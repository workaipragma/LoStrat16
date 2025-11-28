
import React, { useMemo, useState } from 'react';
import { BacktestResult } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Layers, Zap, ShieldAlert, ArrowRight, DollarSign, Percent } from 'lucide-react';

interface Props {
    results: BacktestResult[];
    initialCapital: number;
}

export const PortfolioDashboard: React.FC<Props> = ({ results, initialCapital }) => {
    const [viewMode, setViewMode] = useState<'USD' | 'PERCENT'>('USD');

    // Aggregate Data
    const { chartData, stats } = useMemo(() => {
        if (!results.length) return { chartData: [], stats: null };

        // 1. Calculate Unallocated Cash
        const botAllocPct = results[0].config.botAllocation / 100;
        const allocatedPerBot = initialCapital * botAllocPct;
        const totalAllocated = allocatedPerBot * results.length;
        const unallocatedCash = Math.max(0, initialCapital - totalAllocated);

        const maxLen = Math.max(...results.map(r => r.equityCurve.length));
        const step = Math.ceil(maxLen / 200);

        const data = [];
        let currentTotalEquity = 0;
        let baselineTotalEquity = 0;
        let maxPeak = 0;
        let maxDrawdown = 0;

        for (let i = 0; i < maxLen; i += step) {
            let botsEquitySum = 0;
            let botsBaselineSum = 0;
            let timeStr = '';

            results.forEach(r => {
                const idx = Math.min(i, r.equityCurve.length - 1);
                const p = r.equityCurve[idx];
                const b = r.baselineResult?.equityCurve[Math.min(i, (r.baselineResult.equityCurve.length || 0) - 1)];
                
                // Fallback if baseline doesn't exist yet
                const baseVal = b ? b.equity : (r.equityCurve[0]?.equity || allocatedPerBot);
                
                if (p) {
                    botsEquitySum += p.equity;
                    timeStr = new Date(p.time).getFullYear().toString(); // Rough year
                } else {
                    botsEquitySum += allocatedPerBot;
                }
                botsBaselineSum += baseVal;
            });

            const totalEq = botsEquitySum + unallocatedCash;
            const baseEq = botsBaselineSum + unallocatedCash;

            if (totalEq > maxPeak) maxPeak = totalEq;
            const dd = maxPeak > 0 ? ((maxPeak - totalEq) / maxPeak) * 100 : 0;
            if (dd > maxDrawdown) maxDrawdown = dd;

            currentTotalEquity = totalEq;
            baselineTotalEquity = baseEq;

            // Normalize for view mode
            const displayEquity = viewMode === 'USD' ? Math.round(totalEq) : ((totalEq - initialCapital) / initialCapital) * 100;
            const displayBase = viewMode === 'USD' ? Math.round(baseEq) : ((baseEq - initialCapital) / initialCapital) * 100;

            data.push({
                time: timeStr,
                equity: displayEquity,
                baseline: displayBase,
                drawdown: dd
            });
        }

        const netProfit = currentTotalEquity - initialCapital;
        const netProfitPercent = (netProfit / initialCapital) * 100;
        const baseProfit = baselineTotalEquity - initialCapital;
        const baseProfitPercent = (baseProfit / initialCapital) * 100;

        return { 
            chartData: data, 
            stats: {
                initialCapital,
                currentTotalEquity,
                netProfit,
                netProfitPercent,
                baseProfitPercent,
                maxDrawdown,
                alpha: netProfitPercent - baseProfitPercent
            }
        };
    }, [results, initialCapital, viewMode]); // Added viewMode dependency to trigger recalc

    if (!stats) return null;

    const formatY = (val: number) => {
        if (viewMode === 'PERCENT') {
            return `${val.toFixed(0)}%`;
        }
        return `$${(val / 1000).toFixed(0)}k`;
    };

    return (
        <div className="w-full bg-[#05070a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative mb-12">
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        <Layers className="text-blue-500" />
                        ГЛОБАЛЬНЫЙ ПОРТФЕЛЬ
                        <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-1 rounded ml-2 font-mono">
                            ${stats.initialCapital.toLocaleString()} СТАРТ
                        </span>
                    </h2>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex bg-gray-900 rounded-lg p-1 border border-white/10">
                        <button 
                            onClick={() => setViewMode('USD')} 
                            className={`px-3 py-1 rounded text-xs font-bold transition-all ${viewMode === 'USD' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            <DollarSign size={12}/> USD
                        </button>
                        <button 
                            onClick={() => setViewMode('PERCENT')} 
                            className={`px-3 py-1 rounded text-xs font-bold transition-all ${viewMode === 'PERCENT' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Percent size={12}/> %
                        </button>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Текущий Баланс</div>
                        <div className={`text-2xl font-mono font-bold ${stats.netProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
                            ${Math.round(stats.currentTotalEquity).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[450px]">
                
                {/* CHART */}
                <div className="lg:col-span-3 p-6 border-r border-white/5 flex flex-col relative">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Динамика Роста</h3>
                        <div className="flex gap-4">
                             <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                 <span className="w-3 h-1 bg-gray-600 rounded-full"></span> Базовая
                             </div>
                             <div className="flex items-center gap-2 text-[10px] text-purple-300">
                                 <span className="w-3 h-1 bg-purple-500 rounded-full shadow-[0_0_5px_#a855f7]"></span> Оптимизированная
                             </div>
                        </div>
                     </div>

                     <div className="flex-grow w-full h-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gPort" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis 
                                    dataKey="time" 
                                    tick={{fontSize: 10, fill: '#6b7280'}} 
                                    axisLine={false} 
                                    tickLine={false}
                                    minTickGap={30}
                                />
                                <YAxis 
                                    orientation="right"
                                    tickFormatter={formatY}
                                    tick={{fontSize: 10, fill: '#6b7280'}} 
                                    axisLine={false} 
                                    tickLine={false}
                                    width={40}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#020408', borderColor: '#333', fontSize: '11px', borderRadius: '12px' }}
                                    formatter={(val: number, name: string) => [
                                        viewMode === 'USD' ? `$${val.toLocaleString()}` : `${val.toFixed(1)}%`,
                                        name === 'equity' ? 'После AI' : 'До AI'
                                    ]}
                                    labelStyle={{ color: '#9ca3af', marginBottom: '5px' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="baseline" 
                                    stroke="#4b5563" 
                                    strokeWidth={2} 
                                    strokeDasharray="4 4" 
                                    fill="transparent" 
                                    activeDot={false}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="equity" 
                                    stroke="#a855f7" 
                                    strokeWidth={3} 
                                    fill="url(#gPort)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                     </div>

                     {/* Drawdown Chart under main chart */}
                     <div className="h-16 mt-4 w-full border-t border-white/5 pt-2">
                        <div className="text-[9px] text-gray-600 uppercase mb-1">Риск Просадки (Drawdown)</div>
                        <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={chartData}>
                                <Area type="step" dataKey="drawdown" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={1}/>
                                <YAxis hide domain={[0, 100]}/>
                             </AreaChart>
                        </ResponsiveContainer>
                     </div>
                </div>

                {/* STATS */}
                <div className="p-6 space-y-8 bg-white/[0.01]">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Zap size={14} className="text-yellow-500"/> Эффективность AI
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-xl border border-white/5">
                                <span className="text-xs text-gray-500">Базовый Результат</span>
                                <span className="font-mono font-bold text-gray-400">{stats.baseProfitPercent.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-center -my-2 relative z-10">
                                <div className="bg-[#05070a] p-1 rounded-full border border-gray-800">
                                    <ArrowRight size={14} className="text-gray-600 rotate-90" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-900/20 rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                <span className="text-xs text-purple-200">После Оптимизации</span>
                                <span className="font-mono font-bold text-green-400 text-lg">+{stats.netProfitPercent.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ShieldAlert size={14} className="text-red-500"/> Риск Метрика
                        </h3>
                        <div className="mb-2 flex justify-between text-[10px] text-gray-500">
                             <span>Макс. Просадка</span>
                             <span className={stats.maxDrawdown > 25 ? 'text-red-400' : 'text-green-400'}>{stats.maxDrawdown.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${stats.maxDrawdown > 30 ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{width: `${Math.min(100, stats.maxDrawdown)}%`}}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

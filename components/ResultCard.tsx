
import React, { useState, useMemo } from 'react';
import { BacktestResult, StrategyConfig } from '../types';
import { AreaChart, Area, Line, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { BrainCircuit, Loader2, Zap } from 'lucide-react';
import { optimizeCoinSettings } from '../services/optimizer';

interface Props {
  result: BacktestResult;
  config: StrategyConfig;
  onUpdate: (newResult: BacktestResult) => void;
}

export const ResultCard: React.FC<Props> = ({ result, config, onUpdate }) => {
  const [optimizing, setOptimizing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const isProfitable = result.totalProfit > 0;
  const alpha = result.netProfitPercent - ((result.buyAndHoldProfit || 0) / (config.initialCapital * config.botAllocation/100) * 100);

  const chartData = useMemo(() => {
    if (!result.equityCurve?.length) return [];
    const len = Math.max(result.equityCurve.length, result.baselineResult?.equityCurve.length || 0);
    const step = Math.ceil(len / 40); 

    const data = [];
    for (let i = 0; i < len; i += step) {
        const idx = Math.min(i, result.equityCurve.length-1);
        const currPoint = result.equityCurve[idx];
        const basePoint = result.baselineResult?.equityCurve[Math.min(i, (result.baselineResult?.equityCurve.length||0)-1)];
        const holdPoint = result.buyAndHoldEquityCurve[Math.min(i, result.buyAndHoldEquityCurve.length-1)];

        if (currPoint) {
            data.push({
                time: new Date(currPoint.time).getFullYear(),
                equity: Math.round(currPoint.equity),
                baseEquity: basePoint ? Math.round(basePoint.equity) : null,
                hold: holdPoint ? Math.round(holdPoint.equity) : null,
            });
        }
    }
    return data;
  }, [result]);

  const handleOptimize = async () => {
      setOptimizing(true);
      setTimeout(async () => {
          const res = await optimizeCoinSettings(result.coin, config);
          onUpdate(res);
          setOptimizing(false);
      }, 50);
  };

  const fmt = (n: number) => Number.isFinite(n) ? n.toFixed(1) : '0.0';

  return (
    <div className={`bg-gray-800 border rounded-2xl overflow-hidden shadow-lg flex flex-col h-[400px] relative transition-all ${result.aiOptimized ? 'border-purple-500 shadow-purple-900/20' : 'border-gray-700'}`}>
      
      {/* HEADER */}
      <div className="p-3 bg-gray-900/50 border-b border-gray-700 flex justify-between items-center h-[50px]">
         <div className="flex items-center gap-2">
             <div className={`w-8 h-8 rounded bg-gray-800 flex items-center justify-center font-bold text-xs ${isProfitable ? 'text-green-400 border border-green-500/30' : 'text-red-400 border border-red-500/30'}`}>
                 {result.coin.substring(0,4)}
             </div>
             <div>
                 <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-200">{result.coin}</span>
                    {alpha > 0 && <span className="text-[9px] bg-blue-900/40 text-blue-300 px-1 rounded border border-blue-800">BEAT</span>}
                 </div>
                 <div className={`text-xs font-mono font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                     {result.netProfitPercent > 0 ? '+' : ''}{fmt(result.netProfitPercent)}%
                 </div>
             </div>
         </div>
         <div className="text-right">
             <div className="text-[9px] text-gray-500 uppercase flex items-center gap-1 justify-end">
                Score
             </div>
             <div className={`font-mono font-bold text-lg leading-none ${result.strategyScore > 75 ? 'text-green-400' : result.strategyScore > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                 {result.strategyScore}
             </div>
         </div>
      </div>

      {/* CHART BODY */}
      <div className="flex-grow bg-[#0b0d10] relative group">
          {!showDetails && (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{top:10, right:40, left:0, bottom:0}}>
                    <defs>
                        <linearGradient id={`g${result.coin}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isProfitable ? "#22c55e" : "#ef4444"} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={isProfitable ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis 
                        dataKey="time" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 9, fill: '#6b7280'}}
                        minTickGap={30}
                    />
                    <YAxis 
                        orientation="right" 
                        domain={['auto','auto']} 
                        axisLine={false} 
                        tickLine={false}
                        tick={{fontSize: 9, fill: '#6b7280'}}
                        width={35}
                    />
                    <Line type="monotone" dataKey="hold" stroke="#374151" strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false}/>
                    {result.aiOptimized && (
                        <Line type="monotone" dataKey="baseEquity" stroke="#6b7280" strokeWidth={1} dot={false} isAnimationActive={false} />
                    )}
                    <Area type="monotone" dataKey="equity" stroke={isProfitable ? "#22c55e" : "#ef4444"} fill={`url(#g${result.coin})`} strokeWidth={2} isAnimationActive={false}/>
                    <Tooltip 
                        contentStyle={{backgroundColor:'#111827', border:'1px solid #374151', fontSize:'10px', borderRadius: '8px'}}
                        labelStyle={{display:'none'}}
                        formatter={(val:any, name:string) => [ `$${val}`, name==='hold'?'Hold':name==='baseEquity'?'До AI':'Текущий' ]}
                    />
                </AreaChart>
            </ResponsiveContainer>
          )}

          {/* AI DETAILS OVERLAY */}
          {result.aiOptimized && (
              <div className={`absolute inset-0 bg-gray-900/95 backdrop-blur-sm transition-opacity flex flex-col p-4 ${showDetails ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
                  <h4 className="text-xs font-bold text-purple-400 uppercase mb-3 flex items-center gap-2">
                      <Zap size={12}/> Отчет AI Оптимизации
                  </h4>
                  
                  {/* DIFF TABLE */}
                  <div className="space-y-2 text-xs w-full mb-4">
                      <div className="grid grid-cols-3 text-gray-500 pb-1 border-b border-gray-700">
                           <span>Параметр</span>
                           <span className="text-right">Было</span>
                           <span className="text-right">Стало</span>
                      </div>
                      {result.configDiff && Object.keys(result.configDiff).map(k => {
                          const key = k as keyof StrategyConfig;
                          const oldVal = result.baselineResult?.config[key];
                          const newVal = result.config[key];
                          return (
                              <div key={key} className="grid grid-cols-3 items-center py-1">
                                  <span className="text-gray-400 capitalize">{key.replace('Percent',' %').replace('Period', ' Per')}</span>
                                  <span className="text-right text-red-400">{String(oldVal)}</span>
                                  <span className="text-right text-green-400 font-bold">{String(newVal)}</span>
                              </div>
                          )
                      })}
                  </div>

                  <div className="space-y-2 text-xs w-full mt-auto">
                      <div className="grid grid-cols-3 items-center">
                          <span className="text-gray-400">Profit</span>
                          <span className="text-right text-gray-500">{result.baselineResult?.netProfitPercent.toFixed(0)}%</span>
                          <span className="text-right text-green-400 font-bold">{result.netProfitPercent.toFixed(0)}%</span>
                      </div>
                      <div className="grid grid-cols-3 items-center">
                          <span className="text-gray-400">Drawdown</span>
                          <span className="text-right text-red-400">{result.baselineResult?.maxDrawdown.toFixed(1)}%</span>
                          <span className="text-right text-green-400 font-bold">{result.maxDrawdown.toFixed(1)}%</span>
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* METRICS & ACTIONS */}
      <div className="bg-gray-800 border-t border-gray-700 h-[80px] flex flex-col">
          <div className="flex-1 grid grid-cols-3 divide-x divide-gray-700 py-2">
              <div className="text-center">
                  <div className="text-[9px] text-gray-500 uppercase">Просадка</div>
                  <div className={`font-mono font-bold text-xs ${result.maxDrawdown > 40 ? 'text-red-500' : 'text-gray-200'}`}>
                      {fmt(result.maxDrawdown)}%
                  </div>
              </div>
              <div className="text-center">
                  <div className="text-[9px] text-gray-500 uppercase">Сделки</div>
                  <div className="font-mono font-bold text-xs text-gray-200">{result.totalTrades}</div>
              </div>
              <div className="text-center">
                  <div className="text-[9px] text-gray-500 uppercase">PF</div>
                  <div className="font-mono font-bold text-xs text-gray-200">{fmt(result.profitFactor)}</div>
              </div>
          </div>
          
          <div className="h-[30px] flex">
              {result.aiOptimized ? (
                  <button onClick={() => setShowDetails(!showDetails)} className="w-full flex items-center justify-center gap-2 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 text-[10px] uppercase font-bold transition-colors">
                      {showDetails ? 'Скрыть Отчет' : 'Что изменил AI?'}
                  </button>
              ) : (
                  <button onClick={handleOptimize} disabled={optimizing} className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-gray-400 hover:text-white text-[10px] uppercase font-bold transition-colors">
                      {optimizing ? <Loader2 className="animate-spin w-3 h-3"/> : <BrainCircuit className="w-3 h-3"/>}
                      Оптимизировать
                  </button>
              )}
          </div>
      </div>
    </div>
  );
};

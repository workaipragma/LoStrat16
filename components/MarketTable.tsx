
import React, { useState, useMemo } from 'react';
import { BacktestResult } from '../types';
import { ArrowUpDown, TrendingUp, AlertTriangle, Crosshair, Award } from 'lucide-react';

interface Props {
    results: BacktestResult[];
}

type SortField = 'coin' | 'netProfitPercent' | 'maxDrawdown' | 'sharpeRatio' | 'calmarRatio' | 'profitFactor' | 'winRate' | 'sqn' | 'totalTrades';

export const MarketTable: React.FC<Props> = ({ results }) => {
    const [sortField, setSortField] = useState<SortField>('netProfitPercent');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const sortedData = useMemo(() => {
        return [...results].sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];
            
            // Handle infinity/NaN
            if (!Number.isFinite(valA)) return 1;
            if (!Number.isFinite(valB)) return -1;
            
            return sortDir === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        });
    }, [results, sortField, sortDir]);

    const fmt = (n: number, decimals = 2) => Number.isFinite(n) ? n.toFixed(decimals) : '-';

    // Color helpers
    const getProfitColor = (v: number) => v > 100 ? 'text-green-400' : v > 0 ? 'text-green-600' : 'text-red-500';
    // Drawdown should be RED if high
    const getDDColor = (v: number) => v > 40 ? 'text-red-500 font-bold' : v > 20 ? 'text-yellow-500' : 'text-gray-400';
    const getScoreColor = (v: number) => v > 80 ? 'text-purple-400' : v > 50 ? 'text-blue-400' : 'text-gray-500';

    return (
        <div className="bg-[#05070a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl mt-12 relative">
            {/* Neon Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>

            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-wider">
                    <Award className="text-yellow-500"/> Рыночная Матрица
                </h3>
                <span className="text-xs text-gray-500 font-mono">{results.length} АКТИВОВ</span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#020408] text-[10px] uppercase tracking-widest text-gray-500 font-bold border-b border-white/5">
                            <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('coin')}>Актив</th>
                            <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('netProfitPercent')}>Профит % <ArrowUpDown size={10} className="inline ml-1"/></th>
                            <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('maxDrawdown')}>Max Просадка <ArrowUpDown size={10} className="inline ml-1"/></th>
                            <th className="p-4 text-right cursor-pointer hover:text-white transition-colors text-blue-400" onClick={() => handleSort('sharpeRatio')}>Шарп (Sharpe) <ArrowUpDown size={10} className="inline ml-1"/></th>
                            <th className="p-4 text-right cursor-pointer hover:text-white transition-colors text-yellow-400" onClick={() => handleSort('calmarRatio')}>Кальмар (Calmar) <ArrowUpDown size={10} className="inline ml-1"/></th>
                            <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('profitFactor')}>Profit Factor <ArrowUpDown size={10} className="inline ml-1"/></th>
                            <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('winRate')}>WinRate <ArrowUpDown size={10} className="inline ml-1"/></th>
                            <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('totalTrades')}>Сделки <ArrowUpDown size={10} className="inline ml-1"/></th>
                            <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('sqn')}>Качество (SQN) <ArrowUpDown size={10} className="inline ml-1"/></th>
                        </tr>
                    </thead>
                    <tbody className="text-xs font-mono">
                        {sortedData.map((res, i) => (
                            <tr key={res.coin} className="border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors group">
                                <td className="p-4 font-bold text-white flex items-center gap-2">
                                    <span className="w-5 h-5 rounded flex items-center justify-center bg-gray-800 text-[9px] group-hover:bg-gray-700 transition-colors">{i+1}</span>
                                    {res.coin}
                                    {res.aiOptimized && <span className="text-[8px] px-1 rounded bg-purple-900/50 text-purple-300 border border-purple-500/30">AI</span>}
                                </td>
                                <td className={`p-4 text-right font-bold ${getProfitColor(res.netProfitPercent)}`}>
                                    {fmt(res.netProfitPercent, 1)}%
                                </td>
                                <td className={`p-4 text-right font-bold ${getDDColor(res.maxDrawdown)}`}>
                                    {fmt(res.maxDrawdown, 1)}%
                                </td>
                                <td className="p-4 text-right text-gray-300">
                                    <span className={`${res.sharpeRatio > 2 ? 'text-blue-400 font-bold' : ''}`}>{fmt(res.sharpeRatio)}</span>
                                </td>
                                <td className="p-4 text-right text-gray-300">
                                    <span className={`${res.calmarRatio > 3 ? 'text-yellow-400 font-bold' : ''}`}>{fmt(res.calmarRatio)}</span>
                                </td>
                                <td className="p-4 text-right text-gray-400">
                                    {fmt(res.profitFactor)}
                                </td>
                                <td className="p-4 text-right text-gray-400">
                                    {fmt(res.winRate, 0)}%
                                </td>
                                <td className="p-4 text-right text-gray-400">
                                    {res.totalTrades}
                                </td>
                                <td className={`p-4 text-right font-bold ${getScoreColor(res.sqn * 20)}`}>
                                    {fmt(res.sqn)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

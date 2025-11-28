
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, ExternalLink } from 'lucide-react';

export const StrategyFooter: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="max-w-[1920px] mx-auto px-6 pb-12 mt-12 relative z-10">
            <div className="bg-[#05070a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div 
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-4 bg-white/[0.02] flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <FileText className="text-gray-500" size={16} />
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                            Техническая спецификация: LONG_STRATEGY 16.0
                        </span>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>}
                </div>

                {isOpen && (
                    <div className="p-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-12 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Логика Ядра</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Стратегия использует сетку DCA (Dollar Cost Averaging) из 6 ордеров с динамическим мартингейлом.
                                    Входы осуществляются по сигналам перепроданности (CCI, Williams %R) на локальных проливах, 
                                    что позволяет входить лучше, чем при обычной лимитной сетке.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Структура Сетки</h4>
                                <ul className="text-xs text-gray-500 space-y-1 font-mono">
                                    <li>Ордер 1 (База): 0.0% Drop (6.66% Vol)</li>
                                    <li>Ордер 2: -6.0% Drop (8.00% Vol) [Фильтр ADX]</li>
                                    <li>Ордер 3: -15.0% Drop (13.00% Vol) [Фильтр Bollinger]</li>
                                    <li>Ордер 4: -28.0% Drop (16.00% Vol) [Фильтр Keltner]</li>
                                    <li>Ордер 5: -40.0% Drop (30.00% Vol) [Уровни CCI]</li>
                                    <li>Ордер 6: -65.0% Drop (26.34% Vol) [Panic Buy]</li>
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-6">
                             <div>
                                <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-2">Индикаторы</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-900/50 p-3 rounded-lg border border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase">Фильтр Входа</div>
                                        <div className="text-sm font-bold text-gray-300">CMO (30m)</div>
                                    </div>
                                    <div className="bg-gray-900/50 p-3 rounded-lg border border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase">Триггер</div>
                                        <div className="text-sm font-bold text-gray-300">CCI (1h/5m)</div>
                                    </div>
                                    <div className="bg-gray-900/50 p-3 rounded-lg border border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase">Выход</div>
                                        <div className="text-sm font-bold text-gray-300">Turtle Channel</div>
                                    </div>
                                    <div className="bg-gray-900/50 p-3 rounded-lg border border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase">Тренд</div>
                                        <div className="text-sm font-bold text-gray-300">ADX (15m)</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-4 flex justify-end">
                                <a 
                                    href="https://telegra.ph/Obnovlenie-LONG-STRATEGY-121-09-05" 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition-colors uppercase font-bold"
                                >
                                    Оригинал Стратегии <ExternalLink size={12}/>
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

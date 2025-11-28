
import React, { useState } from 'react';
import { StrategyConfig } from '../types';
import { Play, RefreshCw, Layers, Activity, Sliders, Info, BarChart2 } from 'lucide-react';

interface Props {
  config: StrategyConfig;
  setConfig: (config: StrategyConfig) => void;
  onRun: () => void;
  isRunning: boolean;
}

// Новый компонент тултипа с порталом/фиксированным позиционированием для решения проблем с обрезкой
const Tooltip: React.FC<{title: string, desc: string}> = ({title, desc}) => {
    const [show, setShow] = useState(false);
    
    return (
        <div 
            className="relative inline-block ml-2 align-middle z-50"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <Info size={14} className="text-gray-600 hover:text-blue-400 cursor-help transition-colors" />
            
            {show && (
                <div 
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 pointer-events-none" 
                    style={{zIndex: 99999}}
                >
                    <div className="bg-[#0f1115] border border-gray-600 rounded-xl p-3 shadow-2xl relative">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-xl"></div>
                         <h4 className="text-[11px] font-bold text-gray-200 uppercase tracking-widest mb-1">{title}</h4>
                         <p className="text-[10px] text-gray-400 leading-relaxed text-left normal-case font-sans">
                             {desc}
                         </p>
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0f1115] border-r border-b border-gray-600 rotate-45"></div>
                </div>
            )}
        </div>
    );
};

export const StrategyCard: React.FC<Props> = ({ config, setConfig, onRun, isRunning }) => {
  const handleChange = (key: keyof StrategyConfig, value: number | boolean) => {
    setConfig({ ...config, [key]: value });
  };

  return (
    <div className="bg-[#020408] border border-white/10 rounded-3xl p-6 shadow-2xl relative backdrop-blur-sm group mb-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6 relative z-10">
        <div className="flex items-center gap-5">
          <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-white/10 relative">
              <Activity className="text-purple-400 w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              PRAGMA <span className="text-purple-500 font-light">TRADE</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Core 16.0 Online
            </p>
          </div>
        </div>
        
        <button
            onClick={onRun}
            disabled={isRunning}
            className={`
              relative overflow-hidden px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all duration-300
              ${isRunning 
                ? 'bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-500 text-black border border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)] active:scale-95'
              }
            `}
          >
            <div className="flex items-center gap-3 relative z-10">
               {isRunning ? <RefreshCw className="animate-spin w-5 h-5" /> : <Play className="fill-current w-5 h-5" />}
               <span>{isRunning ? 'Симуляция...' : 'Запуск Теста'}</span>
            </div>
          </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
        
        {/* INPUTS */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Capital & Risk */}
            <div className="space-y-4 p-6 bg-[#0a0c10]/80 rounded-2xl border border-white/5">
                <h3 className="text-xs font-bold text-blue-400 flex items-center gap-2 uppercase tracking-widest mb-4">
                    <Layers size={14}/> Управление Капиталом
                </h3>
                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-[9px] uppercase text-gray-500 font-bold tracking-wider flex items-center">
                            Общий Капитал <Tooltip title="Все средства" desc="Это общая сумма ваших денег. Бот возьмет отсюда только свой маленький %." />
                        </label>
                        <div className="relative group">
                            <span className="absolute left-3 top-2.5 text-gray-500 text-xs">$</span>
                            <input
                            type="number"
                            value={config.initialCapital}
                            onChange={(e) => handleChange('initialCapital', Number(e.target.value))}
                            className="w-full bg-[#05070a] border border-gray-800 rounded-xl pl-6 py-2 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] uppercase text-gray-500 font-bold tracking-wider flex items-center">
                            Плечо (x) <Tooltip title="Кредитное плечо" desc="Увеличивает объем позиции. 20x рекомендовано стратегией." />
                        </label>
                        <input
                            type="number"
                            value={config.leverage}
                            onChange={(e) => handleChange('leverage', Number(e.target.value))}
                            className="w-full bg-[#05070a] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    
                    {/* ВОССТАНОВЛЕННЫЕ НАСТРОЙКИ */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] uppercase text-gray-500 font-bold tracking-wider flex items-center">
                            Комиссия (%) <Tooltip title="Комиссия биржи" desc="Процент, который биржа берет за открытие и закрытие." />
                        </label>
                        <input
                            type="number" step="0.01"
                            value={config.commission}
                            onChange={(e) => handleChange('commission', Number(e.target.value))}
                            className="w-full bg-[#05070a] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] uppercase text-gray-500 font-bold tracking-wider flex items-center">
                            Проскальзывание (%) <Tooltip title="Slippage" desc="Потеря цены при входе рыночным ордером." />
                        </label>
                        <input
                            type="number" step="0.01"
                            value={config.slippage}
                            onChange={(e) => handleChange('slippage', Number(e.target.value))}
                            className="w-full bg-[#05070a] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                </div>
                
                <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[9px] uppercase text-gray-500 font-bold tracking-wider flex items-center">
                            Выделение на Бота (%) <Tooltip title="Риск на монету" desc="Сколько % от общего капитала дать одному боту. Стандарт 0.5%." />
                        </label>
                        <span className="text-xs font-mono font-bold text-blue-400">{config.botAllocation}%</span>
                    </div>
                    <input
                        type="range" min="0.1" max="5" step="0.1"
                        value={config.botAllocation}
                        onChange={(e) => handleChange('botAllocation', Number(e.target.value))}
                        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>

            {/* Signals */}
            <div className="space-y-4 p-6 bg-[#0a0c10]/80 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-yellow-400 flex items-center gap-2 uppercase tracking-widest">
                        <Sliders size={14}/> Сигналы 16.0
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-500 uppercase font-bold">Smart Entry</span>
                        <div 
                            onClick={() => handleChange('smartEntry', !config.smartEntry)}
                            className={`w-8 h-4 rounded-full cursor-pointer relative transition-colors ${config.smartEntry ? 'bg-green-500' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${config.smartEntry ? 'left-4.5' : 'left-0.5'}`}></div>
                        </div>
                         <Tooltip title="Умный Вход" desc="Бот не входит сразу. Он ждет сильной просадки (дна) перед запуском." />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 uppercase font-semibold">CCI Limit</label>
                        <input type="number" value={config.cciThreshold} onChange={(e) => handleChange('cciThreshold', Number(e.target.value))} className="w-full bg-[#05070a] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-yellow-500"/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 uppercase font-semibold">Williams %R</label>
                        <input type="number" value={config.williamsThreshold} onChange={(e) => handleChange('williamsThreshold', Number(e.target.value))} className="w-full bg-[#05070a] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-yellow-500"/>
                    </div>
                </div>
            </div>

            {/* Exit & Grid */}
            <div className="md:col-span-2 p-6 bg-[#0a0c10]/80 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                     <label className="text-[9px] text-gray-500 font-bold uppercase flex items-center gap-1">
                         Тейк-Профит % <Tooltip title="Take Profit" desc="Минимальная прибыль для закрытия сделки." />
                     </label>
                     <input type="number" step="0.1" value={config.tpPercent} onChange={(e) => handleChange('tpPercent', Number(e.target.value))} className="w-full bg-[#05070a] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-green-500"/>
                </div>
                <div className="flex-1 space-y-2">
                     <label className="text-[9px] text-gray-500 font-bold uppercase flex items-center gap-1">
                         Период Turtle <Tooltip title="Канал Дончиана" desc="Период для определения канала выхода (Turtle Channel)." />
                     </label>
                     <input type="number" value={config.turtlePeriod} onChange={(e) => handleChange('turtlePeriod', Number(e.target.value))} className="w-full bg-[#05070a] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-green-500"/>
                </div>
            </div>
        </div>

        {/* VISUALIZATION */}
        <div className="xl:col-span-4 bg-[#0b0e14] rounded-2xl border border-white/10 p-6 flex flex-col relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
             
            <h3 className="text-xs font-bold text-gray-300 flex items-center gap-2 uppercase tracking-widest mb-6 relative z-10">
                <BarChart2 size={14} className="text-green-500"/> Лестница Усреднения
                <Tooltip title="DCA Сетка" desc="Визуализация шагов докупки при падении. Чем шире полоса, тем больше объем покупки." />
            </h3>
            
            <div className="flex-grow flex flex-col justify-between space-y-2 relative z-10">
                {config.gridSteps.map((step, index) => {
                    const weight = config.volumeWeights[index];
                    const widthPercent = Math.min(100, Math.max(25, (weight / 30) * 100));
                    return (
                        <div key={index} className="flex items-center gap-3">
                            <div className="w-4 text-[9px] text-gray-600 font-mono text-right">#{index+1}</div>
                            <div className="flex-grow h-8 relative">
                                <div 
                                    className="absolute top-0 left-0 h-full rounded-r bg-blue-900/30 border-y border-r border-blue-500/30 flex items-center px-3 justify-between"
                                    style={{ width: `${widthPercent}%` }}
                                >
                                    <span className="text-[9px] font-bold text-gray-300">-{step}%</span>
                                    <span className="text-[9px] font-mono text-blue-400">{weight}% Объем</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="mt-4 text-[9px] text-gray-500 text-center">
                *Схема срабатывания ордеров при падении
            </div>
        </div>
      </div>
    </div>
  );
};


import React, { useState, useEffect, useMemo } from 'react';
import { StrategyCard } from './components/StrategyCard';
import { ResultCard } from './components/ResultCard';
import { MarketTable } from './components/MarketTable';
import { PortfolioDashboard } from './components/PortfolioDashboard';
import { StrategyFooter } from './components/StrategyFooter';
import { StrategyConfig, BacktestResult, COIN_LIST } from './types';
import { runBacktest } from './services/engine';
import { optimizeCoinSettings } from './services/optimizer';
import { Activity, Loader2, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [config, setConfig] = useState<StrategyConfig>({
    initialCapital: 1000,
    botAllocation: 0.5,
    leverage: 20,
    commission: 0.05,
    slippage: 0.01,
    smartEntry: true, // Default ON
    cciPeriod: 20, cciThreshold: 80,
    cmoPeriod: 9, cmoThreshold: -90,
    williamsPeriod: 14, williamsThreshold: -80,
    adxPeriod: 14, adxThreshold: 40,
    gridSteps: [0.04, 6, 15, 28, 40, 65],
    volumeWeights: [6.66, 8, 13, 16, 30, 26.34],
    tpPercent: 1.0, turtlePeriod: 20 
  });

  const [results, setResults] = useState<BacktestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isTuningAll, setIsTuningAll] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRunBacktest = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    
    const chunkSize = 5;
    const coins = COIN_LIST;
    const newResults: BacktestResult[] = [];
    
    const processChunk = async (index: number) => {
        if (index >= coins.length) {
            setIsRunning(false);
            return;
        }
        const chunk = coins.slice(index, index + chunkSize);
        await new Promise(resolve => setTimeout(resolve, 5));
        chunk.forEach(coin => newResults.push(runBacktest(coin, config)));
        setResults([...newResults]); 
        setProgress(Math.round(((index + chunk.length) / coins.length) * 100));
        processChunk(index + chunkSize);
    };
    processChunk(0);
  };

  useEffect(() => { handleRunBacktest(); }, []);

  const handleTuneAll = async () => {
      if (isTuningAll || results.length === 0) return;
      setIsTuningAll(true);
      const coinsToTune = [...results];
      let tunedCount = 0;
      for (let i = 0; i < coinsToTune.length; i++) {
          const res = coinsToTune[i];
          if (!res.aiOptimized) {
            const tuned = await optimizeCoinSettings(res.coin, config);
            setResults(prev => prev.map(r => r.coin === tuned.coin ? tuned : r));
          }
          tunedCount++;
          setProgress(Math.round((tunedCount / coinsToTune.length) * 100));
          await new Promise(r => setTimeout(r, 10)); 
      }
      setIsTuningAll(false);
  };

  const totalStats = useMemo(() => {
      if (results.length === 0) return { profit: 0 };
      
      const allocatedPerBot = config.initialCapital * (config.botAllocation / 100);
      const totalAllocated = allocatedPerBot * results.length;
      const unallocated = config.initialCapital - totalAllocated;
      
      const totalEquity = results.reduce((sum, r) => sum + r.finalEquity, 0) + unallocated;
      return { profit: totalEquity - config.initialCapital };
  }, [results, config]);

  return (
    <div className="min-h-screen bg-[#020408] text-gray-100 font-sans selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-900/10 blur-[120px] rounded-full"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>

      <header className="sticky top-0 z-50 bg-[#020408]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-[1920px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-900 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.3)] border border-purple-500/30">
               <Activity className="text-white w-6 h-6" />
            </div>
            <div>
                 <h1 className="text-xl font-black text-white tracking-tight leading-none">PRAGMA <span className="text-purple-500 font-light">TRADE</span></h1>
                 <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Institutional AI Core</p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
              <div className="text-right hidden md:block">
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Total PnL</div>
                  <div className={`font-mono font-bold text-xl ${totalStats.profit >= 0 ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]' : 'text-red-400'}`}>
                      {totalStats.profit >= 0 ? '+' : ''}${Math.round(totalStats.profit).toLocaleString()}
                  </div>
              </div>
              
              <button 
                onClick={handleTuneAll}
                disabled={isTuningAll || isRunning || results.length === 0}
                className="group relative overflow-hidden bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 px-6 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
              >
                 <div className="flex items-center gap-3 relative z-10">
                     {isTuningAll ? <Loader2 className="animate-spin w-4 h-4 text-purple-400"/> : <BrainCircuit className="w-4 h-4 text-purple-400 group-hover:text-purple-300"/>}
                     <span className="text-xs font-bold uppercase tracking-wider text-purple-300 group-hover:text-white">AI Эволюция</span>
                 </div>
              </button>
          </div>
        </div>
        
        {(isRunning || isTuningAll) && (
            <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 transition-all duration-300 shadow-[0_0_10px_#a855f7]" style={{ width: `${progress}%` }} />
        )}
      </header>

      <main className="max-w-[1920px] mx-auto px-6 py-10 relative z-10 space-y-10">
        <StrategyCard config={config} setConfig={setConfig} onRun={handleRunBacktest} isRunning={isRunning} />

        {results.length > 0 && <PortfolioDashboard results={results} initialCapital={config.initialCapital} />}

        {results.length > 0 && (
            <div>
                <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3 tracking-tight border-b border-white/5 pb-4">
                    <Activity size={24} className="text-gray-600"/> 
                    АКТИВЫ ПОРТФЕЛЯ
                    <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-1 rounded ml-2 font-mono">LIVE SIMULATION</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {results.map(r => (
                        <ResultCard key={r.coin} result={r} config={config} onUpdate={(n) => setResults(prev => prev.map(p => p.coin === n.coin ? n : p))} />
                    ))}
                </div>
            </div>
        )}

        {results.length > 0 && <MarketTable results={results} />}
        
        <StrategyFooter />
      </main>
    </div>
  );
};

export default App;

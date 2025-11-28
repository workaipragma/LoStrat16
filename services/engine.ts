
import { BacktestResult, Candle, StrategyConfig, Trade } from '../types';
import { calculateCCI, calculateCMO, calculateWilliamsR, calculateTurtleChannels } from './indicators';
import { generateMarketData } from './dataGenerator';

const safe = (val: number, fallback = 0): number => {
    if (typeof val !== 'number') return fallback;
    if (isNaN(val)) return fallback;
    if (!isFinite(val)) return fallback;
    return val;
};

const calculateStdDev = (data: number[]): number => {
    if (data.length < 2) return 0;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (data.length - 1);
    return Math.sqrt(variance);
};

export const runBacktest = (coin: string, config: StrategyConfig, existingCandles?: Candle[]): BacktestResult => {
  const candles = existingCandles || generateMarketData(coin);
  
  if (!candles || candles.length === 0) {
      return createEmptyResult(coin, config);
  }

  // Бот получает только свою долю от общего капитала.
  const allocatedCapital = config.initialCapital * (config.botAllocation / 100);
  
  // Indicators
  const cci = calculateCCI(candles, config.cciPeriod);
  const cmo = calculateCMO(candles.map(c => c.close), config.cmoPeriod);
  const wr = calculateWilliamsR(candles, config.williamsPeriod);
  const turtle = calculateTurtleChannels(candles, config.turtlePeriod);

  let equity = allocatedCapital;
  let maxEquity = equity;
  const equityCurve = [];
  const drawdownCurve = [];
  const buyAndHoldCurve = [];
  const dailyReturns: number[] = [];
  let lastDayEquity = equity;
  let currentDay = new Date(candles[0].time).getDay();

  const trades: Trade[] = [];
  let activeTrade: Trade | null = null;
  const dcaDistribution = new Array(7).fill(0);
  let totalFeesPaid = 0;

  const startPrice = candles[0].close;
  // B&H считаем тоже от выделенной доли
  const bhCoins = allocatedCapital / startPrice;

  // Smart Entry Logic
  let isTradingAllowed = !config.smartEntry; 
  const warmup = 50; 

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    
    // Check Smart Entry condition
    if (!isTradingAllowed && i > warmup) {
        const recentHigh = Math.max(...candles.slice(i-20, i).map(c => c.high));
        const drop = (recentHigh - candle.close) / recentHigh;
        if (drop > 0.15 || wr[i] < -95) {
            isTradingAllowed = true;
        }
    }

    // Equity Calculation
    let unrealized = 0;
    if (activeTrade) {
        const value = (activeTrade.totalVolume / activeTrade.avgPrice) * candle.close;
        unrealized = value - activeTrade.totalVolume;
    }
    const totalEquity = equity + unrealized;
    
    // Returns
    const day = new Date(candle.time).getDay();
    if (day !== currentDay) {
        const ret = (totalEquity - lastDayEquity) / lastDayEquity;
        dailyReturns.push(ret);
        lastDayEquity = totalEquity;
        currentDay = day;
    }
    
    // Curves
    const bhVal = bhCoins * candle.close;
    buyAndHoldCurve.push({ time: candle.time, equity: Math.round(safe(bhVal)) });

    if (i >= warmup) {
        if (totalEquity > maxEquity) maxEquity = totalEquity;
        const dd = maxEquity > 0 ? ((maxEquity - totalEquity) / maxEquity) * 100 : 0;
        
        equityCurve.push({ time: candle.time, equity: Math.round(safe(totalEquity)) });
        drawdownCurve.push({ time: candle.time, drawdown: safe(dd) });
    }

    if (i < warmup || !isTradingAllowed) continue;

    // --- LOGIC ---
    if (activeTrade) {
        // DCA
        const lvl = activeTrade.dcaLevelReached;
        if (lvl < config.gridSteps.length) {
            const dropReq = config.gridSteps[lvl];
            const basePrice = activeTrade.orders[0].price;
            const target = basePrice * (1 - dropReq / 100);

            // Wick Hunter
            if (candle.low <= target) {
                 const nextLvl = lvl + 1;
                 const weightCurr = config.volumeWeights[nextLvl] || 20;
                 const weightBase = config.volumeWeights[0] || 6;
                 
                 const rawVol = activeTrade.orders[0].volume * (weightCurr / weightBase);
                 const price = target * (1 + config.slippage / 100); 
                 
                 const fee = rawVol * (config.commission / 100);
                 equity -= fee;
                 totalFeesPaid += fee;

                 activeTrade.orders.push({
                     price, volume: rawVol, fee, time: candle.time, type: 'BUY', reason: `DCA ${nextLvl}`
                 });
                 
                 // Recalc
                 let sumVol = 0;
                 let sumCoins = 0;
                 activeTrade.orders.forEach(o => {
                     sumVol += o.volume;
                     sumCoins += o.volume / o.price;
                 });
                 activeTrade.totalVolume = sumVol;
                 activeTrade.avgPrice = sumVol / sumCoins;
                 activeTrade.dcaLevelReached = nextLvl;
            }
        }

        // TP
        const minTp = activeTrade.avgPrice * (1 + config.tpPercent / 100);
        const turtleHigh = turtle.upper[i-1] || 999999999;
        const triggerPrice = Math.max(minTp, turtleHigh);

        // Optimistic Exit within candle
        if (candle.high >= triggerPrice) {
            const exitPrice = triggerPrice * (1 - config.slippage / 100);
            const revenue = (activeTrade.totalVolume / activeTrade.avgPrice) * exitPrice;
            const fee = revenue * (config.commission / 100);
            const profit = revenue - activeTrade.totalVolume - fee;
            
            equity += profit;
            totalFeesPaid += fee;
            
            activeTrade.status = 'CLOSED';
            activeTrade.exitPrice = exitPrice;
            activeTrade.exitTime = candle.time;
            activeTrade.pnl = profit;
            activeTrade.pnlPercent = (profit / activeTrade.totalVolume) * 100;
            
            trades.push(activeTrade);
            if (activeTrade.dcaLevelReached < dcaDistribution.length) {
                dcaDistribution[activeTrade.dcaLevelReached]++;
            }
            activeTrade = null;
        }

    } else {
        // ENTRY
        const bodyLow = Math.min(candle.open, candle.close);
        const wickSize = (bodyLow - candle.low) / bodyLow;
        const isDip = wickSize > 0.03; 

        const isCci = cci[i] < config.cciThreshold;
        const isCmo = cmo[i] > config.cmoThreshold;
        const isWr = wr[i] < config.williamsThreshold;

        if (isDip || (isCci && isCmo && isWr)) {
             const maxPos = allocatedCapital * config.leverage;
             const totalWeights = config.volumeWeights.reduce((a,b) => a+b, 0);
             const entryWeight = config.volumeWeights[0];
             
             const rawVol = maxPos * (entryWeight / totalWeights);

             if (rawVol > 1) { 
                 const rawPrice = isDip ? candle.low * 1.01 : candle.close;
                 const entryPrice = rawPrice * (1 + config.slippage / 100);
                 const fee = rawVol * (config.commission / 100);
                 
                 equity -= fee;
                 totalFeesPaid += fee;

                 activeTrade = {
                     id: `tr-${i}`, coin, entryTime: candle.time, status: 'OPEN',
                     orders: [{
                         price: entryPrice, volume: rawVol, fee,
                         time: candle.time, type: 'BUY', reason: 'Signal'
                     }],
                     avgPrice: entryPrice,
                     totalVolume: rawVol,
                     pnl: 0, pnlPercent: 0, maxDrawdownPercent: 0, dcaLevelReached: 0
                 };
             }
        }
    }
  }

  // Final MTM
  if (activeTrade) {
      const last = candles[candles.length-1];
      const exitP = last.close * (1 - config.slippage / 100);
      const rev = (activeTrade.totalVolume / activeTrade.avgPrice) * exitP;
      const fee = rev * (config.commission / 100);
      const profit = rev - activeTrade.totalVolume - fee;
      equity += profit;
      totalFeesPaid += fee;
      activeTrade.pnl = profit;
      trades.push(activeTrade);
  }

  const totalProfit = equity - allocatedCapital; 
  
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl <= 0);
  const grossWin = wins.reduce((a,b) => a + b.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((a,b) => a + b.pnl, 0));
  
  const pf = grossLoss === 0 ? (grossWin > 0 ? 100 : 0) : grossWin / grossLoss;
  const dd = Math.max(0, ...drawdownCurve.map(d => d.drawdown));
  const rf = dd === 0 ? (totalProfit > 0 ? 100 : 0) : (totalProfit/allocatedCapital*100) / dd;

  const meanReturn = dailyReturns.length ? dailyReturns.reduce((a,b) => a+b, 0) / dailyReturns.length : 0;
  const stdDev = calculateStdDev(dailyReturns);
  const sharpe = stdDev === 0 ? 0 : (meanReturn / stdDev) * Math.sqrt(365);

  const negativeReturns = dailyReturns.filter(r => r < 0);
  const downsideDev = calculateStdDev(negativeReturns);
  const sortino = downsideDev === 0 ? 0 : (meanReturn / downsideDev) * Math.sqrt(365);

  const years = Math.max(0.1, candles.length * 4 / (24 * 365));
  const cagr = (Math.pow(Math.max(0.1, equity) / allocatedCapital, 1 / years) - 1) * 100;
  const calmar = dd === 0 ? 100 : cagr / dd;

  const tradePnLs = trades.map(t => t.pnl);
  const avgTrade = tradePnLs.length ? tradePnLs.reduce((a,b) => a+b,0) / tradePnLs.length : 0;
  const stdTrade = calculateStdDev(tradePnLs);
  const sqn = stdTrade === 0 ? 0 : (avgTrade / stdTrade) * Math.sqrt(trades.length);

  let holdSum = 0;
  let closedCnt = 0;
  trades.forEach(t => {
      if (t.status === 'CLOSED' && t.exitTime) {
          holdSum += (t.exitTime - t.entryTime);
          closedCnt++;
      }
  });
  const avgHold = closedCnt > 0 ? (holdSum / closedCnt) / (1000*3600) : 0;

  let score = 50;
  if (sharpe > 1.5) score += 15;
  if (rf > 5) score += 15;
  if (dd < 30) score += 10;
  if (totalProfit < 0) score = 10;

  return {
      coin,
      totalTrades: trades.length,
      winRate: safe(trades.length > 0 ? (wins.length/trades.length)*100 : 0),
      totalProfit: Math.round(safe(totalProfit)), // Round to Integer
      netProfitPercent: safe((totalProfit/allocatedCapital)*100),
      maxDrawdown: safe(dd),
      profitFactor: safe(pf),
      recoveryFactor: safe(rf),
      sharpeRatio: safe(sharpe),
      sortinoRatio: safe(sortino),
      calmarRatio: safe(calmar),
      sqn: safe(sqn),
      strategyScore: Math.max(0, Math.min(100, safe(score))),
      maxDcaLevel: Math.max(0, ...trades.map(t => t.dcaLevelReached)),
      finalEquity: Math.round(safe(equity)), // Round to Integer
      avgHoldTimeHrs: safe(avgHold),
      dailyProfit: 0,
      totalFees: Math.round(safe(totalFeesPaid)),
      trades,
      equityCurve,
      drawdownCurve,
      buyAndHoldEquityCurve: buyAndHoldCurve,
      buyAndHoldProfit: Math.round(safe(buyAndHoldCurve[buyAndHoldCurve.length-1]?.equity - allocatedCapital)),
      dcaDistribution,
      config
  };
};

const createEmptyResult = (coin: string, config: StrategyConfig): BacktestResult => ({
    coin, config,
    totalTrades: 0, winRate: 0, totalProfit: 0, netProfitPercent: 0,
    maxDrawdown: 0, profitFactor: 0, recoveryFactor: 0, strategyScore: 0,
    sharpeRatio: 0, sortinoRatio: 0, calmarRatio: 0, sqn: 0,
    maxDcaLevel: 0, finalEquity: 0, avgHoldTimeHrs: 0, dailyProfit: 0, totalFees: 0,
    trades: [], equityCurve: [], drawdownCurve: [], buyAndHoldEquityCurve: [], buyAndHoldProfit: 0, dcaDistribution: []
});

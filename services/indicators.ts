
import { Candle } from '../types';

export const calculateSMA = (data: number[], period: number): number[] => {
  const sma: number[] = new Array(data.length).fill(0);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) sum -= data[i - period];
    if (i >= period - 1) sma[i] = sum / period;
  }
  return sma;
};

export const calculateEMA = (data: number[], period: number): number[] => {
  const k = 2 / (period + 1);
  const ema: number[] = new Array(data.length).fill(0);
  ema[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    ema[i] = data[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
};

// Chande Momentum Oscillator
export const calculateCMO = (closes: number[], period: number): number[] => {
  const cmo: number[] = new Array(closes.length).fill(0);
  for (let i = period; i < closes.length; i++) {
    let sumUp = 0;
    let sumDown = 0;
    for (let j = 0; j < period; j++) {
      const diff = closes[i - j] - closes[i - j - 1];
      if (diff > 0) sumUp += diff;
      else sumDown += Math.abs(diff);
    }
    const total = sumUp + sumDown;
    cmo[i] = total === 0 ? 0 : ((sumUp - sumDown) / total) * 100;
  }
  return cmo;
};

// Commodity Channel Index
export const calculateCCI = (candles: Candle[], period: number): number[] => {
  const cci: number[] = new Array(candles.length).fill(0);
  const tp = candles.map(c => (c.high + c.low + c.close) / 3);
  const smaTp = calculateSMA(tp, period);
  
  for (let i = period; i < candles.length; i++) {
    let meanDev = 0;
    for (let j = 0; j < period; j++) {
      meanDev += Math.abs(tp[i - j] - smaTp[i]);
    }
    meanDev /= period;
    cci[i] = meanDev === 0 ? 0 : (tp[i] - smaTp[i]) / (0.015 * meanDev);
  }
  return cci;
};

// Williams %R
export const calculateWilliamsR = (candles: Candle[], period: number): number[] => {
  const wr: number[] = new Array(candles.length).fill(0);
  for (let i = period; i < candles.length; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = 0; j < period; j++) {
      if (candles[i - j].high > highestHigh) highestHigh = candles[i - j].high;
      if (candles[i - j].low < lowestLow) lowestLow = candles[i - j].low;
    }
    const denom = highestHigh - lowestLow;
    wr[i] = denom === 0 ? 0 : ((highestHigh - candles[i].close) / denom) * -100;
  }
  return wr;
};

// Average Directional Index (ADX)
export const calculateADX = (candles: Candle[], period: number): number[] => {
  if (candles.length < period * 2) return new Array(candles.length).fill(0);

  const tr: number[] = [0];
  const dmPlus: number[] = [0];
  const dmMinus: number[] = [0];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    
    tr.push(Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    ));
    
    const upMove = current.high - prev.high;
    const downMove = prev.low - current.low;
    
    dmPlus.push((upMove > downMove && upMove > 0) ? upMove : 0);
    dmMinus.push((downMove > upMove && downMove > 0) ? downMove : 0);
  }

  // Helper for Wilders Smoothing
  const smooth = (data: number[], p: number) => {
    const result = new Array(data.length).fill(0);
    let sum = 0;
    for(let i=0; i<p; i++) sum += data[i];
    result[p-1] = sum;
    for(let i=p; i<data.length; i++) {
      result[i] = result[i-1] - (result[i-1]/p) + data[i];
    }
    return result;
  };

  const str = smooth(tr, period);
  const sDmPlus = smooth(dmPlus, period);
  const sDmMinus = smooth(dmMinus, period);
  
  const dx: number[] = new Array(candles.length).fill(0);
  for(let i=0; i<candles.length; i++) {
     if (str[i] === 0) continue;
     const diPlus = (sDmPlus[i] / str[i]) * 100;
     const diMinus = (sDmMinus[i] / str[i]) * 100;
     const sum = diPlus + diMinus;
     dx[i] = sum === 0 ? 0 : (Math.abs(diPlus - diMinus) / sum) * 100;
  }
  
  // ADX is smoothed DX
  return calculateSMA(dx, period); // Approximation of ADX smoothing
};

// Turtle Zone (Donchian + ATR)
export const calculateTurtleChannels = (candles: Candle[], period: number): { upper: number[], lower: number[] } => {
  const upper: number[] = new Array(candles.length).fill(0);
  const lower: number[] = new Array(candles.length).fill(0);
  
  for (let i = period; i < candles.length; i++) {
    let max = -Infinity;
    let min = Infinity;
    
    for (let j = 0; j < period; j++) {
      if (candles[i - j].high > max) max = candles[i - j].high;
      if (candles[i - j].low < min) min = candles[i - j].low;
    }
    upper[i] = max;
    lower[i] = min;
  }
  return { upper, lower };
};

export const calculateATR = (candles: Candle[], period: number): number[] => {
  const tr: number[] = [0];
  const atr: number[] = new Array(candles.length).fill(0);

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    
    const trValue = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    tr.push(trValue);
  }

  let sum = 0;
  for (let i = 0; i < period; i++) sum += tr[i];
  atr[period - 1] = sum / period;

  for (let i = period; i < candles.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  }
  
  return atr;
};

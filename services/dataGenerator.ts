
import { Candle } from '../types';

// База данных дат запуска
const LAUNCH_DATES: Record<string, [number, number]> = {
  BTC: [2009, 0], ETH: [2015, 7], LTC: [2011, 9], XRP: [2012, 0], ADA: [2017, 9],
  SOL: [2020, 3], AVAX: [2020, 8], DOT: [2020, 7], MATIC: [2019, 3], LINK: [2017, 8],
  ATOM: [2019, 2], UNI: [2020, 8], AAVE: [2020, 9], SNX: [2019, 0], SAND: [2020, 7],
  NEAR: [2020, 9], ARB: [2023, 2], OP: [2022, 4], SUI: [2023, 4], APT: [2022, 9],
  JTO: [2023, 11], ONDO: [2024, 0], TIA: [2023, 9], PEPE: [2023, 3], TON: [2021, 0]
};

// "Якоря" цен - примерные Хай/Лоу для крупных монет, чтобы симуляция была 1-в-1 с реальностью
const PRICE_ANCHORS: Record<string, Record<number, number>> = {
    BTC: { 2020: 10000, 2021: 60000, 2022: 16000, 2023: 30000, 2024: 70000 },
    ETH: { 2020: 300, 2021: 4500, 2022: 1000, 2023: 2000, 2024: 3500 },
    SOL: { 2020: 1, 2021: 250, 2022: 9, 2023: 60, 2024: 150 },
    ADA: { 2020: 0.05, 2021: 3.0, 2022: 0.25, 2023: 0.5, 2024: 0.7 },
    DOT: { 2020: 3, 2021: 50, 2022: 4, 2023: 7, 2024: 9 },
    AVAX: { 2020: 3, 2021: 130, 2022: 10, 2023: 30, 2024: 50 },
    LINK: { 2020: 4, 2021: 50, 2022: 5, 2023: 15, 2024: 18 }
};

export const generateMarketData = (coinName: string, requestedYears: number = 5): Candle[] => {
  const candles: Candle[] = [];
  
  const [launchYear, launchMonth] = LAUNCH_DATES[coinName] || [2018, 0];
  const now = new Date();
  const currentYearNum = now.getFullYear();
  
  let startYear = currentYearNum - requestedYears;
  let startMonth = now.getMonth();

  if (startYear < launchYear || (startYear === launchYear && startMonth < launchMonth)) {
      startYear = launchYear;
      startMonth = launchMonth;
  }

  const startDate = new Date(startYear, startMonth, 1);
  const startTime = startDate.getTime();
  const endTime = now.getTime();
  const msPerCandle = 4 * 60 * 60 * 1000;
  const totalCandles = Math.floor((endTime - startTime) / msPerCandle);

  const seed = coinName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Определяем базовую цену старта
  let anchors = PRICE_ANCHORS[coinName];
  if (!anchors) {
      // Если нет точных якорей, берем паттерн "Generic Altcoin"
      anchors = { 
          2020: 10, 
          2021: 150, // Pump
          2022: 15,  // Dump
          2023: 30,  // Recovery
          2024: 60   // Growth
      };
      // Масштабируем под шиткоины
      if (['SHIB1000', 'PEPE', 'BONK'].includes(coinName)) {
         Object.keys(anchors).forEach(k => anchors[Number(k)] /= 10000);
      }
  }

  // Интерполяция цены между годами
  const getTargetPrice = (ts: number): number => {
      const date = new Date(ts);
      const year = date.getFullYear();
      const month = date.getMonth();
      const progress = month / 12;

      const pCurrent = anchors[year] || anchors[2024];
      const pNext = anchors[year + 1] || pCurrent * 1.2;
      
      return pCurrent + (pNext - pCurrent) * progress;
  };

  let currentPrice = getTargetPrice(startTime);
  if (!currentPrice || isNaN(currentPrice)) currentPrice = 10;

  let currentTime = startTime;
  
  for (let i = 0; i < totalCandles; i++) {
    // 1. Тренд (тяготение к таргет цене года)
    const target = getTargetPrice(currentTime);
    const trendPull = (target - currentPrice) / 200; // Медленное притяжение

    // 2. Волатильность (шум)
    // Альткоины очень шумные. 
    const volatility = 0.02 + (Math.random() * 0.02); // 2-4% per 4h candle
    const noise = (Math.random() - 0.5) * volatility * currentPrice;

    // 3. Формирование тела
    let close = currentPrice + trendPull + noise;
    if (close <= 0) close = 0.0000001;

    const open = currentPrice;
    let high = Math.max(open, close);
    let low = Math.min(open, close);

    // 4. Тени (Wicks) - критически важно для стратегии 16.0
    // В реальности цена часто ходит вниз на 5% и возвращается
    const wickExtend = volatility * 3; // Тени длиннее тела
    high += high * Math.random() * wickExtend;
    low -= low * Math.random() * wickExtend;

    // 5. Коррекция под проливы (Flash Crashes)
    // Раз в ~2 месяца сильный пролив
    if (Math.random() < 0.002) {
        low *= 0.85; // -15%
    }
    // Раз в ~2 месяца памп
    if (Math.random() < 0.002) {
        high *= 1.15; // +15%
    }

    candles.push({
      time: currentTime,
      open, high, low, close,
      volume: Math.random() * 1000000
    });

    currentPrice = close;
    currentTime += msPerCandle;
  }

  return candles;
};

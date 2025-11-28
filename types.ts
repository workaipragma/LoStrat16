
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeOrder {
  price: number;
  volume: number; // In USDT
  fee: number; // Commission paid
  time: number;
  type: 'BUY' | 'SELL';
  reason: string;
}

export interface Trade {
  id: string;
  coin: string;
  entryTime: number;
  status: 'OPEN' | 'CLOSED';
  orders: TradeOrder[]; // History of DCA buys
  avgPrice: number;
  totalVolume: number;
  exitTime?: number;
  exitPrice?: number;
  pnl: number;
  pnlPercent: number;
  maxDrawdownPercent: number; // Max negative PnL during trade
  dcaLevelReached: number; // 0 to 6
}

export interface StrategyStats {
  totalProfit: number;
  netProfitPercent: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number; // Gross Profit / Gross Loss
  recoveryFactor: number; // Net Profit / Max Drawdown
  
  // Institutional Metrics
  sharpeRatio: number; // Risk-adjusted return
  sortinoRatio: number; // Downside risk-adjusted return
  calmarRatio: number; // Annualized Return / Max Drawdown
  sqn: number; // System Quality Number
  
  strategyScore: number; // 0-100 proprietary score
  totalTrades: number;
  maxDcaLevel: number;
  finalEquity: number;
  avgHoldTimeHrs: number; // Average hours held
  dailyProfit: number;
  totalFees: number; // Total paid in fees
}

export interface BacktestResult extends StrategyStats {
  coin: string;
  trades: Trade[];
  equityCurve: { time: number; equity: number }[];
  buyAndHoldEquityCurve: { time: number; equity: number }[]; 
  buyAndHoldProfit: number; 
  drawdownCurve: { time: number; drawdown: number }[];
  dcaDistribution: number[]; // Histogram
  config: StrategyConfig;
  
  // AI Optimization
  aiOptimized?: boolean;
  baselineResult?: BacktestResult; // For visual comparison chart
  configDiff?: Partial<StrategyConfig>; // What changed?
  generation?: number; // For GA
}

export interface StrategyConfig {
  initialCapital: number;
  botAllocation: number; // Percent of current equity per bot (e.g. 0.5%)
  leverage: number; // e.g. 20x
  
  // Costs
  commission: number; // % per order (e.g. 0.05)
  slippage: number; // % price impact (e.g. 0.01)

  // Entry Filters
  smartEntry: boolean;
  cciPeriod: number;
  cciThreshold: number; // < 80
  cmoPeriod: number;
  cmoThreshold: number; // > -90
  williamsPeriod: number;
  williamsThreshold: number; // < -80
  adxPeriod: number;
  adxThreshold: number; // > 40 (for Order 2)
  
  // Grid Settings (The 16.0 Grid)
  gridSteps: number[]; // [0.04, 6, 15, 28, 40, 65]
  volumeWeights: number[]; // Allocation % for each step
  
  // Exit
  tpPercent: number; // Min TP (1%)
  turtlePeriod: number; // For Turtle Zone
}

export const COIN_LIST = [
  "AAVE", "ADA", "AGI", "AIOZ", "ANKR", "ASTR", "ATOM", "AVAX", "AXS", "BAT", 
  "BCH", "CELO", "CFX", "CHR", "COMP", "CRO", "CRV", "CTC", "CTK", "CVC", 
  "DASH", "DGB", "DOT", "EGLD", "ENS", "ETC", "FIL", "FLOW", "FLR", "GLM", 
  "GRT", "HBAR", "ICP", "ICX", "IMX", "INJ", "IOTA", "JTO", "KAS", "KNC", 
  "KSM", "LDO", "LINK", "LRC", "MANA", "MNT", "MOVR", "NEO", "NMR", "ONDO", 
  "ONG", "POL", "RVN", "SAND", "SHIB1000", "SLP", "STORJ", "SUPER", "SUSHI", 
  "STX", "SXP", "TAO", "THETA", "TON", "TWT", "UMA", "UNI", "VET", "WOO", 
  "XLM", "XRP", "XTZ", "YFI", "ZEC", "ZIL"
];

// Anchors for Generator
export interface YearPrice {
    [year: number]: number;
}

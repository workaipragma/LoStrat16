
import { BacktestResult, StrategyConfig } from '../types';
import { runBacktest } from './engine';
import { generateMarketData } from './dataGenerator';

const POPULATION_SIZE = 20; 
const GENERATIONS = 5; 
const MUTATION_RATE = 0.2; 

export const optimizeCoinSettings = async (coin: string, baseConfig: StrategyConfig): Promise<BacktestResult> => {
    const candles = generateMarketData(coin);
    const baseline = runBacktest(coin, baseConfig, candles);
    
    let population = generatePopulation(baseConfig, POPULATION_SIZE);
    
    let bestResult = baseline;
    let bestScore = evaluate(baseline);
    let bestConfig = { ...baseConfig };

    for (let gen = 0; gen < GENERATIONS; gen++) {
        const results = population.map(cfg => {
            const res = runBacktest(coin, cfg, candles);
            return { config: cfg, result: res, score: evaluate(res) };
        });

        const genBest = results.reduce((prev, curr) => curr.score > prev.score ? curr : prev);
        
        if (genBest.score > bestScore) {
            bestScore = genBest.score;
            bestResult = genBest.result;
            bestConfig = genBest.config;
        }

        results.sort((a, b) => b.score - a.score);
        
        const parents = results.slice(0, Math.floor(POPULATION_SIZE * 0.4)).map(r => r.config);
        
        const nextGen: StrategyConfig[] = [...parents]; 
        
        while (nextGen.length < POPULATION_SIZE) {
            const p1 = parents[Math.floor(Math.random() * parents.length)];
            const p2 = parents[Math.floor(Math.random() * parents.length)];
            let child = crossover(p1, p2);
            if (Math.random() < MUTATION_RATE) {
                child = mutate(child);
            }
            nextGen.push(child);
        }
        population = nextGen;
        
        await new Promise(r => setTimeout(r, 5));
    }

    const isImproved = bestScore > evaluate(baseline) * 1.05; 
    
    const diff: Partial<StrategyConfig> = {};
    if (isImproved) {
        if (bestConfig.tpPercent !== baseConfig.tpPercent) diff.tpPercent = bestConfig.tpPercent;
        if (bestConfig.turtlePeriod !== baseConfig.turtlePeriod) diff.turtlePeriod = bestConfig.turtlePeriod;
        if (bestConfig.cciThreshold !== baseConfig.cciThreshold) diff.cciThreshold = bestConfig.cciThreshold;
    }

    return {
        ...bestResult,
        aiOptimized: isImproved,
        baselineResult: baseline,
        configDiff: diff,
        generation: GENERATIONS
    };
};

const evaluate = (res: BacktestResult): number => {
    if (res.maxDrawdown > 55) return -1000;
    if (res.totalTrades < 5) return -100;
    
    const profitScore = res.netProfitPercent; 
    const safetyScore = (50 - res.maxDrawdown) * 3; 
    const effScore = res.sharpeRatio * 20;

    return profitScore + safetyScore + effScore;
};

const generatePopulation = (base: StrategyConfig, size: number): StrategyConfig[] => {
    const pop: StrategyConfig[] = [];
    pop.push(base); 
    for (let i = 1; i < size; i++) {
        pop.push(mutate(base));
    }
    return pop;
};

const mutate = (cfg: StrategyConfig): StrategyConfig => {
    const c = { ...cfg };
    const r = Math.random();
    
    if (r < 0.2) c.tpPercent = Number((c.tpPercent * (0.8 + Math.random() * 0.4)).toFixed(2));
    else if (r < 0.4) c.turtlePeriod = Math.floor(c.turtlePeriod * (0.8 + Math.random() * 0.4));
    else if (r < 0.6) c.cciThreshold = Math.min(100, Math.max(50, c.cciThreshold + (Math.random() - 0.5) * 20));
    
    return c;
};

const crossover = (p1: StrategyConfig, p2: StrategyConfig): StrategyConfig => {
    return {
        ...p1,
        tpPercent: Math.random() > 0.5 ? p1.tpPercent : p2.tpPercent,
        turtlePeriod: Math.random() > 0.5 ? p1.turtlePeriod : p2.turtlePeriod,
        gridSteps: p1.gridSteps, 
        volumeWeights: p1.volumeWeights
    };
};

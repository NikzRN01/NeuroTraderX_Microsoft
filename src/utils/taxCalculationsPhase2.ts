/**
 * Tax Optimization Phase 2: Advanced Features
 * 
 * Features:
 * - Wash-sale rule detection and enforcement
 * - Multiple tax lot tracking (FIFO, LIFO, Specific ID)
 * - Tax optimization strategies
 * - Cost basis method selection
 */

import { HoldingWithTax } from './taxCalculations';

// ============================================================================
// CONSTANTS
// ============================================================================

export const WASH_SALE_DAYS = 30;

export type CostBasisMethod = 'FIFO' | 'LIFO' | 'SPECIFIC_ID' | 'AVERAGE';

// ============================================================================
// TYPES
// ============================================================================

export interface TaxLot {
  lotId: string;
  symbol: string;
  shares: number;
  purchasePrice: number;
  purchaseDate: Date;
  remainingShares: number; // After partial sales
}

export interface Transaction {
  transactionId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  date: Date;
}

export interface WashSaleViolation {
  symbol: string;
  sellDate: Date;
  sellShares: number;
  sellPrice: number;
  buyDate: Date;
  buyShares: number;
  buyPrice: number;
  disallowedLoss: number;
  daysApart: number;
  adjustedCostBasis: number;
}

export interface OptimizationStrategy {
  strategyType: 'HARVEST_LOSSES' | 'DEFER_GAINS' | 'CONVERT_TO_LONG_TERM' | 'BRACKET_OPTIMIZATION';
  title: string;
  description: string;
  symbol?: string;
  action: string;
  estimatedSavings: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  daysUntilLongTerm?: number;
}

export interface LotSaleRecommendation {
  symbol: string;
  method: CostBasisMethod;
  lotsToSell: Array<{
    lotId: string;
    shares: number;
    purchasePrice: number;
    purchaseDate: Date;
    gainLoss: number;
    taxImpact: number;
  }>;
  totalGainLoss: number;
  totalTax: number;
  reasoning: string;
}

// ============================================================================
// WASH-SALE RULE FUNCTIONS
// ============================================================================

/**
 * Check if two dates are within the wash-sale window (30 days)
 */
export function isWithinWashSaleWindow(date1: Date, date2: Date): boolean {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= WASH_SALE_DAYS;
}

/**
 * Detect wash-sale violations in transaction history
 */
export function detectWashSales(transactions: Transaction[]): WashSaleViolation[] {
  const violations: WashSaleViolation[] = [];
  
  // Group by symbol
  const bySymbol = transactions.reduce((acc, t) => {
    if (!acc[t.symbol]) acc[t.symbol] = [];
    acc[t.symbol].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Check each symbol
  Object.keys(bySymbol).forEach(symbol => {
    const symbolTxns = bySymbol[symbol].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Find sell transactions at a loss
    const sells = symbolTxns.filter(t => t.type === 'SELL');
    
    sells.forEach(sell => {
      // Find corresponding buys (this is simplified - should match specific lots)
      const previousBuys = symbolTxns.filter(
        t => t.type === 'BUY' && t.date < sell.date
      );
      
      if (previousBuys.length === 0) return;
      
      // Estimate cost basis (simplified FIFO)
      const avgBuyPrice = previousBuys.reduce((sum, b) => sum + b.price, 0) / previousBuys.length;
      const loss = (sell.price - avgBuyPrice) * sell.shares;
      
      if (loss >= 0) return; // Not a loss, no wash sale concern
      
      // Look for buys within 30 days before OR after the sell
      const washBuys = symbolTxns.filter(t => {
        if (t.type !== 'BUY') return false;
        const daysDiff = Math.abs((t.date.getTime() - sell.date.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= WASH_SALE_DAYS && t.date !== sell.date;
      });
      
      washBuys.forEach(buy => {
        const disallowedLoss = Math.min(Math.abs(loss), buy.shares * sell.price);
        const daysApart = Math.round(Math.abs((buy.date.getTime() - sell.date.getTime()) / (1000 * 60 * 60 * 24)));
        
        violations.push({
          symbol,
          sellDate: sell.date,
          sellShares: sell.shares,
          sellPrice: sell.price,
          buyDate: buy.date,
          buyShares: buy.shares,
          buyPrice: buy.price,
          disallowedLoss,
          daysApart,
          adjustedCostBasis: buy.price + (disallowedLoss / buy.shares),
        });
      });
    });
  });

  return violations;
}

/**
 * Calculate adjusted cost basis after wash sale
 */
export function calculateAdjustedCostBasis(
  originalCostBasis: number,
  disallowedLoss: number,
  shares: number
): number {
  return originalCostBasis + disallowedLoss / shares;
}

// ============================================================================
// TAX LOT TRACKING FUNCTIONS
// ============================================================================

/**
 * Select lots to sell using FIFO method
 */
export function selectLotsFIFO(lots: TaxLot[], sharesToSell: number): TaxLot[] {
  const sorted = [...lots].sort((a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime());
  return selectLotsSequential(sorted, sharesToSell);
}

/**
 * Select lots to sell using LIFO method
 */
export function selectLotsLIFO(lots: TaxLot[], sharesToSell: number): TaxLot[] {
  const sorted = [...lots].sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime());
  return selectLotsSequential(sorted, sharesToSell);
}

/**
 * Select lots to maximize losses (for tax-loss harvesting)
 */
export function selectLotsMaxLoss(lots: TaxLot[], sharesToSell: number, currentPrice: number): TaxLot[] {
  const sorted = [...lots].sort((a, b) => {
    const lossA = (currentPrice - a.purchasePrice) * a.remainingShares;
    const lossB = (currentPrice - b.purchasePrice) * b.remainingShares;
    return lossA - lossB; // Most negative first
  });
  return selectLotsSequential(sorted, sharesToSell);
}

/**
 * Select lots to minimize gains (for tax optimization)
 */
export function selectLotsMinGain(lots: TaxLot[], sharesToSell: number, currentPrice: number): TaxLot[] {
  const sorted = [...lots].sort((a, b) => {
    const gainA = (currentPrice - a.purchasePrice) * a.remainingShares;
    const gainB = (currentPrice - b.purchasePrice) * b.remainingShares;
    return gainA - gainB; // Smallest gain first
  });
  return selectLotsSequential(sorted, sharesToSell);
}

/**
 * Helper to select lots sequentially from sorted array
 */
function selectLotsSequential(sortedLots: TaxLot[], sharesToSell: number): TaxLot[] {
  const selected: TaxLot[] = [];
  let remaining = sharesToSell;
  
  for (const lot of sortedLots) {
    if (remaining <= 0) break;
    
    const sharesToTake = Math.min(lot.remainingShares, remaining);
    selected.push({
      ...lot,
      shares: sharesToTake,
      remainingShares: sharesToTake,
    });
    remaining -= sharesToTake;
  }
  
  return selected;
}

/**
 * Calculate gain/loss for selected lots
 */
export function calculateLotGainLoss(lots: TaxLot[], currentPrice: number): number {
  return lots.reduce((total, lot) => {
    return total + (currentPrice - lot.purchasePrice) * lot.shares;
  }, 0);
}

// ============================================================================
// OPTIMIZATION STRATEGIES
// ============================================================================

/**
 * Generate tax optimization strategies based on holdings
 */
export function generateOptimizationStrategies(
  holdings: HoldingWithTax[],
  annualIncome: number,
  currentDate: Date = new Date()
): OptimizationStrategy[] {
  const strategies: OptimizationStrategy[] = [];

  holdings.forEach(holding => {
    // Strategy 1: Harvest losses before year-end
    if (holding.unrealizedGainLoss < 0) {
      const daysUntilYearEnd = Math.ceil(
        (new Date(currentDate.getFullYear(), 11, 31).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilYearEnd < 60) {
        strategies.push({
          strategyType: 'HARVEST_LOSSES',
          title: `Harvest ${holding.symbol} Loss Before Year-End`,
          description: `Sell ${holding.symbol} to realize ${Math.abs(holding.unrealizedGainLoss).toFixed(2)} loss and offset gains. ${daysUntilYearEnd} days remaining.`,
          symbol: holding.symbol,
          action: `Sell ${holding.shares} shares`,
          estimatedSavings: holding.estimatedTax,
          priority: daysUntilYearEnd < 30 ? 'HIGH' : 'MEDIUM',
        });
      }
    }

    // Strategy 2: Wait for long-term status
    if (!holding.isLongTerm && holding.unrealizedGainLoss > 0) {
      const daysUntilLongTerm = 365 - holding.holdingPeriodDays;
      
      if (daysUntilLongTerm <= 60) {
        const shortTermTax = holding.estimatedTax;
        const longTermTax = holding.unrealizedGainLoss * 0.15; // Assume 15% long-term rate
        const savings = shortTermTax - longTermTax;
        
        strategies.push({
          strategyType: 'CONVERT_TO_LONG_TERM',
          title: `Wait ${daysUntilLongTerm} Days for Long-Term Rate`,
          description: `${holding.symbol} will qualify for long-term capital gains in ${daysUntilLongTerm} days, reducing tax from ${(holding.taxRate * 100).toFixed(0)}% to 15%.`,
          symbol: holding.symbol,
          action: `Hold until ${new Date(currentDate.getTime() + daysUntilLongTerm * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
          estimatedSavings: savings,
          priority: savings > 1000 ? 'HIGH' : 'MEDIUM',
          daysUntilLongTerm,
        });
      }
    }

    // Strategy 3: Defer gains to next year
    if (holding.unrealizedGainLoss > 5000) {
      const daysUntilYearEnd = Math.ceil(
        (new Date(currentDate.getFullYear(), 11, 31).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilYearEnd < 90) {
        strategies.push({
          strategyType: 'DEFER_GAINS',
          title: `Consider Deferring ${holding.symbol} Gains`,
          description: `Large gain of $${holding.unrealizedGainLoss.toFixed(2)}. Deferring to next year may provide better tax planning opportunities.`,
          symbol: holding.symbol,
          action: `Wait ${daysUntilYearEnd + 1} days to sell`,
          estimatedSavings: 0, // Tax deferral benefit
          priority: 'LOW',
        });
      }
    }

    // Strategy 4: Bracket optimization
    if (annualIncome > 90000 && annualIncome < 110000 && holding.unrealizedGainLoss > 0) {
      strategies.push({
        strategyType: 'BRACKET_OPTIMIZATION',
        title: `Optimize Tax Bracket Timing`,
        description: `You're near a tax bracket threshold. Consider spreading sales across tax years to stay in lower bracket.`,
        action: 'Review annual income and plan sales accordingly',
        estimatedSavings: holding.unrealizedGainLoss * 0.02, // Rough estimate
        priority: 'MEDIUM',
      });
    }
  });

  // Sort by priority and savings
  return strategies.sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.estimatedSavings - a.estimatedSavings;
  });
}

/**
 * Generate lot-specific sale recommendations
 */
export function generateLotSaleRecommendations(
  symbol: string,
  lots: TaxLot[],
  sharesToSell: number,
  currentPrice: number,
  annualIncome: number
): LotSaleRecommendation[] {
  const recommendations: LotSaleRecommendation[] = [];

  // FIFO recommendation
  const fifoLots = selectLotsFIFO(lots, sharesToSell);
  const fifoGainLoss = calculateLotGainLoss(fifoLots, currentPrice);
  const fifoTax = Math.abs(fifoGainLoss) * 0.22; // Simplified
  
  recommendations.push({
    symbol,
    method: 'FIFO',
    lotsToSell: fifoLots.map(lot => ({
      lotId: lot.lotId,
      shares: lot.shares,
      purchasePrice: lot.purchasePrice,
      purchaseDate: lot.purchaseDate,
      gainLoss: (currentPrice - lot.purchasePrice) * lot.shares,
      taxImpact: (currentPrice - lot.purchasePrice) * lot.shares * 0.22,
    })),
    totalGainLoss: fifoGainLoss,
    totalTax: fifoGainLoss > 0 ? fifoTax : 0,
    reasoning: 'First-In-First-Out: Sells oldest shares first. Simple and commonly used.',
  });

  // LIFO recommendation
  const lifoLots = selectLotsLIFO(lots, sharesToSell);
  const lifoGainLoss = calculateLotGainLoss(lifoLots, currentPrice);
  const lifoTax = Math.abs(lifoGainLoss) * 0.22;
  
  recommendations.push({
    symbol,
    method: 'LIFO',
    lotsToSell: lifoLots.map(lot => ({
      lotId: lot.lotId,
      shares: lot.shares,
      purchasePrice: lot.purchasePrice,
      purchaseDate: lot.purchaseDate,
      gainLoss: (currentPrice - lot.purchasePrice) * lot.shares,
      taxImpact: (currentPrice - lot.purchasePrice) * lot.shares * 0.22,
    })),
    totalGainLoss: lifoGainLoss,
    totalTax: lifoGainLoss > 0 ? lifoTax : 0,
    reasoning: 'Last-In-First-Out: Sells newest shares first. May minimize short-term gains.',
  });

  // Max Loss recommendation
  const maxLossLots = selectLotsMaxLoss(lots, sharesToSell, currentPrice);
  const maxLossGainLoss = calculateLotGainLoss(maxLossLots, currentPrice);
  const maxLossTax = Math.abs(maxLossGainLoss) * 0.22;
  
  recommendations.push({
    symbol,
    method: 'SPECIFIC_ID',
    lotsToSell: maxLossLots.map(lot => ({
      lotId: lot.lotId,
      shares: lot.shares,
      purchasePrice: lot.purchasePrice,
      purchaseDate: lot.purchaseDate,
      gainLoss: (currentPrice - lot.purchasePrice) * lot.shares,
      taxImpact: (currentPrice - lot.purchasePrice) * lot.shares * 0.22,
    })),
    totalGainLoss: maxLossGainLoss,
    totalTax: maxLossGainLoss > 0 ? maxLossTax : 0,
    reasoning: 'Tax-Loss Harvesting: Sells lots with largest losses first to maximize tax savings.',
  });

  return recommendations.sort((a, b) => a.totalTax - b.totalTax);
}

/**
 * Export data to CSV format
 */
export function exportToCSV(holdings: HoldingWithTax[]): string {
  const headers = [
    'Symbol',
    'Shares',
    'Purchase Price',
    'Current Price',
    'Cost Basis',
    'Current Value',
    'Gain/Loss',
    'Gain/Loss %',
    'Purchase Date',
    'Holding Period (days)',
    'Type',
    'Tax Rate',
    'Estimated Tax',
  ];

  const rows = holdings.map(h => [
    h.symbol,
    h.shares,
    h.purchasePrice.toFixed(2),
    h.currentPrice.toFixed(2),
    h.costBasis.toFixed(2),
    h.currentValue.toFixed(2),
    h.unrealizedGainLoss.toFixed(2),
    h.unrealizedGainLossPercent.toFixed(2),
    h.purchaseDate.toLocaleDateString(),
    h.holdingPeriodDays,
    h.isLongTerm ? 'Long-term' : 'Short-term',
    (h.taxRate * 100).toFixed(2) + '%',
    h.estimatedTax.toFixed(2),
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Save holdings to localStorage
 */
export function saveHoldingsToStorage(holdings: any[], storageKey: string = 'tax_optimization_holdings'): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(holdings));
  } catch (error) {
    console.error('Failed to save holdings:', error);
  }
}

/**
 * Load holdings from localStorage
 */
export function loadHoldingsFromStorage(storageKey: string = 'tax_optimization_holdings'): any[] | null {
  try {
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load holdings:', error);
    return null;
  }
}

/**
 * Tax Optimization Phase 1: Core Tax Calculation Utilities
 * 
 * Features:
 * - Capital gains/loss calculation
 * - Short-term vs Long-term classification
 * - Tax liability estimation
 * - Tax-loss harvesting identification
 */

// ============================================================================
// CONSTANTS - US Federal Tax Rates (2024-2026)
// ============================================================================

export const TAX_RATES = {
  // Short-term capital gains (taxed as ordinary income)
  SHORT_TERM_BRACKETS: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  
  // Long-term capital gains (held > 365 days)
  LONG_TERM_BRACKETS: [
    { min: 0, max: 47025, rate: 0.00 },
    { min: 47025, max: 518900, rate: 0.15 },
    { min: 518900, max: Infinity, rate: 0.20 },
  ],
};

export const LONG_TERM_HOLDING_DAYS = 365;

// ============================================================================
// TYPES
// ============================================================================

export interface HoldingWithTax {
  symbol: string;
  shares: number;
  costBasis: number; // Total cost
  currentValue: number; // Total current value
  purchaseDate: Date;
  purchasePrice: number; // Per share
  currentPrice: number; // Per share
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
  holdingPeriodDays: number;
  isLongTerm: boolean;
  estimatedTax: number;
  taxRate: number;
}

export interface TaxSummary {
  totalGains: number;
  totalLosses: number;
  netGainLoss: number;
  shortTermGains: number;
  shortTermLosses: number;
  longTermGains: number;
  longTermLosses: number;
  estimatedTaxLiability: number;
  potentialTaxSavings: number; // From harvesting losses
}

export interface TaxLossHarvestingOpportunity {
  symbol: string;
  shares: number;
  unrealizedLoss: number;
  potentialTaxSavings: number;
  isLongTerm: boolean;
  purchaseDate: Date;
  currentValue: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate number of days between two dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determine if a holding is long-term (held > 365 days)
 */
export function isLongTermHolding(purchaseDate: Date, currentDate: Date = new Date()): boolean {
  return getDaysBetween(purchaseDate, currentDate) > LONG_TERM_HOLDING_DAYS;
}

/**
 * Calculate tax on capital gains based on income and gain type
 */
export function calculateCapitalGainsTax(
  gainAmount: number,
  isLongTerm: boolean,
  annualIncome: number = 100000
): { tax: number; rate: number } {
  if (gainAmount <= 0) return { tax: 0, rate: 0 };

  const brackets = isLongTerm 
    ? TAX_RATES.LONG_TERM_BRACKETS 
    : TAX_RATES.SHORT_TERM_BRACKETS;

  // Find applicable bracket
  const bracket = brackets.find(b => annualIncome >= b.min && annualIncome < b.max) 
    || brackets[brackets.length - 1];

  const tax = gainAmount * bracket.rate;
  return { tax, rate: bracket.rate };
}

/**
 * Analyze a single holding for tax implications
 */
export function analyzeHolding(
  symbol: string,
  shares: number,
  purchasePrice: number,
  currentPrice: number,
  purchaseDate: Date,
  annualIncome: number = 100000
): HoldingWithTax {
  const costBasis = shares * purchasePrice;
  const currentValue = shares * currentPrice;
  const unrealizedGainLoss = currentValue - costBasis;
  const unrealizedGainLossPercent = (unrealizedGainLoss / costBasis) * 100;
  
  const holdingPeriodDays = getDaysBetween(purchaseDate, new Date());
  const isLongTerm = holdingPeriodDays > LONG_TERM_HOLDING_DAYS;
  
  const { tax, rate } = calculateCapitalGainsTax(
    Math.max(0, unrealizedGainLoss),
    isLongTerm,
    annualIncome
  );

  return {
    symbol,
    shares,
    costBasis,
    currentValue,
    purchaseDate,
    purchasePrice,
    currentPrice,
    unrealizedGainLoss,
    unrealizedGainLossPercent,
    holdingPeriodDays,
    isLongTerm,
    estimatedTax: tax,
    taxRate: rate,
  };
}

/**
 * Calculate comprehensive tax summary for entire portfolio
 */
export function calculateTaxSummary(
  holdings: HoldingWithTax[],
  annualIncome: number = 100000
): TaxSummary {
  let totalGains = 0;
  let totalLosses = 0;
  let shortTermGains = 0;
  let shortTermLosses = 0;
  let longTermGains = 0;
  let longTermLosses = 0;

  holdings.forEach(holding => {
    if (holding.unrealizedGainLoss > 0) {
      totalGains += holding.unrealizedGainLoss;
      if (holding.isLongTerm) {
        longTermGains += holding.unrealizedGainLoss;
      } else {
        shortTermGains += holding.unrealizedGainLoss;
      }
    } else {
      const loss = Math.abs(holding.unrealizedGainLoss);
      totalLosses += loss;
      if (holding.isLongTerm) {
        longTermLosses += loss;
      } else {
        shortTermLosses += loss;
      }
    }
  });

  const netGainLoss = totalGains - totalLosses;
  
  // Calculate estimated tax liability
  let estimatedTaxLiability = 0;
  if (netGainLoss > 0) {
    // Net gains - calculate tax on net amount
    const stNet = shortTermGains - shortTermLosses;
    const ltNet = longTermGains - longTermLosses;
    
    if (stNet > 0) {
      estimatedTaxLiability += calculateCapitalGainsTax(stNet, false, annualIncome).tax;
    }
    if (ltNet > 0) {
      estimatedTaxLiability += calculateCapitalGainsTax(ltNet, true, annualIncome).tax;
    }
  }

  // Potential tax savings from harvesting all losses
  const potentialTaxSavings = holdings
    .filter(h => h.unrealizedGainLoss < 0)
    .reduce((sum, h) => {
      const loss = Math.abs(h.unrealizedGainLoss);
      const { tax } = calculateCapitalGainsTax(loss, h.isLongTerm, annualIncome);
      return sum + tax;
    }, 0);

  return {
    totalGains,
    totalLosses,
    netGainLoss,
    shortTermGains,
    shortTermLosses,
    longTermGains,
    longTermLosses,
    estimatedTaxLiability,
    potentialTaxSavings,
  };
}

/**
 * Identify tax-loss harvesting opportunities
 */
export function identifyTaxLossHarvesting(
  holdings: HoldingWithTax[],
  annualIncome: number = 100000
): TaxLossHarvestingOpportunity[] {
  return holdings
    .filter(h => h.unrealizedGainLoss < 0) // Only losing positions
    .map(holding => {
      const unrealizedLoss = Math.abs(holding.unrealizedGainLoss);
      const { tax } = calculateCapitalGainsTax(unrealizedLoss, holding.isLongTerm, annualIncome);
      
      return {
        symbol: holding.symbol,
        shares: holding.shares,
        unrealizedLoss,
        potentialTaxSavings: tax,
        isLongTerm: holding.isLongTerm,
        purchaseDate: holding.purchaseDate,
        currentValue: holding.currentValue,
      };
    })
    .sort((a, b) => b.potentialTaxSavings - a.potentialTaxSavings); // Sort by highest savings
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

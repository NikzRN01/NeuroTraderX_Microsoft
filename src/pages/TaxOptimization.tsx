/**
 * Tax Optimization Phase 1
 * 
 * Features:
 * - Portfolio holdings with cost basis tracking
 * - Unrealized gains/losses calculation
 * - Tax liability estimation
 * - Tax-loss harvesting recommendations
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ChevronLeft, 
  Plus, 
  TrendingDown, 
  Calculator,
  AlertCircle,
  Info,
  Trash2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  analyzeHolding,
  calculateTaxSummary,
  identifyTaxLossHarvesting,
  formatCurrency,
  formatPercent,
  type HoldingWithTax,
} from "@/utils/taxCalculations";

interface HoldingInput {
  id: string;
  symbol: string;
  shares: string;
  purchasePrice: string;
  currentPrice: string;
  purchaseDate: string;
}

const TaxOptimization = () => {
  const [annualIncome, setAnnualIncome] = useState("100000");
  const [holdings, setHoldings] = useState<HoldingInput[]>([
    {
      id: "1",
      symbol: "",
      shares: "",
      purchasePrice: "",
      currentPrice: "",
      purchaseDate: "",
    },
  ]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // Add new holding row
  const addHolding = () => {
    setHoldings([
      ...holdings,
      {
        id: Date.now().toString(),
        symbol: "",
        shares: "",
        purchasePrice: "",
        currentPrice: "",
        purchaseDate: "",
      },
    ]);
  };

  // Remove holding row
  const removeHolding = (id: string) => {
    setHoldings(holdings.filter(h => h.id !== id));
  };

  // Update holding field
  const updateHolding = (id: string, field: keyof HoldingInput, value: string) => {
    setHoldings(
      holdings.map(h => (h.id === id ? { ...h, [field]: value } : h))
    );
  };

  // Parse and analyze holdings
  const analyzedHoldings: HoldingWithTax[] = holdings
    .filter(h => h.symbol && h.shares && h.purchasePrice && h.currentPrice && h.purchaseDate)
    .map(h => 
      analyzeHolding(
        h.symbol.toUpperCase(),
        parseFloat(h.shares),
        parseFloat(h.purchasePrice),
        parseFloat(h.currentPrice),
        new Date(h.purchaseDate),
        parseFloat(annualIncome)
      )
    );

  const taxSummary = analyzedHoldings.length > 0 
    ? calculateTaxSummary(analyzedHoldings, parseFloat(annualIncome))
    : null;

  const harvestingOpportunities = analyzedHoldings.length > 0
    ? identifyTaxLossHarvesting(analyzedHoldings, parseFloat(annualIncome))
    : [];

  return (
    <div className="min-h-screen p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <Link to="/" className="text-primary hover:text-primary/80 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gradient">Tax Optimization</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Phase 1: Capital Gains Calculator & Tax-Loss Harvesting
            </p>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div variants={itemVariants}>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This tool provides estimates only and should not be considered tax advice. 
              Please consult a qualified tax professional for your specific situation.
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Annual Income Input */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Your Tax Information</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your annual income to calculate accurate tax rates
                </p>
              </div>
              <div className="max-w-xs">
                <Label htmlFor="annual-income">Annual Income (USD)</Label>
                <Input
                  id="annual-income"
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  placeholder="100000"
                  className="mt-1"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Portfolio Holdings Input */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Portfolio Holdings</h2>
                  <p className="text-sm text-muted-foreground">
                    Add your investment holdings to analyze tax implications
                  </p>
                </div>
                <Button onClick={addHolding} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Holding
                </Button>
              </div>

              <div className="space-y-3">
                {holdings.map((holding) => (
                  <div
                    key={holding.id}
                    className="grid grid-cols-6 gap-3 p-4 rounded-lg bg-secondary/20 border border-border/30"
                  >
                    <div>
                      <Label className="text-xs">Symbol</Label>
                      <Input
                        value={holding.symbol}
                        onChange={(e) => updateHolding(holding.id, "symbol", e.target.value.toUpperCase())}
                        placeholder="AAPL"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Shares</Label>
                      <Input
                        type="number"
                        value={holding.shares}
                        onChange={(e) => updateHolding(holding.id, "shares", e.target.value)}
                        placeholder="100"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Purchase Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={holding.purchasePrice}
                        onChange={(e) => updateHolding(holding.id, "purchasePrice", e.target.value)}
                        placeholder="150.00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Current Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={holding.currentPrice}
                        onChange={(e) => updateHolding(holding.id, "currentPrice", e.target.value)}
                        placeholder="175.00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Purchase Date</Label>
                      <Input
                        type="date"
                        value={holding.purchaseDate}
                        onChange={(e) => updateHolding(holding.id, "purchaseDate", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-end">
                      {holdings.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeHolding(holding.id)}
                          className="h-10 w-10"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tax Summary */}
        {taxSummary && (
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Tax Summary</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Net Gain/Loss */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Net Gain/Loss</p>
                    <p className={`text-2xl font-bold ${taxSummary.netGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(taxSummary.netGainLoss)}
                    </p>
                  </div>

                  {/* Estimated Tax Liability */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-red-900/40 to-orange-900/40 border border-red-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Estimated Tax</p>
                    <p className="text-2xl font-bold text-red-400">
                      {formatCurrency(taxSummary.estimatedTaxLiability)}
                    </p>
                  </div>

                  {/* Potential Tax Savings */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Potential Savings</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(taxSummary.potentialTaxSavings)}
                    </p>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Short-Term (≤365 days)</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Gains:</span>
                        <span className="text-green-400">{formatCurrency(taxSummary.shortTermGains)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Losses:</span>
                        <span className="text-red-400">{formatCurrency(taxSummary.shortTermLosses)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Long-Term (&gt;365 days)</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Gains:</span>
                        <span className="text-green-400">{formatCurrency(taxSummary.longTermGains)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Losses:</span>
                        <span className="text-red-400">{formatCurrency(taxSummary.longTermLosses)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Holdings Analysis */}
        {analyzedHoldings.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Holdings Analysis</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Symbol</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Shares</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Cost Basis</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Current Value</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Gain/Loss</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Tax Rate</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Est. Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyzedHoldings.map((holding, index) => (
                      <tr key={index} className="border-b border-border/10">
                        <td className="py-3 px-2 font-medium">{holding.symbol}</td>
                        <td className="py-3 px-2 text-right">{holding.shares}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(holding.costBasis)}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(holding.currentValue)}</td>
                        <td className={`py-3 px-2 text-right ${holding.unrealizedGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(holding.unrealizedGainLoss)}
                          <span className="text-xs ml-1">({formatPercent(holding.unrealizedGainLossPercent)})</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`text-xs px-2 py-1 rounded ${holding.isLongTerm ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            {holding.isLongTerm ? 'Long' : 'Short'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">{(holding.taxRate * 100).toFixed(0)}%</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(holding.estimatedTax)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tax-Loss Harvesting Opportunities */}
        {harvestingOpportunities.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-green-400" />
                  <h2 className="text-xl font-semibold">Tax-Loss Harvesting Opportunities</h2>
                </div>
                
                <Alert className="bg-green-900/20 border-green-500/30">
                  <AlertCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-400">
                    You can harvest losses to offset capital gains and reduce your tax liability. 
                    Remember the wash-sale rule: don't repurchase the same security within 30 days.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  {harvestingOpportunities.map((opp, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/20"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{opp.symbol}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Purchased: {opp.purchaseDate.toLocaleDateString()} 
                            ({opp.isLongTerm ? 'Long-term' : 'Short-term'})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Potential Tax Savings</p>
                          <p className="text-2xl font-bold text-green-400">
                            {formatCurrency(opp.potentialTaxSavings)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-border/20">
                        <div>
                          <p className="text-xs text-muted-foreground">Shares</p>
                          <p className="font-medium">{opp.shares}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Unrealized Loss</p>
                          <p className="font-medium text-red-400">{formatCurrency(opp.unrealizedLoss)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Current Value</p>
                          <p className="font-medium">{formatCurrency(opp.currentValue)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TaxOptimization;

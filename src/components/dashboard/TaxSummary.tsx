import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calculator, TrendingDown, AlertCircle, ArrowRight, DollarSign } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { loadHoldingsFromStorage } from "@/utils/taxCalculationsPhase2";
import { analyzeHolding, calculateTaxSummary, identifyTaxLossHarvesting, formatCurrency } from "@/utils/taxCalculations";

const TaxSummary = () => {
  // Load holdings from storage (same source as Tax Optimization page)
  const storedHoldings = loadHoldingsFromStorage();
  const annualIncome = 100000; // Default, could be stored in settings/profile

  // Helper function to validate complete date
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  // Analyze holdings if they exist
  const analyzedHoldings = storedHoldings && storedHoldings.length > 0
    ? storedHoldings
        .filter(h => (h.assetType !== "Gold Investments" ? h.symbol : true) && h.quantity && h.purchasePrice && h.currentPrice && isValidDate(h.purchaseDate))
        .map(h => 
          analyzeHolding(
            h.symbol ? h.symbol.toUpperCase() : h.assetType,
            parseFloat(h.quantity),
            parseFloat(h.purchasePrice),
            parseFloat(h.currentPrice),
            new Date(h.purchaseDate),
            annualIncome
          )
        )
    : [];

  const taxSummary = analyzedHoldings.length > 0 
    ? calculateTaxSummary(analyzedHoldings, annualIncome)
    : null;

  const harvestingOpportunities = analyzedHoldings.length > 0
    ? identifyTaxLossHarvesting(analyzedHoldings, annualIncome)
    : [];

  // If no holdings, show a prompt to add them
  if (!taxSummary) {
    return (
      <GlassCard className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-500/20">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-purple-200 dark:bg-purple-500/20 p-3">
            <Calculator className="h-6 w-6 text-purple-700 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-white mb-1">Tax Impact Analysis</h3>
            <p className="text-sm text-purple-700 dark:text-muted-foreground mb-4">
              Add your holdings to see estimated tax liability and savings opportunities
            </p>
            <Link 
              to="/tax-optimization" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 text-white dark:text-purple-300 transition-colors font-medium text-sm"
            >
              Add Holdings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-500/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-200 dark:bg-purple-500/20 p-3">
              <Calculator className="h-6 w-6 text-purple-700 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900 dark:text-white">Tax Impact Analysis</h3>
              <p className="text-sm text-purple-700 dark:text-muted-foreground">
                {analyzedHoldings.length} holding{analyzedHoldings.length > 1 ? 's' : ''} analyzed
              </p>
            </div>
          </div>
          <Link 
            to="/tax-optimization" 
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Net Gain/Loss */}
          <motion.div 
            className="p-4 rounded-lg bg-white/50 dark:bg-white/5 border border-purple-200/50 dark:border-purple-500/20"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <p className="text-xs text-purple-700 dark:text-muted-foreground">Net Gain/Loss</p>
            </div>
            <p className={`text-xl font-bold ${taxSummary.netGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(taxSummary.netGainLoss)}
            </p>
          </motion.div>

          {/* Estimated Tax */}
          <motion.div 
            className="p-4 rounded-lg bg-white/50 dark:bg-white/5 border border-purple-200/50 dark:border-purple-500/20"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-xs text-purple-700 dark:text-muted-foreground">Estimated Tax</p>
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(taxSummary.estimatedTaxLiability)}
            </p>
          </motion.div>

          {/* Potential Savings */}
          <motion.div 
            className="p-4 rounded-lg bg-white/50 dark:bg-white/5 border border-purple-200/50 dark:border-purple-500/20"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-xs text-purple-700 dark:text-muted-foreground">Potential Savings</p>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(taxSummary.potentialTaxSavings)}
            </p>
          </motion.div>
        </div>

        {/* Harvesting Opportunities */}
        {harvestingOpportunities.length > 0 && (
          <div className="pt-3 border-t border-purple-200 dark:border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-purple-900 dark:text-white">
                  {harvestingOpportunities.length} Tax-Loss Harvesting Opportunit{harvestingOpportunities.length > 1 ? 'ies' : 'y'}
                </p>
              </div>
              <Link 
                to="/tax-optimization" 
                className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                View Details
              </Link>
            </div>
            <p className="text-xs text-purple-700 dark:text-muted-foreground mt-1">
              Save up to {formatCurrency(harvestingOpportunities.reduce((sum, opp) => sum + opp.potentialTaxSavings, 0))} by harvesting losses
            </p>
          </div>
        )}

        {/* Action Button */}
        <Link 
          to="/tax-optimization" 
          className="block w-full mt-4 rounded-lg bg-purple-600 hover:bg-purple-700 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 py-2.5 text-white dark:text-purple-300 transition-colors text-center font-medium text-sm"
        >
          View Full Tax Analysis
        </Link>
      </div>
    </GlassCard>
  );
};

export default TaxSummary;

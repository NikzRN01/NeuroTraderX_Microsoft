
import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, AlertCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import LineChart from "@/components/ui/LineChart";
import { loadHoldingsFromStorage } from "@/utils/taxCalculationsPhase2";
import { analyzeHolding, formatCurrency } from "@/utils/taxCalculations";
import { priceApi } from "@/services/api";
import { toast } from "sonner";

const PortfolioOverview = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("7 Days");
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 0,
    totalGrowth: 0,
    totalGrowthPercentage: 0,
    riskLevel: "Low",
  });
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
  const [investmentTypes, setInvestmentTypes] = useState([
    { name: "Stock Investments", value: 0, growth: 0, icon: "📈" },
    { name: "Mutual Funds", value: 0, growth: 0, icon: "📊" },
    { name: "Crypto Account", value: 0, growth: 0, icon: "🪙" },
    { name: "Gold Investments", value: 0, growth: 0, icon: "🪙" },
  ]);
  const [loading, setLoading] = useState(true);

  // Validate date format
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  useEffect(() => {
    const fetchPortfolioData = async () => {
      setLoading(true);
      try {
        // Load holdings from TaxOptimization storage
        const storedHoldings = loadHoldingsFromStorage();
        
        if (!storedHoldings || storedHoldings.length === 0) {
          setLoading(false);
          return;
        }

        // Filter complete holdings
        const completeHoldings = storedHoldings.filter(h => 
          (h.assetType !== "Gold Investments" ? h.symbol : true) && 
          h.quantity && 
          h.purchasePrice && 
          h.currentPrice && 
          isValidDate(h.purchaseDate)
        );

        if (completeHoldings.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch current prices for stocks and mutual funds
        const updatedHoldings = await Promise.all(
          completeHoldings.map(async (h) => {
            let currentPrice = parseFloat(h.currentPrice);
            
            // Fetch real-time price for stocks and mutual funds
            if (h.symbol && (h.assetType === "Stock Investments" || h.assetType === "Mutual Funds")) {
              try {
                const priceData = h.assetType === "Stock Investments" 
                  ? await priceApi.getStockPrice(h.symbol)
                  : await priceApi.getMutualFundPrice(h.symbol);
                
                if (priceData && priceData.currentPrice) {
                  currentPrice = priceData.currentPrice;
                }
              } catch (error) {
                console.error(`Failed to fetch price for ${h.symbol}`);
              }
            }
            
            return {
              ...h,
              currentPrice: currentPrice.toString(),
            };
          })
        );

        // Calculate portfolio totals
        let totalValue = 0;
        let totalCostBasis = 0;
        const typeValues: Record<string, { value: number; costBasis: number }> = {
          "Stock Investments": { value: 0, costBasis: 0 },
          "Mutual Funds": { value: 0, costBasis: 0 },
          "Crypto Account": { value: 0, costBasis: 0 },
          "Gold Investments": { value: 0, costBasis: 0 },
        };

        updatedHoldings.forEach(h => {
          const quantity = parseFloat(h.quantity);
          const purchasePrice = parseFloat(h.purchasePrice);
          const currentPrice = parseFloat(h.currentPrice);
          const currentValue = quantity * currentPrice;
          const costBasis = quantity * purchasePrice;

          totalValue += currentValue;
          totalCostBasis += costBasis;

          if (typeValues[h.assetType]) {
            typeValues[h.assetType].value += currentValue;
            typeValues[h.assetType].costBasis += costBasis;
          }
        });

        const totalGrowth = totalValue - totalCostBasis;
        const totalGrowthPercentage = totalCostBasis > 0 ? (totalGrowth / totalCostBasis) * 100 : 0;

        // Update portfolio data
        setPortfolioData({
          totalValue,
          totalGrowth,
          totalGrowthPercentage,
          riskLevel: totalGrowthPercentage > 15 ? "High" : totalGrowthPercentage > 5 ? "Medium" : "Low",
        });

        // Update investment types
        const updatedTypes = investmentTypes.map(type => ({
          ...type,
          value: typeValues[type.name].value,
          growth: typeValues[type.name].value - typeValues[type.name].costBasis,
        }));
        setInvestmentTypes(updatedTypes);

        // Generate chart data for the selected time range
        const days = selectedTimeRange === "7 Days" ? 7 : selectedTimeRange === "14 Days" ? 14 : 30;
        const chartPoints = [];
        
        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (days - i - 1));
          
          // Simulate historical growth - in production, this would come from historical data
          const growthFactor = 1 + (totalGrowthPercentage / 100) * (i / days);
          const value = totalCostBasis * growthFactor;
          
          chartPoints.push({
            name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.round(value * 100) / 100,
          });
        }
        
        setChartData(chartPoints);

      } catch (error) {
        console.error('Failed to fetch portfolio data:', error);
        toast.error('Failed to load portfolio data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPortfolioData();
  }, [selectedTimeRange]);

  const timeRangeClass = (range: string) =>
    `px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
      selectedTimeRange === range
        ? "bg-primary/10 text-primary"
        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
    }`;

  return (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gradient">Portfolio Overview</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Portfolio Value and Chart */}
      <GlassCard className="relative overflow-hidden">
        <div className="z-10 mb-6 flex flex-col md:flex-row md:items-end justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Total Portfolio Value</h3>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-bold">
                ${portfolioData.totalValue.toLocaleString("en-US")}
              </span>
              <div className={`flex items-center ${portfolioData.totalGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                {portfolioData.totalGrowth >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {portfolioData.totalGrowthPercentage.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <LineChart data={chartData} />
      </GlassCard>

      {/* Investment Types */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {investmentTypes.map((investment, idx) => (
          <GlassCard key={idx} className="relative overflow-hidden">
            <div className="mb-3 flex items-center gap-2">
              <div className="text-xl">{investment.icon}</div>
              <h3 className="font-medium">{investment.name}</h3>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold">
                  ${investment.value.toLocaleString("en-US")}
                </p>
                <div className={`flex items-center ${investment.growth >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {investment.growth >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    ${Math.abs(investment.growth).toLocaleString("en-US")}
                  </span>
                </div>
              </div>
              <div className="relative h-16 w-16">
                <div className="absolute bottom-0 right-0 h-14 w-14 rounded-full bg-blue-500/10"></div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

export default PortfolioOverview;

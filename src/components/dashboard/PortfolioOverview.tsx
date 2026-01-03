
import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, AlertCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import LineChart from "@/components/ui/LineChart";

const PortfolioOverview = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("7 Days");
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 125630.45,
    totalGrowth: 11800,
    totalGrowthPercentage: 12.4,
    riskLevel: "Low",
  });
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
  const [investmentTypes, setInvestmentTypes] = useState([
    { name: "Stock Investments", value: 26000, growth: 2889, icon: "📈" },
    { name: "Mutual Funds", value: 28000, growth: 2996, icon: "📊" },
    { name: "Crypto Account", value: 25000, growth: 2447, icon: "🪙" },
    { name: "Gold Investments", value: 29000, growth: 2899, icon: "🪙" },
  ]);

  useEffect(() => {
    // This would be replaced with actual API calls to fetch user data
    const fetchUserData = async () => {
      try {
        // Fetch from Supabase or your API
        // For now, we leave it at zero values
        
        // Example of chart data structure (empty for now)
        const emptyChartData = Array(7).fill(0).map((_, i) => ({
          name: `Day ${i + 1}`,
          value: 0
        }));
        
        setChartData(emptyChartData);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    
    fetchUserData();
  }, []);

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

          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">Risk: {portfolioData.riskLevel}</span>
            </div>
            <button className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>AI Recommendations</span>
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          <button
            className={timeRangeClass("7 Days")}
            onClick={() => setSelectedTimeRange("7 Days")}
          >
            7 Days
          </button>
          <button
            className={timeRangeClass("14 Days")}
            onClick={() => setSelectedTimeRange("14 Days")}
          >
            14 Days
          </button>
          <button
            className={timeRangeClass("30 Days")}
            onClick={() => setSelectedTimeRange("30 Days")}
          >
            30 Days
          </button>
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


import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Clock, Percent, DollarSign, BarChart3 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import LineChart from "@/components/ui/LineChart";

interface PortfolioSummaryProps {
  portfolioData: any;
}

const PortfolioSummary = ({ portfolioData }: PortfolioSummaryProps) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("7 Days");

  // Default empty data for when the portfolio data is not loaded yet
  const defaultData = {
    totalValue: 0,
    totalGrowth: 0,
    totalGrowthPercentage: 0,
    investmentPeriod: "0 Years",
    avgAnnualReturn: "0%",
    totalInvested: 0,
    riskLevel: "Low",
    chartData: []
  };

  // Use portfolio data if available, otherwise use default empty data
  const {
    totalValue = 0,
    totalGrowth = 0,
    totalGrowthPercentage = 0,
    investmentPeriod = "0 Years",
    avgAnnualReturn = "0%",
    totalInvested = 0,
    riskLevel = "Low",
    chartData = []
  } = portfolioData || defaultData;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const timeRangeClass = (range: string) =>
    `px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
      selectedTimeRange === range
        ? "bg-primary/10 text-primary"
        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
    }`;

  return (
    <motion.div variants={itemVariants}>
      <GlassCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Portfolio Summary</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">
                    ${totalValue.toLocaleString("en-US")}
                  </span>
                  <div className={`flex items-center ${totalGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {totalGrowth >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {totalGrowthPercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Investment Period</p>
                  </div>
                  <p className="text-lg font-medium">{investmentPeriod}</p>
                </div>
                <div className="glass-panel rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Avg. Annual Return</p>
                  </div>
                  <p className="text-lg font-medium text-success">{avgAnnualReturn}</p>
                </div>
                <div className="glass-panel rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Total Invested</p>
                  </div>
                  <p className="text-lg font-medium">${totalInvested.toLocaleString()}</p>
                </div>
                <div className="glass-panel rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Risk Level</p>
                  </div>
                  <p className="text-lg font-medium">{riskLevel}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Performance</h3>
              <div className="flex gap-2">
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
            </div>
            <LineChart data={chartData} showTimeFrames={false} />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default PortfolioSummary;

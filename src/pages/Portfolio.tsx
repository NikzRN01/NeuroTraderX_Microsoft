
import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import LineChart from "@/components/ui/LineChart";
import PieChart from "@/components/ui/PieChart";
import { ArrowUpRight, ArrowDownRight, Filter, Download, Clock, Percent, DollarSign, BarChart3 } from "lucide-react";
import { mockPortfolioData, sampleChartData } from "@/utils/mockData";

const Portfolio = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("7 Days");

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

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
    <div className="min-h-screen p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gradient">My Portfolio</h1>
            <p className="text-muted-foreground">Comprehensive view of your investments</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors">
              <Filter className="h-4 w-4" />
          
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors">
              <Download className="h-4 w-4" />
              <span className="text-sm">Export</span>
            </button>
          </div>
        </motion.div>

        {/* Portfolio Summary */}
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
                        ${mockPortfolioData.totalValue.toLocaleString("en-US")}
                      </span>
                      <div className={`flex items-center ${mockPortfolioData.totalGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {mockPortfolioData.totalGrowth >= 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {mockPortfolioData.totalGrowthPercentage.toFixed(2)}%
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
                      <p className="text-lg font-medium">2.5 Years</p>
                    </div>
                    <div className="glass-panel rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Avg. Annual Return</p>
                      </div>
                      <p className="text-lg font-medium text-success">+12.4%</p>
                    </div>
                    <div className="glass-panel rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Total Invested</p>
                      </div>
                      <p className="text-lg font-medium">$110,000</p>
                    </div>
                    <div className="glass-panel rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Risk Level</p>
                      </div>
                      <p className="text-lg font-medium">{mockPortfolioData.riskLevel}</p>
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
                <LineChart data={sampleChartData} showTimeFrames={false} />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Asset Allocation and Top Holdings */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard title="Asset Allocation">
            <div className="relative">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/5 blur-xl"></div>
              <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-purple-500/5 blur-xl"></div>
              <PieChart data={mockPortfolioData.assetAllocation} />
              
              <div className="mt-4 grid grid-cols-2 gap-2">
                {mockPortfolioData.assetAllocation.map((category, idx) => (
                  <motion.div 
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/30 transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{category.name}</span>
                      <span className="text-[10px] text-muted-foreground">{category.value}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassCard>
          
          <GlassCard title="Top Holdings">
            <div className="space-y-4">
              {mockPortfolioData.topHoldings.map((holding, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-xs font-medium">{holding.symbol.substring(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{holding.name}</p>
                        <p className="text-xs text-muted-foreground">{holding.symbol}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ${holding.value.toLocaleString("en-US")}
                    </p>
                    <div className={`flex items-center justify-end ${holding.growth >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {holding.growth >= 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      <span className="text-xs">
                        {holding.growthPercentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div variants={itemVariants}>
          <GlassCard title="Performance Metrics">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel rounded-lg p-3">
                <p className="text-sm text-muted-foreground">CAGR</p>
                <p className="text-xl font-medium text-success">+14.8%</p>
                <p className="text-xs text-muted-foreground">vs. +8.2% Benchmark</p>
              </div>
              <div className="glass-panel rounded-lg p-3">
                <p className="text-sm text-muted-foreground">YTD Return</p>
                <p className="text-xl font-medium text-success">+9.2%</p>
                <p className="text-xs text-muted-foreground">vs. +5.4% Benchmark</p>
              </div>
              <div className="glass-panel rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Volatility Score</p>
                <p className="text-xl font-medium">0.65</p>
                <p className="text-xs text-muted-foreground">Medium Volatility</p>
              </div>
              <div className="glass-panel rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                <p className="text-xl font-medium">1.32</p>
                <p className="text-xs text-muted-foreground">Above Average</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Upcoming Dividends */}
        <motion.div variants={itemVariants}>
          <GlassCard title="Upcoming Dividends">
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-secondary/40 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium">Apple Inc. (AAPL)</p>
                  <p className="text-xs text-muted-foreground">Ex-Dividend Date: May 12, 2023</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success">$0.23 per share</p>
                  <p className="text-xs text-muted-foreground">Est. $56.35 total</p>
                </div>
              </div>
              <div className="flex justify-between items-center bg-secondary/40 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium">Microsoft (MSFT)</p>
                  <p className="text-xs text-muted-foreground">Ex-Dividend Date: May 18, 2023</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success">$0.68 per share</p>
                  <p className="text-xs text-muted-foreground">Est. $81.60 total</p>
                </div>
              </div>
              <div className="flex justify-between items-center bg-secondary/40 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium">Johnson & Johnson (JNJ)</p>
                  <p className="text-xs text-muted-foreground">Ex-Dividend Date: May 22, 2023</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success">$1.13 per share</p>
                  <p className="text-xs text-muted-foreground">Est. $45.20 total</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Portfolio;

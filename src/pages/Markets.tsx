
import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import LineChart from "@/components/ui/LineChart";
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";
import { mockMarketData, sampleChartData, newsItems } from "@/utils/mockData";

const Markets = () => {
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
            <h1 className="text-3xl font-bold text-gradient">Markets</h1>
            <p className="text-muted-foreground">Track global market trends and discover opportunities</p>
          </div>
        </motion.div>

        {/* Market Overview */}
        <motion.div variants={itemVariants}>
          <Card title="Market Overview">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {mockMarketData.indices.map((index, i) => (
                  <div key={i} className="glass-panel rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">{index.name}</p>
                    <div className="flex justify-between items-end">
                      <p className="text-lg font-bold">{index.value.toLocaleString("en-US")}</p>
                      <div className={`flex items-center ${index.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {index.change >= 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        <span className="text-sm">
                          {index.changePercentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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

              <LineChart data={sampleChartData} />
            </div>
          </Card>
        </motion.div>

        {/* Trending Stocks and News */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Trending Stocks" className="p-6">
            <div className="space-y-4">
              {mockMarketData.trendingStocks.map((stock, index) => (
                <div key={index} className="flex justify-between items-center p-2 hover:bg-secondary/20 rounded-lg transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-xs font-medium">{stock.symbol.substring(0, 2)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{stock.name}</p>
                        <p className="text-xs text-muted-foreground">{stock.symbol}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ${stock.value.toLocaleString("en-US")}
                    </p>
                    <div className={`flex items-center justify-end ${stock.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {stock.change >= 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      <span className="text-xs">
                        {stock.changePercentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          <Card title="Market News" className="p-6">
            <div className="space-y-4">
              {newsItems.map((news) => (
                <a 
                  key={news.id}
                  href="#"
                  className="flex justify-between items-start border-b border-border/30 pb-3 last:border-0 last:pb-0 hover:bg-secondary/20 p-2 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open('https://finance.yahoo.com', '_blank');
                  }}
                >
                  <div>
                    <h4 className="text-sm font-medium">{news.title}</h4>
                    <div className="mt-1 flex items-center text-xs text-muted-foreground">
                      <span>{news.source}</span>
                      <span className="mx-1.5">•</span>
                      <span>{news.time}</span>
                      <span className="mx-1.5">•</span>
                      <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px]">{news.category}</span>
                    </div>
                  </div>
                  <button className="text-primary">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </a>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Stock Screener */}
        <motion.div variants={itemVariants}>
          <Card title="Stock Screener">
            <div className="mb-4">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Market Cap</label>
                  <select className="w-full bg-secondary rounded-lg px-3 py-2 text-sm">
                    <option>Any</option>
                    <option>Small Cap (&lt; $2B)</option>
                    <option>Mid Cap ($2B - $10B)</option>
                    <option>Large Cap (&gt; $10B)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">P/E Ratio</label>
                  <select className="w-full bg-secondary rounded-lg px-3 py-2 text-sm">
                    <option>Any</option>
                    <option>&lt; 10</option>
                    <option>10 - 20</option>
                    <option>20 - 50</option>
                    <option>&gt; 50</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Dividend Yield</label>
                  <select className="w-full bg-secondary rounded-lg px-3 py-2 text-sm">
                    <option>Any</option>
                    <option>&lt; 1%</option>
                    <option>1% - 3%</option>
                    <option>3% - 5%</option>
                    <option>&gt; 5%</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-3">
                <button className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm">
                  Apply Filters
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="text-left p-2 text-xs text-muted-foreground font-medium border-b border-border/50">Symbol</th>
                    <th className="text-left p-2 text-xs text-muted-foreground font-medium border-b border-border/50">Name</th>
                    <th className="text-right p-2 text-xs text-muted-foreground font-medium border-b border-border/50">Price</th>
                    <th className="text-right p-2 text-xs text-muted-foreground font-medium border-b border-border/50">Change</th>
                    <th className="text-right p-2 text-xs text-muted-foreground font-medium border-b border-border/50">Market Cap</th>
                    <th className="text-right p-2 text-xs text-muted-foreground font-medium border-b border-border/50">P/E Ratio</th>
                    <th className="text-right p-2 text-xs text-muted-foreground font-medium border-b border-border/50">Dividend</th>
                  </tr>
                </thead>
                <tbody>
                  {mockMarketData.trendingStocks.map((stock, index) => (
                    <tr key={index} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-2 text-sm">{stock.symbol}</td>
                      <td className="p-2 text-sm">{stock.name}</td>
                      <td className="p-2 text-sm text-right">${stock.value.toLocaleString()}</td>
                      <td className={`p-2 text-sm text-right ${stock.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {stock.change >= 0 ? '+' : ''}{stock.changePercentage.toFixed(2)}%
                      </td>
                      <td className="p-2 text-sm text-right">${(stock.value * 1000000).toLocaleString()}M</td>
                      <td className="p-2 text-sm text-right">{(20 + Math.random() * 15).toFixed(2)}</td>
                      <td className="p-2 text-sm text-right">{(Math.random() * 3).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Markets;

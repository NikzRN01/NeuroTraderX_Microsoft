
import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LineChart from "@/components/ui/LineChart";
import { ArrowRight, TrendingUp, AlertCircle, BarChart3, Send, Search } from "lucide-react";
import { sampleChartData } from "@/utils/mockData";

const Insights = () => {
  const [userQuery, setUserQuery] = useState("");
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [insightResults, setInsightResults] = useState<null | {
    summary: string;
    prediction: string;
    recommendation: string;
    riskLevel: string;
    confidence: number;
  }>(null);

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

  const handleGenerateInsight = () => {
    if (!userQuery.trim()) return;
    
    setLoading(true);
    setSelectedInsight(userQuery);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setInsightResults({
        summary: `Analysis of ${userQuery} indicates strong growth potential in the next quarter based on recent earnings reports, technical indicators, and market sentiment.`,
        prediction: "8-12% price increase over the next 60 days",
        recommendation: "Consider increasing position by 2-3% of portfolio value",
        riskLevel: "Medium",
        confidence: 75
      });
      setLoading(false);
    }, 2000);
  };

  const predefinedQueries = [
    "AAPL stock outlook",
    "Technology sector analysis",
    "Emerging market opportunities",
    "Dividend stocks performance",
    "Interest rates impact on financials"
  ];

  return (
    <div className="min-h-screen p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient">AI Insights</h1>
              <p className="text-muted-foreground">Ask about any stock, sector, or market trend</p>
            </div>
          </div>
        </motion.div>

        {/* Search Input */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter a stock symbol, sector, or market trend..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="w-full pl-10"
                  onKeyPress={(e) => e.key === "Enter" && handleGenerateInsight()}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {predefinedQueries.map((query, index) => (
                  <button
                    key={index}
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors"
                    onClick={() => {
                      setUserQuery(query);
                      handleGenerateInsight();
                    }}
                  >
                    {query}
                  </button>
                ))}
              </div>
              
              <Button 
                onClick={handleGenerateInsight} 
                disabled={!userQuery.trim() || loading}
                className="w-full"
              >
                {loading ? "Generating Insights..." : "Generate AI Insights"}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Analysis Results */}
        {(loading || insightResults) && (
          <motion.div 
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-medium">{selectedInsight} Analysis</h2>
                {!loading && (
                  <div className={`px-2 py-1 rounded text-xs ${
                    insightResults?.confidence && insightResults.confidence >= 75 ? 'bg-green-500/20 text-green-400' :
                    insightResults?.confidence && insightResults.confidence >= 50 ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {insightResults?.confidence}% Confidence
                  </div>
                )}
              </div>
              
              {loading ? (
                <div className="space-y-4">
                  <div className="h-20 glass-panel rounded-lg animate-pulse"></div>
                  <div className="h-40 glass-panel rounded-lg animate-pulse"></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-24 glass-panel rounded-lg animate-pulse"></div>
                    <div className="h-24 glass-panel rounded-lg animate-pulse"></div>
                    <div className="h-24 glass-panel rounded-lg animate-pulse"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="glass-panel rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-2">Summary</h3>
                    <p className="text-sm text-muted-foreground">{insightResults?.summary}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">Performance Projection</h3>
                    <LineChart data={sampleChartData} height={250} />
                    <div className="mt-2 flex justify-end">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                        <span>Historical</span>
                        <div className="h-3 w-3 bg-green-500 rounded-full ml-2"></div>
                        <span>Projected</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-panel rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">Prediction</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{insightResults?.prediction}</p>
                    </div>
                    
                    <div className="glass-panel rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">Recommendation</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{insightResults?.recommendation}</p>
                    </div>
                    
                    <div className="glass-panel rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">Risk Assessment</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">Risk Level: {insightResults?.riskLevel}</p>
                      <div className="mt-2 glass-panel rounded-full h-2 bg-secondary overflow-hidden">
                        <div 
                          className={`h-full ${
                            insightResults?.riskLevel === 'Low' ? 'bg-green-500' :
                            insightResults?.riskLevel === 'Medium' ? 'bg-amber-500' :
                            'bg-red-500'
                          }`} 
                          style={{ 
                            width: insightResults?.riskLevel === 'Low' ? '30%' :
                                   insightResults?.riskLevel === 'Medium' ? '60%' :
                                   '90%' 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setUserQuery("")}>
                      New Analysis
                    </Button>
                    <Button className="flex items-center gap-1">
                      <span>Save Analysis</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Related Insights */}
        {insightResults && (
          <motion.div 
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-medium mb-4">Related Insights</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2">Industry Comparison</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    See how this investment compares to industry benchmarks and peers.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">View Comparison</Button>
                </div>
                
                <div className="glass-panel rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2">News Sentiment</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Analysis of recent news and social media sentiment towards this investment.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">View Sentiment</Button>
                </div>
                
                <div className="glass-panel rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2">Historical Performance</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Detailed breakdown of performance across different market conditions.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">View History</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Insights;

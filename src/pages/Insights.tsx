
import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LineChart from "@/components/ui/LineChart";
import { ArrowRight, TrendingUp, AlertCircle, BarChart3, Send, Search, ZoomIn, LineChart as LineChartIcon, BarChartHorizontal, AreaChart as AreaChartIcon, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { sampleChartData } from "@/utils/mockData";
import { insightsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const Insights = () => {
  const [userQuery, setUserQuery] = useState("");
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timePeriod, setTimePeriod] = useState(30);
  const [chartType, setChartType] = useState<"area" | "line" | "bar">("area");
  const [showZoom, setShowZoom] = useState(true);
  const { toast } = useToast();
  const analysisRef = useRef<HTMLDivElement>(null);
  const [insightResults, setInsightResults] = useState<null | {
    symbol?: string;
    lastPrice?: number;
    priceChange?: number;
    dayHigh?: number;
    peRatio?: number | string;
    marketCap?: number | string;
    summary: string;
    prediction: string;
    recommendation: string;
    riskLevel: string;
    confidence: number;
    dataSource?: string;
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

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatMarketCap = (marketCap: number | string) => {
    if (typeof marketCap === "string") return marketCap;
    if (marketCap >= 1e12) return "$" + (marketCap / 1e12).toFixed(2) + "T";
    if (marketCap >= 1e9) return "$" + (marketCap / 1e9).toFixed(2) + "B";
    if (marketCap >= 1e6) return "$" + (marketCap / 1e6).toFixed(2) + "M";
    return "$" + marketCap.toLocaleString();
  };

  const getDataSourceBadge = (source: string | undefined) => {
    switch (source) {
      case "cached":
        return { bg: "bg-blue-500/20", text: "text-blue-400", label: "Cached" };
      case "yahoo_finance":
        return { bg: "bg-green-500/20", text: "text-green-400", label: "Live (Yahoo)" };
      case "finnhub":
        return { bg: "bg-purple-500/20", text: "text-purple-400", label: "Live (Finnhub)" };
      case "mock":
        return { bg: "bg-amber-500/20", text: "text-amber-400", label: "Mock Data" };
      default:
        return { bg: "bg-gray-500/20", text: "text-gray-400", label: "Unknown" };
    }
  };

  const generateChartData = (priceChange: number, lastPrice: number, days: number = 30, dayHigh?: number) => {
    const dataPoints = days; // Use the actual days parameter
    const points: { name: string; value: number }[] = [];

    const basePrice = lastPrice > 0 ? lastPrice : 100;
    const inferredChange = typeof dayHigh === "number" && dayHigh > 0
      ? ((dayHigh - basePrice) / basePrice) * 100
      : 0;

    const targetReturn = Math.abs(priceChange) > 0.1
      ? priceChange
      : (Math.abs(inferredChange) > 0.5 ? inferredChange : 2); // ensure some movement

    const driftPerStep = targetReturn / dataPoints;
    const baseVol = Math.min(3.5, Math.max(0.6, Math.abs(targetReturn) / dataPoints * 2 + 0.6));

    const randomNormal = () => {
      const u = Math.random() || 1e-9;
      const v = Math.random() || 1e-9;
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    let current = basePrice * (0.985 + Math.random() * 0.03); // small offset for realism

    for (let i = 0; i < dataPoints; i++) {
      const seasonality = Math.sin((i / dataPoints) * Math.PI * 2) * 0.4;
      const jump = Math.random() < 0.08 ? (Math.random() * 1.2 + 0.3) * (Math.random() > 0.5 ? 1 : -1) : 0;
      const noise = randomNormal() * baseVol;
      const stepReturn = driftPerStep + seasonality + noise + jump;

      current = Math.max(1, current * (1 + stepReturn / 100));

      points.push({
        name: new Date(Date.now() - (dataPoints - i - 1) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: parseFloat(current.toFixed(2)),
      });
    }

    if (typeof dayHigh === "number" && dayHigh > 0) {
      const maxValue = Math.max(...points.map((p) => p.value));
      if (maxValue > 0) {
        const scale = dayHigh / maxValue;
        const clampedScale = Math.min(1.15, Math.max(0.85, scale));
        return points.map((p) => ({ ...p, value: parseFloat((p.value * clampedScale).toFixed(2)) }));
      }
    }

    return points;
  };

  const handleGenerateInsight = async () => {
    if (!userQuery.trim()) return;
    
    setLoading(true);
    setSelectedInsight(userQuery);
    
    try {
      const response = await insightsApi.getSymbolInsights(userQuery);
      setInsightResults(response);
      toast({
        title: "Success",
        description: "Insights generated for " + response.symbol,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!insightResults || !analysisRef.current) return;
    
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we prepare your analysis...",
      });

      const element = analysisRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0a0a0a',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${insightResults.symbol || selectedInsight}_analysis_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: `${insightResults.symbol || selectedInsight} analysis saved as PDF`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };

  const predefinedQueries = [
    "AAPL",
    "GOOGL",
    "MSFT",
    "TSLA",
    "NVDA"
  ];

  // Memoize chart data at top level to avoid conditional hooks
  const chartData = useMemo(() => {
    if (!insightResults || !insightResults.lastPrice || insightResults.priceChange === undefined) {
      return [];
    }
    return generateChartData(
      insightResults.priceChange || 0,
      insightResults.lastPrice,
      timePeriod,
      insightResults.dayHigh
    );
  }, [timePeriod, insightResults]);

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
                    onClick={async () => {
                      setUserQuery(query);
                      setLoading(true);
                      setSelectedInsight(query);
                      try {
                        const response = await insightsApi.getSymbolInsights(query);
                        setInsightResults(response);
                        toast({
                          title: "Success",
                          description: "Insights generated for " + response.symbol,
                        });
                      } catch (err) {
                        toast({
                          title: "Error",
                          description: "Failed to generate insights. Please try again.",
                          variant: "destructive"
                        });
                      } finally {
                        setLoading(false);
                      }
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
            <Card className="p-6" ref={analysisRef}>
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
                  {insightResults && insightResults.lastPrice && (
                    <div className="glass-panel rounded-lg p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="text-3xl font-bold mb-2">{insightResults.symbol || selectedInsight}</h2>
                          <div className="flex items-baseline gap-4">
                            <span className="text-4xl font-bold">${formatNumber(insightResults.lastPrice)}</span>
                            <span className={`text-2xl font-semibold ${(insightResults.priceChange || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                              {(insightResults.priceChange || 0) >= 0 ? "+" : ""}{(insightResults.priceChange || 0).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        {insightResults.dataSource && (
                          <div className={`px-3 py-1 rounded-full ${getDataSourceBadge(insightResults.dataSource).bg} ${getDataSourceBadge(insightResults.dataSource).text} text-sm font-medium`}>
                            {getDataSourceBadge(insightResults.dataSource).label}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-background/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Current Price</p>
                          <p className="text-xl font-bold">${formatNumber(insightResults.lastPrice)}</p>
                        </div>
                        <div className="p-4 bg-background/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Price Change</p>
                          <p className={`text-xl font-bold ${(insightResults.priceChange || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {(insightResults.priceChange || 0) >= 0 ? "+" : ""}{(insightResults.priceChange || 0).toFixed(2)}%
                          </p>
                        </div>
                        <div className="p-4 bg-background/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Day High</p>
                          <p className="text-xl font-bold">${formatNumber(insightResults.dayHigh ?? 0)}</p>
                        </div>
                        <div className="p-4 bg-background/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
                          <p className="text-xl font-bold">{formatMarketCap(insightResults.marketCap || 0)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="glass-panel rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-2">Summary</h3>
                    <p className="text-sm text-muted-foreground">{insightResults?.summary}</p>
                  </div>
                  
                  {insightResults && insightResults.lastPrice && insightResults.priceChange !== undefined && (
                    <div>
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                        <h3 className="text-sm font-medium">{timePeriod}-Day Price Chart</h3>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => setTimePeriod(7)} className={`px-4 py-1.5 text-xs font-medium rounded-full ${timePeriod === 7 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>7 Days</button>
                          <button onClick={() => setTimePeriod(14)} className={`px-4 py-1.5 text-xs font-medium rounded-full ${timePeriod === 14 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>14 Days</button>
                          <button onClick={() => setTimePeriod(30)} className={`px-4 py-1.5 text-xs font-medium rounded-full ${timePeriod === 30 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>30 Days</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div className="flex rounded-full bg-secondary p-1 text-xs font-medium">
                            <button
                              onClick={() => setChartType("line")}
                              className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${chartType === "line" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/80"}`}
                              aria-label="Show line chart"
                            >
                              <LineChartIcon className="h-3.5 w-3.5" /> Line
                            </button>
                            <button
                              onClick={() => setChartType("area")}
                              className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${chartType === "area" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/80"}`}
                              aria-label="Show area chart"
                            >
                              <AreaChartIcon className="h-3.5 w-3.5" /> Area
                            </button>
                            <button
                              onClick={() => setChartType("bar")}
                              className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${chartType === "bar" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/80"}`}
                              aria-label="Show bar chart"
                            >
                              <BarChartHorizontal className="h-3.5 w-3.5" /> Bar
                            </button>
                          </div>
                          <button
                            onClick={() => setShowZoom((prev) => !prev)}
                            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${showZoom ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
                            aria-label="Toggle zoom and pan"
                          >
                            <ZoomIn className="h-3.5 w-3.5" /> {showZoom ? "Zoom On" : "Zoom Off"}
                          </button>
                        </div>
                      </div>
                      <LineChart 
                        key={`${chartType}-${showZoom}`}
                        data={chartData}
                        height={250}
                        showTimeFrames={false}
                        chartType={chartType}
                        showBrush={showZoom}
                      />
                      <div className="mt-2 flex justify-end">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                          <span>Price Trend ({(insightResults.priceChange || 0).toFixed(2)}% change)</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
                  
                  <div className="flex justify-end">
                    <Button className="flex items-center gap-2" onClick={handleSaveAnalysis}>
                      <Download className="h-4 w-4" />
                      <span>Download PDF</span>
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Insights;

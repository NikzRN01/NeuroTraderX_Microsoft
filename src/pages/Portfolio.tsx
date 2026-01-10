
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import LineChart from "@/components/ui/LineChart";
import AssetAllocation from "@/components/dashboard/AssetAllocation";
import TopHoldings from "@/components/dashboard/TopHoldings";
import { ArrowUpRight, ArrowDownRight, Filter, Download, Clock, Percent, DollarSign, Plus, CalendarIcon } from "lucide-react";
import { loadHoldingsFromStorage, saveHoldingsToStorage } from "@/utils/taxCalculationsPhase2";
import { priceApi, holdingsApi } from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChartDataPoint {
  date: string;
  value: number;
}

const Portfolio = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("7 Days");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Key to force refresh child components
  const { toast } = useToast();
  
  // Form state for adding holding
  const [newHolding, setNewHolding] = useState({
    symbol: "",
    assetType: "Stock Investments",
    quantity: "",
    purchasePrice: "",
    currentPrice: "",
    purchaseDate: new Date(),
  });
  
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 0,
    totalInvested: 0,
    totalGrowth: 0,
    totalGrowthPercentage: 0,
    investmentPeriod: "0 Months",
    avgAnnualReturn: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // Validate date format
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  // Calculate investment period
  const calculateInvestmentPeriod = (holdings: any[]): string => {
    if (holdings.length === 0) return "0 Months";

    const validDates = holdings
      .filter(h => isValidDate(h.purchaseDate))
      .map(h => new Date(h.purchaseDate).getTime());

    if (validDates.length === 0) return "0 Months";

    const earliestDate = new Date(Math.min(...validDates));
    const now = new Date();

    const months = (now.getFullYear() - earliestDate.getFullYear()) * 12 +
      (now.getMonth() - earliestDate.getMonth());

    if (months < 12) {
      return `${months} Month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) {
        return `${years} Year${years !== 1 ? 's' : ''}`;
      }
      return `${years}.${Math.round((remainingMonths / 12) * 10)} Years`;
    }
  };

  // Generate historical chart data
  const generateChartData = (
    totalValue: number,
    totalInvested: number,
    timeRange: string
  ): ChartDataPoint[] => {
    const days = timeRange === "7 Days" ? 7 : timeRange === "14 Days" ? 14 : 30;
    const data: ChartDataPoint[] = [];

    const startValue = totalInvested;
    const endValue = totalValue;
    const growthPerDay = (endValue - startValue) / days;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Add some realistic variation
      const baseValue = startValue + (growthPerDay * (days - i));
      const variation = baseValue * (Math.random() * 0.02 - 0.01); // ±1% variation
      const value = Math.max(0, baseValue + variation);

      data.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: Math.round(value),
      });
    }

    // Ensure last point matches current value
    if (data.length > 0) {
      data[data.length - 1].value = Math.round(totalValue);
    }

    return data;
  };

  useEffect(() => {
    const fetchPortfolioData = async () => {
      setLoading(true);
      try {
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

        // Fetch current prices
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

            const quantity = parseFloat(h.quantity);
            const purchasePrice = parseFloat(h.purchasePrice);

            return {
              ...h,
              currentPrice,
              currentValue: quantity * currentPrice,
              costBasis: quantity * purchasePrice,
            };
          })
        );

        // Calculate totals
        let totalValue = 0;
        let totalInvested = 0;

        updatedHoldings.forEach(h => {
          totalValue += h.currentValue;
          totalInvested += h.costBasis;
        });

        const totalGrowth = totalValue - totalInvested;
        const totalGrowthPercentage = totalInvested > 0 ? (totalGrowth / totalInvested) * 100 : 0;

        // Calculate investment period
        const investmentPeriod = calculateInvestmentPeriod(completeHoldings);

        // Calculate average annual return
        const months = parseInt(investmentPeriod.split(' ')[0]) || 1;
        const years = investmentPeriod.includes('Year') ?
          parseFloat(investmentPeriod.split(' ')[0]) : months / 12;
        const avgAnnualReturn = years > 0 ? (totalGrowthPercentage / years) : totalGrowthPercentage;

        setPortfolioData({
          totalValue,
          totalInvested,
          totalGrowth,
          totalGrowthPercentage,
          investmentPeriod,
          avgAnnualReturn,
        });

        // Generate chart data
        const chart = generateChartData(totalValue, totalInvested, selectedTimeRange);
        setChartData(chart);

      } catch (error) {
        console.error('Failed to fetch portfolio data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, [selectedTimeRange]);

  const handleAddHolding = async () => {
    // Validation
    if (!newHolding.symbol && newHolding.assetType !== "Gold Investments") {
      toast({
        title: "Validation Error",
        description: "Symbol is required for this asset type.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newHolding.quantity || !newHolding.purchasePrice) {
      toast({
        title: "Validation Error",
        description: "Quantity and Purchase Price are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const existingHoldings = loadHoldingsFromStorage() || [];
      
      const holdingToAdd = {
        id: `holding-${Date.now()}`,
        symbol: newHolding.symbol.toUpperCase(),
        assetType: newHolding.assetType,
        quantity: newHolding.quantity,
        purchasePrice: newHolding.purchasePrice,
        currentPrice: newHolding.currentPrice || newHolding.purchasePrice,
        purchaseDate: format(newHolding.purchaseDate, "yyyy-MM-dd"),
      };

      const updatedHoldings = [...existingHoldings, holdingToAdd];
      saveHoldingsToStorage(updatedHoldings);

      // Sync to backend
      const userId = parseInt(localStorage.getItem("userId") || "1", 10);
      try {
        await holdingsApi.syncHoldings(userId, updatedHoldings, 'upload');
      } catch (error) {
        console.error('Failed to sync to backend, but saved locally', error);
      }

      toast({
        title: "Success",
        description: "Holding added successfully!",
      });

      // Reset form and close dialog
      setNewHolding({
        symbol: "",
        assetType: "Stock Investments",
        quantity: "",
        purchasePrice: "",
        currentPrice: "",
        purchaseDate: new Date(),
      });
      setDialogOpen(false);

      // Refresh portfolio data and child components
      setRefreshKey(prev => prev + 1);
      fetchPortfolioData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add holding. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchPortfolioData = async () => {
    setLoading(true);
    try {
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

      // Fetch current prices
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
          
          const quantity = parseFloat(h.quantity);
          const purchasePrice = parseFloat(h.purchasePrice);
          
          return {
            ...h,
            currentPrice,
            currentValue: quantity * currentPrice,
            costBasis: quantity * purchasePrice,
          };
        })
      );

      // Calculate totals
      let totalValue = 0;
      let totalInvested = 0;

      updatedHoldings.forEach(h => {
        totalValue += h.currentValue;
        totalInvested += h.costBasis;
      });

      const totalGrowth = totalValue - totalInvested;
      const totalGrowthPercentage = totalInvested > 0 ? (totalGrowth / totalInvested) * 100 : 0;
      
      // Calculate investment period
      const investmentPeriod = calculateInvestmentPeriod(completeHoldings);
      
      // Calculate average annual return
      const months = parseInt(investmentPeriod.split(' ')[0]) || 1;
      const years = investmentPeriod.includes('Year') ? 
        parseFloat(investmentPeriod.split(' ')[0]) : months / 12;
      const avgAnnualReturn = years > 0 ? (totalGrowthPercentage / years) : totalGrowthPercentage;

      setPortfolioData({
        totalValue,
        totalInvested,
        totalGrowth,
        totalGrowthPercentage,
        investmentPeriod,
        avgAnnualReturn,
      });

      // Generate chart data
      const chart = generateChartData(totalValue, totalInvested, selectedTimeRange);
      setChartData(chart);

    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    `px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${selectedTimeRange === range
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">Add Holding</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Holding</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetType">Asset Type</Label>
                    <Select
                      value={newHolding.assetType}
                      onValueChange={(value) => setNewHolding({ ...newHolding, assetType: value })}
                    >
                      <SelectTrigger id="assetType">
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stock Investments">Stock Investments</SelectItem>
                        <SelectItem value="Mutual Funds">Mutual Funds</SelectItem>
                        <SelectItem value="Crypto Account">Crypto Account</SelectItem>
                        <SelectItem value="Gold Investments">Gold Investments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newHolding.assetType !== "Gold Investments" && (
                    <div className="space-y-2">
                      <Label htmlFor="symbol">Symbol</Label>
                      <Input
                        id="symbol"
                        placeholder="e.g., AAPL"
                        value={newHolding.symbol}
                        onChange={(e) => setNewHolding({ ...newHolding, symbol: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="quantity">
                      {newHolding.assetType === "Gold Investments" ? "Grams" : "Quantity"}
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="0"
                      value={newHolding.quantity}
                      onChange={(e) => setNewHolding({ ...newHolding, quantity: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      placeholder="0.00"
                      value={newHolding.purchasePrice}
                      onChange={(e) => setNewHolding({ ...newHolding, purchasePrice: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentPrice">Current Price</Label>
                    <Input
                      id="currentPrice"
                      type="number"
                      placeholder="0.00"
                      value={newHolding.currentPrice}
                      onChange={(e) => setNewHolding({ ...newHolding, currentPrice: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Purchase Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newHolding.purchaseDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newHolding.purchaseDate ? format(newHolding.purchaseDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newHolding.purchaseDate}
                          onSelect={(date) => date && setNewHolding({ ...newHolding, purchaseDate: date })}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button onClick={handleAddHolding} className="w-full">
                    Add Holding
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
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
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading portfolio data...</p>
              </div>
            ) : portfolioData.totalValue === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-muted-foreground">No holdings found. Add your first holding to get started.</p>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span className="text-sm font-medium">Add Your First Holding</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Holding</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="assetType-empty">Asset Type</Label>
                        <Select
                          value={newHolding.assetType}
                          onValueChange={(value) => setNewHolding({ ...newHolding, assetType: value })}
                        >
                          <SelectTrigger id="assetType-empty">
                            <SelectValue placeholder="Select asset type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Stock Investments">Stock Investments</SelectItem>
                            <SelectItem value="Mutual Funds">Mutual Funds</SelectItem>
                            <SelectItem value="Crypto Account">Crypto Account</SelectItem>
                            <SelectItem value="Gold Investments">Gold Investments</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {newHolding.assetType !== "Gold Investments" && (
                        <div className="space-y-2">
                          <Label htmlFor="symbol-empty">Symbol</Label>
                          <Input
                            id="symbol-empty"
                            placeholder="e.g., AAPL"
                            value={newHolding.symbol}
                            onChange={(e) => setNewHolding({ ...newHolding, symbol: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="quantity-empty">
                          {newHolding.assetType === "Gold Investments" ? "Grams" : "Quantity"}
                        </Label>
                        <Input
                          id="quantity-empty"
                          type="number"
                          placeholder="0"
                          value={newHolding.quantity}
                          onChange={(e) => setNewHolding({ ...newHolding, quantity: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="purchasePrice-empty">Purchase Price</Label>
                        <Input
                          id="purchasePrice-empty"
                          type="number"
                          placeholder="0.00"
                          value={newHolding.purchasePrice}
                          onChange={(e) => setNewHolding({ ...newHolding, purchasePrice: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currentPrice-empty">Current Price (Optional)</Label>
                        <Input
                          id="currentPrice-empty"
                          type="number"
                          placeholder="0.00"
                          value={newHolding.currentPrice}
                          onChange={(e) => setNewHolding({ ...newHolding, currentPrice: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Purchase Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !newHolding.purchaseDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newHolding.purchaseDate ? format(newHolding.purchaseDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={newHolding.purchaseDate}
                              onSelect={(date) => date && setNewHolding({ ...newHolding, purchaseDate: date })}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <Button onClick={handleAddHolding} className="w-full">
                        Add Holding
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Portfolio Summary</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold">
                          ${portfolioData.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-panel rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Investment Period</p>
                        </div>
                        <p className="text-lg font-medium">{portfolioData.investmentPeriod}</p>
                      </div>
                      <div className="glass-panel rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Percent className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Avg. Annual Return</p>
                        </div>
                        <p className={`text-lg font-medium ${portfolioData.avgAnnualReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {portfolioData.avgAnnualReturn >= 0 ? '+' : ''}{portfolioData.avgAnnualReturn.toFixed(1)}%
                        </p>
                      </div>
                      <div className="glass-panel rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Total Invested</p>
                        </div>
                        <p className="text-lg font-medium">
                          ${portfolioData.totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
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
            )}
          </GlassCard>
        </motion.div>

        {/* Asset Allocation and Top Holdings */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AssetAllocation key={`asset-${refreshKey}`} />
          <TopHoldings key={`holdings-${refreshKey}`} />
        </motion.div>

      </motion.div>
    </div>
  );
};

export default Portfolio;


import { useState, useEffect } from "react";
import GlassCard from "@/components/ui/GlassCard";
import PieChart from "@/components/ui/PieChart";
import { motion } from "framer-motion";
import { loadHoldingsFromStorage } from "@/utils/taxCalculationsPhase2";
import { priceApi } from "@/services/api";

interface AssetAllocationData {
  name: string;
  value: number;
  color: string;
}

interface AssetAllocationProps {
  portfolioData?: unknown;
}

const AssetAllocation = ({ portfolioData }: AssetAllocationProps) => {
  const [data, setData] = useState<AssetAllocationData[]>([]);
  const [loading, setLoading] = useState(true);

  // Asset type color mapping
  const assetColors: Record<string, string> = {
    "Stock Investments": "#3b82f6",    // blue
    "Mutual Funds": "#8b5cf6",         // purple
    "Crypto Account": "#f59e0b",       // amber
    "Gold Investments": "#eab308",     // yellow
  };

  // Validate date format
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  useEffect(() => {
    const fetchAssetAllocation = async () => {
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
            
            return {
              assetType: h.assetType,
              value: parseFloat(h.quantity) * currentPrice,
            };
          })
        );

        // Group by asset type and calculate totals
        const assetTotals: Record<string, number> = {};
        let totalValue = 0;

        updatedHoldings.forEach(h => {
          if (!assetTotals[h.assetType]) {
            assetTotals[h.assetType] = 0;
          }
          assetTotals[h.assetType] += h.value;
          totalValue += h.value;
        });

        // Calculate percentages and format data
        const allocationData: AssetAllocationData[] = Object.entries(assetTotals)
          .map(([name, value]) => ({
            name,
            value: totalValue > 0 ? Math.round((value / totalValue) * 100) : 0,
            color: assetColors[name] || "#6b7280",
          }))
          .sort((a, b) => b.value - a.value);

        setData(allocationData);
      } catch (error) {
        console.error('Failed to fetch asset allocation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssetAllocation();
  }, []);

  if (loading) {
    return (
      <GlassCard title="Asset Allocation" className="h-full">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading allocation...</p>
        </div>
      </GlassCard>
    );
  }

  if (data.length === 0) {
    return (
      <GlassCard title="Asset Allocation" className="h-full">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-sm">No holdings found. Add holdings in Tax Optimization.</p>
        </div>
      </GlassCard>
    );
  }
  
  return (
    <GlassCard title="Asset Allocation" className="h-full relative overflow-hidden">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/5 blur-xl"></div>
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-purple-500/5 blur-xl"></div>
      
      <div className="pt-2">
        <PieChart data={data} />
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((category, idx) => (
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
    </GlassCard>
  );
};

export default AssetAllocation;

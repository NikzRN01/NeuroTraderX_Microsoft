
import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { loadHoldingsFromStorage } from "@/utils/taxCalculationsPhase2";
import { priceApi } from "@/services/api";

interface Holding {
  symbol: string;
  name: string;
  value: number;
  growth: number;
  growthPercentage: number;
}

interface TopHoldingsProps {
  portfolioData?: unknown;
}

const TopHoldings = ({ portfolioData }: TopHoldingsProps) => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
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
    const fetchHoldings = async () => {
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

        // Fetch current prices and calculate values
        const holdingsWithPrices = await Promise.all(
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
            const currentValue = quantity * currentPrice;
            const costBasis = quantity * purchasePrice;
            const growth = currentValue - costBasis;
            const growthPercentage = costBasis > 0 ? (growth / costBasis) * 100 : 0;

            return {
              symbol: h.symbol || h.assetType,
              name: h.symbol || h.assetType,
              value: currentValue,
              growth,
              growthPercentage,
            };
          })
        );

        // Sort by value and take top 5
        const topHoldings = holdingsWithPrices
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        setHoldings(topHoldings);
      } catch (error) {
        console.error('Failed to fetch holdings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, []);

  if (loading) {
    return (
      <GlassCard title="Top Holdings" className="h-full">
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Loading holdings...</p>
        </div>
      </GlassCard>
    );
  }

  if (holdings.length === 0) {
    return (
      <GlassCard title="Top Holdings" className="h-full">
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground text-sm">No holdings found. Add holdings in Tax Optimization.</p>
        </div>
      </GlassCard>
    );
  }
  
  return (
    <GlassCard title="Top Holdings" className="h-full">
      <div className="space-y-4">
        {holdings.map((holding) => (
          <div key={holding.symbol} className="flex justify-between items-center">
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
  );
};

export default TopHoldings;

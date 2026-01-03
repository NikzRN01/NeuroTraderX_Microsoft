
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { mockPortfolioData } from "@/utils/mockData";

interface TopHoldingsProps {
  portfolioData?: any;
}

const TopHoldings = ({ portfolioData }: TopHoldingsProps) => {
  // Use provided portfolioData or fallback to mockData
  const holdings = portfolioData?.topHoldings || mockPortfolioData.topHoldings;
  
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

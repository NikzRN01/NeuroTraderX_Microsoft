
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { mockMarketData } from "@/utils/mockData";

const MarketTrends = () => {
  return (
    <GlassCard title="Market Trends" className="h-full">
      <div className="space-y-6">
        <div>
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">Major Indices</h4>
          <div className="space-y-3">
 
           
          </div>
        </div>
        
        <div>
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">Trending Stocks</h4>
          
        </div>
      </div>
    </GlassCard>
  );
};

export default MarketTrends;


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
            {mockMarketData.indices.map((index) => (
              <div key={index.name} className="flex justify-between items-center">
                <p className="text-sm">{index.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {index.value.toLocaleString("en-US")}
                  </p>
                  <div className={`flex items-center ${index.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {index.change >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    <span className="text-xs">
                      {index.changePercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">Trending Stocks</h4>
          <div className="space-y-3">
            {mockMarketData.trendingStocks.map((stock) => (
              <div key={stock.symbol} className="flex justify-between items-center">
                <div>
                  <p className="text-sm">{stock.name}</p>
                  <p className="text-xs text-muted-foreground">{stock.symbol}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {stock.value.toLocaleString("en-US")}
                  </p>
                  <div className={`flex items-center ${stock.change >= 0 ? 'text-success' : 'text-destructive'}`}>
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
        </div>
      </div>
    </GlassCard>
  );
};

export default MarketTrends;


import GlassCard from "@/components/ui/GlassCard";
import PieChart from "@/components/ui/PieChart";
import { mockPortfolioData } from "@/utils/mockData";
import { motion } from "framer-motion";

interface AssetAllocationProps {
  portfolioData?: any;
}

const AssetAllocation = ({ portfolioData }: AssetAllocationProps) => {
  // Use provided portfolioData or fallback to mockData
  const data = portfolioData?.assetAllocation || mockPortfolioData.assetAllocation;
  
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

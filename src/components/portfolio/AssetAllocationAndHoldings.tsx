
import { motion } from "framer-motion";
import AssetAllocation from "@/components/dashboard/AssetAllocation";
import TopHoldings from "@/components/dashboard/TopHoldings";
import type { PortfolioData } from "@/utils/mockData";

interface AssetAllocationAndHoldingsProps {
  portfolioData: Partial<PortfolioData>;
}

const AssetAllocationAndHoldings = ({ portfolioData }: AssetAllocationAndHoldingsProps) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AssetAllocation portfolioData={portfolioData} />
      <TopHoldings portfolioData={portfolioData} />
    </motion.div>
  );
};

export default AssetAllocationAndHoldings;

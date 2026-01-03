
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";

interface PerformanceMetricsProps {
  portfolioData?: any;
}

const PerformanceMetrics = ({ portfolioData }: PerformanceMetricsProps) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div variants={itemVariants}>
      <GlassCard title="Performance Metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-lg p-3">
            <p className="text-sm text-muted-foreground">CAGR</p>
            <p className="text-xl font-medium text-success">+14.8%</p>
            <p className="text-xs text-muted-foreground">vs. +8.2% Benchmark</p>
          </div>
          <div className="glass-panel rounded-lg p-3">
            <p className="text-sm text-muted-foreground">YTD Return</p>
            <p className="text-xl font-medium text-success">+9.2%</p>
            <p className="text-xs text-muted-foreground">vs. +5.4% Benchmark</p>
          </div>
          <div className="glass-panel rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Volatility Score</p>
            <p className="text-xl font-medium">0.65</p>
            <p className="text-xs text-muted-foreground">Medium Volatility</p>
          </div>
          <div className="glass-panel rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
            <p className="text-xl font-medium">1.32</p>
            <p className="text-xs text-muted-foreground">Above Average</p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default PerformanceMetrics;

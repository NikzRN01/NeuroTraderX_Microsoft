
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PortfolioOverview from "@/components/dashboard/PortfolioOverview";
import AssetAllocation from "@/components/dashboard/AssetAllocation";
import TopHoldings from "@/components/dashboard/TopHoldings";
import MarketTrends from "@/components/dashboard/MarketTrends";
import GlassCard from "@/components/ui/GlassCard";
import { newsItems, insightRecommendations } from "@/utils/mockData";
import { ArrowRight, TrendingUp, ShieldCheck } from "lucide-react";

const Dashboard = () => {
  // Animation variants for staggered animations
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

  return (
    <div className="min-h-screen p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <PortfolioOverview />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-1">
            <AssetAllocation />
          </div>
          <div className="col-span-1">
            <TopHoldings />
          </div>
          <div className="col-span-1">
            <MarketTrends />
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <GlassCard title="Latest Financial News">
                <div className="space-y-4">
                  {newsItems.slice(0, 3).map((news) => (
                    <a 
                      key={news.id}
                      href="#" 
                      className="flex justify-between items-start border-b border-border/30 pb-3 last:border-0 last:pb-0 hover:bg-secondary/20 p-2 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open('https://finance.yahoo.com', '_blank');
                      }}
                    >
                      <div>
                        <h4 className="text-sm font-medium">{news.title}</h4>
                        <div className="mt-1 flex items-center text-xs text-muted-foreground">
                          <span>{news.source}</span>
                          <span className="mx-1.5">•</span>
                          <span>{news.time}</span>
                          <span className="mx-1.5">•</span>
                          <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px]">{news.category}</span>
                        </div>
                      </div>
                      <button className="text-primary">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </a>
                  ))}
                </div>
                <div className="mt-3 text-center">
                  <Link to="/news" className="text-sm text-primary flex items-center justify-center gap-1 w-full">
                    <span>View more news</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </GlassCard>
            </div>

            <div>
              <GlassCard title="AI Recommendations">
                <div className="space-y-3">
                  {insightRecommendations.map((rec) => (
                    <div key={rec.id} className="glass-panel rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium">{rec.title}</h4>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          rec.impact === 'High' ? 'bg-red-500/20 text-red-400' : 
                          rec.impact === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {rec.impact}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">{rec.type}</span>
                        <Link 
                          to={`/ai-recommendation/${rec.id}`} 
                          className="text-primary text-xs flex items-center gap-1"
                        >
                          <span>Take action</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-500/20 p-3">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Smart Analysis</h3>
                  <p className="text-sm text-muted-foreground">Get AI-powered insights on your portfolio</p>
                </div>
              </div>
              <Link to="/insights" className="mt-4 w-full rounded-lg bg-blue-500/20 py-2 text-blue-400 hover:bg-blue-500/30 transition-colors block text-center">
                Analyze Portfolio
              </Link>
            </GlassCard>

            <GlassCard className="bg-gradient-to-br from-amber-900/40 to-red-900/40 border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-500/20 p-3">
                  <ShieldCheck className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Tax Optimization</h3>
                  <p className="text-sm text-muted-foreground">Find tax-saving opportunities</p>
                </div>
              </div>
              <Link to="/tax-optimization" className="mt-4 w-full rounded-lg bg-amber-500/20 py-2 text-amber-400 hover:bg-amber-500/30 transition-colors block text-center">
                Optimize Taxes
              </Link>
            </GlassCard>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;

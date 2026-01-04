
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PortfolioOverview from "@/components/dashboard/PortfolioOverview";
import AssetAllocation from "@/components/dashboard/AssetAllocation";
import TopHoldings from "@/components/dashboard/TopHoldings";
import MarketTrends from "@/components/dashboard/MarketTrends";
import TaxSummary from "@/components/dashboard/TaxSummary";
import GlassCard from "@/components/ui/GlassCard";
import {insightRecommendations } from "@/utils/mockData";
import { newsApi } from "@/services/api"; 
import { ArrowRight, TrendingUp, ShieldCheck, Loader2 } from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  description?: string;
  source: string;
  time: string;
  category: string;
  url?: string;
}

const Dashboard = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Fetch news from backend
  useEffect(() => {
    let cancelled = false;
    
    const loadNews = async () => {
      setNewsLoading(true);
      try {
        const data = await newsApi.fetchNews();
        if (!cancelled && data) {
          // API returns { body: [...], meta: {...} }
          const newsArray = data.body || data;
          const transformedNews = Array.isArray(newsArray) ? newsArray.map((item: any, index: number) => ({
            id: index + 1,
            title: item.title || 'No title',
            description: item.description || '',
            source: 'Yahoo Finance', // API doesn't provide source, using default
            time: item.pubDate ? new Date(item.pubDate).toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: '2-digit' 
            }) : 'Recently',
            category: 'Markets',
            url: item.link || '#'
          })) : [];
          setNewsItems(transformedNews.slice(0, 5));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch news:', error);
          setNewsError('Failed to load news');
        }
      } finally {
        if (!cancelled) setNewsLoading(false);
      } 
    };
    
    void loadNews();
    return () => {
      cancelled = true;
    };
  }, []);

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

        {/* Tax Summary Card */}
        <motion.div variants={itemVariants}>
          <TaxSummary />
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard title="Latest Financial News">
            {newsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : newsError ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{newsError}</p>
              </div>
            ) : newsItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No news available</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {newsItems.slice(0, 5).map((news) => (
                    <a 
                      key={news.id}
                      href={news.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-between items-start border-b border-border/30 pb-3 last:border-0 last:pb-0 hover:bg-secondary/20 p-2 rounded-lg transition-colors"
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
              </>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;

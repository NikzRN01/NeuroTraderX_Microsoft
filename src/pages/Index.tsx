
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
import { newsApi, holdingsApi } from "@/services/api"; 
import { ArrowRight, TrendingUp, ShieldCheck, Loader2 } from "lucide-react";
import { saveHoldingsToStorage, loadHoldingsFromStorage } from "@/utils/taxCalculationsPhase2";

interface NewsItem {
  id: number;
  title: string;
  description?: string;
  source: string;
  time: string;
  category: string;
  url?: string;
}

type RawNewsApiItem = {
  title?: unknown;
  description?: unknown;
  pubDate?: unknown;
  link?: unknown;
};

const asString = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

const formatPubDate = (value: unknown) => {
  if (value instanceof Date) {
    return value.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  }

  return "Recently";
};

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
          const transformedNews = Array.isArray(newsArray) ? newsArray.map((item: RawNewsApiItem, index: number) => ({
            id: index + 1,
            title: asString(item.title, 'No title'),
            description: asString(item.description, ''),
            source: 'Yahoo Finance', // API doesn't provide source, using default
            time: formatPubDate(item.pubDate),
            category: 'Markets',
            url: asString(item.link, '#')
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

  // Background sync holdings from backend
  useEffect(() => {
    let cancelled = false;
    
    const syncHoldings = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      
      try {
        const backendHoldings = await holdingsApi.getUserHoldings(parseInt(userId, 10));
        const localHoldings = loadHoldingsFromStorage();
        
        // If backend has holdings and they're different from local, update localStorage
        if (backendHoldings && backendHoldings.length > 0 && !cancelled) {
          const backendIds = backendHoldings.map((h: { id: string }) => h.id).sort().join(',');
          const localIds = localHoldings.map((h: { id: string }) => h.id).sort().join(',');
          
          if (backendIds !== localIds) {
            saveHoldingsToStorage(backendHoldings);
            console.log('Synced holdings from backend');
          }
        }
      } catch (error) {
        console.error('Failed to sync holdings:', error);
      }
    };
    
    syncHoldings();
    
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
          <div className="col-span-2">
            <AssetAllocation />
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

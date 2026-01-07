
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronLeft, ArrowRight, Filter, Clock, Search, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { newsApi } from "@/services/api";
import { IntelligentSearch } from "@/components/search/IntelligentSearch";

interface NewsItem {
  id: number;
  title: string;
  description?: string;
  source: string;
  time: string;
  category: string;
  url?: string;
  sentiment?: {
    label: string;
    score: number;
    confidence: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
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

const NewsPage = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("All");

  // Get sentiment badge with financial context
  const getSentimentBadge = (sentiment?: NewsItem['sentiment']) => {
    if (!sentiment) return null;

    const { label, score, confidence } = sentiment;
    
    // Financial interpretation
    const getFinancialLabel = () => {
      if (label === 'positive') return 'Bullish';
      if (label === 'negative') return 'Bearish';
      return 'Neutral';
    };

    const getIcon = () => {
      if (label === 'positive') return <TrendingUp className="h-3 w-3" />;
      if (label === 'negative') return <TrendingDown className="h-3 w-3" />;
      return <Minus className="h-3 w-3" />;
    };

    const getColorClasses = () => {
      if (label === 'positive') return 'bg-green-500/10 text-green-600 border-green-500/20';
      if (label === 'negative') return 'bg-red-500/10 text-red-600 border-red-500/20';
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    };

    const confidencePercent = Math.round(score * 100);

    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${getColorClasses()}`}>
          {getIcon()}
          <span>{getFinancialLabel()}</span>
          <span className="ml-1 opacity-70">{confidencePercent}%</span>
        </div>
      </div>
    );
  };

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
            title: asString(item.title, 'No title'),
            description: asString(item.description, ''),
            source: 'Yahoo Finance', // API doesn't provide source, using default
            time: formatPubDate(item.pubDate),
            category: 'Markets',
            url: asString(item.link, '#'),
            sentiment: item.sentiment
          })) : [];
          setNewsItems(transformedNews);
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

  // Extract unique categories from news items
  const categories = ["All", ...Array.from(new Set(newsItems.map(item => item.category)))];

  const categoryClass = (category: string) =>
    `px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${selectedCategory === category
      ? "bg-primary/10 text-primary"
      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
    }`;

  // Filter news by category and search query
  const filteredNews = newsItems.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSentiment = sentimentFilter === "All" || 
      (item.sentiment && item.sentiment.label === sentimentFilter.toLowerCase());
    return matchesCategory && matchesSearch && matchesSentiment;
  });

  return (
    <div className="min-h-screen p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* AI-Powered Intelligent Search */}
        <motion.div variants={itemVariants}>
          <IntelligentSearch 
            onResultsChange={(results) => {
              // When search results come in, you can optionally replace the news list
              if (results.length > 0) {
                setNewsItems(results.map((r, idx) => ({
                  id: idx + 1,
                  title: r.title,
                  description: r.description,
                  source: r.source,
                  time: new Date(r.pubDate).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }),
                  category: 'Markets',
                  url: r.url,
                  sentiment: r.sentiment
                })));
              }
            }}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col items-center gap-4">
          {/* <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search news..."
              className="input-search pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div> */}
          
          {/* Sentiment Filter */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-sm text-muted-foreground mr-2">Market Sentiment:</span>
            {['All', 'Bullish', 'Neutral', 'Bearish'].map((sentiment) => {
              const isActive = sentimentFilter === sentiment;
              const getButtonClass = () => {
                if (!isActive) return 'bg-secondary text-muted-foreground hover:bg-secondary/80';
                if (sentiment === 'Bullish') return 'bg-green-500/10 text-green-600 border-green-500/20 border';
                if (sentiment === 'Bearish') return 'bg-red-500/10 text-red-600 border-red-500/20 border';
                return 'bg-primary/10 text-primary border border-primary/20';
              };
              
              const getIcon = () => {
                if (sentiment === 'Bullish') return <TrendingUp className="h-3 w-3" />;
                if (sentiment === 'Bearish') return <TrendingDown className="h-3 w-3" />;
                if (sentiment === 'Neutral') return <Minus className="h-3 w-3" />;
                return <Filter className="h-3 w-3" />;
              };
              
              // Map display names to API values
              const apiValue = sentiment === 'Bullish' ? 'positive' : 
                             sentiment === 'Bearish' ? 'negative' : 
                             sentiment === 'Neutral' ? 'neutral' : 'All';
              
              return (
                <button
                  key={sentiment}
                  onClick={() => setSentimentFilter(apiValue)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${getButtonClass()}`}
                >
                  {getIcon()}
                  {sentiment}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Sentiment Overview Card */}
        {!newsLoading && newsItems.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3">Market Sentiment Overview</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Bullish', sentiment: 'positive', icon: TrendingUp },
                  { label: 'Neutral', sentiment: 'neutral', icon: Minus },
                  { label: 'Bearish', sentiment: 'negative', icon: TrendingDown }
                ].map(({ label, sentiment, icon: Icon }) => {
                  const count = newsItems.filter(item => item.sentiment?.label === sentiment).length;
                  const percentage = newsItems.length > 0 ? Math.round((count / newsItems.length) * 100) : 0;
                  
                  const getCardClasses = () => {
                    if (label === 'Bullish') return 'bg-green-500/5 border-green-500/10';
                    if (label === 'Bearish') return 'bg-red-500/5 border-red-500/10';
                    return 'bg-gray-500/5 border-gray-500/10';
                  };
                  
                  const getTextClasses = () => {
                    if (label === 'Bullish') return { title: 'text-green-600', count: 'text-green-700', icon: 'text-green-600' };
                    if (label === 'Bearish') return { title: 'text-red-600', count: 'text-red-700', icon: 'text-red-600' };
                    return { title: 'text-gray-600', count: 'text-gray-700', icon: 'text-gray-600' };
                  };
                  
                  const classes = getTextClasses();
                  
                  return (
                    <div key={label} className={`border rounded-lg p-3 ${getCardClasses()}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`${classes.title} text-xs font-medium`}>{label}</span>
                        <Icon className={`h-4 w-4 ${classes.icon}`} />
                      </div>
                      <div className={`text-2xl font-bold ${classes.count}`}>{count}</div>
                      <div className="text-xs text-muted-foreground mt-1">{percentage}% of news</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-medium">Latest News</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {filteredNews.length} {filteredNews.length === 1 ? 'article' : 'articles'}
                </span>
              </div>
            </div>

            {newsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : newsError ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>{newsError}</p>
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No news articles found</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {filteredNews.map((news) => (
                    <a
                      key={news.id}
                      href={news.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-between items-start p-4 border-b border-border/30 last:border-0 hover:bg-secondary/20 rounded-lg transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-base font-medium flex-1">{news.title}</h3>
                          {getSentimentBadge(news.sentiment)}
                        </div>
                        {news.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {news.description}
                          </p>
                        )}
                        <div className="flex items-center text-xs text-muted-foreground flex-wrap gap-1">
                          <span>{news.source}</span>
                          <span className="mx-1.5">•</span>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{news.time}</span>
                          </div>
                          <span className="mx-1.5">•</span>
                          <span className="bg-secondary px-1.5 py-0.5 rounded">{news.category}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NewsPage;

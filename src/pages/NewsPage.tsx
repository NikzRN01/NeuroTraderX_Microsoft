
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronLeft, ArrowRight, Filter, Clock, Search, Loader2 } from "lucide-react";
import { newsApi } from "@/services/api";

interface NewsItem {
  id: number;
  title: string;
  description?: string;
  source: string;
  time: string;
  category: string;
  url?: string;
}

const NewsPage = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

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
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-primary hover:text-primary/80 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gradient">Financial News</h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search news..."
              className="input-search pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              className={categoryClass(category)}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </motion.div>

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
                        <h3 className="text-base font-medium mb-1">{news.title}</h3>
                        {news.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {news.description}
                          </p>
                        )}
                        <div className="flex items-center text-xs text-muted-foreground">
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

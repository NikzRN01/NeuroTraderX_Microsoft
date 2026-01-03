
import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronLeft, ArrowRight, Filter, Clock, Search } from "lucide-react";
import { newsItems } from "@/utils/mockData";

const NewsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

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

  const categories = ["All", "Markets", "Stocks", "Crypto", "Economy", "Technology"];

  const categoryClass = (category: string) =>
    `px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
      selectedCategory === category
        ? "bg-primary/10 text-primary"
        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
    }`;

  const filteredNews = selectedCategory === "All" 
    ? newsItems 
    : newsItems.filter(item => item.category === selectedCategory);

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
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                <span>Filter</span>
              </Button>
            </div>
            
            <div className="space-y-4">
              {filteredNews.map((news) => (
                <a 
                  key={news.id}
                  href="#" 
                  className="flex justify-between items-start p-4 border-b border-border/30 last:border-0 hover:bg-secondary/20 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open('https://finance.yahoo.com', '_blank');
                  }}
                >
                  <div className="flex-1">
                    <h3 className="text-base font-medium mb-1">{news.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {"Latest financial news and market updates from trusted sources."}
                    </p>
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
            
            <div className="mt-6 flex justify-center">
              <Button variant="outline">Load More News</Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NewsPage;

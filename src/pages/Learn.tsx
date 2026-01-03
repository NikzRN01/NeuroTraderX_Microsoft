
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ArrowRight, BookOpen, GraduationCap, Search, Clock, BarChart3, Megaphone } from "lucide-react";
import { learningModules } from "@/utils/mockData";

const Learn = () => {
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient">Learning Center</h1>
              <p className="text-muted-foreground">Enhance your investment knowledge with our learning resources</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search learning resources..."
                className="input-search pl-10 w-64"
              />
            </div>
          </div>
        </motion.div>

        {/* Learning Paths */}
        <motion.div variants={itemVariants}>
          <Card title="Learning Paths">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-3">
                  <div className="rounded-full bg-blue-500/20 p-2">
                    <BookOpen className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">Beginner</span>
                </div>
                <h3 className="text-lg font-medium mb-1">Investment Basics</h3>
                <p className="text-xs text-muted-foreground mb-4">Start your investment journey with fundamental concepts</p>
                <button className="w-full rounded-lg bg-blue-500/20 py-2 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm">
                  Start Learning
                </button>
              </div>

              <div className="glass-panel rounded-lg p-4 border-l-4 border-purple-500">
                <div className="flex justify-between items-start mb-3">
                  <div className="rounded-full bg-purple-500/20 p-2">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">Intermediate</span>
                </div>
                <h3 className="text-lg font-medium mb-1">Technical Analysis</h3>
                <p className="text-xs text-muted-foreground mb-4">Learn how to analyze price trends and patterns</p>
                <button className="w-full rounded-lg bg-purple-500/20 py-2 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm">
                  Start Learning
                </button>
              </div>

              <div className="glass-panel rounded-lg p-4 border-l-4 border-emerald-500">
                <div className="flex justify-between items-start mb-3">
                  <div className="rounded-full bg-emerald-500/20 p-2">
                    <GraduationCap className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Advanced</span>
                </div>
                <h3 className="text-lg font-medium mb-1">Portfolio Management</h3>
                <p className="text-xs text-muted-foreground mb-4">Master advanced strategies for portfolio optimization</p>
                <button className="w-full rounded-lg bg-emerald-500/20 py-2 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm">
                  Start Learning
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* My Learning Progress */}
        <motion.div variants={itemVariants}>
          <Card title="My Learning Progress">
            <div className="space-y-6">
              {learningModules.map((module) => (
                <div key={module.id} className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-start gap-3 sm:w-1/2">
                    <div className="rounded-full bg-secondary p-2 mt-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="text-base font-medium">{module.title}</h4>
                      <div className="flex items-center mt-1 gap-3">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{module.level}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{module.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{module.modules} modules</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="sm:w-1/2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground">Progress: {module.progress}%</span>
                      <button className="text-xs text-primary">
                        Continue
                      </button>
                    </div>
                    <div className="glass-panel rounded-full h-2 bg-secondary overflow-hidden">
                      <div className={`h-full ${
                        module.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                      }`} style={{ width: `${module.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Featured Learning */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Market Terminology" className="col-span-1">
            <div className="space-y-3">
              <div className="glass-panel rounded-lg p-3">
                <h4 className="text-sm font-medium">Bull Market</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  A market condition where prices are rising or expected to rise. This typically indicates investor confidence and economic growth.
                </p>
              </div>
              <div className="glass-panel rounded-lg p-3">
                <h4 className="text-sm font-medium">Bear Market</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  A market condition where prices are falling or expected to fall. This typically indicates investor pessimism and economic downturn.
                </p>
              </div>
              <div className="glass-panel rounded-lg p-3">
                <h4 className="text-sm font-medium">Dividend Yield</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  The annual dividend payment divided by the stock price, expressed as a percentage. It represents the cash flow an investor gets for each dollar invested.
                </p>
              </div>
              <div className="mt-3 text-center">
                <button className="text-sm text-primary flex items-center justify-center gap-1 w-full">
                  <span>View full glossary</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </Card>
          
          <Card title="Investment Guides" className="col-span-1">
            <div className="space-y-3">
              <div className="glass-panel rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium">Beginner's Guide to Stock Investing</h4>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Learn the basics of stock market investing and how to build your first portfolio.</p>
                <button className="mt-2 text-xs text-primary flex items-center gap-1">
                  <span>Read guide</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="glass-panel rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium">Understanding ETFs vs. Mutual Funds</h4>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Compare exchange-traded funds and mutual funds to determine which is right for your investment goals.</p>
                <button className="mt-2 text-xs text-primary flex items-center gap-1">
                  <span>Read guide</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="glass-panel rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium">Tax-Efficient Investing Strategies</h4>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Learn how to minimize tax impact on your investments and maximize after-tax returns.</p>
                <button className="mt-2 text-xs text-primary flex items-center gap-1">
                  <span>Read guide</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </Card>

          <Card title="Recommended Webinars" className="col-span-1">
            <div className="space-y-3">
              <div className="glass-panel rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Advanced Technical Analysis</p>
                </div>
                <p className="text-xs text-muted-foreground">May 15, 2023 | 7:00 PM EST</p>
                <button className="mt-2 text-xs text-primary flex items-center gap-1">
                  <span>Register now</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="glass-panel rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Retirement Planning Essentials</p>
                </div>
                <p className="text-xs text-muted-foreground">May 18, 2023 | 6:00 PM EST</p>
                <button className="mt-2 text-xs text-primary flex items-center gap-1">
                  <span>Register now</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="glass-panel rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Global Market Outlook Q2 2023</p>
                </div>
                <p className="text-xs text-muted-foreground">May 22, 2023 | 8:00 PM EST</p>
                <button className="mt-2 text-xs text-primary flex items-center gap-1">
                  <span>Register now</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Learn;


import { motion } from "framer-motion";
import { Filter, Download } from "lucide-react";

const PortfolioHeader = () => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gradient">My Portfolio</h1>
        <p className="text-muted-foreground">Comprehensive view of your investments</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors">
          <Filter className="h-4 w-4" />
          <span className="text-sm">Filter</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors">
          <Download className="h-4 w-4" />
          <span className="text-sm">Export</span>
        </button>
      </div>
    </motion.div>
  );
};

export default PortfolioHeader;


import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";

interface UpcomingDividendsProps {
  portfolioData?: any;
}

const UpcomingDividends = ({ portfolioData }: UpcomingDividendsProps) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  // We would use portfolioData here in a real implementation
  const upcomingDividends = [
    { company: "Microsoft", symbol: "MSFT", date: "June 15, 2023", amount: 0.68 },
    { company: "Apple Inc.", symbol: "AAPL", date: "July 03, 2023", amount: 0.24 },
    { company: "Johnson & Johnson", symbol: "JNJ", date: "July 21, 2023", amount: 1.13 }
  ];

  return (
    <motion.div variants={itemVariants}>
      <GlassCard title="Upcoming Dividends">
        <div className="space-y-4">
          {upcomingDividends.map((dividend, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">{dividend.company}</p>
                <p className="text-xs text-muted-foreground">{dividend.symbol}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Ex-Date</p>
                <p className="text-sm">{dividend.date}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="text-sm font-medium">${dividend.amount}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default UpcomingDividends;

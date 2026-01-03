
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  hoverable?: boolean;
  centerTitle?: boolean;
}

const GlassCard = ({ children, title, className = "", hoverable = true, centerTitle = false }: CardProps) => {
  return (
    <motion.div
      whileHover={hoverable ? { y: -5, transition: { duration: 0.2 } } : {}}
      className={`glass-panel rounded-xl ${hoverable ? 'card-hover' : ''} ${className}`}
    >
      {title && (
        <div className={`px-4 py-3 border-b border-border/50 ${centerTitle ? 'text-center' : ''}`}>
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </motion.div>
  );
};

export default GlassCard;

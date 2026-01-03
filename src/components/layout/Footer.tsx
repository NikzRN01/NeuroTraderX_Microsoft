
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-border/30 bg-background/50 px-6 py-4">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/portfolio" className="hover:text-primary transition-colors">
            Portfolio
          </Link>
          <Link to="/markets" className="hover:text-primary transition-colors">
            Markets
          </Link>
          <Link to="/insights" className="hover:text-primary transition-colors">
            Insights
          </Link>
          <Link to="/ai-chat" className="hover:text-primary transition-colors">
            AI Chat
          </Link>
        </div>
        <div className="text-sm text-muted-foreground">
          © 2025 NeuroTradeX. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

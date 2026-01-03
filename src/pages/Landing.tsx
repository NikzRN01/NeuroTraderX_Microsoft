
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  Shield, 
  TrendingUp, 
  FileText, 
  Link as LinkIcon,
  ChevronRight,
  Star,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <TrendingUp className="h-10 w-10 text-primary" />,
      title: "AI-Powered Portfolio Insights",
      description: "Get AI-driven financial recommendations tailored to your unique investment profile."
    },
    {
      icon: <FileText className="h-10 w-10 text-primary" />,
      title: "Tax Optimization",
      description: "Discover tax-saving investment strategies to maximize your returns."
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-primary" />,
      title: "Real-Time Market Predictions",
      description: "AI-driven forecasts for smarter investing decisions."
    },
    {
      icon: <Shield className="h-10 w-10 text-primary" />,
      title: "Secure & Personalized Dashboard",
      description: "A seamless, interactive user experience designed for your financial goals."
    },
    {
      icon: <LinkIcon className="h-10 w-10 text-primary" />,
      title: "Seamless API Integration",
      description: "Real-time stock tracking and compliance tools at your fingertips."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Retail Investor",
      content: "The AI recommendations have completely transformed my investment strategy. I've seen a 15% increase in my portfolio value in just 3 months.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Financial Advisor",
      content: "I recommend NeuroTradeX to all my clients. The tax optimization tools alone have saved them thousands in unnecessary payments.",
      rating: 5
    },
    {
      name: "Priya Patel",
      role: "Day Trader",
      content: "The real-time market predictions give me an edge that I've never had with other platforms. Absolutely worth every penny.",
      rating: 4
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 py-32 md:py-40">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-background"></div>
        </div>

        <div className="mx-auto max-w-5xl text-center">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Empower Your Investments with <span className="text-gradient">AI-Driven Insights</span>
          </motion.h1>
          
          <motion.p 
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            AI-powered recommendations, real-time market analysis, and portfolio optimization – all in one place.
          </motion.p>
          
          <motion.div 
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button 
              size="lg" 
              onClick={() => navigate("/signin")}
              className="text-base"
            >
              Sign In
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/signup")}
              className="text-base"
            >
              Get Started <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 lg:px-8 bg-secondary/30">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features for Smart Investing</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="glass-panel card-hover rounded-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                className="glass-panel card-hover rounded-lg p-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <div className="flex items-center mb-4">
                  <div className="bg-primary/20 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">{testimonial.content}</p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < testimonial.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} 
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="py-16 px-6 lg:px-8 bg-secondary/30">
        <div className="mx-auto max-w-3xl text-center">
          <Lock className="h-12 w-12 mx-auto text-primary mb-6" />
          <h2 className="text-2xl font-bold mb-4">Security & Compliance</h2>
          <p className="text-muted-foreground">
            Your security is our priority. We employ industry-leading encryption and security practices to 
            protect your data and investments. All our systems comply with financial industry regulations to 
            ensure your peace of mind.
          </p>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="mt-auto border-t border-border/30 bg-background/50 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <Link to="/" className="flex items-center mb-4">
                <img src="/logo.svg" alt="NeuroTradeX Logo" className="h-8 w-8" />
                <span className="ml-2 text-xl font-semibold tracking-tight text-gradient">
                  NeuroTradeX
                </span>
              </Link>
              <p className="text-sm text-muted-foreground">
                AI-powered investment platform providing smart insights for the modern investor.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
                <li><Link to="/signin" className="hover:text-primary transition-colors">Sign In</Link></li>
                <li><Link to="/signup" className="hover:text-primary transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="#" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2023 NeuroTradeX. All rights reserved.
            </div>
            <div className="text-sm text-muted-foreground">
              Made with ❤️ by Libert-T
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

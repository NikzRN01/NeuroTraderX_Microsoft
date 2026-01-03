
import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  BarChart3, 
  Globe, 
  Lightbulb,
  User,
  BellRing,
  Menu,
  X,
  MessageSquare,
  LogOut,
  LogIn,
  Newspaper
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insightRecommendations } from "@/utils/mockData";
import { useTheme } from "@/providers/ThemeProvider";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { ThemeToggle } = useTheme();

  // Check authentication status on mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem("authenticated") === "true";
      setIsAuthenticated(authStatus);
    };
    
    // Check initially
    checkAuth();
    
    // Set up event listener for storage changes (in case of logout in another tab)
    window.addEventListener("storage", checkAuth);
    
    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/portfolio", label: "Portfolio", icon: BarChart3 },
    { path: "/markets", label: "Markets", icon: Globe },
    { path: "/insights", label: "Insights", icon: Lightbulb },
    { path: "/ai-chat", label: "AI Chat", icon: MessageSquare },
    { path: "/news", label: "News", icon: Newspaper },
    { path: "/profile", label: "Profile", icon: User },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authenticated");
    localStorage.removeItem("username");
    
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account"
    });
    
    setIsProfileDropdownOpen(false);
    navigate("/landing");
  };

  // For landing page and auth pages, show simplified navbar
  if (location.pathname === "/landing" || location.pathname === "/signin" || location.pathname === "/signup") {
    return (
      <nav className="glass-panel sticky top-0 z-50 w-full px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand Name */}
          <div className="flex items-center space-x-3">
            <Link to="/landing" className="flex items-center">
              <img src="/logo.svg" alt="NeuroTradeX Logo" className="h-8 w-8" />
              <span className="ml-2 text-xl font-semibold tracking-tight text-gradient">
                NeuroTradeX
              </span>
            </Link>
          </div>

          {/* Sign In / Sign Up Buttons */}
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              className="hidden sm:inline-flex"
              onClick={() => navigate("/signin")}
            >
              <LogIn className="mr-2 h-4 w-4" /> Sign In
            </Button>
            <Button 
              onClick={() => navigate("/signup")}
            >
              Get Started
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    );
  }

  // For onboarding, show a minimal navbar with no navigation
  if (location.pathname === "/onboarding") {
    return (
      <nav className="glass-panel sticky top-0 z-50 w-full px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand Name */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <img src="/logo.svg" alt="NeuroTradeX Logo" className="h-8 w-8" />
              <span className="ml-2 text-xl font-semibold tracking-tight text-gradient">
                NeuroTradeX
              </span>
            </div>
          </div>

          {/* Theme Toggle */}
          <div>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    );
  }

  // Regular navbar for authenticated routes
  return (
    <nav className="glass-panel sticky top-0 z-50 w-full px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Logo and Brand Name */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center">
            <img src="/logo.svg" alt="NeuroTradeX Logo" className="h-8 w-8" />
            <span className="ml-2 text-xl font-semibold tracking-tight text-gradient">
              NeuroTradeX
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {isAuthenticated ? (
            <>
              {/* Profile */}
              <div className="relative" ref={profileDropdownRef}>
                <button 
                  className="h-9 w-9 overflow-hidden rounded-full transition-all hover:opacity-80"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  aria-label="Profile"
                >
                  <div className="absolute inset-0 bg-gradient-radial from-blue-600/20 to-blue-800/40"></div>
                  <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-primary">
                    {localStorage.getItem("username")?.charAt(0).toUpperCase() || "U"}
                  </span>
                </button>
                
                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 glass-panel rounded-lg animate-fade-in z-50">
                    <button
                      className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-secondary/40 rounded-md text-sm"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Button
              onClick={() => navigate("/signin")}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </Button>
          )}

          {/* Mobile Menu Button */}
          <button 
            className="block md:hidden" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-primary" />
            ) : (
              <Menu className="h-6 w-6 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 py-2 glass-panel rounded-lg animate-fade-in">
          <div className="flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item mx-2 my-1 ${
                  location.pathname === item.path ? "active" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            {!isAuthenticated && (
              <Link
                to="/signin"
                className="nav-item mx-2 my-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

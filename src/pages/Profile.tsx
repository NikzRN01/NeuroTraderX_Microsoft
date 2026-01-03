
import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import { User, Mail, Lock, Settings, Upload, HelpCircle, LogOut, Edit, Phone, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/providers/ThemeProvider";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("settings");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { ThemeToggle } = useTheme();

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

  const tabClass = (tab: string) =>
    `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      activeTab === tab
        ? "bg-secondary text-primary"
        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
    }`;

  const profileItems = [
    { id: "settings", icon: Settings, label: "Account Settings" },
    { id: "preference", icon: Settings, label: "Preferences" },
    { id: "export", icon: Upload, label: "Export Data" },
    { id: "help", icon: HelpCircle, label: "Help & Support" },
    { id: "logout", icon: LogOut, label: "Log Out" },
  ];

  const handleLogout = () => {
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account"
    });
    navigate("/");
  };

  const handleExportData = (format: string) => {
    toast({
      title: "Data export initiated",
      description: `Your data is being exported in ${format} format. Download will begin shortly.`
    });
    
    // Mock download functionality
    setTimeout(() => {
      // In a real application, this would be a generated file from the server
      const dummyData = {
        portfolio: [
          { asset: "AAPL", quantity: 10, value: 1750.45 },
          { asset: "GOOGL", quantity: 5, value: 6532.50 },
          { asset: "BTC", quantity: 0.5, value: 15275.80 },
        ],
        insights: [
          { title: "Portfolio Diversification", score: 85 },
          { title: "Risk Assessment", score: 65 },
        ]
      };
      
      const dataStr = JSON.stringify(dummyData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileName = `neurotradex_export_${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
      linkElement.remove();
    }, 1500);
  };

  return (
    <div className="min-h-screen p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants} className="md:col-span-1">
          <GlassCard className="relative">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-secondary flex items-center justify-center relative">
                  <span className="text-2xl font-semibold text-foreground">NN</span>
                  <div className="absolute inset-0 bg-gradient-radial from-blue-600/20 to-blue-800/40"></div>
                </div>
                <button className="absolute -right-1 -bottom-1 rounded-full p-1 bg-secondary text-primary">
                  <Edit className="h-3 w-3" />
                </button>
              </div>
              <h2 className="mt-3 text-lg font-medium">Nikhil Naraniya</h2>
              <p className="text-sm text-muted-foreground">Premium Member</p>
              <div className="w-full border-t border-border mt-4 pt-4">
                <ul className="space-y-1">
                  {profileItems.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => item.id === "logout" ? handleLogout() : setActiveTab(item.id)}
                        className={tabClass(item.id)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-3">
          {activeTab === "settings" && (
            <GlassCard title="Account Settings">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                    <div>
                      <h3 className="text-base font-medium">Personal Information</h3>
                      <p className="text-sm text-muted-foreground">Update your personal details</p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium rounded-lg bg-primary/10 text-primary self-start">
                      Save Changes
                    </button>
                  </div>
                  <div className="glass-panel rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            defaultValue="Nikhil Naraniya"
                            className="w-full bg-secondary py-2 pl-10 pr-4 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="email"
                            defaultValue="nikznaraniya@gmail.com"
                            className="w-full bg-secondary py-2 pl-10 pr-4 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Phone Number</label>
                        <input
                          type="tel"
                          defaultValue="+91 94276 20852"
                          className="w-full bg-secondary py-2 px-4 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Country</label>
                        <select className="w-full bg-secondary py-2 px-4 rounded-lg text-sm">
                          <option>India</option>
                          <option>United States</option>
                          <option>Canada</option>
                          <option>United Kingdom</option>
                          <option>Australia</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <h3 className="text-base font-medium">Security</h3>
                    <p className="text-sm text-muted-foreground">Manage your password and security settings</p>
                  </div>
                  <div className="glass-panel rounded-lg p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Current Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="password"
                            placeholder="Enter current password"
                            className="w-full bg-secondary py-2 pl-10 pr-4 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="password"
                            placeholder="Enter new password"
                            className="w-full bg-secondary py-2 pl-10 pr-4 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Confirm New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="password"
                            placeholder="Confirm new password"
                            className="w-full bg-secondary py-2 pl-10 pr-4 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {activeTab === "preference" && (
            <GlassCard title="Preferences">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div>
                    <h3 className="text-base font-medium">Display Settings</h3>
                    <p className="text-sm text-muted-foreground">Customize your dashboard view</p>
                  </div>
                  <div className="glass-panel rounded-lg p-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Default Dashboard View</label>
                        <select className="w-full bg-secondary py-2 px-4 rounded-lg text-sm">
                          <option>Total Portfolio Value</option>
                          <option>Watchlist</option>
                        </select>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Theme Mode</span>
                        <ThemeToggle />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {activeTab === "export" && (
            <GlassCard title="Export Data">
              <div className="space-y-6">
                <div className="glass-panel rounded-lg p-4">
                  <div className="space-y-4">
                    <p className="text-sm">
                      Export your financial data in various formats. This includes your portfolio information, 
                      transaction history, and AI-generated insights.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button 
                        className="rounded-lg bg-primary/10 py-2 text-primary hover:bg-primary/20 transition-colors"
                        onClick={() => handleExportData('JSON')}
                      >
                        Export as JSON
                      </button>
                      <button 
                        className="rounded-lg bg-primary/10 py-2 text-primary hover:bg-primary/20 transition-colors"
                        onClick={() => handleExportData('CSV')}
                      >
                        Export as CSV
                      </button>
                      <button 
                        className="rounded-lg bg-primary/10 py-2 text-primary hover:bg-primary/20 transition-colors"
                        onClick={() => handleExportData('PDF')}
                      >
                        Export as PDF
                      </button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      <p>Data included in export:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Portfolio holdings and performance</li>
                        <li>Transaction history</li>
                        <li>AI investment insights</li>
                        <li>Account settings</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {activeTab === "help" && (
            <GlassCard title="Help & Support">
              <div className="space-y-6">
                <div className="glass-panel rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-medium">Contact Information</h3>
                      <div className="mt-3 space-y-3">
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Email Support</p>
                            <a href="mailto:support@neurotradex.com" className="text-sm text-primary">
                              support@neurotradex.com
                            </a>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Phone Support</p>
                            <a href="tel:+18001234567" className="text-sm text-primary">
                              +1 (800) 123-4567
                            </a>
                            <p className="text-xs text-muted-foreground">
                              Available Monday - Friday, 9am - 5pm EST
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Company Address</p>
                            <p className="text-sm">
                              NeuroTradeX Inc.<br />
                              123 Finance Street, Suite 456<br />
                              New York, NY 10001<br />
                              United States
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-border pt-4">
                      <h3 className="text-base font-medium">Frequently Asked Questions</h3>
                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-sm font-medium">How do I reset my password?</p>
                          <p className="text-sm text-muted-foreground">
                            Go to the Account Settings tab and select the Security section to change your password.
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">How can I export my portfolio data?</p>
                          <p className="text-sm text-muted-foreground">
                            Use the Export Data tab to download your portfolio information in various formats.
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">How are AI recommendations generated?</p>
                          <p className="text-sm text-muted-foreground">
                            Our AI analyzes market trends, your portfolio composition, and historical data to provide personalized investment insights.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Profile;

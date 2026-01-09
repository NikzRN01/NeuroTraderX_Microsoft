
import { toast } from "sonner";

// Base API URL - adjust this to match your Flask server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Error handler helper function
type ErrorWithResponse = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

const handleError = (error: unknown): never => {
  console.error("API Error:", error);
  const errorMessage =
    (error as ErrorWithResponse)?.response?.data?.error ||
    (error instanceof Error ? error.message : "An unexpected error occurred");
  toast.error(errorMessage);
  throw error;
};

// Generic fetch wrapper with error handling
const fetchWithErrorHandling = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const hasBody = options.body != null;
    const method = (options.method || "GET").toUpperCase();

    // Only set JSON Content-Type when we actually send a body.
    // Setting Content-Type on GET triggers unnecessary CORS preflight.
    const defaultHeaders: Record<string, string> = {};
    if (hasBody && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      defaultHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      toast.error(data.error || "An error occurred");
      throw new Error(data.error || "Request failed");
    }
    
    return data;
  } catch (error) {
    return handleError(error);
  }
};

// Auth API
export const authApi = {
  register: (username: string, password: string) => 
    fetchWithErrorHandling("/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  
  login: (username: string, password: string) => 
    fetchWithErrorHandling("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
    
  updatePreferences: (userId: number, preferences: Record<string, unknown>) =>
    fetchWithErrorHandling("/update_preferences", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, ...preferences }),
    }),
    
  getInvestmentStrategy: (userId: number) =>
    fetchWithErrorHandling("/investment_strategy", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    }),
};

// Portfolio Analysis API
export const portfolioApi = {
  analyzePortfolio: (tickers: string[], startDate: string, endDate: string) => 
    fetchWithErrorHandling("/analyze", {
      method: "POST",
      body: JSON.stringify({ tickers, start_date: startDate, end_date: endDate }),
    }),
  
  fetchPortfolioData: (userId: number) =>
    fetchWithErrorHandling("/portfolio", {
      method: "GET",
      headers: {
        "User-ID": userId.toString(),
      }
    }),
    
  uploadPortfolio: (userId: number, portfolioData: unknown) =>
    fetchWithErrorHandling("/portfolio", {
      method: "POST",
      body: JSON.stringify({ 
        user_id: userId,
        portfolio_data: portfolioData 
      }),
    }),
};

// News API
export const newsApi = {
  fetchNews: async (ticker?: string) => {
    try {
      const params = ticker ? `?ticker=${ticker}` : '';
      const response = await fetch(`${API_BASE_URL}/news${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      return await response.json();
    } catch (error) {
      console.error('News API Error:', error);
      return null;
    }
  },
};

// Tax Liability API
export const taxApi = {
  calculateTaxLiability: (portfolio: unknown[]) =>
    fetchWithErrorHandling("/api/submit_portfolio", {
      method: "POST",
      body: JSON.stringify({ portfolio }),
    }),
};

// Market Data API
export const marketApi = {
  fetchMarketData: (marketType: string, symbol: string, exchange: string = "NSE") =>
    fetchWithErrorHandling("/fetch_data", {
      method: "POST",
      body: JSON.stringify({ market_type: marketType, symbol, exchange }),
    }),
    
  fetchAllMarketData: () =>
    fetchWithErrorHandling("/market-data", {
      method: "GET",
    }),

  fetchMutualFunds: (limit: number = 500) =>
    fetchWithErrorHandling(`/api/mutual-funds?limit=${encodeURIComponent(limit)}`, {
      method: "GET",
    }),
};

// Future Prediction API
export const predictionApi = {
  getPrediction: (symbol: string, days: number, futureDays: number, initialInvestment: number) =>
    fetchWithErrorHandling("/predict", {
      method: "POST",
      body: JSON.stringify({
        symbol,
        days,
        future_days: futureDays,
        initial_investment: initialInvestment
      }),
    }),
};

// Insights API
export const insightsApi = {
  getStockInsights: (symbols: string[], intervals: number[]) =>
    fetchWithErrorHandling("/insights", {
      method: "POST",
      body: JSON.stringify({ symbols, intervals }),
    }),
  
  getSymbolInsights: (query: string) =>
    fetchWithErrorHandling<{
      symbol: string;
      lastPrice: number;
      priceChange: number;
      peRatio: number | string;
      marketCap: number | string;
      summary: string;
      prediction: string;
      recommendation: string;
      riskLevel: "Low" | "Medium" | "High";
      confidence: number;
    }>("/api/insights", {
      method: "POST",
      body: JSON.stringify({ query }),
    }),
};

// AI Chat API
export const aiApi = {
  sendMessage: (message: string) =>
    fetchWithErrorHandling<{ response: string }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
};

// Price API
export const priceApi = {
  getStockPrice: async (symbol: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stock-price?symbol=${encodeURIComponent(symbol)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch price for ${symbol}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Price API Error:', error);
      return null;
    }
  },
  
  getMutualFundPrice: async (symbol: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mutual-fund-price?symbol=${encodeURIComponent(symbol)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch NAV for ${symbol}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Price API Error:', error);
      return null;
    }
  },
};

// Holdings Sync API
export const holdingsApi = {
  syncHoldings: async (userId: number, holdings: unknown[], action: 'upload' | 'sync' = 'sync') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/holdings/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, holdings, action }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync holdings');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Holdings Sync Error:', error);
      return null;
    }
  },
  
  getUserHoldings: async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio`, {
        method: 'GET',
        headers: {
          'User-ID': userId.toString(),
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch holdings');
      }
      
      const data = await response.json();
      return data.holdings || [];
    } catch (error) {
      console.error('Get Holdings Error:', error);
      return [];
    }
  },
};


import { toast } from "sonner";

// Base API URL - adjust this to match your Flask server
const API_BASE_URL = "http://localhost:5000";

// Error handler helper function
const handleError = (error: any) => {
  console.error("API Error:", error);
  const errorMessage = error?.response?.data?.error || "An unexpected error occurred";
  toast.error(errorMessage);
  throw error;
};

// Generic fetch wrapper with error handling
const fetchWithErrorHandling = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
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
    
  updatePreferences: (userId: number, preferences: any) =>
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
    
  uploadPortfolio: (userId: number, portfolioData: any) =>
    fetchWithErrorHandling("/portfolio", {
      method: "POST",
      body: JSON.stringify({ 
        user_id: userId,
        portfolio_data: portfolioData 
      }),
    }),
};

// Tax Liability API
export const taxApi = {
  calculateTaxLiability: (portfolio: any[]) =>
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
};

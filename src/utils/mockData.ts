
export interface PortfolioData {
  totalValue: number;
  totalGrowth: number;
  totalGrowthPercentage: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  accountTypes: {
    name: string;
    value: number;
    growth: number;
  }[];
  timePerformance: {
    period: string;
    value: number;
  }[];
  assetAllocation: {
    name: string;
    value: number;
    color: string;
  }[];
  topHoldings: {
    name: string;
    symbol: string;
    value: number;
    growth: number;
    growthPercentage: number;
  }[];
}

export interface MarketData {
  indices: {
    name: string;
    value: number;
    change: number;
    changePercentage: number;
  }[];
  trendingStocks: {
    name: string;
    symbol: string;
    value: number;
    change: number;
    changePercentage: number;
  }[];
}

export const mockPortfolioData: PortfolioData = {
  totalValue: 125630.45,
  totalGrowth: 1205.30,
  totalGrowthPercentage: 0.97,
  riskLevel: 'Moderate',
  accountTypes: [
    { name: 'Taxable', value: 65420.25, growth: 702.15 },
    { name: 'Retirement', value: 42180.10, growth: 318.45 },
    { name: 'Crypto', value: 18030.10, growth: 184.70 }
  ],
  timePerformance: [
    { period: '1W', value: 123850.20 },
    { period: '1M', value: 119450.80 },
    { period: '6M', value: 108720.15 },
    { period: '1Y', value: 95420.30 },
    { period: 'All', value: 85000.00 }
  ],
  assetAllocation: [
    { name: 'Equities', value: 60, color: 'rgba(59, 130, 246, 0.8)' },
    { name: 'Bonds', value: 15, color: 'rgba(16, 185, 129, 0.8)' },
    { name: 'Cash', value: 10, color: 'rgba(249, 115, 22, 0.8)' },
    { name: 'Crypto', value: 10, color: 'rgba(139, 92, 246, 0.8)' },
    { name: 'Others', value: 5, color: 'rgba(156, 163, 175, 0.8)' }
  ],
  topHoldings: [
    { name: 'Apple Inc.', symbol: 'AAPL', value: 12450.30, growth: 245.80, growthPercentage: 2.01 },
    { name: 'Microsoft', symbol: 'MSFT', value: 8950.50, growth: 134.25, growthPercentage: 1.52 },
    { name: 'Amazon', symbol: 'AMZN', value: 7840.20, growth: -98.50, growthPercentage: -1.24 },
    { name: 'Tesla', symbol: 'TSLA', value: 6580.10, growth: 87.30, growthPercentage: 1.34 },
    { name: 'Ethereum', symbol: 'ETH', value: 5920.80, growth: 215.40, growthPercentage: 3.78 }
  ]
};

export const mockMarketData: MarketData = {
  indices: [
    { name: 'S&P 500', value: 4783.83, change: 25.20, changePercentage: 0.53 },
    { name: 'Nasdaq', value: 16274.09, change: 130.30, changePercentage: 0.78 },
    { name: 'Dow Jones', value: 38239.98, change: -45.20, changePercentage: -0.12 },
    { name: 'Nifty 50', value: 22367.45, change: 89.10, changePercentage: 0.42 },
    { name: 'Sensex', value: 73678.23, change: 201.30, changePercentage: 0.27 }
  ],
  trendingStocks: [
    { name: 'NVIDIA', symbol: 'NVDA', value: 907.36, change: 23.45, changePercentage: 2.65 },
    { name: 'Meta Platforms', symbol: 'META', value: 478.22, change: 12.80, changePercentage: 2.75 },
    { name: 'Alphabet', symbol: 'GOOGL', value: 165.63, change: 3.21, changePercentage: 1.98 },
    { name: 'Reliance Industries', symbol: 'RELIANCE.NS', value: 2875.25, change: 45.30, changePercentage: 1.60 },
    { name: 'Infosys', symbol: 'INFY.NS', value: 1467.80, change: -18.90, changePercentage: -1.27 }
  ]
};

export const timeFrameOptions = ['1W', '1M', '6M', '1Y', 'All'];

// Sample data for charts
export const sampleChartData = [
  { name: 'Jan', value: 100000 },
  { name: 'Feb', value: 102000 },
  { name: 'Mar', value: 98000 },
  { name: 'Apr', value: 103000 },
  { name: 'May', value: 108000 },
  { name: 'Jun', value: 115000 },
  { name: 'Jul', value: 112000 },
  { name: 'Aug', value: 118000 },
  { name: 'Sep', value: 121000 },
  { name: 'Oct', value: 119000 },
  { name: 'Nov', value: 123000 },
  { name: 'Dec', value: 125630 }
];

export const newsItems = [
  {
    id: 1,
    title: 'Federal Reserve Maintains Interest Rates, Signals Potential Cuts',
    description: 'The Federal Reserve has decided to maintain current interest rates while signaling potential future cuts based on economic indicators.',
    source: 'Financial Times',
    time: '2 hours ago',
    category: 'Economy'
  },
  {
    id: 2,
    title: 'Tech Stocks Rally as AI Optimism Continues to Grow',
    description: 'Technology stocks are experiencing a significant rally as investors show increased optimism about artificial intelligence developments.',
    source: 'Bloomberg',
    time: '4 hours ago',
    category: 'Technology'
  },
  {
    id: 3,
    title: 'NVIDIA Announces New AI Chips, Stock Surges 5%',
    description: 'NVIDIA has unveiled its next generation of AI processing chips, causing a 5% surge in its stock price as markets react positively.',
    source: 'CNBC',
    time: '6 hours ago',
    category: 'Technology'
  },
  {
    id: 4,
    title: 'Oil Prices Drop Amid Global Supply Concerns',
    description: 'Global oil prices have decreased as concerns about supply chains and production levels impact market sentiment.',
    source: 'Reuters',
    time: '8 hours ago',
    category: 'Commodities'
  },
  {
    id: 5,
    title: 'Indian Markets Hit All-Time High as Foreign Investments Surge',
    description: 'Indian stock markets have reached record highs as foreign investments continue to flow into the country\'s growing economy.',
    source: 'Economic Times',
    time: '9 hours ago',
    category: 'Markets'
  }
];

export const insightRecommendations = [
  {
    id: 1,
    title: 'Consider diversifying your tech holdings',
    description: 'Your portfolio is heavily weighted towards tech. Consider adding exposure to healthcare and consumer staples for better diversification.',
    impact: 'Medium',
    type: 'Diversification'
  },
  {
    id: 2,
    title: 'Potential tax-loss harvesting opportunity',
    description: 'Consider selling Amazon at a loss to offset capital gains and reduce your tax liability for the year.',
    impact: 'High',
    type: 'Tax Planning'
  },
  {
    id: 3,
    title: 'Rebalance portfolio to target allocation',
    description: 'Your equity allocation has exceeded your target by 5%. Consider rebalancing to maintain your risk profile.',
    impact: 'Medium',
    type: 'Rebalancing'
  }
];

export const learningModules = [
  {
    id: 1,
    title: 'Investment Fundamentals',
    level: 'Beginner',
    duration: '2 hours',
    modules: 8,
    progress: 100
  },
  {
    id: 2,
    title: 'Stock Market Analysis',
    level: 'Intermediate',
    duration: '4 hours',
    modules: 12,
    progress: 75
  },
  {
    id: 3,
    title: 'Advanced Portfolio Management',
    level: 'Advanced',
    duration: '6 hours',
    modules: 15,
    progress: 30
  },
  {
    id: 4,
    title: 'Tax Strategies for Investors',
    level: 'Intermediate',
    duration: '3 hours',
    modules: 10,
    progress: 0
  }
];

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, TrendingUp, TrendingDown, Minus, X, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  source: string;
  pubDate: string;
  url: string;
  sentiment: {
    label: string;
    score: number;
    confidence: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
}

interface IntelligentSearchProps {
  onResultsChange?: (results: SearchResult[]) => void;
}

export function IntelligentSearch({ onResultsChange }: IntelligentSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Debounced search suggestions
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/search/suggestions?q=${encodeURIComponent(query)}&top=5`
        );
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Execute search
  const executeSearch = useCallback(async (searchQuery: string, sentiment?: string | null) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        top: '20'
      });

      if (sentiment) {
        params.append('sentiment', sentiment);
      }

      const response = await fetch(`${API_BASE_URL}/api/search/news?${params}`);
      const data = await response.json();
      
      const searchResults = data.results || [];
      setResults(searchResults);
      setShowResults(true);
      
      if (onResultsChange) {
        onResultsChange(searchResults);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [onResultsChange]);

  const handleSearch = () => {
    executeSearch(query, sentimentFilter);
    setSuggestions([]);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
    executeSearch(suggestion, sentimentFilter);
  };

  const handleSentimentFilter = (sentiment: string) => {
    const newSentiment = sentimentFilter === sentiment ? null : sentiment;
    setSentimentFilter(newSentiment);
    if (query.trim()) {
      executeSearch(query, newSentiment);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSuggestions([]);
    setSentimentFilter(null);
    if (onResultsChange) {
      onResultsChange([]);
    }
  };

  const getSentimentIcon = (label: string) => {
    if (label === 'positive') return <TrendingUp className="h-3 w-3" />;
    if (label === 'negative') return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getSentimentColor = (label: string) => {
    if (label === 'positive') return 'text-green-600 bg-green-500/10';
    if (label === 'negative') return 'text-red-600 bg-red-500/10';
    return 'text-gray-600 bg-gray-500/10';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Search Bar */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search news with AI... (e.g., 'bullish tech earnings', 'market crash news')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-24"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="h-7 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                size="sm"
                className="h-7"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </div>

          {/* Autocomplete Suggestions */}
          {suggestions.length > 0 && (
            <div className="border rounded-md bg-card">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-secondary text-sm border-b last:border-b-0"
                >
                  <Search className="inline h-3 w-3 mr-2 text-muted-foreground" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Sentiment Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Filter by:</span>
            {[
              { label: 'Bullish', value: 'positive', icon: TrendingUp },
              { label: 'Neutral', value: 'neutral', icon: Minus },
              { label: 'Bearish', value: 'negative', icon: TrendingDown }
            ].map(({ label, value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleSentimentFilter(value)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                  sentimentFilter === value
                    ? value === 'positive'
                      ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                      : value === 'negative'
                      ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                      : 'bg-gray-500/10 text-gray-600 border border-gray-500/20'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Search Results */}
      {showResults && (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Search Results {results.length > 0 && `(${results.length})`}
            </h3>
            {results.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearSearch}>
                Clear
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No results found for "{query}"</p>
              <p className="text-xs mt-2">Try different keywords or remove filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <a
                  key={result.id}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 border rounded-lg hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium mb-1">{result.title}</h4>
                      {result.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {result.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{result.source}</span>
                        <span>•</span>
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(result.pubDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {result.sentiment && (
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getSentimentColor(
                          result.sentiment.label
                        )}`}
                      >
                        {getSentimentIcon(result.sentiment.label)}
                        <span>
                          {result.sentiment.label === 'positive'
                            ? 'Bullish'
                            : result.sentiment.label === 'negative'
                            ? 'Bearish'
                            : 'Neutral'}
                        </span>
                        <span className="opacity-70">
                          {Math.round(result.sentiment.score * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

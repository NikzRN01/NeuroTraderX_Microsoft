
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";
import LineChart from "@/components/ui/LineChart";
import TradingViewWidget from "@/components/markets/TradingViewWidget";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockMarketData, newsItems } from "@/utils/mockData";
import { marketApi, newsApi } from "@/services/api";
import mutualFundsCsvText from "../../server/mutual_funds.csv?raw";

type MutualFundRow = Record<string, string | number | null | undefined>;

type ReturnsKey = "1Y Returns (%)" | "3Y Returns (%)" | "5Y Returns (%)";

const RETURN_OPTIONS: { label: string; key: ReturnsKey }[] = [
  { label: "1Y", key: "1Y Returns (%)" },
  { label: "3Y", key: "3Y Returns (%)" },
  { label: "5Y", key: "5Y Returns (%)" },
];

const parseCsv = (csvText: string): MutualFundRow[] => {
  const rows: MutualFundRow[] = [];
  if (!csvText) return rows;

  const lines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length < 2) return rows;

  const splitCsvLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        const next = line[i + 1];
        if (inQuotes && next === '"') {
          cur += '"';
          i++;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }

      if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
        continue;
      }

      cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const headers = splitCsvLine(nonEmpty[0]);
  for (let i = 1; i < nonEmpty.length; i++) {
    const values = splitCsvLine(nonEmpty[i]);
    const row: MutualFundRow = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j] ?? `col_${j}`;
      const v = values[j];
      row[key] = v === undefined || v === "" ? null : v;
    }
    rows.push(row);
  }
  return rows;
};

const abbreviateSchemeName = (name: string) => {
  const trimmed = name.trim();
  if (trimmed.length <= 18) return trimmed;
  return `${trimmed.slice(0, 18)}…`;
};

const Markets = () => {
  const [selectedReturnsKey, setSelectedReturnsKey] = useState<ReturnsKey>("1Y Returns (%)");
  const [mutualFunds, setMutualFunds] = useState<MutualFundRow[]>([]);
  const [mutualFundsLoading, setMutualFundsLoading] = useState<boolean>(true);
  const [mutualFundsError, setMutualFundsError] = useState<string | null>(null);

  const [selectedMutualFundName, setSelectedMutualFundName] = useState<string>("");
  
  // Filter states
  const [marketCap, setMarketCap] = useState<string>("Any");
  const [peRatio, setPeRatio] = useState<string>("Any");
  const [dividendYield, setDividendYield] = useState<string>("Any");
  const [filtersApplied, setFiltersApplied] = useState<boolean>(false);
  
  // News states
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setMutualFundsLoading(true);
      setMutualFundsError(null);
      try {
        // Prefer backend so this works in deployed mode.
        // If backend isn't running locally, fall back to bundling the CSV.
        const res = await marketApi.fetchMutualFunds(1200);
        const rows = (res as { rows?: MutualFundRow[] })?.rows;
        if (!cancelled) setMutualFunds(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) {
          try {
            const fallbackRows = parseCsv(mutualFundsCsvText);
            setMutualFunds(fallbackRows);
          } catch {
            setMutualFundsError("Failed to load mutual funds data");
            setMutualFunds([]);
          }
        }
      } finally {
        if (!cancelled) setMutualFundsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);
  
  // Fetch news from backend
  useEffect(() => {
    let cancelled = false;
    
    const loadNews = async () => {
      setNewsLoading(true);
      try {
        const data = await newsApi.fetchNews();
        if (!cancelled && data) {
          // API returns { body: [...], meta: {...} }
          const newsArray = data.body || data;
          const transformedNews = Array.isArray(newsArray) ? newsArray.map((item: any, index: number) => ({
            id: index + 1,
            title: item.title || 'No title',
            description: item.description || '',
            source: 'Yahoo Finance', // API doesn't provide source, using default
            time: item.pubDate ? new Date(item.pubDate).toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: '2-digit' 
            }) : 'Recently',
            category: 'Markets',
            url: item.link || '#'
          })) : [];
          setNews(transformedNews);
        } else if (!cancelled) {
          // Fallback to mock data if API fails
          setNews(newsItems);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch news:', error);
          // Fallback to mock data
          setNews(newsItems);
        }
      } finally {
        if (!cancelled) setNewsLoading(false);
      }
    };
    
    void loadNews();
    return () => {
      cancelled = true;
    };
  }, []);

  const mutualFundNames = useMemo(() => {
    const names = mutualFunds
      .map((r) => String(r["Scheme Name"] ?? ""))
      .filter((n) => n.trim().length > 0);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [mutualFunds]);

  useEffect(() => {
    if (!selectedMutualFundName && mutualFundNames.length > 0) {
      setSelectedMutualFundName(mutualFundNames[0]);
    }
  }, [mutualFundNames, selectedMutualFundName]);

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

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
      active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
    }`;

  const fundReturnRangeClass = (key: ReturnsKey) => chipClass(selectedReturnsKey === key);

  const topFunds = useMemo(() => {
    const points = mutualFunds
      .map((row) => {
        const schemeName = String(row["Scheme Name"] ?? "Unknown");
        const category = String(row["Category"] ?? "—");
        const aumRaw = row["AUM (Cr)"];
        const aum = typeof aumRaw === "number" ? aumRaw : Number(aumRaw);
        const raw = row[selectedReturnsKey];
        const returns = typeof raw === "number" ? raw : Number(raw);
        if (!Number.isFinite(returns)) return null;
        return {
          schemeName,
          category,
          returns,
          aum: Number.isFinite(aum) ? aum : null,
        };
      })
      .filter(Boolean) as {
      schemeName: string;
      category: string;
      returns: number;
      aum: number | null;
    }[];
    points.sort((a, b) => b.returns - a.returns);
    return points.slice(0, 8);
  }, [mutualFunds, selectedReturnsKey]);

  const selectedMutualFundRow = useMemo(() => {
    if (!selectedMutualFundName) return null;
    return (
      mutualFunds.find((r) => String(r["Scheme Name"] ?? "") === selectedMutualFundName) ?? null
    );
  }, [mutualFunds, selectedMutualFundName]);

  const selectedMutualFundSeries = useMemo(() => {
    const row = selectedMutualFundRow;
    if (!row) return [] as { name: string; value: number }[];

    const toNum = (v: unknown) => {
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const y1 = toNum(row["1Y Returns (%)"]);
    const y3 = toNum(row["3Y Returns (%)"]);
    const y5 = toNum(row["5Y Returns (%)"]);
    const out: { name: string; value: number }[] = [];
    if (y1 != null) out.push({ name: "1Y", value: y1 });
    if (y3 != null) out.push({ name: "3Y", value: y3 });
    if (y5 != null) out.push({ name: "5Y", value: y5 });
    return out;
  }, [selectedMutualFundRow]);

  const tableFunds = useMemo(() => {
    if (!filtersApplied) {
      return mutualFunds.slice(0, 25);
    }
    
    // Apply filters
    let filtered = [...mutualFunds];
    
    // Filter by category (treating it as market cap proxy since we don't have actual market cap data)
    if (marketCap !== "Any") {
      // This is a simplified example - you can enhance the logic based on your data
      const categoryFilter = marketCap.toLowerCase().includes("small") ? "Small" :
                            marketCap.toLowerCase().includes("mid") ? "Mid" :
                            marketCap.toLowerCase().includes("large") ? "Large" : "";
      if (categoryFilter) {
        filtered = filtered.filter(f => 
          String(f["Category"] ?? "").toLowerCase().includes(categoryFilter.toLowerCase())
        );
      }
    }
    
    // Filter by P/E Ratio (using AUM as proxy since we don't have P/E data)
    if (peRatio !== "Any") {
      filtered = filtered.filter(f => {
        const aum = Number(f["AUM (Cr)"] ?? 0);
        if (peRatio === "< 10") return aum < 1000;
        if (peRatio === "10 - 20") return aum >= 1000 && aum < 5000;
        if (peRatio === "20 - 50") return aum >= 5000 && aum < 10000;
        if (peRatio === "> 50") return aum >= 10000;
        return true;
      });
    }
    
    // Filter by Dividend Yield (using 1Y Returns as proxy)
    if (dividendYield !== "Any") {
      filtered = filtered.filter(f => {
        const returns = Number(f["1Y Returns (%)"] ?? 0);
        if (dividendYield === "< 1%") return returns < 5;
        if (dividendYield === "1% - 3%") return returns >= 5 && returns < 10;
        if (dividendYield === "3% - 5%") return returns >= 10 && returns < 15;
        if (dividendYield === "> 5%") return returns >= 15;
        return true;
      });
    }
    
    return filtered.slice(0, 25);
  }, [mutualFunds, filtersApplied, marketCap, peRatio, dividendYield]);
  
  const handleApplyFilters = () => {
    setFiltersApplied(true);
  };
  
  const resetFilters = () => {
    setMarketCap("Any");
    setPeRatio("Any");
    setDividendYield("Any");
    setFiltersApplied(false);
  };

  return (
    <div className="min-h-screen p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Markets</h1>
            <p className="text-muted-foreground">Track global market trends and discover opportunities</p>
          </div>
        </motion.div>

        {/* Market Overview */}
        <motion.div variants={itemVariants}>
          <Card title="Market Overview">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {mockMarketData.indices.map((index, i) => (
                  <div key={i} className="glass-panel rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">{index.name}</p>
                    <div className="flex justify-between items-end">
                      <p className="text-lg font-bold">{index.value.toLocaleString("en-US")}</p>
                      <div className={`flex items-center ${index.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {index.change >= 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        <span className="text-sm">
                          {index.changePercentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-[520px] w-full overflow-hidden rounded-lg">
                <TradingViewWidget />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Top Funds and News */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Top Mutual Funds" className="p-6">
            <div className="mb-4 grid grid-cols-1 gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Select mutual fund</p>
                  <Select
                    value={selectedMutualFundName}
                    onValueChange={(v) => setSelectedMutualFundName(v)}
                    disabled={mutualFundsLoading || mutualFundNames.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={mutualFundsLoading ? "Loading…" : "Select a mutual fund"} />
                    </SelectTrigger>
                    <SelectContent>
                      {mutualFundNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end justify-end gap-2">
                  {RETURN_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      className={fundReturnRangeClass(opt.key)}
                      onClick={() => setSelectedReturnsKey(opt.key)}
                      type="button"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {mutualFundsError ? (
                <div className="text-sm text-muted-foreground">{mutualFundsError}</div>
              ) : selectedMutualFundSeries.length === 0 ? (
                <div className="text-sm text-muted-foreground">Select a fund to view returns</div>
              ) : (
                <LineChart
                  data={selectedMutualFundSeries}
                  showTimeFrames={false}
                  formatValue={(v) => `${v.toFixed(2)}%`}
                />
              )}
            </div>
            <div className="space-y-4">
              {mutualFundsLoading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : topFunds.length === 0 ? (
                <div className="text-sm text-muted-foreground">No data available</div>
              ) : (
                topFunds.map((fund, index) => (
                  <div
                    key={`${fund.schemeName}-${index}`}
                    className="flex justify-between items-center p-2 hover:bg-secondary/20 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-xs font-medium">MF</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{fund.schemeName}</p>
                          <p className="text-xs text-muted-foreground">{fund.category}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {fund.aum != null ? `${fund.aum.toLocaleString("en-US")} Cr` : "—"}
                      </p>
                      <div className="flex items-center justify-end text-success">
                        <ArrowUpRight className="h-3 w-3" />
                        <span className="text-xs">{fund.returns.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
          
          <Card title="Market News" className="p-6">
            <div className="space-y-4">
              {newsLoading ? (
                <div className="text-sm text-muted-foreground">Loading news...</div>
              ) : news.length === 0 ? (
                <div className="text-sm text-muted-foreground">No news available</div>
              ) : (
                news.map((newsItem) => (
                  <a 
                    key={newsItem.id}
                    href="#"
                    className="flex justify-between items-start border-b border-border/30 pb-3 last:border-0 last:pb-0 hover:bg-secondary/20 p-2 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      if (newsItem.url && newsItem.url !== '#') {
                        window.open(newsItem.url, '_blank');
                      } else {
                        window.open('https://finance.yahoo.com', '_blank');
                      }
                    }}
                  >
                    <div>
                      <h4 className="text-sm font-medium">{newsItem.title}</h4>
                      <div className="mt-1 flex items-center text-xs text-muted-foreground">
                        <span>{newsItem.source}</span>
                        <span className="mx-1.5">•</span>
                        <span>{newsItem.time}</span>
                        <span className="mx-1.5">•</span>
                        <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px]">{newsItem.category}</span>
                      </div>
                    </div>
                    <button className="text-primary">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </a>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Mutual Fund Screener */}
        <motion.div variants={itemVariants}>
          <Card title="Mutual Fund Screener">
            <div className="mb-4">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Market Cap</label>
                  <select 
                    className="w-full bg-secondary rounded-lg px-3 py-2 text-sm"
                    value={marketCap}
                    onChange={(e) => setMarketCap(e.target.value)}
                  >
                    <option>Any</option>
                    <option>Small Cap (&lt; $2B)</option>
                    <option>Mid Cap ($2B - $10B)</option>
                    <option>Large Cap (&gt; $10B)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">P/E Ratio</label>
                  <select 
                    className="w-full bg-secondary rounded-lg px-3 py-2 text-sm"
                    value={peRatio}
                    onChange={(e) => setPeRatio(e.target.value)}
                  >
                    <option>Any</option>
                    <option>&lt; 10</option>
                    <option>10 - 20</option>
                    <option>20 - 50</option>
                    <option>&gt; 50</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Dividend Yield</label>
                  <select 
                    className="w-full bg-secondary rounded-lg px-3 py-2 text-sm"
                    value={dividendYield}
                    onChange={(e) => setDividendYield(e.target.value)}
                  >
                    <option>Any</option>
                    <option>&lt; 1%</option>
                    <option>1% - 3%</option>
                    <option>3% - 5%</option>
                    <option>&gt; 5%</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-3 flex gap-2">
                <button 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </button>
                {filtersApplied && (
                  <button 
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/80 transition-colors"
                    onClick={resetFilters}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="text-left p-2 text-xs text-muted-foreground font-medium border-b border-border/50">Scheme</th>
                    <th className="text-left p-2 text-xs text-muted-foreground font-medium border-b border-border/50">Category</th>
                    <th className="text-left p-2 text-xs text-muted-foreground font-medium border-b border-border/50">Risk</th>
                    <th className="text-right p-2 text-xs text-muted-foreground font-medium border-b border-border/50">Min (₹)</th>
                    <th className="text-right p-2 text-xs text-muted-foreground font-medium border-b border-border/50">1Y</th>
                    <th className="text-right p-2 text-xs text-muted-foreground font-medium border-b border-border/50">3Y</th>
                    <th className="text-right p-2 text-xs text-muted-foreground font-medium border-b border-border/50">5Y</th>
                  </tr>
                </thead>
                <tbody>
                  {mutualFundsLoading ? (
                    <tr>
                      <td className="p-4 text-sm text-muted-foreground" colSpan={7}>
                        Loading…
                      </td>
                    </tr>
                  ) : tableFunds.length === 0 ? (
                    <tr>
                      <td className="p-4 text-sm text-muted-foreground" colSpan={7}>
                        No data available
                      </td>
                    </tr>
                  ) : (
                    tableFunds.map((row, index) => (
                      <tr key={index} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-2 text-sm">{String(row["Scheme Name"] ?? "—")}</td>
                        <td className="p-2 text-sm">{String(row["Category"] ?? "—")}</td>
                        <td className="p-2 text-sm">{String(row["Risk Level"] ?? "—")}</td>
                        <td className="p-2 text-sm text-right">{String(row["Min Investment (₹)"] ?? "—")}</td>
                        <td className="p-2 text-sm text-right">{String(row["1Y Returns (%)"] ?? "—")}</td>
                        <td className="p-2 text-sm text-right">{String(row["3Y Returns (%)"] ?? "—")}</td>
                        <td className="p-2 text-sm text-right">{String(row["5Y Returns (%)"] ?? "—")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Markets;

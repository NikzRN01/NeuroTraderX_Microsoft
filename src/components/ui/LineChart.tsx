
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  LineChart as RCLineChart,
  Line,
  BarChart,
  Bar,
  type TooltipProps,
} from "recharts";

interface LineChartProps {
  data: { name: string; value: number }[];
  height?: number;
  showTimeFrames?: boolean;
  formatValue?: (value: number) => string;
  chartType?: "area" | "line" | "bar";
  showBrush?: boolean;
}

const defaultFormatCurrency = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const CustomTooltip = (
  {
    active,
    payload,
    label,
    formatValue,
  }: TooltipProps<number, string> & { formatValue: (value: number) => string }
) => {
  if (active && payload && payload.length) {
    const rawValue = payload[0]?.value;
    const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
    return (
      <div className="glass-panel rounded p-3 text-xs shadow-lg border border-white/10 backdrop-blur-md bg-background/95">
        <p className="mb-1 font-medium text-foreground">{label}</p>
        <p className="text-primary font-semibold">{formatValue(value)}</p>
      </div>
    );
  }
  return null;
};

const LineChart = ({
  data,
  height = 200,
  showTimeFrames = true,
  formatValue,
  chartType = "area",
  showBrush = false,
}: LineChartProps) => {
  const [activeTimeFrame, setActiveTimeFrame] = useState<string>("7 Days");
  const [chartData, setChartData] = useState(data || []);

  const valueFormatter = formatValue ?? defaultFormatCurrency;

  useEffect(() => {
    // Initialize with empty data if none provided
    if (!data || data.length === 0) {
      setChartData([]);
      return;
    }
    
    // Use the data as is
    setChartData(data);
  }, [data]);

  const timeFrameClass = (range: string) =>
    `px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
      activeTimeFrame === range
        ? "bg-primary/10 text-primary"
        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
    }`;

  return (
    <div className="w-full">
      {showTimeFrames && (
        <div className="mb-4 flex justify-end space-x-2">
          <button
            onClick={() => setActiveTimeFrame("7 Days")}
            className={timeFrameClass("7 Days")}
          >
            7 Days
          </button>
          <button
            onClick={() => setActiveTimeFrame("14 Days")}
            className={timeFrameClass("14 Days")}
          >
            14 Days
          </button>
          <button
            onClick={() => setActiveTimeFrame("30 Days")}
            className={timeFrameClass("30 Days")}
          >
            30 Days
          </button>
        </div>
      )}
      <div className="chart-container" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartData.length > 0 ? (
            chartType === "line" ? (
              <RCLineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  minTickGap={20}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={10}
                  tickFormatter={(value) => valueFormatter(Number(value))}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickMargin={6}
                  domain={[
                    (dataMin: number) => dataMin * 0.98,
                    (dataMax: number) => dataMax * 1.02,
                  ]}
                />
                <Tooltip 
                  content={<CustomTooltip formatValue={valueFormatter} />} 
                  cursor={false}
                  wrapperStyle={{ outline: 'none' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff" }}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
                {showBrush && <Brush height={20} travellerWidth={8} stroke="#3b82f6" />}
              </RCLineChart>
            ) : chartType === "bar" ? (
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  minTickGap={20}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={10}
                  tickFormatter={(value) => valueFormatter(Number(value))}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickMargin={6}
                  domain={[
                    (dataMin: number) => dataMin * 0.98,
                    (dataMax: number) => dataMax * 1.02,
                  ]}
                />
                <Tooltip 
                  content={<CustomTooltip formatValue={valueFormatter} />} 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  wrapperStyle={{ outline: 'none' }}
                />
                <Bar
                  dataKey="value"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
                {showBrush && <Brush height={20} travellerWidth={8} stroke="#3b82f6" />}
              </BarChart>
            ) : (
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  minTickGap={20}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={10}
                  tickFormatter={(value) => valueFormatter(Number(value))}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickMargin={6}
                  domain={[
                    (dataMin: number) => dataMin * 0.98,
                    (dataMax: number) => dataMax * 1.02,
                  ]}
                />
                <Tooltip 
                  content={<CustomTooltip formatValue={valueFormatter} />} 
                  cursor={false}
                  wrapperStyle={{ outline: 'none' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff" }}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
                {showBrush && <Brush height={20} travellerWidth={8} stroke="#3b82f6" />}
              </AreaChart>
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LineChart;

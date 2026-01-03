
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface LineChartProps {
  data: { name: string; value: number }[];
  height?: number;
  showTimeFrames?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel rounded p-2 text-xs shadow-md">
        <p className="mb-1 font-medium">{label}</p>
        <p className="text-primary">
          ${payload[0].value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const LineChart = ({ data, height = 200, showTimeFrames = true }: LineChartProps) => {
  const [activeTimeFrame, setActiveTimeFrame] = useState<string>("7 Days");
  const [chartData, setChartData] = useState(data || []);

  useEffect(() => {
    // Initialize with empty data if none provided
    if (!data || data.length === 0) {
      setChartData([]);
      return;
    }
    
    // Use the data as is
    setChartData(data);
  }, [data, activeTimeFrame]);

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
      <div className="chart-container h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartData.length > 0 ? (
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
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis 
                stroke="#9ca3af" 
                fontSize={10} 
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
                activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff" }}
              />
            </AreaChart>
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

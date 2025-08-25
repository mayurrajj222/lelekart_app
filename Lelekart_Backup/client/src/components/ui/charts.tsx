import React from "react";

// Mock chart components that mimic the behavior of a real charting library
// In a real application, you would use a library like Recharts, Chart.js, or Tremor

// Common props interface
interface ChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function BarChart({
  data,
  index,
  categories,
  colors = ["primary"],
  valueFormatter = (value) => `${value}`,
  className,
  title,
  yAxisLabel = "Value",
  onBarClick,
}: ChartProps & {
  title?: string;
  yAxisLabel?: string;
  onBarClick?: (item: any) => void;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full text-muted-foreground">
        No data available
      </div>
    );
  }

  // Find the maximum value for scaling
  const maxValue = Math.max(
    ...data.flatMap((item) => categories.map((category) => item[category] || 0))
  );

  // Generate Y-axis ticks
  const yTicks = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    yTicks.push((maxValue / tickCount) * i);
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* Chart Title */}
      {title && (
        <div className="text-center font-semibold text-lg mb-4">{title}</div>
      )}

      <div className="flex h-full">
        {/* Y-axis */}
        <div className="flex flex-col justify-between pr-2 text-xs text-muted-foreground min-w-[40px]">
          {yTicks.reverse().map((tick, i) => (
            <div key={i} className="flex items-center">
              <span>{Math.round(tick)}</span>
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="flex-1 relative">
          {/* Y-axis grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {yTicks.map((tick, i) => (
              <div key={i} className="border-b border-gray-200 w-full" />
            ))}
          </div>

          {/* Bars */}
          <div className="absolute inset-0 flex items-end pt-4 pb-8">
            {data.map((item, i) => (
              <div key={i} className="flex-1 flex justify-center px-1">
                {categories.map((category, catIndex) => {
                  const value = item[category] || 0;
                  const heightPercent =
                    maxValue > 0 ? (value / maxValue) * 100 : 0;

                  return (
                    <div
                      key={catIndex}
                      className={`w-full rounded-t transition-all duration-200 hover:opacity-80 ${
                        onBarClick ? "cursor-pointer" : ""
                      }`}
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: getColorValue(
                          colors[catIndex % colors.length]
                        ),
                        minHeight: "4px",
                      }}
                      title={`${category}: ${valueFormatter(value)}`}
                      onClick={() => onBarClick && onBarClick(item)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-xs text-muted-foreground">
            {data.map((item, i) => (
              <div key={i} className="text-center truncate flex-1">
                {typeof item[index] === "string" ? item[index] : ""}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Y-axis label */}
      <div className="absolute left-0 top-1/2 transform -translate-x-8 -translate-y-1/2 rotate-270 text-sm font-medium text-muted-foreground">
        {yAxisLabel}
      </div>
    </div>
  );
}

export function LineChart({
  data,
  index,
  categories,
  colors = ["primary"],
  valueFormatter = (value) => `${value}`,
  className,
}: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {categories.map((category, catIndex) => {
            const points = data
              .map((item, i) => {
                const value = item[category] || 0;
                const maxValue = Math.max(...data.map((d) => d[category] || 0));
                const x = (i / (data.length - 1)) * 100;
                const y = maxValue > 0 ? 100 - (value / maxValue) * 100 : 100;
                return `${x},${y}`;
              })
              .join(" ");

            return (
              <polyline
                key={catIndex}
                points={points}
                fill="none"
                stroke={getColorValue(colors[catIndex % colors.length])}
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-muted-foreground">
        {data.map((item, i) => (
          <div key={i} className="truncate">
            {typeof item[index] === "string" ? item[index] : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PieChart({
  data,
  index,
  categories,
  colors = ["primary", "blue", "green", "yellow", "purple"],
  valueFormatter = (value) => `${value}`,
  className,
}: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full text-muted-foreground">
        No data available
      </div>
    );
  }

  const category = categories[0]; // Usually pie charts have only one category
  const total = data.reduce((sum, item) => sum + (item[category] || 0), 0);

  let currentAngle = 0;

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth="1"
          />

          {data.map((item, i) => {
            const value = item[category] || 0;
            const percentage = total > 0 ? (value / total) * 100 : 0;
            const angle = (percentage / 100) * 360;

            // Calculate the SVG arc path
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;

            const startRadians = (startAngle - 90) * (Math.PI / 180);
            const endRadians = (endAngle - 90) * (Math.PI / 180);

            const startX = 50 + 40 * Math.cos(startRadians);
            const startY = 50 + 40 * Math.sin(startRadians);
            const endX = 50 + 40 * Math.cos(endRadians);
            const endY = 50 + 40 * Math.sin(endRadians);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

            return (
              <path
                key={i}
                d={pathData}
                fill={getColorValue(colors[i % colors.length])}
                stroke="#fff"
                strokeWidth="1"
                title={`${item[index]}: ${valueFormatter(value)} (${percentage.toFixed(1)}%)`}
              />
            );
          })}
        </svg>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          {data.map((item, i) => {
            const value = item[category] || 0;
            const percentage = total > 0 ? (value / total) * 100 : 0;

            return (
              <div key={i} className="flex items-center">
                <div
                  className="w-3 h-3 mr-1 rounded-sm"
                  style={{
                    backgroundColor: getColorValue(colors[i % colors.length]),
                  }}
                />
                <span>
                  {item[index]} ({percentage.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DonutChart({
  data,
  index,
  categories,
  colors = ["primary", "blue", "green", "yellow", "purple"],
  valueFormatter = (value) => `${value}`,
  className,
}: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full text-muted-foreground">
        No data available
      </div>
    );
  }

  const category = categories[0]; // Usually donut charts have only one category
  const total = data.reduce((sum, item) => sum + (item[category] || 0), 0);

  let currentAngle = 0;

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          {data.map((item, i) => {
            const value = item[category] || 0;
            const percentage = total > 0 ? (value / total) * 100 : 0;
            const angle = (percentage / 100) * 360;

            // Calculate the SVG arc path
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;

            const startRadians = (startAngle - 90) * (Math.PI / 180);
            const endRadians = (endAngle - 90) * (Math.PI / 180);

            const startX = 50 + 30 * Math.cos(startRadians);
            const startY = 50 + 30 * Math.sin(startRadians);
            const endX = 50 + 30 * Math.cos(endRadians);
            const endY = 50 + 30 * Math.sin(endRadians);

            const largeArcFlag = angle > 180 ? 1 : 0;

            // For donut, we use two arcs to create the hole
            const outerArc = `M ${startX} ${startY} A 30 30 0 ${largeArcFlag} 1 ${endX} ${endY}`;

            const innerStartX = 50 + 20 * Math.cos(startRadians);
            const innerStartY = 50 + 20 * Math.sin(startRadians);
            const innerEndX = 50 + 20 * Math.cos(endRadians);
            const innerEndY = 50 + 20 * Math.sin(endRadians);

            const innerArc = `L ${innerEndX} ${innerEndY} A 20 20 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY} Z`;

            const pathData = `${outerArc} ${innerArc}`;

            return (
              <path
                key={i}
                d={pathData}
                fill={getColorValue(colors[i % colors.length])}
                stroke="#fff"
                strokeWidth="1"
                title={`${item[index]}: ${valueFormatter(value)} (${percentage.toFixed(1)}%)`}
              />
            );
          })}

          {/* Donut hole */}
          <circle cx="50" cy="50" r="20" fill="white" />

          {/* Total in the center */}
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-medium"
          >
            {valueFormatter(total)}
          </text>
        </svg>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          {data.map((item, i) => {
            const value = item[category] || 0;
            const percentage = total > 0 ? (value / total) * 100 : 0;

            return (
              <div key={i} className="flex items-center">
                <div
                  className="w-3 h-3 mr-1 rounded-sm"
                  style={{
                    backgroundColor: getColorValue(colors[i % colors.length]),
                  }}
                />
                <span>
                  {item[index]} ({percentage.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function GroupedBarChart({
  data,
  index,
  categories,
  colors = ["pink", "blue"],
  valueFormatter = (value: number, category?: string) => `${value}`,
  className,
  title,
  yAxisLabel = "Count",
  onBarClick,
}: ChartProps & {
  title?: string;
  yAxisLabel?: string;
  valueFormatter?: (value: number, category?: string) => string;
  onBarClick?: (item: any) => void;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full text-muted-foreground">
        No data available
      </div>
    );
  }

  // Find the maximum value across all categories for scaling
  const maxValue = Math.max(
    ...data.flatMap((item) => categories.map((category) => item[category] || 0))
  );

  // Generate Y-axis ticks
  const yTicks = [];
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    yTicks.push((maxValue / tickCount) * i);
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* Chart Title */}
      {title && (
        <div className="text-center font-semibold text-lg mb-4">{title}</div>
      )}

      <div className="flex h-full">
        {/* Y-axis */}
        <div className="flex flex-col justify-between pr-2 text-xs text-muted-foreground min-w-[40px]">
          {yTicks.reverse().map((tick, i) => (
            <div key={i} className="flex items-center">
              <span>{Math.round(tick)}</span>
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="flex-1 relative">
          {/* Y-axis grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {yTicks.map((tick, i) => (
              <div key={i} className="border-b border-gray-200 w-full" />
            ))}
          </div>

          {/* Bars */}
          <div className="absolute inset-0 flex items-end pt-4 pb-8">
            {data.map((item, i) => (
              <div
                key={i}
                className="flex-1 flex justify-center space-x-1 px-1"
              >
                {categories.map((category, catIndex) => {
                  const value = item[category] || 0;
                  const heightPercent =
                    maxValue > 0 ? (value / maxValue) * 100 : 0;

                  return (
                    <div
                      key={catIndex}
                      className="flex flex-col items-center"
                      style={{ width: `${100 / categories.length}%` }}
                    >
                      <div
                        className={`w-full rounded-t transition-all duration-200 hover:opacity-80 ${
                          onBarClick ? "cursor-pointer" : ""
                        }`}
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: getColorValue(
                            colors[catIndex % colors.length]
                          ),
                          minHeight: "4px",
                        }}
                        title={`${category}: ${valueFormatter(value, category)}`}
                        onClick={() => onBarClick && onBarClick(item)}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-xs text-muted-foreground">
            {data.map((item, i) => (
              <div key={i} className="text-center truncate flex-1">
                {typeof item[index] === "string" ? item[index] : ""}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center mt-4 space-x-4">
        {categories.map((category, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-sm"
              style={{
                backgroundColor: getColorValue(colors[i % colors.length]),
              }}
            />
            <span className="text-sm font-medium capitalize">{category}</span>
          </div>
        ))}
      </div>

      {/* Y-axis label */}
      <div className="absolute left-0 top-1/2 transform -translate-x-8 -translate-y-1/2 rotate-270 text-sm font-medium text-muted-foreground">
        {yAxisLabel}
      </div>
    </div>
  );
}

// Helper function to get actual color value from theme variable or CSS color
function getColorValue(color: string): string {
  const colorMap: Record<string, string> = {
    primary: "#2563eb", // Blue
    blue: "#3b82f6",
    green: "#10b981",
    red: "#ef4444",
    yellow: "#f59e0b",
    purple: "#8b5cf6",
    gray: "#6b7280",
    pink: "#ec4899",
    cyan: "#06b6d4",
    indigo: "#6366f1",
    violet: "#8b5cf6",
  };

  return colorMap[color] || color;
}

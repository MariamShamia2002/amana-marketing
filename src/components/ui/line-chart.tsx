"use client";

import React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface LineChartDataPoint {
  name: string;
  [key: string]: string | number;
}

interface LineChartProps {
  title: string;
  data: LineChartDataPoint[];
  className?: string;
  height?: number;
  lines: Array<{
    dataKey: string;
    stroke: string;
    name: string;
    strokeWidth?: number;
  }>;
  formatValue?: (value: number) => string;
  formatTooltipValue?: (value: number, name: string) => [string, string];
}

export function LineChart({
  title,
  data,
  className = "",
  height = 400,
  lines,
  formatValue = (value) => value.toLocaleString(),
  formatTooltipValue = (value, name) => [formatValue(value), name],
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}
      >
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {formatTooltipValue(entry.value, entry.name)[1]}:{" "}
              {formatTooltipValue(entry.value, entry.name)[0]}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}
    >
      <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>

      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={{ stroke: "#6B7280" }}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={{ stroke: "#6B7280" }}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "#9CA3AF" }} iconType="line" />
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.stroke}
                strokeWidth={line.strokeWidth || 2}
                name={line.name}
                dot={{ fill: line.stroke, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: line.stroke, strokeWidth: 2 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

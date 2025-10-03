"use client";

import { useState, useEffect } from "react";
import { Navbar } from "../../src/components/ui/navbar";
import { Footer } from "../../src/components/ui/footer";
import { LineChart } from "../../src/components/ui/line-chart";
import { fetchMarketingDataClient } from "../../src/lib/api";
import { MarketingData, WeeklyPerformance } from "../../src/types/marketing";

export default function WeeklyView() {
  const [marketingData, setMarketingData] = useState<MarketingData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchMarketingDataClient();
        setMarketingData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Transform weekly performance data for charts
  const transformWeeklyData = (weeklyData: WeeklyPerformance[]) => {
    return weeklyData.map((week) => ({
      name: new Date(week.week_start).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      revenue: week.revenue,
      spend: week.spend,
      impressions: week.impressions,
      clicks: week.clicks,
      conversions: week.conversions,
    }));
  };

  // Get aggregated weekly data across all campaigns
  const getAggregatedWeeklyData = () => {
    if (!marketingData?.campaigns) return [];

    const weeklyMap = new Map<string, WeeklyPerformance>();

    marketingData.campaigns.forEach((campaign) => {
      campaign.weekly_performance.forEach((week) => {
        const key = week.week_start;
        if (weeklyMap.has(key)) {
          const existing = weeklyMap.get(key)!;
          weeklyMap.set(key, {
            ...existing,
            impressions: existing.impressions + week.impressions,
            clicks: existing.clicks + week.clicks,
            conversions: existing.conversions + week.conversions,
            spend: existing.spend + week.spend,
            revenue: existing.revenue + week.revenue,
          });
        } else {
          weeklyMap.set(key, { ...week });
        }
      });
    });

    return Array.from(weeklyMap.values()).sort(
      (a, b) =>
        new Date(a.week_start).getTime() - new Date(b.week_start).getTime()
    );
  };

  const aggregatedWeeklyData = getAggregatedWeeklyData();
  const chartData = transformWeeklyData(aggregatedWeeklyData);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-400 text-xl">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Navbar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-12">
          <div className="px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-5xl font-bold">
                Weekly Performance
              </h1>
              <p className="mt-4 text-lg text-gray-300">
                Track revenue and spend trends across all campaigns
              </p>
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Revenue and Spend Chart */}
            <LineChart
              title="Revenue vs Spend by Week"
              data={chartData}
              height={400}
              lines={[
                {
                  dataKey: "revenue",
                  stroke: "#10B981",
                  name: "Revenue",
                  strokeWidth: 3,
                },
                {
                  dataKey: "spend",
                  stroke: "#EF4444",
                  name: "Spend",
                  strokeWidth: 3,
                },
              ]}
              formatValue={(value) => `$${value.toLocaleString()}`}
              formatTooltipValue={(value, name) => [
                `$${value.toLocaleString()}`,
                name,
              ]}
            />

            {/* Additional Metrics Chart */}
            <LineChart
              title="Impressions and Clicks by Week"
              data={chartData}
              height={400}
              lines={[
                {
                  dataKey: "impressions",
                  stroke: "#3B82F6",
                  name: "Impressions",
                  strokeWidth: 2,
                },
                {
                  dataKey: "clicks",
                  stroke: "#F59E0B",
                  name: "Clicks",
                  strokeWidth: 2,
                },
              ]}
              formatValue={(value) => value.toLocaleString()}
            />

            {/* Conversions Chart */}
            <LineChart
              title="Conversions by Week"
              data={chartData}
              height={400}
              lines={[
                {
                  dataKey: "conversions",
                  stroke: "#8B5CF6",
                  name: "Conversions",
                  strokeWidth: 3,
                },
              ]}
              formatValue={(value) => value.toLocaleString()}
            />
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Navbar } from "../../src/components/ui/navbar";
import { Footer } from "../../src/components/ui/footer";
import dynamic from "next/dynamic";
import { transformRegionalDataForBubbleMap } from "../../src/components/ui/bubble-map";
import { fetchMarketingDataClient } from "../../src/lib/api";
import { MarketingData, RegionalPerformance } from "../../src/types/marketing";

const BubbleMap = dynamic(
  () =>
    import("../../src/components/ui/bubble-map").then((mod) => mod.BubbleMap),
  { ssr: false }
);

export default function RegionView() {
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

  const getAggregatedRegionalData = () => {
    if (!marketingData?.campaigns) return [];

    const regionalMap = new Map<string, RegionalPerformance>();

    marketingData.campaigns.forEach((campaign) => {
      campaign.regional_performance.forEach((region) => {
        const key = `${region.region}-${region.country}`;
        if (regionalMap.has(key)) {
          const existing = regionalMap.get(key)!;
          regionalMap.set(key, {
            ...existing,
            impressions: existing.impressions + region.impressions,
            clicks: existing.clicks + region.clicks,
            conversions: existing.conversions + region.conversions,
            spend: existing.spend + region.spend,
            revenue: existing.revenue + region.revenue,
            ctr: region.ctr,
            conversion_rate: region.conversion_rate,
            cpc: region.cpc,
            cpa: region.cpa,
            roas: region.roas,
          });
        } else {
          regionalMap.set(key, { ...region });
        }
      });
    });

    return Array.from(regionalMap.values());
  };

  const aggregatedRegionalData = getAggregatedRegionalData();

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
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-12">
          <div className="px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-5xl font-bold">
                Regional Performance
              </h1>
              <p className="mt-4 text-lg text-gray-300">
                Track revenue and spend across different regions
              </p>
            </div>
          </div>
        </section>

        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <BubbleMap
              title="Revenue by Region"
              data={transformRegionalDataForBubbleMap(
                aggregatedRegionalData,
                "revenue"
              )}
              height={500}
              minRadius={10}
              maxRadius={60}
              formatValue={(value) => `$${value.toLocaleString()}`}
              formatTooltipValue={(value, region) =>
                `${region}: $${value.toLocaleString()}`
              }
            />
            <BubbleMap
              title="Spend by Region"
              data={transformRegionalDataForBubbleMap(
                aggregatedRegionalData,
                "spend"
              )}
              height={500}
              minRadius={10}
              maxRadius={60}
              formatValue={(value) => `$${value.toLocaleString()}`}
              formatTooltipValue={(value, region) =>
                `${region}: $${value.toLocaleString()}`
              }
            />
            <BubbleMap
              title="Impressions by Region"
              data={transformRegionalDataForBubbleMap(
                aggregatedRegionalData,
                "impressions"
              )}
              height={500}
              minRadius={8}
              maxRadius={50}
              formatValue={(value) => value.toLocaleString()}
              formatTooltipValue={(value, region) =>
                `${region}: ${value.toLocaleString()}`
              }
            />
            <BubbleMap
              title="Conversions by Region"
              data={transformRegionalDataForBubbleMap(
                aggregatedRegionalData,
                "conversions"
              )}
              height={500}
              minRadius={8}
              maxRadius={50}
              formatValue={(value) => value.toLocaleString()}
              formatTooltipValue={(value, region) =>
                `${region}: ${value.toLocaleString()}`
              }
            />
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

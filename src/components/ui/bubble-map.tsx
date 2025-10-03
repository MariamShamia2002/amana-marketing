"use client";

import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

interface BubbleMapDataPoint {
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  value: number;
  color?: string;
  additionalData?: Record<string, any>;
}

interface BubbleMapProps {
  title: string;
  data: BubbleMapDataPoint[];
  className?: string;
  height?: number;
  minRadius?: number;
  maxRadius?: number;
  formatValue?: (value: number) => string;
  formatTooltipValue?: (value: number, region: string) => string;
}

// City coordinates mapping
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Abu Dhabi": { lat: 24.4539, lng: 54.3773 },
  Dubai: { lat: 25.2048, lng: 55.2708 },
  Sharjah: { lat: 25.3573, lng: 55.4033 },
  Riyadh: { lat: 24.7136, lng: 46.6753 },
  Doha: { lat: 25.2854, lng: 51.531 },
  "Kuwait City": { lat: 29.3759, lng: 47.9774 },
  Manama: { lat: 26.0667, lng: 50.5577 },
};

export function BubbleMap({
  title,
  data,
  className = "",
  height = 500,
  minRadius = 8,
  maxRadius = 50,
  formatValue = (value) => value.toLocaleString(),
  formatTooltipValue = (value, region) => `${region}: ${formatValue(value)}`,
}: BubbleMapProps) {
  useEffect(() => {
    // Ensure Leaflet CSS is loaded
    if (typeof window !== "undefined") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.7.1/dist/leaflet.css";
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, []);

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

  // Calculate radius based on value
  const getRadius = (value: number, minValue: number, maxValue: number) => {
    if (maxValue === minValue) return (minRadius + maxRadius) / 2;
    const ratio = (value - minValue) / (maxValue - minValue);
    return minRadius + (maxRadius - minRadius) * ratio;
  };

  // Get color based on value
  const getColor = (value: number, minValue: number, maxValue: number) => {
    if (maxValue === minValue) return "#3B82F6";
    const ratio = (value - minValue) / (maxValue - minValue);

    // Color gradient from blue to red
    if (ratio < 0.5) {
      const intensity = ratio * 2;
      return `rgb(${Math.floor(59 + intensity * 196)}, ${Math.floor(
        130 + intensity * 125
      )}, ${Math.floor(246 - intensity * 246)})`;
    } else {
      const intensity = (ratio - 0.5) * 2;
      return `rgb(${Math.floor(255 - intensity * 255)}, ${Math.floor(
        255 - intensity * 255
      )}, ${Math.floor(246 - intensity * 246)})`;
    }
  };

  const minValue = Math.min(...data.map((item) => item.value));
  const maxValue = Math.max(...data.map((item) => item.value));

  // Calculate center of all points for map view
  const centerLat =
    data.reduce((sum, item) => sum + item.latitude, 0) / data.length;
  const centerLng =
    data.reduce((sum, item) => sum + item.longitude, 0) / data.length;

  return (
    <div
      className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}
    >
      <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>

      <div
        style={{ height: `${height}px` }}
        className="rounded-lg overflow-hidden"
      >
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {data.map((item, index) => {
            const radius = getRadius(item.value, minValue, maxValue);
            const color = getColor(item.value, minValue, maxValue);

            return (
              <CircleMarker
                key={`${item.region}-${index}`}
                center={[item.latitude, item.longitude]}
                radius={radius}
                pathOptions={{
                  fillColor: color,
                  color: "#ffffff",
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.6,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div className="text-sm font-medium text-gray-800">
                    {formatTooltipValue(item.value, item.region)}
                  </div>
                </Tooltip>

                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold text-gray-800 mb-2">
                      {item.region}, {item.country}
                    </div>
                    <div className="space-y-1">
                      <div className="text-gray-600">
                        Value:{" "}
                        <span className="font-medium">
                          {formatValue(item.value)}
                        </span>
                      </div>
                      {item.additionalData &&
                        Object.entries(item.additionalData).map(
                          ([key, value]) => (
                            <div key={key} className="text-gray-600">
                              {key}:{" "}
                              <span className="font-medium">
                                {typeof value === "number"
                                  ? formatValue(value)
                                  : value}
                              </span>
                            </div>
                          )
                        )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>High</span>
          </div>
        </div>
        <div className="text-xs">
          Min: {formatValue(minValue)} | Max: {formatValue(maxValue)}
        </div>
      </div>
    </div>
  );
}

// Helper function to transform regional performance data for the bubble map
export function transformRegionalDataForBubbleMap(
  regionalData: Array<{
    region: string;
    country: string;
    revenue: number;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }>,
  valueType: "revenue" | "spend" | "impressions" | "clicks" | "conversions"
): BubbleMapDataPoint[] {
  return regionalData
    .map((item) => {
      const coordinates = CITY_COORDINATES[item.region];
      if (!coordinates) {
        console.warn(`Coordinates not found for region: ${item.region}`);
        return null;
      }

      return {
        region: item.region,
        country: item.country,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        value: item[valueType],
        additionalData: {
          revenue: item.revenue,
          spend: item.spend,
          impressions: item.impressions,
          clicks: item.clicks,
          conversions: item.conversions,
        },
      };
    })
    .filter(Boolean) as BubbleMapDataPoint[];
}

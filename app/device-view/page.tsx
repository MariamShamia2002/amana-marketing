"use client";
import { useState, useEffect } from 'react';
import { Navbar } from '../../src/components/ui/navbar';
import { CardMetric } from '../../src/components/ui/card-metric';
import { BarChart } from '../../src/components/ui/bar-chart';
import { Table } from '../../src/components/ui/table';
import { Footer } from '../../src/components/ui/footer';
import { Smartphone, Laptop, Tablet, MousePointer, DollarSign, TrendingUp } from 'lucide-react';
import { MarketingData } from '../../src/types/marketing';

// Assumption: Your MarketingData type includes a device breakdown.
// If not, you might need to add this to your `src/types/marketing.ts`
interface DeviceBreakdown {
  device_type: 'Mobile' | 'Desktop' | 'Tablet';
  percentage_of_audience: number;
}

// Add `device_breakdown` to the Campaign type
type CampaignBase = MarketingData['campaigns'][0];

interface CampaignWithDevice extends CampaignBase {
  device_breakdown: DeviceBreakdown[];
}

interface MarketingDataWithDevice extends Omit<MarketingData, 'campaigns'> {
  campaigns: CampaignWithDevice[];
}


interface DeviceMetrics {
  mobileClicks: number;
  mobileSpend: number;
  mobileRevenue: number;
  desktopClicks: number;
  desktopSpend: number;
  desktopRevenue: number;
  tabletClicks: number;
  tabletSpend: number;
  tabletRevenue: number;
}

interface DeviceChartData {
  deviceType: string;
  spend: number;
  revenue: number;
}

interface CampaignPerformanceByDevice {
  campaignName: string;
  deviceType: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
}

export default function DeviceView() {
  const [data, setData] = useState<MarketingDataWithDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/marketing-data');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        // NOTE: Mocking device_breakdown if not present in actual API response
        // In a real scenario, this data should come from your API.
        result.campaigns.forEach((campaign: any) => {
          if (!campaign.device_breakdown) {
            campaign.device_breakdown = [
              { device_type: 'Mobile', percentage_of_audience: Math.random() * 50 + 25 }, // 25-75%
              { device_type: 'Desktop', percentage_of_audience: Math.random() * 30 + 10 }, // 10-40%
              { device_type: 'Tablet', percentage_of_audience: Math.random() * 10 + 2 }, // 2-12%
            ];
            // Normalize percentages to sum to 100
            const total = campaign.device_breakdown.reduce((acc: number, curr: any) => acc + curr.percentage_of_audience, 0);
            campaign.device_breakdown.forEach((db: any) => db.percentage_of_audience = (db.percentage_of_audience / total) * 100);
          }
        });
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process device metrics for cards
  const processDeviceMetrics = (): DeviceMetrics => {
    const initialMetrics: DeviceMetrics = {
      mobileClicks: 0, mobileSpend: 0, mobileRevenue: 0,
      desktopClicks: 0, desktopSpend: 0, desktopRevenue: 0,
      tabletClicks: 0, tabletSpend: 0, tabletRevenue: 0,
    };
    if (!data?.campaigns) return initialMetrics;

    return data.campaigns.reduce((metrics, campaign) => {
      campaign.device_breakdown.forEach(device => {
        const percentage = device.percentage_of_audience / 100;
        const clicks = Math.round(campaign.clicks * percentage);
        const spend = campaign.spend * percentage;
        const revenue = campaign.revenue * percentage;

        switch (device.device_type) {
          case 'Mobile':
            metrics.mobileClicks += clicks;
            metrics.mobileSpend += spend;
            metrics.mobileRevenue += revenue;
            break;
          case 'Desktop':
            metrics.desktopClicks += clicks;
            metrics.desktopSpend += spend;
            metrics.desktopRevenue += revenue;
            break;
          case 'Tablet':
            metrics.tabletClicks += clicks;
            metrics.tabletSpend += spend;
            metrics.tabletRevenue += revenue;
            break;
        }
      });
      return metrics;
    }, initialMetrics);
  };

  // Process device data for charts
  const processDeviceChartData = (): { spend: {label: string, value: number}[], revenue: {label: string, value: number}[] } => {
    if (!data?.campaigns) return { spend: [], revenue: [] };
    
    const deviceMap = new Map<string, { spend: number, revenue: number }>();
    
    data.campaigns.forEach(campaign => {
      campaign.device_breakdown.forEach(device => {
        const percentage = device.percentage_of_audience / 100;
        const spend = campaign.spend * percentage;
        const revenue = campaign.revenue * percentage;
        
        const existing = deviceMap.get(device.device_type) || { spend: 0, revenue: 0 };
        deviceMap.set(device.device_type, {
          spend: existing.spend + spend,
          revenue: existing.revenue + revenue,
        });
      });
    });

    const spendData = Array.from(deviceMap.entries()).map(([deviceType, data]) => ({ label: deviceType, value: data.spend }));
    const revenueData = Array.from(deviceMap.entries()).map(([deviceType, data]) => ({ label: deviceType, value: data.revenue }));
    
    return { spend: spendData, revenue: revenueData };
  };

  // Process campaign performance by device for tables
  const processCampaignPerformanceByDevice = (): { mobile: CampaignPerformanceByDevice[], desktop: CampaignPerformanceByDevice[], tablet: CampaignPerformanceByDevice[] } => {
    if (!data?.campaigns) return { mobile: [], desktop: [], tablet: [] };

    const mobile: CampaignPerformanceByDevice[] = [];
    const desktop: CampaignPerformanceByDevice[] = [];
    const tablet: CampaignPerformanceByDevice[] = [];

    data.campaigns.forEach(campaign => {
      campaign.device_breakdown.forEach(device => {
        const percentage = device.percentage_of_audience / 100;
        const impressions = Math.round(campaign.impressions * percentage);
        const clicks = Math.round(campaign.clicks * percentage);
        const conversions = Math.round(campaign.conversions * percentage);
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

        const performance: CampaignPerformanceByDevice = {
          campaignName: campaign.name,
          deviceType: device.device_type,
          impressions,
          clicks,
          conversions,
          ctr: parseFloat(ctr.toFixed(2)),
          conversionRate: parseFloat(conversionRate.toFixed(2)),
        };

        switch (device.device_type) {
          case 'Mobile':
            mobile.push(performance);
            break;
          case 'Desktop':
            desktop.push(performance);
            break;
          case 'Tablet':
            tablet.push(performance);
            break;
        }
      });
    });

    return { mobile, desktop, tablet };
  };

  const deviceMetrics = processDeviceMetrics();
  const deviceChartData = processDeviceChartData();
  const campaignPerformance = processCampaignPerformanceByDevice();

  const tableColumns = [
    { key: 'campaignName', header: 'Campaign Name', sortable: true, sortType: 'string' as const },
    { key: 'impressions', header: 'Impressions', sortable: true, sortType: 'number' as const, align: 'right' as const },
    { key: 'clicks', header: 'Clicks', sortable: true, sortType: 'number' as const, align: 'right' as const },
    { key: 'conversions', header: 'Conversions', sortable: true, sortType: 'number' as const, align: 'right' as const },
    { key: 'ctr', header: 'CTR (%)', sortable: true, sortType: 'number' as const, align: 'right' as const, render: (value: number) => `${value}%` },
    { key: 'conversionRate', header: 'Conversion Rate (%)', sortable: true, sortType: 'number' as const, align: 'right' as const, render: (value: number) => `${value}%` }
  ];

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Loading device data...</div>
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
                Device View
              </h1>
              <p className="mt-4 text-lg text-gray-300">
                Performance metrics by device type
              </p>
            </div>
          </div>
        </section>

        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Device Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Mobile Metrics */}
              <CardMetric title="Mobile Clicks" value={deviceMetrics.mobileClicks.toLocaleString()} icon={<MousePointer className="h-5 w-5" />} />
              <CardMetric title="Mobile Spend" value={`$${deviceMetrics.mobileSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<DollarSign className="h-5 w-5" />} />
              <CardMetric title="Mobile Revenue" value={`$${deviceMetrics.mobileRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<TrendingUp className="h-5 w-5" />} />
              
              {/* Desktop Metrics */}
              <CardMetric title="Desktop Clicks" value={deviceMetrics.desktopClicks.toLocaleString()} icon={<MousePointer className="h-5 w-5" />} />
              <CardMetric title="Desktop Spend" value={`$${deviceMetrics.desktopSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<DollarSign className="h-5 w-5" />} />
              <CardMetric title="Desktop Revenue" value={`$${deviceMetrics.desktopRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<TrendingUp className="h-5 w-5" />} />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Performance by Device Type</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart title="Total Spend by Device" data={deviceChartData.spend} formatValue={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
              <BarChart title="Total Revenue by Device" data={deviceChartData.revenue} formatValue={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Campaign Performance by Device</h2>
            <div className="space-y-8">
              <Table title="Mobile Campaign Performance" columns={tableColumns} data={campaignPerformance.mobile} maxHeight="400px" />
              <Table title="Desktop Campaign Performance" columns={tableColumns} data={campaignPerformance.desktop} maxHeight="400px" />
              <Table title="Tablet Campaign Performance" columns={tableColumns} data={campaignPerformance.tablet} maxHeight="400px" />
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}
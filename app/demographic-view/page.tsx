"use client";
import { useState, useEffect } from 'react';
import { Navbar } from '../../src/components/ui/navbar';
import { CardMetric } from '../../src/components/ui/card-metric';
import { BarChart } from '../../src/components/ui/bar-chart';
import { Table } from '../../src/components/ui/table';
import { Footer } from '../../src/components/ui/footer';
import { Users, UserCheck, TrendingUp, Target, MousePointer, DollarSign, BarChart3 } from 'lucide-react';
import { MarketingData, DemographicBreakdown } from '../../src/types/marketing';

interface DemographicMetrics {
  maleClicks: number;
  maleSpend: number;
  maleRevenue: number;
  femaleClicks: number;
  femaleSpend: number;
  femaleRevenue: number;
}

interface AgeGroupData {
  ageGroup: string;
  spend: number;
  revenue: number;
}

interface CampaignPerformance {
  ageGroup: string;
  gender: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
}

export default function DemographicView() {
  const [data, setData] = useState<MarketingData | null>(null);
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
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process demographic metrics
  const processDemographicMetrics = (): DemographicMetrics => {
    if (!data?.campaigns) {
      return {
        maleClicks: 0, maleSpend: 0, maleRevenue: 0,
        femaleClicks: 0, femaleSpend: 0, femaleRevenue: 0
      };
    }

    const metrics = {
      maleClicks: 0, maleSpend: 0, maleRevenue: 0,
      femaleClicks: 0, femaleSpend: 0, femaleRevenue: 0
    };

    data.campaigns.forEach(campaign => {
      const totalSpend = campaign.spend;
      const totalRevenue = campaign.revenue;
      const totalClicks = campaign.clicks;

      campaign.demographic_breakdown.forEach(demo => {
        const percentage = demo.percentage_of_audience / 100;
        const clicks = Math.round(totalClicks * percentage);
        const spend = totalSpend * percentage;
        const revenue = totalRevenue * percentage;

        if (demo.gender === 'Male') {
          metrics.maleClicks += clicks;
          metrics.maleSpend += spend;
          metrics.maleRevenue += revenue;
        } else if (demo.gender === 'Female') {
          metrics.femaleClicks += clicks;
          metrics.femaleSpend += spend;
          metrics.femaleRevenue += revenue;
        }
      });
    });

    return metrics;
  };

  // Process age group data for charts
  const processAgeGroupData = (): { spend: AgeGroupData[], revenue: AgeGroupData[] } => {
    if (!data?.campaigns) {
      return { spend: [], revenue: [] };
    }

    const ageGroupMap = new Map<string, { spend: number, revenue: number }>();

    data.campaigns.forEach(campaign => {
      const totalSpend = campaign.spend;
      const totalRevenue = campaign.revenue;

      campaign.demographic_breakdown.forEach(demo => {
        const percentage = demo.percentage_of_audience / 100;
        const spend = totalSpend * percentage;
        const revenue = totalRevenue * percentage;

        const existing = ageGroupMap.get(demo.age_group) || { spend: 0, revenue: 0 };
        ageGroupMap.set(demo.age_group, {
          spend: existing.spend + spend,
          revenue: existing.revenue + revenue
        });
      });
    });

    const spendData: AgeGroupData[] = Array.from(ageGroupMap.entries())
      .map(([ageGroup, data]) => ({ ageGroup, spend: data.spend, revenue: 0 }))
      .sort((a, b) => a.ageGroup.localeCompare(b.ageGroup));

    const revenueData: AgeGroupData[] = Array.from(ageGroupMap.entries())
      .map(([ageGroup, data]) => ({ ageGroup, spend: 0, revenue: data.revenue }))
      .sort((a, b) => a.ageGroup.localeCompare(b.ageGroup));

    return { spend: spendData, revenue: revenueData };
  };

  // Process campaign performance data
  const processCampaignPerformance = (): { male: CampaignPerformance[], female: CampaignPerformance[] } => {
    if (!data?.campaigns) {
      return { male: [], female: [] };
    }

    const maleMap = new Map<string, CampaignPerformance>();
    const femaleMap = new Map<string, CampaignPerformance>();

    data.campaigns.forEach(campaign => {
      const totalImpressions = campaign.impressions;
      const totalClicks = campaign.clicks;
      const totalConversions = campaign.conversions;

      campaign.demographic_breakdown.forEach(demo => {
        const percentage = demo.percentage_of_audience / 100;
        const impressions = Math.round(totalImpressions * percentage);
        const clicks = Math.round(totalClicks * percentage);
        const conversions = Math.round(totalConversions * percentage);
        const ctr = clicks > 0 ? (clicks / impressions) * 100 : 0;
        const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

        const performance: CampaignPerformance = {
          ageGroup: demo.age_group,
          gender: demo.gender,
          impressions,
          clicks,
          conversions,
          ctr: parseFloat(ctr.toFixed(2)),
          conversionRate: parseFloat(conversionRate.toFixed(2))
        };

        if (demo.gender === 'Male') {
          const existing = maleMap.get(demo.age_group);
          if (existing) {
            existing.impressions += impressions;
            existing.clicks += clicks;
            existing.conversions += conversions;
            existing.ctr = existing.clicks > 0 ? parseFloat(((existing.clicks / existing.impressions) * 100).toFixed(2)) : 0;
            existing.conversionRate = existing.clicks > 0 ? parseFloat(((existing.conversions / existing.clicks) * 100).toFixed(2)) : 0;
          } else {
            maleMap.set(demo.age_group, performance);
          }
        } else if (demo.gender === 'Female') {
          const existing = femaleMap.get(demo.age_group);
          if (existing) {
            existing.impressions += impressions;
            existing.clicks += clicks;
            existing.conversions += conversions;
            existing.ctr = existing.clicks > 0 ? parseFloat(((existing.clicks / existing.impressions) * 100).toFixed(2)) : 0;
            existing.conversionRate = existing.clicks > 0 ? parseFloat(((existing.conversions / existing.clicks) * 100).toFixed(2)) : 0;
          } else {
            femaleMap.set(demo.age_group, performance);
          }
        }
      });
    });

    const maleData = Array.from(maleMap.values()).sort((a, b) => a.ageGroup.localeCompare(b.ageGroup));
    const femaleData = Array.from(femaleMap.values()).sort((a, b) => a.ageGroup.localeCompare(b.ageGroup));

    return { male: maleData, female: femaleData };
  };

  const demographicMetrics = processDemographicMetrics();
  const ageGroupData = processAgeGroupData();
  const campaignPerformance = processCampaignPerformance();

  const tableColumns = [
    { key: 'ageGroup', header: 'Age Group', sortable: true, sortType: 'string' as const },
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
          <div className="text-white text-xl">Loading demographic data...</div>
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
                Demographic View
              </h1>
              <p className="mt-4 text-lg text-gray-300">
                Performance metrics by gender and age demographics
              </p>
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {/* Card Metrics Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Gender Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-6">
              {/* Male Metrics */}
              <CardMetric
                title="Total Clicks by Males"
                value={demographicMetrics.maleClicks.toLocaleString()}
                icon={<MousePointer className="h-5 w-5" />}
              />
              <CardMetric
                title="Total Spend by Males"
                value={`$${demographicMetrics.maleSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                icon={<DollarSign className="h-5 w-5" />}
              />
              <CardMetric
                title="Total Revenue by Males"
                value={`$${demographicMetrics.maleRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                icon={<TrendingUp className="h-5 w-5" />}
              />
              
              {/* Female Metrics */}
              <CardMetric
                title="Total Clicks by Females"
                value={demographicMetrics.femaleClicks.toLocaleString()}
                icon={<MousePointer className="h-5 w-5" />}
              />
              <CardMetric
                title="Total Spend by Females"
                value={`$${demographicMetrics.femaleSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                icon={<DollarSign className="h-5 w-5" />}
              />
              <CardMetric
                title="Total Revenue by Females"
                value={`$${demographicMetrics.femaleRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                icon={<TrendingUp className="h-5 w-5" />}
              />
            </div>
          </div>

          {/* Charts Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Performance by Age Group</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart
                title="Total Spend by Age Group"
                data={ageGroupData.spend.map(item => ({
                  label: item.ageGroup,
                  value: item.spend
                }))}
                formatValue={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              />
              <BarChart
                title="Total Revenue by Age Group"
                data={ageGroupData.revenue.map(item => ({
                  label: item.ageGroup,
                  value: item.revenue
                }))}
                formatValue={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              />
            </div>
          </div>

          {/* Tables Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Campaign Performance by Demographics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Table
                title="Male Age Groups Performance"
                columns={tableColumns}
                data={campaignPerformance.male}
                maxHeight="500px"
              />
              <Table
                title="Female Age Groups Performance"
                columns={tableColumns}
                data={campaignPerformance.female}
                maxHeight="500px"
              />
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}

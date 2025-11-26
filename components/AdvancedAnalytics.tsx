"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, BarChart3, PieChart, Calendar, Download, Filter, Loader2, Sparkles, DollarSign } from "lucide-react";
import { getYieldForecast, getMarketPriceTrends, getRiskAssessment, getWeatherForecast } from "@/lib/analyticsAgent";
import { getCropPriceAnalytics } from "@/lib/database";
import toast from "react-hot-toast";

interface ForecastData {
  month: string;
  predicted: number;
  actual?: number;
}

export default function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState("6months");
  const [selectedMetric, setSelectedMetric] = useState("supply");
  const [aiInsights, setAiInsights] = useState<string>("");
  const [priceAnalytics, setPriceAnalytics] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState("maize");

  // Sample forecast data
  const forecastData: ForecastData[] = [
    { month: "Jan", predicted: 12000, actual: 11800 },
    { month: "Feb", predicted: 13500, actual: 13200 },
    { month: "Mar", predicted: 15000, actual: 14800 },
    { month: "Apr", predicted: 16500 },
    { month: "May", predicted: 18000 },
    { month: "Jun", predicted: 19500 },
  ];

  const qualityMetrics = [
    { category: "Grade A", percentage: 75, count: 450, color: "green" },
    { category: "Grade B", percentage: 20, count: 120, color: "yellow" },
    { category: "Grade C", percentage: 5, count: 30, color: "red" },
  ];

  const supplierPerformance = [
    { name: "Seed Co Ltd", onTime: 95, quality: 98, rating: 4.8 },
    { name: "Fertilizer Plus", onTime: 88, quality: 92, rating: 4.5 },
    { name: "Agro Tools", onTime: 92, quality: 95, rating: 4.7 },
  ];

  // Load real analytics data
  useEffect(() => {
    loadAnalytics();
  }, [selectedCrop]);

  const loadAnalytics = async () => {
    try {
      // Load crop price analytics from database
      const prices = await getCropPriceAnalytics(selectedCrop);
      setPriceAnalytics(prices);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const generateAIInsights = async () => {
    setLoadingAI(true);
    try {
      // Get AI-powered yield forecast
      const forecast = await getYieldForecast({
        crop: selectedCrop,
        region: "Zambia",
        season: "2024-2025"
      });

      // Get market price trends
      const priceTrends = await getMarketPriceTrends({
        crop: selectedCrop,
        timeframe: "next 3 months"
      });

      // Get risk assessment
      const risks = await getRiskAssessment({
        crop: selectedCrop,
        region: "Zambia",
        factors: ["weather", "market volatility", "pests", "supply chain"]
      });

      // Combine insights
      const combinedInsights = `
**Yield Forecast:**
${forecast.output_text}

**Market Price Trends:**
${priceTrends.output_text}

**Risk Assessment:**
${risks.output_text}
      `;

      setAiInsights(combinedInsights);
      toast.success('AI insights generated successfully!');
    } catch (error) {
      console.error('Error generating AI insights:', error);
      toast.error('Failed to generate AI insights');
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#1a1a1a]">Advanced Analytics</h2>
          <p className="text-gray-600">AI-powered insights and forecasting</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium"
          >
            <option value="maize">Maize</option>
            <option value="tomatoes">Tomatoes</option>
            <option value="mangoes">Mangoes</option>
            <option value="pineapples">Pineapples</option>
          </select>
          <button 
            onClick={generateAIInsights}
            disabled={loadingAI}
            className="btn-primary flex items-center gap-2"
          >
            {loadingAI ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate AI Insights
              </>
            )}
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* AI Insights Panel */}
      {aiInsights && (
        <div className="card-premium bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-bold text-[#1a1a1a]">AI-Powered Insights for {selectedCrop}</h3>
          </div>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm leading-relaxed">
              {aiInsights}
            </pre>
          </div>
        </div>
      )}

      {/* Real-Time Price Analytics */}
      {priceAnalytics.length > 0 && (
        <div className="card-premium">
          <h3 className="text-xl font-bold text-[#1a1a1a] mb-4 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-[#2d5f3f]" />
            Market Price Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {priceAnalytics.map((item) => (
              <div key={item.crop} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">{item.crop}</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">Avg: K{item.averagePrice.toFixed(2)}/kg</p>
                  <p className="text-gray-600">Min: K{item.minPrice.toFixed(2)}/kg</p>
                  <p className="text-gray-600">Max: K{item.maxPrice.toFixed(2)}/kg</p>
                  <p className="text-gray-500">{item.listingCount} listings</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supply Forecasting */}
      <div className="card-premium">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#2d5f3f]" />
            Supply Forecasting
          </h3>
          <div className="flex gap-2">
            <button className="badge badge-info">AI Powered</button>
            <button className="badge badge-success">95% Accuracy</button>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="space-y-4">
          {forecastData.map((data, index) => (
            <div key={data.month}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{data.month}</span>
                <div className="flex items-center gap-4">
                  {data.actual && (
                    <span className="text-sm text-gray-600">
                      Actual: {data.actual.toLocaleString()} kg
                    </span>
                  )}
                  <span className="text-sm font-semibold text-[#2d5f3f]">
                    Predicted: {data.predicted.toLocaleString()} kg
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {/* Actual bar */}
                {data.actual && (
                  <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 flex items-center justify-end pr-2"
                      style={{ width: `${(data.actual / 20000) * 100}%` }}
                    >
                      <span className="text-xs text-white font-semibold">Actual</span>
                    </div>
                  </div>
                )}
                {/* Predicted bar */}
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className={`bg-gradient-to-r from-[#7fb069] to-[#2d5f3f] h-8 flex items-center justify-end pr-2 ${
                      !data.actual ? 'opacity-60' : ''
                    }`}
                    style={{ width: `${(data.predicted / 20000) * 100}%` }}
                  >
                    <span className="text-xs text-white font-semibold">Forecast</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm font-semibold text-blue-900 mb-1">📊 Forecast Insight</p>
          <p className="text-sm text-blue-700">
            Supply expected to increase by 35% over next 3 months. Consider expanding storage capacity.
          </p>
        </div>
      </div>

      {/* Quality Control Dashboard */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-premium">
          <h3 className="text-xl font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#2d5f3f]" />
            Quality Distribution
          </h3>

          <div className="space-y-4">
            {qualityMetrics.map((metric) => (
              <div key={metric.category}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700">{metric.category}</span>
                  <span className="text-sm text-gray-600">
                    {metric.count} batches • {metric.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      metric.color === 'green'
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : metric.color === 'yellow'
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                    style={{ width: `${metric.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between p-4 bg-green-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-green-900">Overall Quality Score</p>
              <p className="text-3xl font-bold text-green-600">92%</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-600" />
          </div>
        </div>

        {/* Supplier Performance */}
        <div className="card-premium">
          <h3 className="text-xl font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
            <PieChart className="h-6 w-6 text-[#2d5f3f]" />
            Supplier Performance
          </h3>

          <div className="space-y-4">
            {supplierPerformance.map((supplier, index) => (
              <div key={supplier.name} className="p-4 border border-gray-100 rounded-xl hover:bg-[#f0f7f4] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-[#1a1a1a]">{supplier.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= supplier.rating ? '⭐' : '☆'}>
                          {star <= supplier.rating ? '⭐' : '☆'}
                        </span>
                      ))}
                      <span className="text-sm text-gray-600 ml-1">({supplier.rating})</span>
                    </div>
                  </div>
                  <div className={`badge ${
                    index === 0 ? 'badge-success' : index === 1 ? 'badge-warning' : 'badge-info'
                  }`}>
                    #{index + 1}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">On-Time Delivery</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${supplier.onTime}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold">{supplier.onTime}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Quality Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${supplier.quality}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold">{supplier.quality}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Automated Alerts */}
      <div className="card-premium">
        <h3 className="text-xl font-bold text-[#1a1a1a] mb-4">Automated Quality Alerts</h3>
        <div className="space-y-3">
          {[
            { type: 'warning', message: 'Quality drop detected in Batch #234 - requires inspection', time: '2 hours ago' },
            { type: 'success', message: 'All quality checks passed for today\'s deliveries', time: '5 hours ago' },
            { type: 'info', message: 'New quality standard implemented - 95% compliance rate', time: '1 day ago' },
          ].map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border-l-4 ${
                alert.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-500'
                  : alert.type === 'success'
                  ? 'bg-green-50 border-green-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <p className="font-medium text-gray-900">{alert.message}</p>
              <p className="text-sm text-gray-600 mt-1">{alert.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

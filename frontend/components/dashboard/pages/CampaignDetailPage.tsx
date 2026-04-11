"use client";

import { useState } from "react";
import {
  ArrowLeft, Download, TrendingUp, Video, DollarSign,
  BarChart3, Edit3, Check, X,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface VideoData {
  id: string;
  platform: "YouTube" | "Instagram" | "TikTok";
  url: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  published: string;
  price: number | null;
}

const mockCampaignData: Record<string, { id: string; name: string; status: string; created: string; videos: VideoData[] }> = {
  "1": {
    id: "1",
    name: "Q1 Influencer Round-up",
    status: "Active",
    created: "2025-01-15",
    videos: [
      {
        id: "1",
        platform: "YouTube",
        url: "https://www.youtube.com/watch?v=7gt",
        title: "Wait... Smart Glasses are Suddenly Good?",
        views: 7855917,
        likes: 188254,
        comments: 8600,
        published: "2025-09-20",
        price: 5000,
      },
      {
        id: "2",
        platform: "YouTube",
        url: "https://www.youtube.com/watch?v=MiG",
        title: "Learn Chess and Become a Better Developer",
        views: 21734,
        likes: 571,
        comments: 32,
        published: "2025-09-20",
        price: 1200,
      },
      {
        id: "3",
        platform: "Instagram",
        url: "https://www.instagram.com/p/abc123",
        title: "Nike Spring Campaign – Just Do It",
        views: 4200000,
        likes: 180000,
        comments: 3200,
        published: "2025-03-01",
        price: 8000,
      },
      {
        id: "4",
        platform: "TikTok",
        url: "https://www.tiktok.com/@user/video/123",
        title: "Viral Dance Challenge",
        views: 5800000,
        likes: 920000,
        comments: 45000,
        published: "2025-02-15",
        price: 3500,
      },
      {
        id: "5",
        platform: "YouTube",
        url: "https://www.youtube.com/watch?v=xyz",
        title: "Tech Review: Latest Smartphone",
        views: 1100000,
        likes: 42000,
        comments: 890,
        published: "2025-02-28",
        price: null,
      },
    ],
  },
};

const trendData = [
  { date: "Jan 15", views: 450000, engagement: 18000, spend: 2000 },
  { date: "Jan 22", views: 780000, engagement: 32000, spend: 3500 },
  { date: "Jan 29", views: 1200000, engagement: 52000, spend: 6000 },
  { date: "Feb 5", views: 2100000, engagement: 95000, spend: 9500 },
  { date: "Feb 12", views: 3500000, engagement: 156000, spend: 12000 },
  { date: "Feb 19", views: 5200000, engagement: 235000, spend: 15500 },
  { date: "Feb 26", views: 8100000, engagement: 380000, spend: 18700 },
];

const platformGradients: Record<string, string> = {
  YouTube: "from-red-500 to-pink-500",
  Instagram: "from-pink-500 to-purple-500",
  TikTok: "from-gray-800 to-gray-900",
};

function formatNumber(num: number) {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function calculateCPM(views: number, price: number | null) {
  if (!price || views === 0) return "-";
  return `$${((price / views) * 1000).toFixed(2)}`;
}

export function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params?.campaignId as string | undefined;

  const campaign = campaignId ? mockCampaignData[campaignId] : null;
  const [videos, setVideos] = useState<VideoData[]>(campaign?.videos ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">Campaign Not Found</div>
          <Button onClick={() => router.push("/campaigns")}>Back to Campaigns</Button>
        </div>
      </div>
    );
  }

  const totalViews = videos.reduce((s, v) => s + v.views, 0);
  const totalLikes = videos.reduce((s, v) => s + v.likes, 0);
  const totalComments = videos.reduce((s, v) => s + v.comments, 0);
  const totalEngagement = totalLikes + totalComments;
  const engagementRate = totalViews > 0 ? ((totalEngagement / totalViews) * 100).toFixed(2) : "0";
  const totalSpend = videos.reduce((s, v) => s + (v.price ?? 0), 0);
  const cpm = totalViews > 0 ? ((totalSpend / totalViews) * 1000).toFixed(2) : "0";
  const cpe = totalEngagement > 0 ? (totalSpend / totalEngagement).toFixed(2) : "0";
  const avgViewsPerVideo = videos.length > 0 ? Math.round(totalViews / videos.length) : 0;

  const platformStats = videos.reduce<Record<string, { videos: number; views: number; engagement: number; spend: number }>>(
    (acc, v) => {
      if (!acc[v.platform]) acc[v.platform] = { videos: 0, views: 0, engagement: 0, spend: 0 };
      acc[v.platform].videos++;
      acc[v.platform].views += v.views;
      acc[v.platform].engagement += v.likes + v.comments;
      acc[v.platform].spend += v.price ?? 0;
      return acc;
    },
    {}
  );

  const platformBreakdown = Object.entries(platformStats).map(([platform, s]) => ({
    platform,
    ...s,
    engagementRate: s.views > 0 ? ((s.engagement / s.views) * 100).toFixed(1) : "0",
    cpm: s.views > 0 ? ((s.spend / s.views) * 1000).toFixed(0) : "0",
  }));

  const handleEditClick = (video: VideoData) => {
    setEditingId(video.id);
    setEditPrice(video.price?.toString() ?? "");
  };

  const handleSavePrice = (videoId: string) => {
    const price = parseFloat(editPrice);
    if (!isNaN(price) && price >= 0) {
      setVideos(videos.map((v) => (v.id === videoId ? { ...v, price } : v)));
    }
    setEditingId(null);
    setEditPrice("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPrice("");
  };

  const kpis = [
    { label: "Total Videos", value: videos.length.toString(), gradient: "from-blue-500 to-cyan-500", icon: Video },
    { label: "Total Views", value: formatNumber(totalViews), gradient: "from-purple-500 to-pink-500", icon: TrendingUp },
    { label: "Total Engagement", value: formatNumber(totalEngagement), gradient: "from-emerald-500 to-teal-500", icon: BarChart3 },
    { label: "Engagement Rate", value: `${engagementRate}%`, gradient: "from-amber-500 to-orange-500", icon: TrendingUp },
    { label: "Total Spend", value: `$${formatNumber(totalSpend)}`, gradient: "from-indigo-500 to-purple-600", icon: DollarSign },
    { label: "CPM", value: `$${cpm}`, sub: "Spend / (Views / 1000)", gradient: "from-rose-500 to-pink-600", icon: DollarSign },
    { label: "Cost Per Engagement", value: `$${cpe}`, sub: "Spend / (Likes + Comments)", gradient: "from-cyan-500 to-blue-600", icon: DollarSign },
    { label: "Avg Views Per Video", value: formatNumber(avgViewsPerVideo), gradient: "from-violet-500 to-purple-600", icon: Video },
  ];

  return (
    <>
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center px-8 gap-3 flex-shrink-0 shadow-sm">
        <Button variant="ghost" size="sm" onClick={() => router.push("/campaigns")}>
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Button>
        <div className="ml-auto">
          <Button variant="secondary" size="sm">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#F7F8FC]">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Campaign Info */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#E6E8F0] overflow-hidden">
            <div
              className="relative px-8 py-7"
              style={{ background: "linear-gradient(135deg, #F8F6FF 0%, #F3F1FF 40%, #EEF2FF 100%)" }}
            >
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#E6E8F0]" />
              <div className="flex items-start gap-5">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #7C5CFF 0%, #6A3FFF 100%)", boxShadow: "0px 8px 20px rgba(106,63,255,0.12)" }}
                >
                  <Video className="w-12 h-12 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1 pt-2 min-w-0">
                  <h1 className="text-[22px] font-semibold text-[#1F2937] mb-2 truncate leading-tight">
                    {campaign.name}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                      {campaign.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6B7280]" />
                      <span className="text-[13px] text-[#6B7280]">
                        Created {new Date(campaign.created).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            {kpis.map(({ label, value, sub, gradient, icon: Icon }) => (
              <div key={label} className="bg-white rounded-[14px] border border-[#E6E8F0] p-5 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
              </div>
            ))}
          </div>

          {/* Performance Trend */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#E6E8F0] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="text-sm font-semibold text-gray-900">Performance Trend</div>
              <div className="text-xs text-gray-400 mt-0.5">Views and Engagement over time</div>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#8B5CF6" strokeWidth={2} name="Views" />
                  <Line type="monotone" dataKey="engagement" stroke="#10B981" strokeWidth={2} name="Engagement" />
                  <Line type="monotone" dataKey="spend" stroke="#F59E0B" strokeWidth={2} name="Spend ($)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#E6E8F0] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="text-sm font-semibold text-gray-900">Platform Breakdown</div>
              <div className="text-xs text-gray-400 mt-0.5">Performance by platform</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-50/50">
                  <tr>
                    {["Platform", "Videos", "Views", "Engagement", "Eng. Rate", "CPM"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {platformBreakdown.map((item) => (
                    <tr key={item.platform} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${platformGradients[item.platform]} flex items-center justify-center shadow-md`}>
                            <span className="w-2 h-2 rounded-full bg-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{item.platform}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.videos}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 tabular-nums">{formatNumber(item.views)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 tabular-nums">{formatNumber(item.engagement)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-indigo-600 tabular-nums">{item.engagementRate}%</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 tabular-nums">${item.cpm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Video Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#E6E8F0] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="text-sm font-semibold text-gray-900">Campaign Videos</div>
              <div className="text-xs text-gray-400 mt-0.5">Detailed video performance and pricing</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-50/50">
                  <tr>
                    {["Platform", "Title", "Views", "Likes", "Comments", "ER%", "Price", "CPM"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {videos.map((video) => {
                    const er = video.views > 0
                      ? (((video.likes + video.comments) / video.views) * 100).toFixed(2)
                      : "0";
                    const isEditing = editingId === video.id;
                    return (
                      <tr key={video.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${platformGradients[video.platform]} flex items-center justify-center shadow-md`}>
                              <span className="w-2 h-2 rounded-full bg-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{video.platform}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[300px]">
                          <div className="text-sm text-gray-600 truncate">{video.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 tabular-nums">{formatNumber(video.views)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 tabular-nums">{formatNumber(video.likes)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 tabular-nums">{formatNumber(video.comments)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600 tabular-nums">{er}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                <input
                                  type="number"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSavePrice(video.id);
                                    if (e.key === "Escape") handleCancelEdit();
                                  }}
                                  className="w-24 pl-6 pr-2 py-1 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  autoFocus
                                />
                              </div>
                              <button onClick={() => handleSavePrice(video.id)} className="p-1 rounded hover:bg-emerald-100 text-emerald-600">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={handleCancelEdit} className="p-1 rounded hover:bg-red-100 text-red-600">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/price">
                              <span
                                onDoubleClick={() => handleEditClick(video)}
                                className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors px-1 py-0.5 rounded hover:bg-indigo-50"
                              >
                                {video.price !== null ? `$${video.price.toLocaleString()}` : "-"}
                              </span>
                              <button
                                onClick={() => handleEditClick(video)}
                                className="p-1 rounded hover:bg-indigo-50 text-indigo-600 opacity-0 group-hover/price:opacity-100 transition-opacity"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 tabular-nums">
                          {calculateCPM(video.views, video.price)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { Save, RefreshCw, Download, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoData {
  id: string;
  platform: 'YouTube' | 'Instagram' | 'TikTok';
  channel: string;
  title: string;
  published: string;
  views: string;
  likes: string;
  comments: string;
}

const mockData: VideoData[] = [
  {
    id: '1',
    platform: 'YouTube',
    channel: '@mkbhd',
    title: 'Samsung Galaxy S25 Ultra Review — 3 Months Later',
    published: '2025-02-18',
    views: '4.2M',
    likes: '98K',
    comments: '6.1K',
  },
  {
    id: '2',
    platform: 'Instagram',
    channel: '@natgeo',
    title: 'Deep sea creature never seen before 🌊',
    published: '2025-02-24',
    views: '8.7M',
    likes: '412K',
    comments: '2.3K',
  },
  {
    id: '3',
    platform: 'TikTok',
    channel: '@duolingo',
    title: 'POV: You forgot to do your Spanish lesson',
    published: '2025-03-01',
    views: '22.1M',
    likes: '1.8M',
    comments: '34K',
  },
  {
    id: '4',
    platform: 'YouTube',
    channel: '@veritasium',
    title: 'Why Most People Are Wrong About Gravity',
    published: '2025-02-10',
    views: '11.3M',
    likes: '540K',
    comments: '18.9K',
  },
];

const platformColors = {
  YouTube: { dot: 'bg-red-500', pill: 'bg-red-50 border-red-200 text-red-600', gradient: 'from-red-500 to-pink-500' },
  Instagram: { dot: 'bg-pink-500', pill: 'bg-pink-50 border-pink-200 text-pink-600', gradient: 'from-pink-500 to-purple-500' },
  TikTok: { dot: 'bg-gray-900', pill: 'bg-gray-100 border-gray-300 text-gray-700', gradient: 'from-gray-800 to-gray-900' },
};

export function SingleFetchPage() {
  const [videos, setVideos] = useState<VideoData[]>(mockData);
  const [url, setUrl] = useState('');

  const handleFetch = () => {
    if (!url.trim()) return;
    
    const platforms: Array<'YouTube' | 'Instagram' | 'TikTok'> = ['YouTube', 'Instagram', 'TikTok'];
    const channels = {
      YouTube: ['@mkbhd', '@veritasium', '@linus', '@techlinked'],
      Instagram: ['@natgeo', '@nike', '@redbull'],
      TikTok: ['@duolingo', '@charlidamelio', '@khaby.lame'],
    };
    const titles = [
      'New product launch review',
      'Behind the scenes look',
      'Top 10 moments of 2025',
      'This changed everything',
      'Why I switched to...',
      'Weekend vlog series',
    ];

    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const channelList = channels[platform];
    const newVideo: VideoData = {
      id: Date.now().toString(),
      platform,
      channel: channelList[Math.floor(Math.random() * channelList.length)],
      title: titles[Math.floor(Math.random() * titles.length)],
      published: '2025-03-09',
      views: `${(Math.random() * 20 + 0.5).toFixed(1)}M`,
      likes: `${(Math.random() * 900 + 10).toFixed(0)}K`,
      comments: `${(Math.random() * 50 + 1).toFixed(1)}K`,
    };

    setVideos([newVideo, ...videos]);
    setUrl('');
  };

  const handleDelete = (id: string) => {
    setVideos(videos.filter(v => v.id !== id));
  };

  const totalViews = videos.reduce((acc, v) => {
    const views = parseFloat(v.views.replace('M', '')) * 1000000;
    return acc + views;
  }, 0);

  const avgEngagement = (
    videos.reduce((acc, v) => {
      const views = parseFloat(v.views.replace('M', '')) || 1;
      const likes = parseFloat(v.likes.replace('K', '')) / 1000;
      return acc + (likes / views);
    }, 0) / videos.length * 100
  ).toFixed(1);

  return (
    <>
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center px-8 gap-3 flex-shrink-0 shadow-sm">
        <div>
          <span className="text-base font-semibold text-gray-900">Single Fetch</span>
          <span className="text-sm text-gray-400 ml-2">Paste a video URL to fetch live metrics</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button variant="secondary" size="sm">
            <Save className="w-4 h-4" />
            Save to Campaign
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Videos</div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-200">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{videos.length}</div>
              <div className="text-xs text-gray-500">Tracked videos</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Views</div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-200">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{(totalViews / 1000000).toFixed(1)}M</div>
              <div className="text-xs text-gray-500">Combined reach</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg. Engagement</div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{avgEngagement}%</div>
              <div className="text-xs text-gray-500">Like rate</div>
            </div>
          </div>

          {/* Input Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Fetch Video Data</div>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                placeholder="Paste YouTube, Instagram, or TikTok video URL..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 shadow-sm"
              />
              <Button onClick={handleFetch}>
                <RefreshCw className="w-4 h-4" />
                Fetch
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-400 font-medium">Supported:</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 border border-red-200 text-red-600 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                YouTube
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-pink-50 border border-pink-200 text-pink-600 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                Instagram
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 border border-gray-300 text-gray-700 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-gray-900"></span>
                TikTok
              </span>
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Video Results</div>
                <div className="text-xs text-gray-400 mt-0.5">{videos.length} videos tracked</div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="w-3.5 h-3.5" />
                  Export
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Channel</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Published</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Likes</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Comments</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {videos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${platformColors[video.platform].gradient} flex items-center justify-center shadow-md`}>
                            <span className={`w-2 h-2 rounded-full bg-white`}></span>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{video.platform}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">{video.channel}</span>
                      </td>
                      <td className="px-6 py-4 max-w-[280px]">
                        <div className="text-sm text-gray-600 truncate">{video.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{video.published}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">{video.views}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">{video.likes}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">{video.comments}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

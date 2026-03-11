"use client";

import { useState, useRef, useCallback } from "react";
import { Save, RefreshCw, Download, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/config";

interface VideoData {
  id: string;
  platform: string;
  channel: string;
  url: string;
  title: string;
  published: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
}

const platformGradients: Record<string, string> = {
  youtube: 'from-red-500 to-pink-500',
  instagram: 'from-pink-500 to-purple-500',
  tiktok: 'from-gray-800 to-gray-900',
};

function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatPlatform(p: string): string {
  const map: Record<string, string> = {
    youtube: 'YouTube',
    instagram: 'Instagram',
    tiktok: 'TikTok',
  };
  return map[p.toLowerCase()] ?? (p.charAt(0).toUpperCase() + p.slice(1));
}

function detectPlatform(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    if (hostname.includes('youtube.com') || hostname === 'youtu.be') return 'youtube';
    if (hostname.includes('instagram.com')) return 'instagram';
    if (hostname.includes('tiktok.com')) return 'tiktok';
  } catch {}
  return '';
}

function extractChannel(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    for (const p of parts) {
      if (p.startsWith('@')) return p;
    }
    return u.hostname.replace('www.', '');
  } catch {
    return '—';
  }
}

function getPlatformGradient(platform: string): string {
  return platformGradients[platform.toLowerCase()] ?? 'from-indigo-500 to-purple-500';
}

export function SingleFetchPage() {
  const apiBase = getApiBaseUrl();
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [videos, setVideos] = useState<VideoData[]>([]);
  const [url, setUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleFetch = useCallback(async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl || fetching) return;

    setFetching(true);
    setFetchError(null);

    try {
      // Build a single-row CSV with platform + url (backend requires both columns)
      const platform = detectPlatform(trimmedUrl);
      if (!platform) {
        throw new Error('Could not detect platform. Please use a YouTube, Instagram, or TikTok URL.');
      }
      const csvContent = `url,platform\n${trimmedUrl},${platform}`;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'single.csv', { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch(`${apiBase}/jobs/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `Upload failed (${uploadRes.status})`);
      }

      const uploadData = await uploadRes.json();
      const jobId: string = uploadData.job_id;

      const runRes = await fetch(`${apiBase}/jobs/${jobId}/run`, { method: 'POST' });
      if (!runRes.ok) {
        const err = await runRes.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `Failed to start job (${runRes.status})`);
      }

      // Poll until job completes
      await new Promise<void>((resolve, reject) => {
        const check = async () => {
          try {
            const res = await fetch(`${apiBase}/jobs/${jobId}`);
            if (!res.ok) { reject(new Error('Poll failed')); return; }
            const job = await res.json();
            if (job.status === 'completed' || job.status === 'failed') {
              resolve();
            } else {
              pollRef.current = setTimeout(check, 1500);
            }
          } catch (e) {
            reject(e);
          }
        };
        check();
      });

      // Fetch results
      const rRes = await fetch(`${apiBase}/jobs/${jobId}/results?limit=10`);
      if (!rRes.ok) throw new Error('Failed to fetch results');
      const data = await rRes.json();
      const items: Array<{
        status: string;
        error_message?: string | null;
        platform?: string | null;
        url?: string | null;
        channel?: string | null;
        title?: string | null;
        views?: number | null;
        likes?: number | null;
        comments?: number | null;
        published_at?: string | null;
      }> = data.items ?? [];

      if (items.length === 0) throw new Error('No results returned');

      const r = items[0];
      if (r.status === 'failed') {
        throw new Error(r.error_message ?? 'Fetch failed for this URL');
      }

      const newVideo: VideoData = {
        id: jobId,
        platform: formatPlatform(r.platform ?? ''),
        channel: r.channel ?? extractChannel(r.url ?? trimmedUrl),
        url: r.url ?? trimmedUrl,
        title: r.title ?? 'No title',
        published: r.published_at ? r.published_at.slice(0, 10) : '—',
        views: r.views ?? null,
        likes: r.likes ?? null,
        comments: r.comments ?? null,
      };

      setVideos(prev => [newVideo, ...prev]);
      setUrl('');
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Fetch failed');
    } finally {
      setFetching(false);
    }
  }, [url, fetching, apiBase]);

  const handleDelete = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  const totalViews = videos.reduce((acc, v) => acc + (v.views ?? 0), 0);

  const avgEngagement =
    videos.length > 0
      ? (
          videos.reduce((acc, v) => {
            const views = v.views ?? 0;
            const likes = v.likes ?? 0;
            if (views <= 0) return acc;
            return acc + likes / views;
          }, 0) /
          videos.length *
          100
        ).toFixed(1)
      : '0.0';

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
              <div className="text-3xl font-bold text-gray-900 mb-1">{formatNum(totalViews)}</div>
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
                disabled={fetching}
              />
              <Button onClick={handleFetch} disabled={fetching || !url.trim()}>
                <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                {fetching ? 'Fetching…' : 'Fetch'}
              </Button>
            </div>

            {fetchError && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {fetchError}
              </div>
            )}

            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-400 font-medium">Supported:</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 border border-red-200 text-red-600 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                YouTube
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-pink-50 border border-pink-200 text-pink-600 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                Instagram
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 border border-gray-300 text-gray-700 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-gray-900" />
                TikTok
              </span>
            </div>
          </div>

          {/* Results Card */}
          {videos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Video Results</div>
                  <div className="text-xs text-gray-400 mt-0.5">{videos.length} videos tracked</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setVideos([])}>
                    <X className="w-3.5 h-3.5" />
                    Clear
                  </Button>
                  <Button variant="ghost" size="sm" disabled>
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
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {videos.map((video) => (
                      <tr key={video.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getPlatformGradient(video.platform)} flex items-center justify-center shadow-md`}>
                              <span className="w-2 h-2 rounded-full bg-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{video.platform}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap max-w-[160px]">
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline truncate block"
                            title={video.url}
                          >
                            {video.channel}
                          </a>
                        </td>
                        <td className="px-6 py-4 max-w-[280px]">
                          <div className="text-sm text-gray-600 truncate">{video.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{video.published}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatNum(video.views)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatNum(video.likes)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatNum(video.comments)}</span>
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
          )}

        </div>
      </div>
    </>
  );
}

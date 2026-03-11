"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Download, Plus, Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/config";

type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

interface ActiveJob {
  id: string;
  filename: string | null;
  status: JobStatus;
  total_rows: number;
  processed_rows: number;
}

interface ResultRow {
  id: number;
  platform: string | null;
  url: string | null;
  channel: string | null;
  title: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  published_at: string | null;
  status: string;
  error_message: string | null;
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

function formatDate(s: string | null | undefined): string {
  if (!s) return '—';
  return s.slice(0, 10);
}

function formatPlatform(p: string | null): string {
  if (!p) return '—';
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

function extractChannel(url: string | null): string {
  if (!url) return '—';
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

function statusLabel(status: string): string {
  switch (status) {
    case 'running': return '⏳ Processing';
    case 'queued': return '⏳ Queued';
    case 'completed': return '✅ Complete';
    case 'failed': return '❌ Failed';
    default: return status;
  }
}

function statusClass(status: string): string {
  switch (status) {
    case 'running':
    case 'queued':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'failed':
      return 'bg-red-100 text-red-700 border border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
}

export function BulkFetchPage() {
  const apiBase = getApiBaseUrl();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  const pollJob = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`${apiBase}/jobs/${jobId}`);
      if (!res.ok) return;
      const job = await res.json();

      setActiveJob({
        id: job.id,
        filename: job.filename,
        status: job.status,
        total_rows: job.total_rows ?? 0,
        processed_rows: job.processed_rows ?? 0,
      });

      if (job.status === 'completed' || job.status === 'failed') {
        const rRes = await fetch(`${apiBase}/jobs/${jobId}/results?limit=200&offset=0`);
        if (rRes.ok) {
          const data = await rRes.json();
          setResults(data.items ?? []);
        }
      } else {
        pollRef.current = setTimeout(() => pollJob(jobId), 500);
      }
    } catch {
      // Retry on transient errors
      pollRef.current = setTimeout(() => pollJob(jobId), 1000);
    }
  }, [apiBase]);

  const handleFile = useCallback(async (file: File) => {
    if (pollRef.current) clearTimeout(pollRef.current);
    setError(null);
    setResults([]);
    setUploading(true);

    try {
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

      setActiveJob({
        id: jobId,
        filename: file.name,
        status: 'queued',
        total_rows: uploadData.valid_rows ?? uploadData.total_rows ?? 0,
        processed_rows: 0,
      });

      const runRes = await fetch(`${apiBase}/jobs/${jobId}/run`, { method: 'POST' });
      if (!runRes.ok) {
        const err = await runRes.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `Failed to start job (${runRes.status})`);
      }

      setActiveJob(prev => prev ? { ...prev, status: 'running' } : prev);
      pollRef.current = setTimeout(() => pollJob(jobId), 500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [apiBase, pollJob]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDownloadTemplate = () => {
    const csv = 'url\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ\nhttps://www.instagram.com/p/example/\nhttps://www.tiktok.com/@user/video/123456';
    const blob = new Blob([csv], { type: 'text/csv' });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = 'template.csv';
    a.click();
    URL.revokeObjectURL(objectUrl);
  };

  const isActive = activeJob && (activeJob.status === 'running' || activeJob.status === 'queued');
  const pct = activeJob && activeJob.total_rows > 0
    ? Math.round((activeJob.processed_rows / activeJob.total_rows) * 100)
    : 0;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center px-8 gap-3 flex-shrink-0 shadow-sm">
        <div>
          <span className="text-base font-semibold text-gray-900">Bulk Fetch</span>
          <span className="text-sm text-gray-400 ml-2">Upload CSV/XLSX with video URLs</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
            <Download className="w-4 h-4" />
            Download Template
          </Button>
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>
            <Plus className="w-4 h-4" />
            New Bulk Job
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* Upload Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Upload File</div>
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all group ${
                uploading
                  ? 'opacity-50 cursor-wait border-gray-300'
                  : dragging
                  ? 'border-indigo-400 bg-indigo-50/50 cursor-copy'
                  : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer'
              }`}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center group-hover:from-indigo-200 group-hover:to-purple-200 transition-all shadow-md">
                <Upload className="w-8 h-8 text-indigo-600" strokeWidth={2} />
              </div>
              <p className="font-semibold text-base text-gray-700 mb-2">
                {uploading ? 'Uploading…' : 'Drop your file here, or click to browse'}
              </p>
              <p className="text-sm text-gray-400 mb-3">
                Accepted: .csv, .xlsx, .xls — must include a <code className="bg-gray-100 px-2 py-1 rounded-lg text-indigo-600 font-mono text-xs">url</code> column
              </p>
              <p className="text-xs text-gray-400">Maximum file size: 10MB</p>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Active Job Card */}
          {activeJob && (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl overflow-hidden shadow-lg border border-purple-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200">
                      <FileText className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-gray-900">{activeJob.filename ?? 'Uploaded file'}</div>
                      <div className="text-sm text-gray-500">{activeJob.total_rows} URLs</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${statusClass(activeJob.status)}`}>
                      {statusLabel(activeJob.status)}
                    </span>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-sm">
                  <div className="flex justify-between text-xs text-gray-600 mb-2 font-medium">
                    <span>Fetched {activeJob.processed_rows} of {activeJob.total_rows} videos</span>
                    <span className="text-indigo-600 font-semibold">{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all shadow-sm"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {isActive && (
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="text-gray-500">Processing…</span>
                      <span className="text-emerald-600 font-medium">{activeJob.processed_rows} successful</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Card */}
          {results.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Fetched Data</div>
                  <div className="text-xs text-gray-400 mt-0.5">{results.length} rows retrieved</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => activeJob && (window.location.href = `${apiBase}/jobs/${activeJob.id}/export.csv`)}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </Button>
              </div>

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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map((row) => {
                      const platform = (row.platform ?? '').toLowerCase();
                      const gradient = platformGradients[platform] ?? 'from-gray-500 to-gray-600';
                      return (
                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                                <span className="w-2 h-2 rounded-full bg-white" />
                              </div>
                              <span className="text-sm font-medium text-gray-700">{formatPlatform(row.platform)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap max-w-[160px]">
                            <a
                              href={row.url ?? '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline truncate block"
                              title={row.url ?? ''}
                            >
                              {row.channel ?? extractChannel(row.url)}
                            </a>
                          </td>
                          <td className="px-6 py-4 max-w-[250px]">
                            <div className="text-sm text-gray-600 truncate">{row.title ?? '—'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(row.published_at)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatNum(row.views)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatNum(row.likes)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatNum(row.comments)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                              row.status === 'success'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : row.status === 'failed'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                              {row.status === 'success' ? 'Done' : row.status === 'failed' ? 'Failed' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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

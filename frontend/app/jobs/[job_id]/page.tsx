"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, FileText, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/config";

// ─── Types ────────────────────────────────────────────────────────────────────

type JobDetail = {
  id?: string;
  job_id?: string;
  status?: string;
  created_at?: string;
  filename?: string;
  total_rows?: number | null;
  processed_rows?: number | null;
  [k: string]: unknown;
};

type ResultRow = {
  status?: string | null;
  error_message?: string | null;
  platform?: string | null;
  url?: string | null;
  channel?: string | null;
  title?: string | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  published_at?: string | null;
  engagement_rate?: number | null;
  [k: string]: unknown;
};

type ResultDisplayRow = ResultRow & {
  engagement_rate: number | null;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function normaliseResults(payload: unknown): ResultRow[] {
  if (Array.isArray(payload)) return payload as ResultRow[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const c of [obj.items, obj.results, obj.data, obj.rows]) {
      if (Array.isArray(c)) return c as ResultRow[];
    }
  }
  return [];
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function computeEngagementRate(row: ResultRow): number | null {
  const views = toFiniteNumber(row.views);
  if (views === null || views <= 0) return null;
  const likes = toFiniteNumber(row.likes) ?? 0;
  const comments = toFiniteNumber(row.comments) ?? 0;
  return ((likes + comments) / views) * 100;
}

function formatPublishedDate(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") return "—";
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const d = new Date(value.trim());
  if (Number.isNaN(d.getTime())) return value.trim();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatNumber(value: unknown): string {
  const n = toFiniteNumber(value);
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function getPlatformGradient(platform: string): string {
  switch (platform.toLowerCase()) {
    case "youtube": return "from-red-500 to-pink-500";
    case "instagram": return "from-pink-500 to-purple-500";
    case "tiktok": return "from-gray-700 to-gray-900";
    default: return "from-indigo-500 to-purple-500";
  }
}

function JobStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  if (normalized === "completed" || normalized === "complete") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm w-fit">
        <CheckCircle className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Complete</span>
      </div>
    );
  }
  if (normalized === "running" || normalized === "processing" || normalized === "queued") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 shadow-sm w-fit">
        <Clock className="w-3.5 h-3.5 animate-spin" />
        <span className="text-xs font-medium capitalize">{status}</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 border border-red-200 shadow-sm w-fit">
      <XCircle className="w-3.5 h-3.5" />
      <span className="text-xs font-medium capitalize">{status}</span>
    </div>
  );
}

function RowStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "success") {
    return (
      <span className="px-3 py-1 rounded-lg text-xs font-medium border shadow-sm bg-emerald-100 text-emerald-700 border-emerald-200">
        success
      </span>
    );
  }
  if (s === "failed" || s === "error") {
    return (
      <span className="px-3 py-1 rounded-lg text-xs font-medium border shadow-sm bg-red-100 text-red-700 border-red-200">
        {status}
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-lg text-xs font-medium border shadow-sm bg-amber-100 text-amber-700 border-amber-200">
      {status}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams<{ job_id: string }>();
  const jobId = params.job_id;

  const apiBase = React.useMemo(() => getApiBaseUrl(), []);

  const [job, setJob] = React.useState<JobDetail | null>(null);
  const [results, setResults] = React.useState<ResultRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [jobRes, resultsRes] = await Promise.all([
          fetch(`${apiBase}/jobs/${jobId}`),
          fetch(`${apiBase}/jobs/${jobId}/results?limit=200&offset=0`),
        ]);

        if (!jobRes.ok) throw new Error(`Failed to fetch job detail: ${jobRes.status}`);
        if (!resultsRes.ok) throw new Error(`Failed to fetch results: ${resultsRes.status}`);

        const jobJson = (await jobRes.json()) as JobDetail;
        const resultsJson = (await resultsRes.json()) as unknown;

        if (!cancelled) {
          setJob(jobJson);
          setResults(normaliseResults(resultsJson));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [apiBase, jobId]);

  const displayResults = React.useMemo<ResultDisplayRow[]>(
    () => results.map((row) => ({ ...row, engagement_rate: computeEngagementRate(row) })),
    [results]
  );

  const processed = job?.processed_rows ?? null;
  const total = job?.total_rows ?? null;

  const progressPct = React.useMemo(() => {
    if (processed !== null && total !== null && total > 0)
      return Math.round((processed / total) * 100);
    return null;
  }, [processed, total]);

  const successRate = React.useMemo(() => {
    if (displayResults.length === 0) return null;
    const successCount = displayResults.filter((r) => r.status === "success").length;
    return Math.round((successCount / displayResults.length) * 100);
  }, [displayResults]);

  function onExportCsv() {
    window.location.href = `${apiBase}/jobs/${jobId}/export.csv`;
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F7F8FC]">
        <div className="text-sm text-gray-400">Loading…</div>
      </div>
    );
  }

  // ── Error ──
  if (error || !job) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F7F8FC]">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {error ? "Error" : "Job Not Found"}
          </div>
          {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
          <Button variant="outline" onClick={() => router.push("/history")}>
            Back to History
          </Button>
        </div>
      </div>
    );
  }

  const jobStatus = String(job.status ?? "unknown");
  const jobName = String(job.filename ?? job.id ?? jobId);
  const jobUUID = String(job.job_id ?? job.id ?? jobId);

  return (
    <>
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center px-8 gap-3 flex-shrink-0 shadow-sm">
        <Button variant="ghost" size="sm" onClick={() => router.push("/history")}>
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </Button>
        <div className="ml-auto">
          <Button variant="secondary" size="sm" onClick={onExportCsv}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#F7F8FC]">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* Job Info Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#E6E8F0] overflow-hidden">
            {/* Card header */}
            <div
              className="relative px-8 py-7"
              style={{ background: "linear-gradient(135deg, #F8F6FF 0%, #F3F1FF 40%, #EEF2FF 100%)" }}
            >
              <div className="absolute bottom-0 left-0 right-0 h-px bg-[#E6E8F0]" />
              <div className="flex items-start gap-5">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #7C5CFF 0%, #6A3FFF 100%)",
                    boxShadow: "0px 8px 20px rgba(106,63,255,0.12)",
                  }}
                >
                  <FileText className="w-12 h-12 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1 pt-2 min-w-0">
                  <h1 className="text-[22px] font-semibold text-[#1F2937] mb-2 truncate leading-tight">
                    {jobName}
                  </h1>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#6B7280]" />
                    <span className="font-mono text-[13px] text-[#6B7280]">{jobUUID}</span>
                  </div>
                  <JobStatusBadge status={jobStatus} />
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="px-8 py-6">
              <div className="grid grid-cols-3 gap-4">
                {/* Progress */}
                <div className="bg-white rounded-[14px] border border-[#E6E8F0] p-6 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {processed !== null || total !== null
                      ? `${processed ?? 0} / ${total ?? displayResults.length}`
                      : `${displayResults.length} rows`}
                  </div>
                  {progressPct !== null && (
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all shadow-sm"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Created */}
                <div className="bg-white rounded-[14px] border border-[#E6E8F0] p-6 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {job.created_at ? formatDate(String(job.created_at)) : "—"}
                  </div>
                </div>

                {/* Success Rate */}
                <div className="bg-white rounded-[14px] border border-[#E6E8F0] p-6 shadow-[0px_4px_16px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Success Rate</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {successRate !== null ? `${successRate}%` : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#E6E8F0] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="text-sm font-semibold text-gray-900">Results</div>
              <div className="text-xs text-gray-400 mt-0.5">Showing {displayResults.length} row(s)</div>
            </div>

            {displayResults.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">
                No results found for this job.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-50/50">
                    <tr>
                      {["Status", "Platform", "Channel", "Title", "Views", "Likes", "Comments", "Published", "ER%", "Error"].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayResults.map((row, idx) => {
                      const platform = String(row.platform ?? "");
                      const gradient = getPlatformGradient(platform);
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {row.status ? <RowStatusBadge status={String(row.status)} /> : "—"}
                          </td>

                          {/* Platform */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {platform ? (
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                                  <span className="w-2 h-2 rounded-full bg-white" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">{platform}</span>
                              </div>
                            ) : "—"}
                          </td>

                          {/* Channel */}
                          <td className="px-6 py-4 whitespace-nowrap max-w-[160px]">
                            <span className="text-sm font-semibold text-gray-700 truncate block">
                              {row.channel ? String(row.channel) : "—"}
                            </span>
                          </td>

                          {/* Title */}
                          <td className="px-6 py-4 max-w-[300px]">
                            {row.url ? (
                              <a
                                href={String(row.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline truncate block"
                                title={String(row.url)}
                              >
                                {row.title ? String(row.title) : String(row.url)}
                              </a>
                            ) : (
                              <span className="text-sm text-gray-600 truncate block">
                                {row.title ? String(row.title) : "—"}
                              </span>
                            )}
                          </td>

                          {/* Views */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900 tabular-nums">
                              {formatNumber(row.views)}
                            </span>
                          </td>

                          {/* Likes */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900 tabular-nums">
                              {formatNumber(row.likes)}
                            </span>
                          </td>

                          {/* Comments */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900 tabular-nums">
                              {formatNumber(row.comments)}
                            </span>
                          </td>

                          {/* Published */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatPublishedDate(row.published_at)}
                          </td>

                          {/* ER% */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-indigo-600 tabular-nums">
                              {row.engagement_rate !== null ? `${row.engagement_rate.toFixed(2)}%` : "—"}
                            </span>
                          </td>

                          {/* Error */}
                          <td className="px-6 py-4 max-w-[280px]">
                            {row.error_message ? (
                              <span
                                className="text-xs text-red-600 block truncate"
                                title={String(row.error_message)}
                              >
                                {String(row.error_message)}
                              </span>
                            ) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/config";
import Link from "next/link";

interface Job {
  id: string;
  filename: string | null;
  status: string;
  total_rows: number | null;
  processed_rows: number | null;
  created_at: string | null;
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek && !isToday(dateStr);
}

function formatJobTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function mapStatus(status: string): string {
  switch (status) {
    case 'running': return 'Processing';
    case 'completed': return 'Complete';
    case 'failed': return 'Failed';
    case 'queued': return 'Queued';
    default: return status;
  }
}

const StatusBadge = ({ status }: { status: string }) => {
  const uiStatus = mapStatus(status);
  if (uiStatus === 'Complete') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
        <CheckCircle className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{uiStatus}</span>
      </div>
    );
  }
  if (uiStatus === 'Processing' || uiStatus === 'Queued') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
        <Clock className={`w-3.5 h-3.5 ${uiStatus === 'Processing' ? 'animate-spin' : ''}`} />
        <span className="text-xs font-medium">{uiStatus}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 border border-red-200 shadow-sm">
      <XCircle className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">{uiStatus}</span>
    </div>
  );
};

function JobRow({ job, isLast }: { job: Job; isLast: boolean }) {
  const isBulk = !!job.filename;
  const progress =
    job.total_rows && job.total_rows > 0
      ? Math.round(((job.processed_rows ?? 0) / job.total_rows) * 100)
      : null;
  const countText =
    job.total_rows != null
      ? `${job.processed_rows ?? 0} / ${job.total_rows}`
      : '—';

  return (
    <Link
      href={`/jobs/${job.id}`}
      className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-all group ${
        !isLast ? 'border-b border-gray-100' : ''
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
          isBulk
            ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-200'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200'
        }`}
      >
        {isBulk ? (
          <FileText className="w-6 h-6 text-white" strokeWidth={2} />
        ) : (
          <Search className="w-6 h-6 text-white" strokeWidth={2} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors truncate">
          {job.filename ?? 'Single Fetch Session'}
        </div>
        <div className="text-xs text-gray-500">
          {job.created_at ? formatJobTime(job.created_at) : '—'} —{' '}
          <span className="text-gray-400">{isBulk ? 'Bulk Job' : 'Single'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-500 font-medium min-w-[80px] text-right">{countText}</span>
        {progress !== null && (
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <StatusBadge status={job.status} />
      </div>
    </Link>
  );
}

function JobGroup({ label, jobs }: { label: string; jobs: Job[] }) {
  if (jobs.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
      </div>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {jobs.map((job, idx) => (
          <JobRow key={job.id} job={job} isLast={idx === jobs.length - 1} />
        ))}
      </div>
    </div>
  );
}

export function HistoryPage() {
  const apiBase = getApiBaseUrl();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(`${apiBase}/jobs?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        window.location.href = "/login?next=/history";
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch jobs (${res.status})`);
      const data = await res.json();
      setJobs(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    load();
  }, [load]);

  const todayJobs = jobs.filter(j => j.created_at && isToday(j.created_at));
  const weekJobs = jobs.filter(j => j.created_at && isThisWeek(j.created_at));
  const olderJobs = jobs.filter(
    j => !j.created_at || (!isToday(j.created_at) && !isThisWeek(j.created_at))
  );

  return (
    <>
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center px-8 gap-3 flex-shrink-0 shadow-sm">
        <div>
          <span className="text-base font-semibold text-gray-900">Job History</span>
          <span className="text-sm text-gray-400 ml-2">All fetch jobs, sorted by recency</span>
        </div>
        <div className="ml-auto">
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {loading && (
            <div className="text-sm text-gray-500 text-center py-12">Loading jobs…</div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {!loading && !error && jobs.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-12">
              No jobs yet. Upload a CSV on the Bulk Fetch page to get started.
            </div>
          )}

          {!loading && !error && jobs.length > 0 && (
            <>
              <JobGroup label="Today" jobs={todayJobs} />
              <JobGroup label="This Week" jobs={weekJobs} />
              <JobGroup label="Older" jobs={olderJobs} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

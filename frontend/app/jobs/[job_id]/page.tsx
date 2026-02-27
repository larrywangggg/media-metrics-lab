"use client";

import * as React from "react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { getApiBaseUrl } from "@/lib/config";

type MetaResponse = {
  fetchers?: {
    youtube?: string;
    [k: string]: unknown;
  };
};

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
  status?: string | null; // "success" | "failed" | "queued" ...
  error_message?: string | null;

  platform?: string | null;
  url?: string | null;
  title?: string | null;

  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  published_at?: string | null;
  engagement_rate?: number | null;

  [k: string]: unknown;
};

function normaliseResults(payload: unknown): ResultRow[] {
  if (Array.isArray(payload)) return payload as ResultRow[];

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const candidates = [obj.items, obj.results, obj.data, obj.rows];
    for (const c of candidates) {
      if (Array.isArray(c)) return c as ResultRow[];
    }
  }
  return [];
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "success":
      return "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 border-green-200";
    case "failed":
      return "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 border-red-200";
    case "running":
      return "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200";
    case "queued":
      return "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-slate-50 text-slate-700 border-slate-200";
    case "completed":
      return "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 border-green-200";
    default:
      return "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-slate-50 text-slate-700 border-slate-200";
  }
}

function rowTintClass(status: string) {
  if (status === "failed") return "bg-red-50/40";
  if (status === "success") return "bg-green-50/30";
  return "";
}

function safeString(v: unknown) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}

export default function JobDetailPage() {
  const params = useParams<{ job_id: string }>();
  const jobId = params.job_id;

  const apiBase = React.useMemo(() => getApiBaseUrl(), []);

  const [meta, setMeta] = React.useState<MetaResponse | null>(null);
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

        // Fetch meta + job + results in parallel
        const [metaRes, jobRes, resultsRes] = await Promise.all([
          fetch(`${apiBase}/meta`).catch(() => null),
          fetch(`${apiBase}/jobs/${jobId}`),
          fetch(`${apiBase}/jobs/${jobId}/results?limit=200&offset=0`),
        ]);

        // Meta is optional (UI still works without it)
        if (metaRes && metaRes.ok) {
          const metaJson = (await metaRes.json()) as MetaResponse;
          if (!cancelled) setMeta(metaJson);
        }

        if (!jobRes.ok) {
          throw new Error(`Failed to fetch job detail: ${jobRes.status}`);
        }
        const jobJson = (await jobRes.json()) as JobDetail;

        if (!resultsRes.ok) {
          throw new Error(`Failed to fetch results: ${resultsRes.status}`);
        }
        const resultsJson = (await resultsRes.json()) as unknown;

        if (!cancelled) {
          setJob(jobJson);
          setResults(normaliseResults(resultsJson));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [apiBase, jobId]);

  const columns = React.useMemo(() => {
    // Prefer a stable, product-like column order:
    const preferred = [
      "status",
      "platform",
      "url",
      "title",
      "views",
      "likes",
      "comments",
      "published_at",
      "engagement_rate",
      "error_message",
    ];

    const keys = new Set<string>();
    for (const r of results) Object.keys(r).forEach((k) => keys.add(k));

    const head = preferred.filter((k) => keys.has(k));
    const tail = Array.from(keys).filter((k) => !head.includes(k));

    return [...head, ...tail];
  }, [results]);

  async function onExportCsv() {
    window.location.href = `${apiBase}/jobs/${jobId}/export.csv`;
  }

  if (loading) {
    return (
      <div className="p-10">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const jobStatus = String(job?.status ?? "unknown");
  const processed = job?.processed_rows ?? null;
  const total = job?.total_rows ?? null;
  const youtubeImpl = meta?.fetchers?.youtube;

  return (
    <div className="p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Detail</CardTitle>
            <CardDescription>Job ID: {jobId}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <span className="text-muted-foreground mr-2">Status</span>
                <span className={statusBadgeClass(jobStatus)}>{jobStatus}</span>
              </div>

              {(processed !== null || total !== null) && (
                <div>
                  <span className="text-muted-foreground mr-2">Progress</span>
                  <span className="font-medium">
                    {(processed ?? 0)}/{(total ?? results.length)}
                  </span>
                </div>
              )}

              {youtubeImpl && (
                <div>
                  <span className="text-muted-foreground mr-2">YouTube fetcher</span>
                  <span className="font-medium">{youtubeImpl}</span>
                </div>
              )}
            </div>

            {job?.filename && (
              <div>
                <span className="text-muted-foreground">File: </span>
                <span>{String(job.filename)}</span>
              </div>
            )}

            {job?.created_at && (
              <div>
                <span className="text-muted-foreground">Created: </span>
                <span>{String(job.created_at)}</span>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <Button onClick={onExportCsv}>Export CSV</Button>
            </div>

            {error && (
              <div className="pt-3 text-red-600">Error: {error}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Showing {results.length} row(s).</CardDescription>
          </CardHeader>

          <CardContent>
            {results.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No results found for this job.
              </div>
            ) : (
              <div className="overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((c) => (
                        <TableHead key={c}>{c}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {results.map((row, idx) => {
                      const rowStatus = String(row.status ?? "");
                      return (
                        <TableRow key={idx} className={rowTintClass(rowStatus)}>
                          {columns.map((c) => {
                            if (c === "status") {
                              const s = String(row.status ?? "");
                              return (
                                <TableCell key={c}>
                                  {s ? (
                                    <span className={statusBadgeClass(s)}>{s}</span>
                                  ) : (
                                    ""
                                  )}
                                </TableCell>
                              );
                            }

                            if (c === "error_message") {
                              const msg = row.error_message;
                              if (!msg) return <TableCell key={c} />;

                              // Truncate to keep layout stable, show full message on hover
                              return (
                                <TableCell key={c} className="max-w-[360px]">
                                  <span
                                    className="block truncate text-red-700"
                                    title={msg}
                                  >
                                    {msg}
                                  </span>
                                </TableCell>
                              );
                            }

                            // Default rendering
                            return (
                              <TableCell key={c}>
                                {safeString(row[c])}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
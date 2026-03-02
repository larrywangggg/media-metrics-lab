"use client";

import * as React from "react";
import Link from "next/link";
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

type ResultDisplayRow = ResultRow & {
  engagement_rate: number | null;
};

type ResultColumnKey =
  | "status"
  | "platform"
  | "url"
  | "title"
  | "views"
  | "likes"
  | "comments"
  | "published_at"
  | "engagement_rate"
  | "error_message";

type ResultColumn = {
  key: ResultColumnKey;
  label: string;
  headClassName?: string;
  cellClassName?: string;
};

const RESULT_COLUMNS: ResultColumn[] = [
  { key: "status", label: "Status" },
  { key: "platform", label: "Platform" },
  {
    key: "url",
    label: "URL",
    cellClassName: "max-w-[180px] whitespace-normal break-all align-top",
  },
  {
    key: "title",
    label: "Title",
    cellClassName: "max-w-[520px] whitespace-normal break-words align-top",
  },
  {
    key: "views",
    label: "Views",
    headClassName: "text-center",
    cellClassName: "text-center tabular-nums whitespace-nowrap",
  },
  {
    key: "likes",
    label: "Likes",
    headClassName: "text-center",
    cellClassName: "text-center tabular-nums whitespace-nowrap",
  },
  {
    key: "comments",
    label: "Comments",
    headClassName: "text-center",
    cellClassName: "text-center tabular-nums whitespace-nowrap",
  },
  {
    key: "published_at",
    label: "Published",
    headClassName: "text-center",
    cellClassName: "text-center whitespace-nowrap",
  },
  {
    key: "engagement_rate",
    label: "ER%",
    headClassName: "text-right",
    cellClassName: "text-right tabular-nums whitespace-nowrap",
  },
  {
    key: "error_message",
    label: "Error",
    cellClassName: "max-w-[360px]",
  },
];

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
      return "status-pill status-pill--success";
    case "failed":
      return "status-pill status-pill--error";
    case "running":
      return "status-pill status-pill--info";
    case "queued":
      return "status-pill status-pill--neutral";
    case "completed":
      return "status-pill status-pill--success";
    default:
      return "status-pill status-pill--neutral";
  }
}

function rowTintClass(status: string) {
  if (status === "failed") return "result-row--error";
  if (status === "success") return "result-row--success";
  return "";
}

function safeString(v: unknown) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
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
  const trimmed = value.trim();

  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return trimmed;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
          fetch(`${apiBase}/system/meta`).catch(() => null),
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

  const displayResults = React.useMemo<ResultDisplayRow[]>(() => {
    return results.map((row) => ({
      ...row,
      // Temporary client-side value until backend provides this metric.
      engagement_rate: computeEngagementRate(row),
    }));
  }, [results]);

  async function onExportCsv() {
    window.location.href = `${apiBase}/jobs/${jobId}/export.csv`;
  }

  if (loading) {
    return <div className="type-helper text-muted-foreground">Loading...</div>;
  }

  const jobStatus = String(job?.status ?? "unknown");
  const processed = job?.processed_rows ?? null;
  const total = job?.total_rows ?? null;
  const youtubeImpl = meta?.fetchers?.youtube;

  return (
    <div className="app-page-stack">
      <div className="flex items-center justify-between">
        <h1 className="app-heading-lg">Job Detail</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/bulk">Back to Bulk</Link>
        </Button>
      </div>

      <div className="app-page-stack">
        <Card>
          <CardHeader>
            <CardTitle>Job Detail</CardTitle>
            <CardDescription>
              Job ID: <span className="type-mono">{jobId}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="app-section-stack type-body">
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <span className="meta-label">Status</span>
                <span className={statusBadgeClass(jobStatus)}>{jobStatus}</span>
              </div>

              {(processed !== null || total !== null) && (
                <div>
                  <span className="meta-label">Progress</span>
                  <span className="font-medium">
                    {(processed ?? 0)}/{(total ?? results.length)}
                  </span>
                </div>
              )}

              {youtubeImpl && (
                <div>
                  <span className="meta-label">YouTube fetcher</span>
                  <span className="font-medium">{youtubeImpl}</span>
                </div>
              )}
            </div>

            {job?.filename && (
              <div>
                <span className="meta-label">File:</span>
                <span>{String(job.filename)}</span>
              </div>
            )}

            {job?.created_at && (
              <div>
                <span className="meta-label">Created:</span>
                <span>{String(job.created_at)}</span>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <Button onClick={onExportCsv}>Export CSV</Button>
            </div>

            {error && <div className="pt-3 status-text-error">Error: {error}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Showing {displayResults.length} row(s).</CardDescription>
          </CardHeader>

          <CardContent>
            {displayResults.length === 0 ? (
              <div className="type-helper text-muted-foreground">
                No results found for this job.
              </div>
            ) : (
              <div className="app-table-shell overflow-auto">
                <Table>
                  <TableHeader className="bg-muted/60 [&_th]:h-11 [&_th]:border-b [&_th]:font-semibold [&_th]:text-center [&_th]:text-foreground">
                    <TableRow>
                      {RESULT_COLUMNS.map((column) => (
                        <TableHead key={column.key} className={column.headClassName}>
                          {column.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {displayResults.map((row, idx) => {
                      const rowStatus = String(row.status ?? "");
                      return (
                        <TableRow key={idx} className={rowTintClass(rowStatus)}>
                          {RESULT_COLUMNS.map((column) => {
                            if (column.key === "status") {
                              const s = String(row.status ?? "");
                              return (
                                <TableCell key={column.key} className={column.cellClassName}>
                                  {s ? (
                                    <span className={statusBadgeClass(s)}>{s}</span>
                                  ) : (
                                    ""
                                  )}
                                </TableCell>
                              );
                            }

                            if (column.key === "published_at") {
                              return (
                                <TableCell key={column.key} className={column.cellClassName}>
                                  {formatPublishedDate(row.published_at)}
                                </TableCell>
                              );
                            }

                            if (column.key === "engagement_rate") {
                              const rate = row.engagement_rate;
                              return (
                                <TableCell key={column.key} className={column.cellClassName}>
                                  {rate === null ? "—" : `${rate.toFixed(2)}%`}
                                </TableCell>
                              );
                            }

                            if (column.key === "error_message") {
                              const msg = row.error_message;
                              if (!msg) {
                                return (
                                  <TableCell key={column.key} className={column.cellClassName}>
                                    —
                                  </TableCell>
                                );
                              }

                              // Truncate to keep layout stable, show full message on hover
                              return (
                                <TableCell key={column.key} className={column.cellClassName}>
                                  <span
                                    className="status-text-error block truncate"
                                    title={msg}
                                  >
                                    {msg}
                                  </span>
                                </TableCell>
                              );
                            }

                            const raw = row[column.key];
                            const text = safeString(raw);
                            return (
                              <TableCell key={column.key} className={column.cellClassName}>
                                {text || "—"}
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

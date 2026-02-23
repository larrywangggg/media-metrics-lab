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

type JobDetail = {
  id?: string;
  job_id?: string;
  status?: string;
  created_at?: string;
  filename?: string;
  [k: string]: unknown;
};

type ResultRow = Record<string, unknown>;

/** Normalise backend payload into a plain array of result rows. */
function normaliseResults(payload: unknown): ResultRow[] {
  if (Array.isArray(payload)) return payload as ResultRow[];

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const candidates = [
      obj.items,
      obj.results,
      obj.data,
      obj.rows,
    ];

    for (const c of candidates) {
      if (Array.isArray(c)) return c as ResultRow[];
    }
  }

  return [];
}

/** Get API base URL from env, with a safe default for local dev. */
function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
}

export default function JobDetailPage() {
  const params = useParams<{ job_id: string }>();
  const jobId = params.job_id;

  const [job, setJob] = React.useState<JobDetail | null>(null);
  const [results, setResults] = React.useState<ResultRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const apiBase = React.useMemo(() => getApiBase(), []);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Fetch job detail
        const jobRes = await fetch(`${apiBase}/jobs/${jobId}`);
        if (!jobRes.ok) {
          throw new Error(`Failed to fetch job detail: ${jobRes.status}`);
        }
        const jobJson = (await jobRes.json()) as JobDetail;

        // Fetch results (increase limit if you want to display more)
        const resultsRes = await fetch(
          `${apiBase}/jobs/${jobId}/results?limit=200&offset=0`
        );
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

  // Build columns from actual rows (defensive: results may be empty)
  const columns = React.useMemo(() => {
    const keys = new Set<string>();

    // results must be an array here; otherwise normaliseResults() is wrong.
    for (const r of results) {
      Object.keys(r).forEach((k) => keys.add(k));
    }

    const ordered = Array.from(keys);

    // Put common columns first if present
    const preferred = ["row_index", "success", "error"];
    const head = preferred.filter((k) => keys.has(k));
    const tail = ordered.filter((k) => !head.includes(k));

    return [...head, ...tail];
  }, [results]);

  async function onExportCsv() {
    // Simple approach: open the export endpoint directly to trigger download
    window.location.href = `${apiBase}/jobs/${jobId}/export.csv`;
  }

  if (loading) {
    return (
      <div className="p-10">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Detail</CardTitle>
            <CardDescription>Job ID: {jobId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {/* Display a few known fields if they exist */}
            <div>
              <span className="text-muted-foreground">Status: </span>
              <span>{String(job?.status ?? "unknown")}</span>
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

            <div className="pt-2">
              <Button onClick={onExportCsv}>Export CSV</Button>
            </div>

            {error && (
              <div className="pt-3 text-red-600">
                Error: {error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Showing {results.length} row(s).
            </CardDescription>
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
                    {results.map((row, idx) => (
                      <TableRow key={idx}>
                        {columns.map((c) => (
                          <TableCell key={c}>
                            {row[c] === null || row[c] === undefined
                              ? ""
                              : String(row[c])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
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
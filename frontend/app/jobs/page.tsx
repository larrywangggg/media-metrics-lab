"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Job = {
  id: string;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function normaliseJobs(payload: unknown): Job[] {
  // Backend might return:
  // 1) Array<Job>
  // 2) { items: Array<Job>, total?: number, ... }
  // 3) { data: Array<Job>, ... }
  if (Array.isArray(payload)) return payload as Job[];

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as Job[];
    if (Array.isArray(obj.data)) return obj.data as Job[];
    if (Array.isArray(obj.jobs)) return obj.jobs as Job[];
  }

  return [];
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function JobsPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const sortedJobs = useMemo(() => {
    // Sort by created_at desc if available, otherwise keep original order.
    return [...jobs].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });
  }, [jobs]);

  async function fetchJobs() {
    setError("");

    // If env var is missing, show a clear message and stop.
    if (!apiBase) {
      setJobs([]);
      setLoading(false);
      setError(
        "Missing NEXT_PUBLIC_API_BASE in frontend/.env.local. Example: NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000"
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/jobs`, {
        method: "GET",
        // Avoid stale data while developing.
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `GET /jobs failed: ${res.status} ${res.statusText}${
            text ? ` — ${text}` : ""
          }`
        );
      }

      const data = (await res.json()) as unknown;
      const list = normaliseJobs(data);
      setJobs(list);
    } catch (e: any) {
      setJobs([]);
      setError(e?.message ?? "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Jobs</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchJobs()} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
          <Button asChild>
            <Link href="/upload">Upload</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Job history</CardTitle>
          <CardDescription>
            Showing {sortedJobs.length} job(s).
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : sortedJobs.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No jobs yet. Go to <Link className="underline" href="/upload">/upload</Link> to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[360px]">Job ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sortedJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs">
                        {job.id}
                      </TableCell>
                      <TableCell>{job.status ?? "—"}</TableCell>
                      <TableCell>{fmtDate(job.created_at)}</TableCell>
                      <TableCell>{fmtDate(job.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/jobs/${job.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
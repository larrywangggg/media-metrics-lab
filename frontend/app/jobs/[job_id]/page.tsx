"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Job = {
  id: string;
  filename?: string;
  status?: string;
  created_at?: string;
  // Add any other fields if backend returns more info in the future.
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export default function JobDetailPage() {
  const params = useParams<{ job_id: string }>();
  const jobId = params?.job_id;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Guard: jobId might be undefined briefly during hydration.
    if (!jobId) return;

    const controller = new AbortController();

    async function loadJob() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
          method: "GET",
          signal: controller.signal,
        });

        if (!res.ok) {
          // Convert common cases into readable messages.
          if (res.status === 404) {
            throw new Error("Job not found.");
          }
          const text = await res.text().catch(() => "");
          throw new Error(text || `Request failed with status ${res.status}.`);
        }

        const data = (await res.json()) as Job;
        setJob(data);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Something went wrong.");
        setJob(null);
      } finally {
        setLoading(false);
      }
    }

    loadJob();

    return () => controller.abort();
  }, [jobId]);

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold">Job Detail</h1>

      <div className="mt-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Job ID:</span> {jobId}
      </div>

      <div className="mt-6">
        {loading && <div>Loading…</div>}

        {!loading && error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            <div className="font-semibold">Error</div>
            <div className="mt-1">{error}</div>
          </div>
        )}

        {!loading && !error && job && (
          <div className="rounded-lg border p-4">
            <div className="grid gap-2 text-sm">
              <div>
                <span className="font-medium">ID:</span> {job.id}
              </div>
              {job.filename && (
                <div>
                  <span className="font-medium">Filename:</span> {job.filename}
                </div>
              )}
              {job.status && (
                <div>
                  <span className="font-medium">Status:</span> {job.status}
                </div>
              )}
              {job.created_at && (
                <div>
                  <span className="font-medium">Created:</span> {job.created_at}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
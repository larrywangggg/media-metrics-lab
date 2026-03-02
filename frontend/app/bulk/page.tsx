"use client";

import * as React from "react";
import Link from "next/link";

import { getApiBaseUrl } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const JOBS_LIMIT = 10;

type Job = {
  id: string;
  filename?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type JobsPage = {
  items: Job[];
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
};

function normaliseJobs(payload: unknown): Job[] {
  if (Array.isArray(payload)) return payload as Job[];

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as Job[];
    if (Array.isArray(obj.data)) return obj.data as Job[];
    if (Array.isArray(obj.jobs)) return obj.jobs as Job[];
  }

  return [];
}

function normaliseJobsPage(
  payload: unknown,
  fallbackLimit: number,
  fallbackOffset: number
): JobsPage {
  if (Array.isArray(payload)) {
    return {
      items: payload as Job[],
      limit: fallbackLimit,
      offset: fallbackOffset,
      total: payload.length,
      hasMore: false,
    };
  }

  const obj = asRecord(payload);
  const items = normaliseJobs(payload);

  const limit =
    typeof obj?.limit === "number" && obj.limit > 0 ? obj.limit : fallbackLimit;
  const offset =
    typeof obj?.offset === "number" && obj.offset >= 0 ? obj.offset : fallbackOffset;
  const total =
    typeof obj?.total === "number" && obj.total >= 0 ? obj.total : offset + items.length;
  const hasMore =
    typeof obj?.has_more === "boolean" ? obj.has_more : offset + items.length < total;

  return {
    items,
    limit,
    offset,
    total,
    hasMore,
  };
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function shortJobId(id: string): string {
  const firstSegment = id.split("-")[0];
  if (firstSegment && firstSegment.length >= 8 && id.includes("-")) {
    return `${firstSegment.slice(0, 8)}...`;
  }
  if (id.length <= 8) return id;
  return `${id.slice(0, 8)}...`;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function extractFastApiDetail(payload: unknown): string {
  const payloadObj = asRecord(payload);
  const detail = payloadObj?.detail;

  if (!detail) return "Upload failed.";
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => (asRecord(d)?.msg as string | undefined) ?? "")
      .filter(Boolean);
    if (msgs.length > 0) return msgs.join("; ");
    return "Upload failed due to validation errors.";
  }

  try {
    return JSON.stringify(detail);
  } catch {
    return "Upload failed.";
  }
}

function extractJobId(payload: unknown): string | null {
  const payloadObj = asRecord(payload);
  if (!payloadObj) return null;

  if (typeof payloadObj.job_id === "string") return payloadObj.job_id;
  if (typeof payloadObj.id === "string") return payloadObj.id;

  const jobObj = asRecord(payloadObj.job);
  if (typeof jobObj?.id === "string") return jobObj.id;
  if (typeof jobObj?.job_id === "string") return jobObj.job_id;

  return null;
}

function statusBadgeClass(status?: string | null) {
  switch (status) {
    case "success":
    case "completed":
      return "status-pill status-pill--success";
    case "failed":
      return "status-pill status-pill--error";
    case "running":
      return "status-pill status-pill--info";
    case "queued":
      return "status-pill status-pill--neutral";
    default:
      return "status-pill status-pill--neutral";
  }
}

function getApiBaseUrlSafe() {
  try {
    return { apiBase: getApiBaseUrl(), configError: "" };
  } catch (e) {
    return {
      apiBase: "",
      configError:
        e instanceof Error
          ? e.message
          : "Missing NEXT_PUBLIC_API_BASE in frontend/.env.local.",
    };
  }
}

export default function BulkPage() {
  const { apiBase, configError } = React.useMemo(getApiBaseUrlSafe, []);
  const isFirstLoadRef = React.useRef(true);

  const [file, setFile] = React.useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = React.useState(0);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string>("");
  const [uploadMessage, setUploadMessage] = React.useState<string>("");

  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = React.useState(true);
  const [jobsError, setJobsError] = React.useState<string>("");
  const [jobsOffset, setJobsOffset] = React.useState(0);
  const [jobsTotal, setJobsTotal] = React.useState(0);
  const [jobsHasMore, setJobsHasMore] = React.useState(false);
  const [jobsUpdating, setJobsUpdating] = React.useState(false);
  const [pageInput, setPageInput] = React.useState("1");

  const fetchJobs = React.useCallback(
    async (
      requestedOffset: number,
      options?: {
        mode?: "initial" | "update";
      }
    ) => {
      const mode = options?.mode ?? "update";

      setJobsError("");

      if (!apiBase) {
        if (mode === "initial") {
          setJobs([]);
        }
        setJobsLoading(false);
        setJobsUpdating(false);
        setJobsTotal(0);
        setJobsHasMore(false);
        setJobsError(
          configError ||
            "Missing NEXT_PUBLIC_API_BASE in frontend/.env.local. Example: NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000"
        );
        return;
      }

      if (mode === "initial") {
        setJobsLoading(true);
      } else {
        setJobsUpdating(true);
      }
      try {
        const res = await fetch(
          `${apiBase}/jobs?limit=${JOBS_LIMIT}&offset=${requestedOffset}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `GET /jobs failed: ${res.status} ${res.statusText}${
              text ? ` — ${text}` : ""
            }`
          );
        }

        const payload = (await res.json()) as unknown;
        const page = normaliseJobsPage(payload, JOBS_LIMIT, requestedOffset);
        setJobs(page.items);
        setJobsOffset(page.offset);
        setJobsTotal(page.total);
        setJobsHasMore(page.hasMore);
      } catch (e) {
        if (mode === "initial") {
          setJobs([]);
          setJobsTotal(0);
          setJobsHasMore(false);
        }
        setJobsError(e instanceof Error ? e.message : "Failed to load jobs.");
      } finally {
        if (mode === "initial") {
          setJobsLoading(false);
        } else {
          setJobsUpdating(false);
        }
      }
    },
    [apiBase, configError]
  );

  React.useEffect(() => {
    const mode = isFirstLoadRef.current ? "initial" : "update";
    void fetchJobs(jobsOffset, { mode });
    isFirstLoadRef.current = false;
  }, [fetchJobs, jobsOffset]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    setUploadMessage("");
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
  };

  const validateFile = (f: File | null): string | null => {
    if (!f) return "Please choose a CSV or XLSX file.";

    const name = f.name.toLowerCase();
    const ok = name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls");
    if (!ok) return "Only .csv, .xlsx, or .xls files are accepted.";

    const maxBytes = 20 * 1024 * 1024;
    if (f.size > maxBytes) return "File is too large (max 20MB).";

    return null;
  };

  const onUpload = async () => {
    setUploadError("");
    setUploadMessage("");

    if (!apiBase) {
      setUploadError(
        configError ||
          "Missing NEXT_PUBLIC_API_BASE in frontend/.env.local. Example: NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000"
      );
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file as File);

      const res = await fetch(`${apiBase}/jobs/upload`, {
        method: "POST",
        body: form,
      });

      const payload = (await res.json().catch(() => null)) as unknown;

      if (!res.ok) {
        const msg = payload
          ? extractFastApiDetail(payload)
          : `Upload failed (HTTP ${res.status}).`;
        setUploadError(msg);
        return;
      }

      const jobId = extractJobId(payload);
      const payloadObj = asRecord(payload);
      const filename =
        typeof payloadObj?.filename === "string" ? payloadObj.filename : file?.name;
      setUploadMessage(
        jobId
          ? `Uploaded ${filename}. Job created: ${jobId}.`
          : `Uploaded ${filename}.`
      );
      setFile(null);
      setFileInputKey((k) => k + 1);

      if (jobsOffset !== 0) {
        setJobsOffset(0);
      } else {
        await fetchJobs(0, { mode: "initial" });
      }
    } catch (e) {
      setUploadError(extractErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const currentPage = Math.floor(jobsOffset / JOBS_LIMIT) + 1;
  const totalPages = Math.max(1, Math.ceil(jobsTotal / JOBS_LIMIT));
  const startRow = jobs.length === 0 ? 0 : jobsOffset + 1;
  const endRow = jobs.length === 0 ? 0 : jobsOffset + jobs.length;

  const onPrevPage = () => {
    setJobsOffset((prev) => Math.max(0, prev - JOBS_LIMIT));
  };

  const onNextPage = () => {
    if (!jobsHasMore) return;
    setJobsOffset((prev) => prev + JOBS_LIMIT);
  };

  const onGoToPage = () => {
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed)) return;

    const nextPage = Math.min(totalPages, Math.max(1, Math.trunc(parsed)));
    const nextOffset = (nextPage - 1) * JOBS_LIMIT;
    setJobsOffset(nextOffset);
  };

  React.useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const showInitialJobsLoading = jobsLoading && jobs.length === 0;

  return (
    <div className="app-page-stack">
      <div className="app-heading-stack">
        <h1 className="app-heading-xl">Bulk Fetch</h1>
        <p className="app-subtext">
          Upload CSV/XLSX files and monitor recent jobs in one place.
        </p>
      </div>

      {configError ? (
        <Alert variant="destructive">
          <AlertTitle>Configuration error</AlertTitle>
          <AlertDescription>{configError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Accepted formats: .csv, .xlsx, .xls
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {uploadError ? (
            <Alert variant="destructive">
              <AlertTitle>Upload failed</AlertTitle>
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          ) : null}

          {uploadMessage ? (
            <Alert className="alert-success">
              <AlertTitle className="alert-success-title">Upload successful</AlertTitle>
              <AlertDescription className="alert-success-desc">{uploadMessage}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="bulk-file">File</Label>
            <Input
              key={fileInputKey}
              id="bulk-file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={onPickFile}
              disabled={uploading || !apiBase}
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button onClick={onUpload} disabled={uploading || !apiBase}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>Recent Jobs</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {jobsUpdating ? (
              <span className="type-helper text-muted-foreground">Loading page...</span>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchJobs(jobsOffset, { mode: "update" })}
              disabled={jobsLoading || jobsUpdating}
            >
              {jobsUpdating ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {jobsError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Failed to load jobs</AlertTitle>
              <AlertDescription>{jobsError}</AlertDescription>
            </Alert>
          ) : null}

          {showInitialJobsLoading ? (
            <div className="type-helper text-muted-foreground">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="type-helper text-muted-foreground">
              No jobs yet. Upload your first file above.
            </div>
          ) : (
            <div className={`app-section-stack ${jobsUpdating ? "opacity-70" : ""}`}>
              <div className="app-table-shell overflow-x-auto">
                <Table>
                  <TableHeader className="[&_th]:text-center">
                    <TableRow>
                      <TableHead className="w-[180px]">Job ID</TableHead>
                      <TableHead>File name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created at</TableHead>
                      <TableHead>Open</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="type-mono" title={job.id}>
                          {shortJobId(job.id)}
                        </TableCell>
                        <TableCell>{job.filename || "—"}</TableCell>
                        <TableCell>
                          <span className={statusBadgeClass(job.status)}>
                            {job.status || "unknown"}
                          </span>
                        </TableCell>
                        <TableCell>{fmtDate(job.created_at)}</TableCell>
                        <TableCell>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/jobs/${job.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <div className="type-helper text-muted-foreground">
                  Showing {startRow}-{endRow} of {jobsTotal} jobs.
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrevPage}
                    disabled={jobsLoading || jobsUpdating || jobsOffset === 0}
                  >
                    Previous
                  </Button>
                  <div className="type-helper text-muted-foreground">
                    Page {currentPage} / {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="type-helper text-muted-foreground">Go to</span>
                    <Input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onGoToPage();
                      }}
                      className="h-8 w-20"
                      disabled={jobsLoading || jobsUpdating}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onGoToPage}
                      disabled={jobsLoading || jobsUpdating}
                    >
                      Go
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNextPage}
                    disabled={jobsLoading || jobsUpdating || !jobsHasMore}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

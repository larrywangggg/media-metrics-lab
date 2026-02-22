"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

function getApiBaseUrl(): string {
  // Public env var is available in the browser.
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) return "";
  return url.replace(/\/+$/, ""); // trim trailing slashes
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}

function extractFastApiDetail(payload: any): string {
  // FastAPI errors often look like:
  // { detail: "..." } OR { detail: [{ loc: [...], msg: "...", type: "..." }, ...] }
  const detail = payload?.detail;

  if (!detail) return "Upload failed.";
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => d?.msg)
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

function extractJobId(payload: any): string | null {
  // Be tolerant to backend response shape.
  // Common shapes: { job_id: "..." } or { id: "..." } or { job: { id: "..." } }
  if (typeof payload?.job_id === "string") return payload.job_id;
  if (typeof payload?.id === "string") return payload.id;
  if (typeof payload?.job?.id === "string") return payload.job.id;
  if (typeof payload?.job?.job_id === "string") return payload.job.job_id;
  return null;
}

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const apiBaseUrl = getApiBaseUrl();

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const validateFile = (f: File | null): string | null => {
    if (!f) return "Please choose a CSV or XLSX file.";

    const name = f.name.toLowerCase();
    const ok = name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls");
    if (!ok) return "Only .csv, .xlsx, or .xls files are accepted.";

    // Optional: limit size (e.g., 20MB)
    const maxBytes = 20 * 1024 * 1024;
    if (f.size > maxBytes) return "File is too large (max 20MB).";

    return null;
  };

  const onSubmit = async () => {
    setError(null);

    if (!apiBaseUrl) {
      setError("NEXT_PUBLIC_API_BASE_URL is not set. Please configure frontend/.env.local and restart dev server.");
      return;
    }

    const v = validateFile(file);
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();

      // Backend expects parameter name: file (UploadFile = File(...))
      form.append("file", file as File);

      const res = await fetch(`${apiBaseUrl}/jobs/upload`, {
        method: "POST",
        body: form,
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = payload ? extractFastApiDetail(payload) : `Upload failed (HTTP ${res.status}).`;
        setError(msg);
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: msg,
        });
        return;
      }

      const jobId = extractJobId(payload);
      if (!jobId) {
        const msg = "Upload succeeded but job_id was not returned by the backend.";
        setError(msg);
        toast({
          variant: "destructive",
          title: "Unexpected response",
          description: msg,
        });
        return;
      }

      toast({
        title: "Upload successful",
        description: `Job created: ${jobId}`,
      });

      // Navigate to job detail page.
      router.push(`/jobs/${jobId}`);
    } catch (e) {
      const msg = extractErrorMessage(e);
      setError(msg);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-0px)] flex items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Upload Data File</CardTitle>
          <CardDescription>Select a CSV or Excel file to create a job.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={onPickFile}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Accepts: .csv, .xlsx, .xls
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            className="w-full"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  if (!base) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE in frontend/.env.local. Example: NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000"
    );
  }
  return base.replace(/\/+$/, ""); // strip trailing slashes
}
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SingleHomePage() {
  return (
    <div className="app-page-stack">
      <div className="app-heading-stack">
        <h1 className="app-heading-xl">Single Link Fetch</h1>
        <p className="app-subtext">
          This page will be the default single-link workflow.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Coming next</CardTitle>
          <CardDescription>
            The single-link fetch flow will live here. For now, use the bulk workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/bulk">Go to Bulk Fetch</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

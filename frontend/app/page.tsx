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
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Single Link Fetch</h1>
        <p className="text-sm text-muted-foreground">
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

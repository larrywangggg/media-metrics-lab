import type { ReactNode } from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainLayout>{children}</MainLayout>
    </div>
  );
}

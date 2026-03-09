import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden pb-20 md:pb-0">
        {children}
      </div>
    </div>
  );
}

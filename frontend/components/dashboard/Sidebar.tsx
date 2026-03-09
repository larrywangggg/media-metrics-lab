"use client";

import { Search, FileText, Monitor, Clock, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { path: "/", icon: Search, label: "Single Fetch" },
  { path: "/bulk", icon: FileText, label: "Bulk Fetch" },
  { path: "/campaigns", icon: Monitor, label: "Campaigns" },
  { path: "/history", icon: Clock, label: "Job History" },
];

export function Sidebar() {
  const pathname = usePathname();

  const isPathActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <>
      <nav className="hidden w-20 flex-shrink-0 flex-col items-center gap-2 border-r border-gray-200/60 bg-white/80 py-6 shadow-sm backdrop-blur-xl md:flex">
        <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
          </svg>
        </div>

        {navItems.map((item) => {
          const isActive = isPathActive(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                isActive
                  ? "bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 shadow-md shadow-indigo-100"
                  : "text-gray-400 hover:bg-white hover:text-gray-700 hover:shadow-md"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2.5} />
              <div className="pointer-events-none absolute left-20 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                {item.label}
              </div>
            </Link>
          );
        })}

        <div className="mt-auto flex flex-col items-center gap-2">
          <Link
            href="/account"
            className={`group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
              pathname === "/account"
                ? "bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 shadow-md shadow-indigo-100"
                : "text-gray-400 hover:bg-white hover:text-gray-700 hover:shadow-md"
            }`}
          >
            <User className="h-5 w-5" strokeWidth={2.5} />
            <div className="pointer-events-none absolute left-20 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
              Account
            </div>
          </Link>
        </div>
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200/70 bg-white/90 px-2 py-2 shadow-lg backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          {[...navItems, { path: "/account", icon: User, label: "Account" }].map((item) => {
            const Icon = item.icon;
            const isActive = isPathActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex min-w-[64px] flex-col items-center justify-center rounded-xl px-2 py-1.5 text-[11px] font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <Icon className="mb-1 h-4 w-4" strokeWidth={2.5} />
                <span>{item.label.replace(" Fetch", "")}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

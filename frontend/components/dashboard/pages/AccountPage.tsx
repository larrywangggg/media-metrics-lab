"use client";

import { useState } from "react";
import { User, CreditCard, Bell, Moon, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 cursor-pointer rounded-full shadow-inner transition-all ${
        checked ? "bg-gradient-to-r from-indigo-600 to-purple-600" : "bg-gray-300"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all ${
          checked ? "right-0.5" : "left-0.5"
        }`}
      />
    </button>
  );
}

export function AccountPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center px-8 gap-3 flex-shrink-0 shadow-sm">
        <span className="text-base font-semibold text-gray-900">Account Settings</span>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[900px] mx-auto space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
            </div>
            <div className="px-8 pb-8 -mt-12 relative">
              <div className="flex items-end gap-6 mb-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-2xl border-4 border-white">
                  AM
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-gray-900">Alex Marketing</h2>
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md">
                      Pro Plan
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">alex@brand.co</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Alex Marketing"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="alex@brand.co"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                  />
                </div>
              </div>
              <Button>Save Changes</Button>
            </div>
          </div>

          {/* Plan & Usage Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Plan & Usage</div>
                <div className="text-xs text-gray-400">Manage your subscription</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 mb-6 border border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    <div className="text-base font-bold text-gray-900">Pro Plan</div>
                  </div>
                  <div className="text-sm text-gray-600">$49/month · Renews Apr 5, 2026</div>
                </div>
                <Button variant="secondary" size="sm">Manage Billing</Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
                  <div className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Monthly Fetches</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-sm" style={{ width: '43%' }}></div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-gray-900">4,300</span>
                    <span className="text-xs text-gray-400">/ 10,000</span>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
                  <div className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Campaigns</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-sm" style={{ width: '24%' }}></div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-gray-900">12</span>
                    <span className="text-xs text-gray-400">/ 50</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Preferences</div>
                <div className="text-xs text-gray-400">Customize your experience</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <Bell className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Email Notifications</div>
                    <div className="text-xs text-gray-500 mt-0.5">Get notified when bulk jobs complete</div>
                  </div>
                </div>
                <Toggle checked={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
              </div>

              <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Auto-refresh Metrics</div>
                    <div className="text-xs text-gray-500 mt-0.5">Refresh campaign data every 24h</div>
                  </div>
                </div>
                <Toggle checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} />
              </div>

              <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Moon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Dark Mode</div>
                    <div className="text-xs text-gray-500 mt-0.5">Switch to dark theme</div>
                  </div>
                </div>
                <Toggle checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { Search, FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const todayJobs = [
  {
    id: '1',
    name: 'Q1 Influencer Campaign URLs.xlsx',
    time: 'Mar 5, 2026 · 14:22',
    type: 'Bulk Job',
    count: '87 / 124',
    progress: 70,
    status: 'Processing',
    isBulk: true,
  },
  {
    id: '2',
    name: 'Single Fetch Session',
    time: 'Mar 5, 2026 · 11:05',
    type: '4 URLs',
    count: '4 videos',
    status: 'Complete',
    isBulk: false,
  },
];

const thisWeekJobs = [
  {
    id: '3',
    name: 'Nike_Spring_Videos_Final.csv',
    time: 'Mar 3, 2026 · 09:41',
    type: 'Bulk Job',
    count: '56 videos',
    progress: 100,
    status: 'Complete',
    isBulk: true,
  },
  {
    id: '4',
    name: 'Competitor_TikTok_batch.xlsx',
    time: 'Mar 2, 2026 · 17:13',
    type: 'Bulk Job',
    count: '210 videos',
    progress: 100,
    status: 'Complete',
    isBulk: true,
  },
  {
    id: '5',
    name: 'Single Fetch Session',
    time: 'Mar 1, 2026 · 15:30',
    type: '7 URLs',
    count: '7 videos',
    status: 'Failed (2)',
    isBulk: false,
  },
];

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'Complete') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
        <CheckCircle className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{status}</span>
      </div>
    );
  }
  if (status === 'Processing') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
        <Clock className="w-3.5 h-3.5 animate-spin" />
        <span className="text-xs font-medium">{status}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 border border-red-200 shadow-sm">
      <XCircle className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">{status}</span>
    </div>
  );
};

export function HistoryPage() {
  return (
    <>
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center px-8 gap-3 flex-shrink-0 shadow-sm">
        <div>
          <span className="text-base font-semibold text-gray-900">Job History</span>
          <span className="text-sm text-gray-400 ml-2">All fetch jobs, sorted by recency</span>
        </div>
        <div className="ml-auto">
          <Button variant="secondary" size="sm">
            Filter
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Today */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today</div>
              <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {todayJobs.map((job, idx) => (
                <div
                  key={job.id}
                  className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-all group ${
                    idx !== todayJobs.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                    job.isBulk 
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-200' 
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200'
                  }`}>
                    {job.isBulk ? (
                      <FileText className="w-6 h-6 text-white" strokeWidth={2} />
                    ) : (
                      <Search className="w-6 h-6 text-white" strokeWidth={2} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors truncate">
                      {job.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {job.time} — <span className="text-gray-400">{job.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-medium min-w-[80px] text-right">{job.count}</span>
                    {job.progress !== undefined && (
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all shadow-sm" 
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                    )}
                    <StatusBadge status={job.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* This Week */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">This Week</div>
              <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {thisWeekJobs.map((job, idx) => (
                <div
                  key={job.id}
                  className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-all group ${
                    idx !== thisWeekJobs.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                    job.isBulk 
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-200' 
                      : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200'
                  }`}>
                    {job.isBulk ? (
                      <FileText className="w-6 h-6 text-white" strokeWidth={2} />
                    ) : (
                      <Search className="w-6 h-6 text-white" strokeWidth={2} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors truncate">
                      {job.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {job.time} — <span className="text-gray-400">{job.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-medium min-w-[80px] text-right">{job.count}</span>
                    {job.progress !== undefined && (
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all shadow-sm" 
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                    )}
                    <StatusBadge status={job.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

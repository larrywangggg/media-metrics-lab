import { Download, Plus, Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockBulkData = [
  {
    id: '1',
    platform: 'YouTube',
    channel: '@pewdiepie',
    title: 'I Played Minecraft For 100 Days',
    published: '2025-01-12',
    views: '18.4M',
    likes: '890K',
    comments: '42K',
    status: 'Done',
  },
  {
    id: '2',
    platform: 'TikTok',
    channel: '@charlidamelio',
    title: 'Dance challenge gone wrong 😂',
    published: '2025-02-05',
    views: '31.2M',
    likes: '3.4M',
    comments: '56K',
    status: 'Done',
  },
  {
    id: '3',
    platform: 'Instagram',
    channel: '@nike',
    title: 'Just Do It — Spring 2025 Campaign',
    published: '2025-03-02',
    views: '5.1M',
    likes: '220K',
    comments: '4.1K',
    status: 'Done',
  },
  {
    id: '4',
    platform: 'YouTube',
    channel: '@linus',
    title: 'Building the Most Expensive PC Ever',
    published: '2025-02-27',
    views: '—',
    likes: '—',
    comments: '—',
    status: 'Pending',
  },
];

const platformGradients = {
  YouTube: 'from-red-500 to-pink-500',
  Instagram: 'from-pink-500 to-purple-500',
  TikTok: 'from-gray-800 to-gray-900',
};

export function BulkFetchPage() {
  return (
    <>
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center px-8 gap-3 flex-shrink-0 shadow-sm">
        <div>
          <span className="text-base font-semibold text-gray-900">Bulk Fetch</span>
          <span className="text-sm text-gray-400 ml-2">Upload CSV/XLSX with video URLs</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button variant="secondary" size="sm">
            <Download className="w-4 h-4" />
            Download Template
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4" />
            New Bulk Job
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Upload Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Upload File</div>
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center group-hover:from-indigo-200 group-hover:to-purple-200 transition-all shadow-md">
                <Upload className="w-8 h-8 text-indigo-600" strokeWidth={2} />
              </div>
              <p className="font-semibold text-base text-gray-700 mb-2">Drop your file here, or click to browse</p>
              <p className="text-sm text-gray-400 mb-3">
                Accepted: .csv, .xlsx, .xls — must include a <code className="bg-gray-100 px-2 py-1 rounded-lg text-indigo-600 font-mono text-xs">url</code> column
              </p>
              <p className="text-xs text-gray-400">Maximum file size: 10MB</p>
            </div>
          </div>

          {/* Active Job Card */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl overflow-hidden shadow-lg border border-purple-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200">
                    <FileText className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-900">Q1 Influencer Campaign URLs.xlsx</div>
                    <div className="text-sm text-gray-500">Started 2 min ago · 124 URLs</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                    ⏳ Processing
                  </span>
                  <button className="w-8 h-8 rounded-lg bg-white/60 hover:bg-white flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors shadow-sm">
                    <AlertCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-sm">
                <div className="flex justify-between text-xs text-gray-600 mb-2 font-medium">
                  <span>Fetched 87 of 124 videos</span>
                  <span className="text-indigo-600 font-semibold">70%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all shadow-sm" style={{ width: '70%' }}></div>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-gray-500">Estimated time: ~3 minutes</span>
                  <span className="text-emerald-600 font-medium">87 successful</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Fetched Data</div>
                <div className="text-xs text-gray-400 mt-0.5">{mockBulkData.length} rows retrieved</div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Channel</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Published</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Likes</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Comments</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockBulkData.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${platformGradients[row.platform as keyof typeof platformGradients]} flex items-center justify-center shadow-md`}>
                            <span className="w-2 h-2 rounded-full bg-white"></span>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{row.platform}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">{row.channel}</span>
                      </td>
                      <td className="px-6 py-4 max-w-[250px]">
                        <div className="text-sm text-gray-600 truncate">{row.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.published}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">{row.views}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">{row.likes}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">{row.comments}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                          row.status === 'Done' 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { Plus, Video, Tag, Activity, MoreVertical, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { 
    label: 'Total Campaigns', 
    value: '12', 
    sub: '+2 this month',
    color: 'from-blue-500 to-cyan-500',
    shadowColor: 'shadow-blue-200'
  },
  { 
    label: 'Videos Tracked', 
    value: '847', 
    sub: 'Across all campaigns',
    color: 'from-purple-500 to-pink-500',
    shadowColor: 'shadow-purple-200'
  },
  { 
    label: 'Total Views', 
    value: '2.4B', 
    sub: 'Cumulative',
    color: 'from-emerald-500 to-teal-500',
    shadowColor: 'shadow-emerald-200'
  },
  { 
    label: 'Avg. Engagement', 
    value: '4.7%', 
    sub: 'Likes + Comments / Views',
    color: 'from-amber-500 to-orange-500',
    shadowColor: 'shadow-amber-200'
  },
];

const campaigns = [
  {
    id: '1',
    name: 'Q1 Influencer Round-up',
    updated: 'Mar 3, 2025',
    videoCount: 124,
    platforms: ['YouTube', 'Instagram'],
    status: 'Active',
    statusColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    views: '312M',
    likes: '14.2M',
    engagement: '4.6%',
    icon: Video,
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    id: '2',
    name: 'Nike Spring Campaign',
    updated: 'Feb 28, 2025',
    videoCount: 56,
    platforms: ['YouTube', 'Instagram'],
    status: 'Archived',
    statusColor: 'bg-gray-100 text-gray-600 border-gray-200',
    views: '88.4M',
    likes: '5.9M',
    engagement: '6.7%',
    icon: Tag,
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: '3',
    name: 'Competitor Benchmarks',
    updated: 'Today',
    videoCount: 210,
    platforms: ['TikTok', 'YouTube'],
    status: 'Live',
    statusColor: 'bg-blue-100 text-blue-700 border-blue-200',
    views: '1.1B',
    likes: '92M',
    engagement: '8.4%',
    icon: Activity,
    gradient: 'from-cyan-500 to-blue-500',
  },
];

const platformColors = {
  YouTube: 'bg-red-50 border-red-200 text-red-600',
  Instagram: 'bg-pink-50 border-pink-200 text-pink-600',
  TikTok: 'bg-gray-100 border-gray-300 text-gray-700',
};

const platformDots = {
  YouTube: 'bg-red-500',
  Instagram: 'bg-pink-500',
  TikTok: 'bg-gray-900',
};

export function CampaignsPage() {
  return (
    <>
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center px-8 gap-3 flex-shrink-0 shadow-sm">
        <div>
          <span className="text-base font-semibold text-gray-900">Campaigns</span>
          <span className="text-sm text-gray-400 ml-2">Manage your saved video collections</span>
        </div>
        <div className="ml-auto">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg ${stat.shadowColor} flex items-center justify-center`}>
                    <ArrowUpRight className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Campaigns Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-gray-900">Your Campaigns</div>
              <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all</button>
            </div>

            <div className="grid grid-cols-3 gap-5">
              {campaigns.map((campaign) => {
                const Icon = campaign.icon;
                return (
                  <div
                    key={campaign.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer group"
                  >
                    {/* Header with gradient */}
                    <div className={`h-20 bg-gradient-to-br ${campaign.gradient} relative`}>
                      <div className="absolute inset-0 bg-white/10"></div>
                      <div className="absolute top-4 right-4">
                        <button className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 -mt-8 relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${campaign.gradient} shadow-xl flex items-center justify-center relative`}>
                          <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border shadow-sm ${campaign.statusColor}`}>
                          {campaign.status}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="text-base font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{campaign.name}</div>
                        <div className="text-xs text-gray-400">
                          Updated {campaign.updated} · {campaign.videoCount} videos
                        </div>
                      </div>

                      <div className="flex gap-2 mb-5">
                        {campaign.platforms.map((platform) => (
                          <span
                            key={platform}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border shadow-sm flex items-center gap-1.5 ${platformColors[platform as keyof typeof platformColors]}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${platformDots[platform as keyof typeof platformDots]}`}></span>
                            {platform === 'YouTube' ? 'YT' : platform === 'Instagram' ? 'IG' : 'TT'}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-5 border-t border-gray-100">
                        <div>
                          <div className="text-base font-bold text-gray-900">{campaign.views}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">Views</div>
                        </div>
                        <div>
                          <div className="text-base font-bold text-gray-900">{campaign.likes}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">Likes</div>
                        </div>
                        <div>
                          <div className="text-base font-bold text-gray-900">{campaign.engagement}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">Eng. Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* New Campaign Card */}
              <div className="bg-white/60 backdrop-blur-sm border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[340px] text-gray-400 cursor-pointer hover:border-indigo-400 hover:bg-white hover:shadow-lg transition-all group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:from-indigo-100 group-hover:to-purple-100 transition-all shadow-md">
                  <Plus className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 transition-colors" strokeWidth={2} />
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">Create Campaign</div>
                  <div className="text-xs text-gray-400 mt-1">Start tracking new videos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

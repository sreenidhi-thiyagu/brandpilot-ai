"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, TrendingUp, BarChart, RefreshCw, AlertCircle } from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (!Array.isArray(data)) return;
      const sentCampaigns = data.filter((c: any) => c.status === 'sent');
      setCampaigns(sentCampaigns);
      // Auto-select first campaign only if nothing selected yet
      if (sentCampaigns.length > 0 && !selectedId) {
        setSelectedId(sentCampaigns[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchStats = useCallback(async () => {
    if (!selectedId) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${selectedId}/stats`);
      const data = await res.json();
      if (!data.error) setStatsData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setStatsLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) { setStatsData(null); return; }
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Poll for real-time updates
    return () => clearInterval(interval);
  }, [selectedId, fetchStats]);

  if (loading) {
    return <div className="p-8 text-center"><Loader2 size={24} className="animate-spin mx-auto text-indigo-500" /></div>;
  }

  const chartData = statsData ? [
    { name: "Sent", value: statsData.stats.sent },
    { name: "Delivered", value: statsData.stats.delivered },
    { name: "Opened", value: statsData.stats.opened },
    { name: "Clicked", value: statsData.stats.clicked },
    { name: "Converted", value: statsData.stats.converted },
  ] : [];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campaign Analytics</h1>
        <p className="text-slate-500 mt-1">Real-time performance tracking and AI insights.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-4">
          <label className="font-medium text-slate-700">Select Campaign:</label>
          {campaigns.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No sent campaigns yet. Send a campaign first.</p>
          ) : (
            <select
              className="flex-1 max-w-md p-2 border border-slate-300 rounded-lg bg-slate-50"
              value={selectedId || ""}
              onChange={e => setSelectedId(e.target.value)}
            >
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={fetchStats}
            disabled={!selectedId || statsLoading}
            className="p-2 text-slate-500 hover:text-indigo-600 transition-colors bg-slate-100 rounded-lg disabled:opacity-40"
          >
            <RefreshCw size={18} className={statsLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
          <AlertCircle size={40} className="mb-4 text-slate-300" />
          <p className="text-lg font-medium">No analytics yet</p>
          <p className="text-sm mt-2">Go to <strong>Campaigns</strong>, send a campaign, then come back here.</p>
        </div>
      )}

      {statsData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Sent", value: statsData.stats.sent, color: "text-slate-900", sub: null },
              { label: "Delivered", value: statsData.stats.delivered, color: "text-emerald-600",
                sub: statsData.stats.sent ? `${Math.round((statsData.stats.delivered / statsData.stats.sent) * 100)}% delivery rate` : null },
              { label: "Opened", value: statsData.stats.opened, color: "text-blue-600",
                sub: statsData.stats.delivered ? `${Math.round((statsData.stats.opened / statsData.stats.delivered) * 100)}% open rate` : null },
              { label: "Clicked", value: statsData.stats.clicked, color: "text-amber-600",
                sub: statsData.stats.opened ? `${Math.round((statsData.stats.clicked / statsData.stats.opened) * 100)}% click rate` : null },
              { label: "Converted", value: statsData.stats.converted, color: "text-rose-600",
                sub: statsData.stats.clicked ? `${Math.round((statsData.stats.converted / statsData.stats.clicked) * 100)}% conversion` : null },
            ].map((card) => (
              <div key={card.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                {card.sub && <p className={`text-xs font-medium mt-1 ${card.color}`}>{card.sub}</p>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <BarChart size={18} className="text-indigo-600" />
                Funnel Performance
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
              <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <TrendingUp size={18} />
                AI Campaign Insight
              </h3>
              <div className="prose prose-sm text-indigo-800 space-y-3">
                <p>
                  This campaign performed on the <strong>{statsData.campaign?.channel || 'selected'}</strong> channel.
                  {statsData.stats.delivered > 0 && statsData.stats.sent > 0 &&
                    ` Delivery rate: ${Math.round((statsData.stats.delivered / statsData.stats.sent) * 100)}%.`}
                </p>
                {statsData.stats.opened > 0 && statsData.stats.delivered > 0 && (
                  <p>
                    Open rate: <strong>{Math.round((statsData.stats.opened / statsData.stats.delivered) * 100)}%</strong>.
                    {Math.round((statsData.stats.opened / statsData.stats.delivered) * 100) >= 40
                      ? " This is above industry average — great copy!"
                      : " There's room to improve subject lines or send-time."}
                  </p>
                )}
                <p className="mt-4">
                  <strong>Recommendation:</strong> If conversion drop-off is high, test a stronger CTA or reduce steps to purchase in your next campaign.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

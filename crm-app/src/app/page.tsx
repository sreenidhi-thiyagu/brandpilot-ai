"use client";

import { useState, useEffect } from "react";
import { Loader2, Users, ShoppingBag, Send, MousePointerClick, CheckCircle, Lightbulb, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, campRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/campaigns')
        ]);
        setStats(await statsRes.json());
        setCampaigns(await campRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    
    // Auto refresh every 5 seconds for demo purposes
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  const statCards = [
    { name: "Total Customers", value: stats?.customers, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Total Orders", value: stats?.orders, icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-100" },
    { name: "Messages Sent", value: stats?.messages, icon: Send, color: "text-indigo-600", bg: "bg-indigo-100" },
    { name: "Delivery Rate", value: `${stats?.deliveryRate}%`, icon: CheckCircle, color: "text-teal-600", bg: "bg-teal-100" },
    { name: "Open Rate", value: `${stats?.openRate}%`, icon: MousePointerClick, color: "text-amber-600", bg: "bg-amber-100" },
    { name: "Conversion", value: `${stats?.conversionRate}%`, icon: ShoppingBag, color: "text-rose-600", bg: "bg-rose-100" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your GlowCare Beauty performance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start">
            <div className={`p-2 rounded-lg ${s.bg} ${s.color} mb-3`}>
              <s.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">{s.name}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Recent Campaigns</h3>
            <Link href="/campaigns" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 font-medium">Campaign</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.slice(0, 5).map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-900">{c.name}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider
                        ${c.status === 'sent' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl shadow-sm p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lightbulb size={120} />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2 text-indigo-300 mb-4">
              <Sparkles size={18} />
              <span className="text-sm font-semibold uppercase tracking-wider">AI Insight</span>
            </div>
            <p className="text-lg font-medium leading-relaxed mb-6">
              Your "Dormant Chennai Skincare VIPs" segment has not been targeted recently. Sending a WhatsApp campaign with a 15% offer could reactivate 30% of them.
            </p>
            <div className="mt-auto pt-4 border-t border-indigo-800/50">
              <Link href="/campaigns" className="inline-flex items-center text-sm font-medium text-white hover:text-indigo-200 transition-colors">
                Create Campaign <span className="ml-2">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

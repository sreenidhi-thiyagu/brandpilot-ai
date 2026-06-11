"use client";

import { useState, useEffect } from "react";
import { Loader2, Send, Sparkles, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    goal: "",
    segment_id: "",
    channel: "whatsapp",
    tone: "Friendly",
    offer: ""
  });

  const [generatedMsg, setGeneratedMsg] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campRes, segRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/segments')
      ]);
      setCampaigns(await campRes.json());
      setSegments(await segRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setAiError("");
    try {
      const segment = segments.find(s => s.id === form.segment_id);
      const res = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: form.goal,
          segmentName: segment ? segment.name : "All Customers",
          channel: form.channel,
          tone: form.tone,
          offer: form.offer
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Failed to generate message");
        return;
      }
      setGeneratedMsg(data.messageTemplate);
      if (!form.name && data.suggestedName) {
        setForm(f => ({ ...f, name: data.suggestedName }));
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "An error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.segment_id || !generatedMsg) return;
    setSaving(true);
    try {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          goal: form.goal,
          segment_id: form.segment_id,
          channel: form.channel,
          message_template: generatedMsg
        })
      });
      await fetchData();
      setForm({ name: "", goal: "", segment_id: "", channel: "whatsapp", tone: "Friendly", offer: "" });
      setGeneratedMsg("");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id: string) => {
    setSendingId(id);
    try {
      await fetch(`/api/campaigns/${id}/send`, { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campaign Builder</h1>
          <p className="text-slate-500 mt-1">Design and launch AI-powered campaigns.</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Segment</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-lg"
                value={form.segment_id}
                onChange={e => setForm({...form, segment_id: e.target.value})}
              >
                <option value="">Select a segment...</option>
                {segments.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.customer_count})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Channel</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-lg"
                value={form.channel}
                onChange={e => setForm({...form, channel: e.target.value})}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="rcs">RCS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Goal</label>
              <input 
                type="text" 
                placeholder="e.g. Drive weekend sales"
                className="w-full p-2 border border-slate-300 rounded-lg"
                value={form.goal}
                onChange={e => setForm({...form, goal: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tone</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-lg"
                value={form.tone}
                onChange={e => setForm({...form, tone: e.target.value})}
              >
                <option value="Friendly">Friendly</option>
                <option value="Premium">Premium</option>
                <option value="Urgent">Urgent</option>
                <option value="Minimal">Minimal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Offer (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. 15% off using code GLOW15"
              className="w-full p-2 border border-slate-300 rounded-lg"
              value={form.offer}
              onChange={e => setForm({...form, offer: e.target.value})}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !form.segment_id}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Generate Message with AI
          </button>

          {aiError && (
            <div className="mt-4 bg-red-50 p-4 rounded-xl border border-red-200 text-red-700">
              <strong>Error:</strong> {aiError}
            </div>
          )}

          {generatedMsg && (
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-lg font-medium"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message Template</label>
                <textarea 
                  className="w-full p-3 border border-slate-300 rounded-lg h-32 resize-none text-slate-800"
                  value={generatedMsg}
                  onChange={e => setGeneratedMsg(e.target.value)}
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !generatedMsg}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Save Campaign
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-96 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Send size={18} className="text-slate-500" />
              Recent Campaigns
            </h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                Loading...
              </div>
            ) : campaigns.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No campaigns yet.
              </div>
            ) : (
              campaigns.map((c) => (
                <div key={c.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-900 line-clamp-1">{c.name}</h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider
                      ${c.status === 'sent' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500 mb-3">
                    <span className="capitalize font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{c.channel}</span>
                    <span className="truncate">{c.segments?.name || 'Unknown Segment'}</span>
                  </div>
                  {c.status === 'draft' && (
                    <button
                      onClick={() => handleSend(c.id)}
                      disabled={sendingId === c.id}
                      className="w-full flex justify-center items-center gap-1.5 py-1.5 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {sendingId === c.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Send Now
                    </button>
                  )}
                  {c.status === 'sent' && (
                    <p className="text-[10px] text-slate-400 text-right mt-2">Sent {formatDate(c.sent_at)}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

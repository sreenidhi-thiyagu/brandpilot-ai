"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, UserPlus, Plus, Trash2, SlidersHorizontal } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function SegmentsPage() {
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");

  // AI Builder State
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiError, setAiError] = useState("");

  // Manual Builder State
  const [manualName, setManualName] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualRules, setManualRules] = useState([{ field: "city", operator: "equals", value: "" }]);
  const [savingManual, setSavingManual] = useState(false);
  const [manualResult, setManualResult] = useState<any>(null);

  const fetchSegments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/segments');
      const data = await res.json();
      setSegments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleGenerateAI = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setAiResult(null);
    setAiError("");
    try {
      const res = await fetch('/api/segments/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Failed to generate segment");
        return;
      }
      setAiResult(data);
      fetchSegments();
      setPrompt("");
    } catch (error: any) {
      console.error(error);
      setAiError(error.message || "An error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddRule = () => {
    setManualRules([...manualRules, { field: "city", operator: "equals", value: "" }]);
  };

  const handleRemoveRule = (index: number) => {
    setManualRules(manualRules.filter((_, i) => i !== index));
  };

  const handleRuleChange = (index: number, key: string, value: string) => {
    const newRules = [...manualRules];
    newRules[index] = { ...newRules[index], [key]: value };
    // Reset operator if field changes
    if (key === "field") {
      if (["city", "preferred_category", "gender"].includes(value)) {
        newRules[index].operator = "equals";
      } else if (["age", "total_spent"].includes(value)) {
        newRules[index].operator = "greater_than";
      } else if (value === "last_purchase_date") {
        newRules[index].operator = "before";
      }
    }
    setManualRules(newRules);
  };

  const handleSaveManual = async () => {
    if (!manualName.trim()) return;
    setSavingManual(true);
    setManualResult(null);
    try {
      const res = await fetch('/api/segments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: manualName, description: manualDescription, rules: manualRules })
      });
      const data = await res.json();
      setManualResult(data);
      fetchSegments();
      setManualName("");
      setManualDescription("");
      setManualRules([{ field: "city", operator: "equals", value: "" }]);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingManual(false);
    }
  };

  const renderAiBuilder = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <label className="block text-sm font-medium text-slate-700 mb-2">Prompt</label>
        <textarea
          className="w-full p-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none"
          placeholder='e.g. "Find high-value skincare customers from Chennai who have not purchased in 60 days"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleGenerateAI}
            disabled={generating || !prompt.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
          >
            {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Generate Segment
          </button>
        </div>
        
        <div className="mt-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Templates</p>
          <div className="flex flex-wrap gap-2">
            {["Dormant Chennai Skincare VIPs", "High Value Customers", "New Customers", "Repeat Buyers"].map((t) => (
              <button
                key={t}
                onClick={() => setPrompt(`Find ${t.toLowerCase()}`)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-md transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {aiError && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700">
          <strong>Error:</strong> {aiError}
        </div>
      )}

      {aiResult && (
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-800 mb-2">
            <Sparkles size={20} />
            <h3 className="font-semibold text-lg">Segment Created Successfully!</h3>
          </div>
          <p className="text-emerald-700 font-medium">{aiResult.segment?.name}</p>
          <p className="text-sm text-emerald-600 mt-1">{aiResult.segment?.description}</p>
          <div className="mt-4 p-4 bg-white/60 rounded-lg border border-emerald-100">
            <p className="text-sm text-slate-700"><strong>Matched Customers:</strong> {aiResult.matchedCount}</p>
            <p className="text-sm text-slate-700 mt-2"><strong>Applied Rules:</strong></p>
            <pre className="text-xs mt-1 p-2 bg-slate-800 text-emerald-400 rounded overflow-x-auto">
              {JSON.stringify(aiResult.rules, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  const renderManualBuilder = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Segment Name *</label>
          <input
            type="text"
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. VIP Customers Mumbai"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <input
            type="text"
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Customers from Mumbai who spent over 1000"
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value)}
          />
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Segment Rules</h4>
          <div className="space-y-3">
            {manualRules.map((rule, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select
                  className="p-2 border border-slate-300 rounded-lg text-sm flex-1 bg-white"
                  value={rule.field}
                  onChange={(e) => handleRuleChange(idx, "field", e.target.value)}
                >
                  <option value="city">City</option>
                  <option value="gender">Gender</option>
                  <option value="preferred_category">Preferred Category</option>
                  <option value="total_spent">Total Spent</option>
                  <option value="age">Age</option>
                  <option value="last_purchase_date">Last Purchase Date</option>
                </select>

                <select
                  className="p-2 border border-slate-300 rounded-lg text-sm w-36 bg-white"
                  value={rule.operator}
                  onChange={(e) => handleRuleChange(idx, "operator", e.target.value)}
                >
                  {["city", "preferred_category", "gender"].includes(rule.field) && (
                    <>
                      <option value="equals">Equals</option>
                      <option value="contains">Contains</option>
                    </>
                  )}
                  {["total_spent", "age"].includes(rule.field) && (
                    <>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                      <option value="equals">Equals</option>
                    </>
                  )}
                  {rule.field === "last_purchase_date" && (
                    <>
                      <option value="before">Before</option>
                      <option value="after">After</option>
                    </>
                  )}
                </select>

                <input
                  type={rule.field === "last_purchase_date" ? "date" : rule.field === "total_spent" || rule.field === "age" ? "number" : "text"}
                  className="p-2 border border-slate-300 rounded-lg text-sm flex-1"
                  placeholder="Value..."
                  value={rule.value}
                  onChange={(e) => handleRuleChange(idx, "value", e.target.value)}
                />

                <button
                  onClick={() => handleRemoveRule(idx)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={manualRules.length === 1}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddRule}
            className="mt-3 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            <Plus size={16} /> Add Rule
          </button>
        </div>

        <div className="pt-4 flex gap-2">
          <button
            onClick={handleSaveManual}
            disabled={savingManual || !manualName.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors font-medium"
          >
            {savingManual ? <Loader2 size={18} className="animate-spin" /> : <SlidersHorizontal size={18} />}
            Create Segment
          </button>
        </div>
      </div>

      {manualResult && (
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-800 mb-2">
            <Sparkles size={20} />
            <h3 className="font-semibold text-lg">Segment Created Successfully!</h3>
          </div>
          <p className="text-emerald-700 font-medium">{manualResult.segment?.name}</p>
          <div className="mt-4 p-4 bg-white/60 rounded-lg border border-emerald-100">
            <p className="text-sm text-slate-700"><strong>Matched Customers:</strong> {manualResult.matchedCount}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Segment Builder</h1>
          <p className="text-slate-500 mt-1">Carve out audiences based on behaviour and attributes.</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${
              activeTab === "ai" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles size={16} /> AI Builder
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${
              activeTab === "manual" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <SlidersHorizontal size={16} /> Manual Builder
          </button>
        </div>

        {activeTab === "ai" ? renderAiBuilder() : renderManualBuilder()}
      </div>

      <div className="w-full lg:w-96 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <UserPlus size={18} className="text-slate-500" />
            <h3 className="font-semibold text-slate-800">Saved Segments</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                Loading...
              </div>
            ) : segments.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No segments yet. Generate one to get started.
              </div>
            ) : (
              segments.map((s) => (
                <div key={s.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-slate-900">{s.name}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                      {s.customer_count} users
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {s.created_by_ai ? "🤖 AI Generated" : "🛠️ Manually Created"} {s.description ? `• ${s.description}` : ""}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2 text-right">{formatDate(s.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


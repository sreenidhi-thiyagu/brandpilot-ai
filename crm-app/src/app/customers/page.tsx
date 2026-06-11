"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Loader2, Database } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [searchCity, setSearchCity] = useState("");
  const [searchCategory, setSearchCategory] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchCity) params.append("city", searchCity);
      if (searchCategory) params.append("category", searchCategory);
      
      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchCity, searchCategory]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await fetch('/api/customers/seed', { method: 'POST' });
      await fetchCustomers();
    } catch (error) {
      console.error(error);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">Manage and view your shopper database.</p>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {seeding ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
          Seed Demo Data
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex gap-4 bg-slate-50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by city..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by category..."
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">City</th>
                <th className="px-6 py-4 font-medium">Preferred Category</th>
                <th className="px-6 py-4 font-medium">Total Spent</th>
                <th className="px-6 py-4 font-medium">Last Purchase</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No customers found. Click "Seed Demo Data" to generate some.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-0 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{customer.name}</td>
                    <td className="px-6 py-4 text-slate-600">{customer.city}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {customer.preferred_category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-medium">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(customer.last_purchase_date)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

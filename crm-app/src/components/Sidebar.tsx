"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, Send, BarChart3, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "AI Segments", href: "/segments", icon: UserPlus },
  { name: "Campaigns", href: "/campaigns", icon: Send },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-slate-950 text-slate-300 border-r border-slate-800 h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 py-8">
        <div className="p-2 bg-indigo-600 rounded-lg text-white">
          <Fingerprint size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">BrandPilot <span className="text-indigo-400">AI</span></h1>
          <p className="text-xs text-slate-500 font-medium">GlowCare Beauty</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-indigo-600/10 text-indigo-400" 
                  : "hover:bg-slate-900 hover:text-white"
              )}
            >
              <item.icon 
                size={18} 
                className={cn(
                  "transition-colors",
                  isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 mb-1">AI Status</p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm text-slate-300">Models Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}

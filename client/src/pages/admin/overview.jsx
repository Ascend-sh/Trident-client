import {
    RefreshCw,
    AlertCircle
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import CenterModal from "../../components/modals/center-modal";
import { Button } from "@/components/ui/button";
import { request } from "@/lib/request.js";

export default function AdminOverview() {
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [trafficRange, setTrafficRange] = useState("7d");

  const trafficData = useMemo(() => {
    const ranges = {
      "24h": { count: 24, label: (i) => `${String(i).padStart(2, "0")}:00`, base: 40, variance: 30 },
      "7d": { count: 7, label: (i) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i], base: 120, variance: 80 },
      "30d": { count: 30, label: (i) => `${i + 1}`, base: 200, variance: 150 }
    };
    const r = ranges[trafficRange];
    return Array.from({ length: r.count }, (_, i) => ({
      name: r.label(i),
      requests: Math.floor(r.base + Math.random() * r.variance),
      visitors: Math.floor((r.base + Math.random() * r.variance) * 0.4)
    }));
  }, [trafficRange]);

  const handleUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      setUpdateModalOpen(false);
    }, 2000);
  };

  return (
    <div className="bg-surface px-10 py-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">Overview</h1>
          <p className="text-[13px] font-bold text-muted-foreground mt-2">Monitor platform health and manage global server configuration</p>
        </div>
      </div>

      <div className="border border-surface-lighter rounded-lg p-6 mb-10 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <img src="/Logo-dark.png" alt="Torqen" className="h-7 dark:invert" />
          <div className="h-8 w-px bg-surface-lighter" />
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Version</p>
              <p className="text-[13px] font-bold text-foreground tracking-tight">v0.5.0</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Channel</p>
              <p className="text-[13px] font-bold text-foreground tracking-tight">Beta</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Build</p>
              <p className="text-[13px] font-bold text-foreground tracking-tight">Swell</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setUpdateModalOpen(true)}
          className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-all cursor-pointer"
        >
          <RefreshCw size={12} className={isUpdating ? "animate-spin" : ""} />
          Check for Updates
        </button>
      </div>

      <div className="grid grid-cols-4 border border-surface-lighter rounded-lg overflow-hidden mb-10">
        {[
          { label: "Users", value: "127" },
          { label: "Servers", value: "42" },
          { label: "Nests", value: "8" },
          { label: "Status", value: "Up-to-Date" },
        ].map((stat, i) => (
          <div key={i} className={`px-6 py-5 ${i > 0 ? 'border-l border-surface-lighter' : ''}`}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{stat.label}</p>
            <p className="text-[24px] font-bold text-foreground tracking-tighter leading-none">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-10">
        <div className="border border-surface-lighter rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[16px] font-bold text-foreground/70 tracking-tight">Traffic Analytics</h2>
            <div className="flex items-center gap-1 bg-surface-light rounded-md p-0.5 border border-surface-lighter">
              {[
                { label: "24H", value: "24h" },
                { label: "7D", value: "7d" },
                { label: "30D", value: "30d" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTrafficRange(opt.value)}
                  className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all cursor-pointer ${trafficRange === opt.value ? 'bg-surface text-foreground shadow-sm border border-surface-lighter' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[220px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData} margin={{ top: 0, right: 5, left: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.05} />
                    <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "var(--muted-foreground)" }}
                  dy={8}
                  padding={{ left: 10, right: 10 }}
                  interval={0}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--surface-lighter)",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                  }}
                  itemStyle={{ color: "var(--foreground)", padding: "1px 0" }}
                  labelStyle={{ color: "var(--muted-foreground)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}
                />
                <Area type="monotone" dataKey="requests" stroke="var(--color-brand)" strokeWidth={1.5} fill="url(#reqGrad)" />
                <Area type="monotone" dataKey="visitors" stroke="var(--color-brand)" strokeWidth={1.5} strokeOpacity={0.3} fill="url(#visGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      <div className="mb-10">
        <h2 className="text-[14px] font-bold text-foreground/60 tracking-tight mb-4">User Blacklist</h2>
        <div className="border border-surface-lighter rounded-lg">
          <div className="px-6 py-4 border-b border-surface-lighter">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email address..."
                className="flex-1 h-9 px-3 bg-surface-light/50 border border-surface-lighter rounded-md text-[12px] font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/20 transition-all"
              />
              <button className="h-9 px-5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer">
                Ban User
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[2fr_1fr_auto] px-6 py-3 border-b border-surface-lighter">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">User</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Banned</span>
            <span className="w-16" />
          </div>

          {[
            { email: "john.doe@example.com", date: "Jan 15, 2024" },
            { email: "alice.baker@example.com", date: "Jan 12, 2024" },
          ].map((user, i) => (
            <div key={i} className={`group grid grid-cols-[2fr_1fr_auto] px-6 py-4 hover:bg-surface-light/50 transition-colors ${i > 0 ? 'border-t border-surface-lighter' : ''}`}>
              <div className="flex items-center gap-3">
                <img
                  src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(user.email)}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                  alt={user.email}
                  className="w-8 h-8 rounded-full border border-surface-lighter bg-surface-light shrink-0"
                />
                <span className="text-[13px] font-bold text-foreground tracking-tight">{user.email}</span>
              </div>
              <div className="flex items-center">
                <span className="text-[11px] font-bold text-muted-foreground">{user.date}</span>
              </div>
              <div className="flex items-center justify-end">
                <button className="text-[10px] font-bold text-muted-foreground/20 hover:text-red-500 uppercase tracking-widest transition-all cursor-pointer opacity-0 group-hover:opacity-100">
                  Unban
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CenterModal
        isOpen={updateModalOpen}
        onClose={() => !isUpdating && setUpdateModalOpen(false)}
        maxWidth="max-w-md"
      >
        <div className="p-4">
          <h2 className="text-[16px] font-bold text-foreground mb-4 tracking-tight">Check for Updates</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-light border border-surface-lighter">
              <AlertCircle size={20} className="text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-foreground mb-1">Source Repository Update</p>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight leading-relaxed">This will pull the latest version of Torqen from the main branch. Local changes may be overwritten.</p>
              </div>
            </div>

            <div className="rounded-lg border border-surface-lighter bg-surface-light p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Update Sequence</p>
              <code className="text-[11px] font-bold text-foreground/60 font-mono break-all leading-relaxed tracking-tight">
                git pull origin main && bun install && bun run db:migrate
              </code>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-lighter">
              <button
                onClick={() => setUpdateModalOpen(false)}
                disabled={isUpdating}
                className="px-4 py-2 text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="h-9 px-6 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-none cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-surface/20 border-t-surface rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Execute Update
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CenterModal>
    </div>
  );
}

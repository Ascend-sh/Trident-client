import {
    Users,
    RefreshCw,
    AlertCircle,
    Shield,
    Database,
    HardDrive,
    Plus
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import CenterModal from "../../components/modals/center-modal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

const API_BASE = "/api/v1/client";

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include"
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = typeof data === "string" ? data : data?.error || data?.message || "request_failed";
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default function AdminOverview() {
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [serverDefaults, setServerDefaults] = useState({
    memory: 1024,
    swap: 0,
    disk: 2048,
    cpu: 100,
    io: 0,
    databases: 0,
    backups: 0,
    allocations: 0,
    slots: 1
  });
  const [defaultsLoading, setDefaultsLoading] = useState(false);
  const [defaultsSaving, setDefaultsSaving] = useState(false);
  const [defaultsError, setDefaultsError] = useState("");
  const [defaultsSaved, setDefaultsSaved] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    maintenance: false,
    registration: true,
    economy: false
  });
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

  useEffect(() => {
    let cancelled = false;
    setDefaultsLoading(true);
    setDefaultsError("");

    request('/admin/server-defaults')
      .then((res) => {
        if (cancelled) return;
        const d = res?.defaults || {};
        setServerDefaults({
          memory: Number(d.memory ?? 1024),
          swap: Number(d.swap ?? 0),
          disk: Number(d.disk ?? 2048),
          cpu: Number(d.cpu ?? 100),
          io: Number(d.io ?? 0),
          databases: Number(d.databases ?? 0),
          backups: Number(d.backups ?? 0),
          allocations: Number(d.allocations ?? 0),
          slots: Number(d.slots ?? 1)
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setDefaultsError(err?.message || 'Failed to load server defaults');
      })
      .finally(() => {
        if (cancelled) return;
        setDefaultsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Default Resources</h2>
          {defaultsSaved && <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest animate-pulse">Saved</span>}
        </div>

        {defaultsError && (
          <div className="mb-4 px-4 py-3 rounded-md bg-red-500/5 border border-red-500/10 text-[11px] font-bold text-red-600">
            {defaultsError}
          </div>
        )}

        <div className={`border border-surface-lighter rounded-lg p-6 ${defaultsLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { label: "Memory (MB)", key: "memory" },
              { label: "Swap (MB)", key: "swap" },
              { label: "Disk (MB)", key: "disk" },
              { label: "CPU (%)", key: "cpu" },
              { label: "Server Slots", key: "slots" },
              { label: "Databases", key: "databases" },
              { label: "Backups", key: "backups" },
              { label: "Allocations", key: "allocations" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{field.label}</label>
                <Input
                  type="number"
                  value={serverDefaults[field.key]}
                  onChange={(e) => setServerDefaults({ ...serverDefaults, [field.key]: Number(e.target.value) })}
                  className="h-8.5 px-3 bg-surface-light/50 border-surface-lighter text-[12px] font-bold text-foreground focus:border-brand/20 shadow-none transition-all"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-5 pt-5 border-t border-surface-lighter">
            <Button
              onClick={async () => {
                setDefaultsSaving(true);
                setDefaultsError("");
                try {
                  await request('/admin/update-defaults', { method: 'PATCH', body: serverDefaults });
                  setDefaultsSaved(true);
                  setTimeout(() => setDefaultsSaved(false), 2000);
                } catch (err) {
                  setDefaultsError(err?.message || 'Failed to save');
                } finally {
                  setDefaultsSaving(false);
                }
              }}
              disabled={defaultsLoading || defaultsSaving}
              className="h-8 px-6 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest shadow-none cursor-pointer disabled:opacity-50"
            >
              {defaultsSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">System Management</h2>
        <div className="border border-surface-lighter rounded-lg overflow-hidden">
          {[
            { title: "Maintenance Mode", desc: "Disable dashboard access temporarily", icon: Shield, key: "maintenance" },
            { title: "Public Registration", desc: "Allow new account creation", icon: Users, key: "registration" },
            { title: "Economy System", desc: "Enable virtual currency features", icon: Database, key: "economy" },
            { title: "Legacy Backups", desc: "Deprecated backup system", icon: HardDrive, key: "legacy", disabled: true },
          ].map((item, i) => (
            <div key={i} className={`px-6 py-4 flex items-center justify-between group hover:bg-surface-light/50 transition-colors ${i > 0 ? 'border-t border-surface-lighter' : ''} ${item.disabled ? 'opacity-40' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-md bg-surface-light border border-surface-lighter flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                  <item.icon size={15} />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-foreground">{item.title}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{item.desc}</p>
                </div>
              </div>
              <Switch
                checked={systemSettings[item.key]}
                onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, [item.key]: checked })}
                disabled={item.disabled}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">User Blacklist</h2>
        <div className="border border-surface-lighter rounded-lg overflow-hidden">
          <div className="p-5">
            <div className="space-y-2.5 mb-4">
              {[
                { email: "john.doe@example.com", date: "2024-01-15", initial: "JD" },
                { email: "alice.baker@example.com", date: "2024-01-12", initial: "AB" },
              ].map((user, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-md border border-surface-lighter bg-surface-light/30 group hover:bg-surface-light transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-surface-light border border-surface-lighter flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                      {user.initial}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-foreground">{user.email}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{user.date}</p>
                    </div>
                  </div>
                  <button className="text-[9px] font-bold text-muted-foreground hover:text-red-500 uppercase tracking-widest transition-colors cursor-pointer">Remove</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="EMAIL ADDRESS..."
                className="h-8 flex-1 px-3 bg-surface-light/50 border-surface-lighter text-[10px] font-bold text-foreground placeholder:text-muted-foreground uppercase tracking-widest focus:border-brand/20 shadow-none"
              />
              <Button className="h-8 px-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-md font-bold text-[10px] uppercase tracking-widest shadow-none cursor-pointer">
                Ban
              </Button>
            </div>
          </div>
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

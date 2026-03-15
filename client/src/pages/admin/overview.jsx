import { 
    Users, 
    Server, 
    Package, 
    Activity, 
    Download, 
    RefreshCw, 
    AlertCircle, 
    MoveUpRight,
    Shield,
    Database,
    Globe,
    Cpu,
    HardDrive,
    Ban,
    Plus
} from "lucide-react";
import { useState, useEffect } from "react";
import CenterModal from "../../components/modals/center-modal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
    Card, 
    CardHeader, 
    CardTitle, 
    CardDescription, 
    CardContent, 
    CardFooter,
    CardAction
} from "@/components/ui/card";

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
    allocations: 0
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
          allocations: Number(d.allocations ?? 0)
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

  const stats = [
    { label: "Total Users", value: "127", icon: Users },
    { label: "Active Servers", value: "42", icon: Server },
    { label: "Total Nests", value: "8", icon: Package },
    { label: "System Status", value: "Healthy", icon: Activity },
  ];

  const handleUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      setUpdateModalOpen(false);
    }, 2000);
  };

  return (
    <div className="bg-surface px-16 py-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[20px] font-bold text-brand tracking-tight">Admin Overview</h1>
          <p className="text-[12px] font-bold text-brand/30 uppercase tracking-widest mt-1">System Statistics & Configuration</p>
        </div>
        <Button 
          onClick={() => setUpdateModalOpen(true)}
          className="h-8 px-3 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-none"
        >
          <RefreshCw size={12} className={isUpdating ? "animate-spin" : ""} />
          Check Updates
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} size="sm" className="shadow-none border border-surface-lighter ring-0">
            <CardContent className="py-3">
              <p className="text-[11px] font-bold text-brand/50 uppercase tracking-[0.2em] mb-0.5">{stat.label}</p>
              <p className="text-[22px] font-bold text-brand tracking-tight">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-none border border-surface-lighter ring-0 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[13px] font-bold text-brand uppercase tracking-[0.15em]">Default Resources</CardTitle>
                  <CardDescription className="text-[10px] font-bold text-brand/40 uppercase tracking-widest mt-0.5">Global server allocation limits</CardDescription>
                </div>
                {defaultsSaved && <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest animate-pulse">Saved Successfully</span>}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {defaultsError && (
                <div className="mb-6 px-4 py-3 rounded-md bg-red-500/5 border border-red-500/10 text-[11px] font-bold text-red-600">
                  {defaultsError}
                </div>
              )}
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${defaultsLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                {[
                  { label: "Memory (MB)", key: "memory" },
                  { label: "Swap (MB)", key: "swap" },
                  { label: "Disk (MB)", key: "disk" },
                  { label: "CPU (%)", key: "cpu" },
                  { label: "IO Weight", key: "io" },
                  { label: "Databases", key: "databases" },
                  { label: "Backups", key: "backups" },
                  { label: "Allocations", key: "allocations" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-[10px] font-bold text-brand/50 uppercase tracking-widest mb-1.5">{field.label}</label>
                    <Input
                      type="number"
                      value={serverDefaults[field.key]}
                      onChange={(e) => setServerDefaults({ ...serverDefaults, [field.key]: Number(e.target.value) })}
                      className="h-8.5 px-3 bg-surface-light/50 border-brand/[0.05] text-[12px] font-bold text-brand focus:border-brand/20 shadow-none transition-all"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="bg-brand/[0.01] border-t border-brand/[0.03] py-3 flex justify-end">
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
                className="h-8.5 px-6 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-[0.2em] shadow-none cursor-pointer disabled:opacity-50"
              >
                {defaultsSaving ? 'Saving...' : 'Update Defaults'}
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-none border border-surface-lighter ring-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] font-bold text-brand uppercase tracking-[0.15em]">System Management</CardTitle>
              <CardDescription className="text-[10px] font-bold text-brand/40 uppercase tracking-widest mt-0.5">Toggle core platform features</CardDescription>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-brand/[0.03]">
              {[
                { title: "Maintenance Mode", desc: "Temporarily disable access to the dashboard", icon: Shield, key: "maintenance" },
                { title: "Public Registration", desc: "Allow new users to create accounts", icon: Users, key: "registration" },
                { title: "Economy System", desc: "Enable virtual currency features", icon: Database, key: "economy" },
                { title: "Legacy Backups", desc: "Deprecated system-wide backups", icon: HardDrive, key: "legacy", disabled: true },
              ].map((item, i) => (
                <div key={i} className={`px-6 py-4 flex items-center justify-between group hover:bg-brand/[0.01] transition-colors ${item.disabled ? 'opacity-40' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-surface-light border border-brand/[0.05] flex items-center justify-center text-brand/30 group-hover:text-brand/50 transition-colors">
                      <item.icon size={17} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-brand">{item.title}</p>
                      <p className="text-[11px] font-bold text-brand/40 uppercase tracking-tight mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={systemSettings[item.key]}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, [item.key]: checked })}
                    disabled={item.disabled}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="shadow-none border border-surface-lighter ring-0 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[13px] font-bold text-brand uppercase tracking-[0.15em]">User Blacklist</CardTitle>
                  <CardDescription className="text-[10px] font-bold text-brand/40 uppercase tracking-widest mt-0.5">Managed restricted accounts</CardDescription>
                </div>
                <button className="text-brand/20 hover:text-brand/50 transition-colors cursor-pointer"><Plus size={16} /></button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 mb-5">
                {[
                  { email: "john.doe@example.com", date: "2024-01-15", initial: "JD" },
                  { email: "alice.baker@example.com", date: "2024-01-12", initial: "AB" },
                ].map((user, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-brand/[0.03] bg-brand/[0.01] group hover:bg-brand/[0.02] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand/[0.03] flex items-center justify-center text-[10px] font-bold text-brand/50">
                        {user.initial}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-brand">{user.email}</p>
                        <p className="text-[9px] font-bold text-brand/40 uppercase tracking-tighter">{user.date}</p>
                      </div>
                    </div>
                    <button className="text-[10px] font-bold text-brand/20 group-hover:text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors cursor-pointer">Unban</button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <Input
                  type="email"
                  placeholder="USER EMAIL TO BAN..."
                  className="h-9 px-4 bg-surface-light/50 border-brand/[0.05] text-[10px] font-bold text-brand placeholder:text-brand/30 uppercase tracking-widest focus:border-brand/20 shadow-none"
                />
                <Button className="h-9 w-full bg-red-500 text-white hover:bg-red-600 transition-all rounded-md font-bold text-[10px] uppercase tracking-[0.2em] shadow-none">
                  Add to Blacklist
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border border-surface-lighter ring-0 bg-brand text-surface relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield size={80} />
            </div>
            <CardContent className="relative z-10 pt-5 pb-5">
              <p className="text-[10px] font-bold text-surface/60 uppercase tracking-[0.2em] mb-4">Core Information</p>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-surface/50 uppercase tracking-widest mb-1">Current Version</p>
                  <p className="text-[18px] font-bold">v0.5.0-beta</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-surface/50 uppercase tracking-widest mb-1">Build Identifier</p>
                  <p className="text-[14px] font-bold uppercase tracking-widest">Swell-Client-Stable</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CenterModal
        isOpen={updateModalOpen}
        onClose={() => !isUpdating && setUpdateModalOpen(false)}
        maxWidth="max-w-md"
      >
        <div className="p-4">
          <h2 className="text-[16px] font-bold text-brand mb-4 tracking-tight">Check for Updates</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-surface-light border border-surface-lighter">
              <AlertCircle size={20} className="text-brand/40 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-brand mb-1">Source Repository Update</p>
                <p className="text-[11px] font-bold text-brand/30 uppercase tracking-tight leading-relaxed">This will pull the latest version of Torqen from the main branch. Local changes may be overwritten.</p>
              </div>
            </div>

            <div className="rounded-lg border border-surface-lighter bg-surface-light p-4">
              <p className="text-[10px] font-bold text-brand/30 uppercase tracking-widest mb-2">Update Sequence</p>
              <code className="text-[11px] font-bold text-brand/60 font-mono break-all leading-relaxed tracking-tight">
                git pull origin main && bun install && bun run db:migrate
              </code>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-lighter">
              <button
                onClick={() => setUpdateModalOpen(false)}
                disabled={isUpdating}
                className="px-4 py-2 text-[10px] font-bold text-brand/40 hover:text-brand uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="h-10 px-6 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-none cursor-pointer disabled:opacity-50"
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

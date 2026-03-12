import { Users, Server, Package, Activity, Download, RefreshCw, CheckCircle, AlertCircle, MoveUpRight } from "lucide-react";
import { useState, useEffect } from "react";
import CenterModal from "../../components/modals/center-modal";

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
    { label: "Total Users", value: "127", icon: Users, color: "#14b8a6" },
    { label: "Active Servers", value: "42", icon: Server, color: "#14b8a6" },
    { label: "Total Nests", value: "8", icon: Package, color: "#14b8a6" },
    { label: "System Status", value: "Healthy", icon: Activity, color: "#14b8a6" },
  ];

  const handleUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      setUpdateModalOpen(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "#18181b" }}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white mb-1">Admin Overview</h1>
        <p className="text-white/60 text-xs">Dashboard statistics and system information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <div className="lg:col-span-2 rounded-lg border border-white/10 bg-white/5 p-4 relative overflow-hidden">
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{ 
              backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(173, 229, 218, 0.03) 10px, rgba(173, 229, 218, 0.03) 11px)",
              maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,1) 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,1) 100%)"
            }}
          />
          <div className="relative flex items-start justify-between">
            <div>
              <img src="/Logo.png" alt="Torqen" className="h-12 mb-3" />
              <h2 className="text-sm font-semibold text-white mb-2">Torqen Dashboard</h2>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/50 uppercase tracking-wider">Version</span>
                  <span className="text-sm font-semibold" style={{ color: "#14b8a6" }}>v0.5.0-beta</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/50 uppercase tracking-wider">Build</span>
                  <span className="text-xs font-medium text-white">Swell</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <Download size={20} className="text-white/60" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Update Available</h3>
              <p className="text-xs text-white/40">v0.6.0-beta</p>
            </div>
          </div>

          <p className="text-xs text-white/60 mb-4">
            A new version is available. Update from source to get the latest features and bug fixes.
          </p>

          <button
            onClick={() => setUpdateModalOpen(true)}
            className="w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-1.5"
            style={{ backgroundColor: "#14b8a6", color: "#18181b" }}
          >
            <RefreshCw size={14} />
            Update from Source
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-lg border border-white/10 bg-white/5 p-3 flex flex-col"
            >
              <p className="text-lg font-semibold text-white mb-0.5">{stat.value}</p>
              <p className="text-[10px] text-white/60 mb-2">{stat.label}</p>
              <a
                href="#"
                className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white transition-colors duration-200 mt-auto group"
              >
                <span className="group-hover:underline">
                  {stat.label === "System Status" ? "Update system status" : `View all ${stat.label.toLowerCase()}`}
                </span>
                <MoveUpRight size={10} />
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-white mb-3">Configuration</h2>
        
        <div className="space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-xs font-semibold text-white mb-1">Authentication Providers</h3>
            <p className="text-[10px] text-white/50 mb-3">Enable OAuth providers for user authentication</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
                    <span className="text-xs font-bold">G</span>
                  </div>
                  <span className="text-xs text-white">Google OAuth</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#14b8a6]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#5865F2] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </div>
                  <span className="text-xs text-white">Discord OAuth</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#14b8a6]"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-xs font-semibold text-white mb-1">Economy System</h3>
            <p className="text-[10px] text-white/50 mb-3">Enable virtual currency for your dashboard</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white">Enable Economy</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#14b8a6]"></div>
                </label>
              </div>
              <div>
                <label className="text-[10px] text-white/60 uppercase tracking-wider mb-1.5 block">Currency Name</label>
                <input
                  type="text"
                  placeholder="TQN"
                  className="w-full px-3 py-1.5 text-xs text-white bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-[#14b8a6]/50"
                />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-[10px] text-white/60 uppercase tracking-wider mb-2">Grant Currency to User</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="User email"
                  className="flex-1 px-3 py-1.5 text-xs text-white bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-[#14b8a6]/50"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  className="w-24 px-3 py-1.5 text-xs text-white bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-[#14b8a6]/50"
                />
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: "#14b8a6", color: "#18181b" }}
                >
                  Grant
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-xs font-semibold text-white mb-1">Registration</h3>
            <p className="text-[10px] text-white/50 mb-3">Control user registration settings</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white">Disable Registration</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#14b8a6]"></div>
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-xs font-semibold text-white mb-1">Default Server Resources</h3>
                <p className="text-[10px] text-white/50">Set default resource limits for new servers</p>
              </div>
              {defaultsSaved && (
                <span className="text-[10px] text-green-400">Saved</span>
              )}
            </div>

            {defaultsError && (
              <div className="mb-3 px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/10">
                <p className="text-[10px] text-red-200">{defaultsError}</p>
              </div>
            )}

            <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${defaultsLoading ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <label className="text-[10px] text-white/60 uppercase tracking-wider mb-1.5 block">Memory (MB)</label>
                <input
                  type="number"
                  step="1"
                  value={serverDefaults.memory}
                  onChange={(e) => setServerDefaults({ ...serverDefaults, memory: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs text-white bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-[#14b8a6]/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 uppercase tracking-wider mb-1.5 block">Swap (MB)</label>
                <input
                  type="number"
                  step="1"
                  value={serverDefaults.swap}
                  onChange={(e) => setServerDefaults({ ...serverDefaults, swap: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs text-white bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-[#14b8a6]/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 uppercase tracking-wider mb-1.5 block">Disk (MB)</label>
                <input
                  type="number"
                  step="1"
                  value={serverDefaults.disk}
                  onChange={(e) => setServerDefaults({ ...serverDefaults, disk: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs text-white bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-[#14b8a6]/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 uppercase tracking-wider mb-1.5 block">CPU (%)</label>
                <input
                  type="number"
                  step="1"
                  value={serverDefaults.cpu}
                  onChange={(e) => setServerDefaults({ ...serverDefaults, cpu: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs text-white bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-[#14b8a6]/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 uppercase tracking-wider mb-1.5 block">IO Weight</label>
                <input
                  type="number"
                  step="1"
                  value={serverDefaults.io}
                  onChange={(e) => setServerDefaults({ ...serverDefaults, io: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs text-white bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-[#14b8a6]/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 uppercase tracking-wider mb-1.5 block">Databases</label>
                <input
                  type="number"
                  step="1"
                  value={serverDefaults.databases}
                  onChange={(e) => setServerDefaults({ ...serverDefaults, databases: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs text-white bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-[#14b8a6]/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 uppercase tracking-wider mb-1.5 block">Backups</label>
                <input
                  type="number"
                  step="1"
                  value={serverDefaults.backups}
                  onChange={(e) => setServerDefaults({ ...serverDefaults, backups: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs text-white bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-[#14b8a6]/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 uppercase tracking-wider mb-1.5 block">Allocations</label>
                <input
                  type="number"
                  step="1"
                  value={serverDefaults.allocations}
                  onChange={(e) => setServerDefaults({ ...serverDefaults, allocations: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs text-white bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-[#14b8a6]/50"
                />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={async () => {
                  const values = Object.values(serverDefaults);
                  const invalid = values.some(v => !Number.isFinite(v) || !Number.isInteger(v));
                  if (invalid) {
                    setDefaultsError('Enter proper values');
                    return;
                  }

                  setDefaultsSaving(true);
                  setDefaultsError("");
                  setDefaultsSaved(false);

                  try {
                    const res = await request('/admin/update-defaults', { method: 'PATCH', body: serverDefaults });
                    const d = res?.defaults || serverDefaults;
                    setServerDefaults({
                      memory: Number(d.memory ?? serverDefaults.memory),
                      swap: Number(d.swap ?? serverDefaults.swap),
                      disk: Number(d.disk ?? serverDefaults.disk),
                      cpu: Number(d.cpu ?? serverDefaults.cpu),
                      io: Number(d.io ?? serverDefaults.io),
                      databases: Number(d.databases ?? serverDefaults.databases),
                      backups: Number(d.backups ?? serverDefaults.backups),
                      allocations: Number(d.allocations ?? serverDefaults.allocations)
                    });
                    setDefaultsSaved(true);
                    setTimeout(() => setDefaultsSaved(false), 1500);
                  } catch (err) {
                    setDefaultsError(err?.message || 'Failed to save server defaults');
                  } finally {
                    setDefaultsSaving(false);
                  }
                }}
                disabled={defaultsLoading || defaultsSaving}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#14b8a6", color: "#18181b" }}
              >
                {defaultsSaving ? 'Saving...' : 'Save Resources'}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-xs font-semibold text-white mb-1">Maintenance Mode</h3>
            <p className="text-[10px] text-white/50 mb-3">Temporarily disable access to the dashboard</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white">Enable Maintenance Mode</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#14b8a6]"></div>
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-xs font-semibold text-white mb-1">User Blacklist</h3>
            <p className="text-[10px] text-white/50 mb-3">Manage banned users and restrict access</p>
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/20 border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span className="text-xs font-semibold text-red-400">JD</span>
                  </div>
                  <div>
                    <p className="text-xs text-white">john.doe@example.com</p>
                    <p className="text-[10px] text-white/40">Banned on 2024-01-15</p>
                  </div>
                </div>
                <button className="text-xs text-white/60 hover:text-white transition-colors duration-200">
                  Unban
                </button>
              </div>
              
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/20 border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span className="text-xs font-semibold text-red-400">AB</span>
                  </div>
                  <div>
                    <p className="text-xs text-white">alice.baker@example.com</p>
                    <p className="text-[10px] text-white/40">Banned on 2024-01-12</p>
                  </div>
                </div>
                <button className="text-xs text-white/60 hover:text-white transition-colors duration-200">
                  Unban
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email to blacklist"
                  className="flex-1 px-3 py-1.5 text-xs text-white bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:border-[#14b8a6]/50"
                />
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: "#14b8a6", color: "#18181b" }}
                >
                  Add to Blacklist
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CenterModal
        isOpen={updateModalOpen}
        onClose={() => !isUpdating && setUpdateModalOpen(false)}
        title="Update from Source"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
            <AlertCircle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 mb-1">This will pull the latest changes from the source repository.</p>
              <p className="text-xs text-white/50">Make sure you have committed any local changes before proceeding.</p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-white/40 mb-2">Update command:</p>
            <code className="text-xs text-white font-mono">git pull origin main && bun install && bun run db:migrate</code>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setUpdateModalOpen(false)}
              disabled={isUpdating}
              className="px-4 py-2 text-xs font-medium text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="px-4 py-2 text-xs font-medium text-black rounded-lg transition-all duration-200 hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#14b8a6" }}
            >
              {isUpdating ? (
                <>
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Start Update
                </>
              )}
            </button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
}



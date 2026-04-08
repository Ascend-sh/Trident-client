import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

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
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) {
        const message = typeof data === "string" ? data : data?.error || data?.message || "request_failed";
        const error = new Error(message);
        error.status = res.status;
        throw error;
    }
    return data;
}

const DEFAULT_MODULES = {
    billing: { enabled: true, label: "Billing", description: "Credits, invoices, and payment processing" },
    support: { enabled: false, label: "Support", description: "Ticket system and knowledge base" },
};

const DEFAULT_SETTINGS = {
    registrationEnabled: true,
    maintenanceMode: false,
    sessionTimeout: 30,
    apiRateLimit: 60,
};

export default function AdminConfigs() {
    const [modules, setModules] = useState(DEFAULT_MODULES);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [originalModules] = useState(DEFAULT_MODULES);
    const [originalSettings] = useState(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);

    const [serverDefaults, setServerDefaults] = useState({
        memory: 1024, swap: 0, disk: 2048, cpu: 100,
        io: 0, databases: 0, backups: 0, allocations: 0, slots: 1
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
        return () => { cancelled = true; };
    }, []);

    const handleSaveDefaults = async () => {
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
    };

    const hasChanges = JSON.stringify(modules) !== JSON.stringify(originalModules) ||
        JSON.stringify(settings) !== JSON.stringify(originalSettings);

    const toggleModule = (key) => {
        setModules(prev => ({
            ...prev,
            [key]: { ...prev[key], enabled: !prev[key].enabled }
        }));
    };

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await new Promise(r => setTimeout(r, 600));
        } catch (err) {
            console.error("Failed to save:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const enabledCount = Object.values(modules).filter(m => m.enabled).length;

    return (
        <div className="bg-surface px-10 py-10">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">Configuration</h1>
                    <p className="text-[13px] font-bold text-muted-foreground mt-2">Manage modules, limits, and platform behavior</p>
                </div>
                {hasChanges && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-8 px-4 flex items-center gap-2 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-3 h-3 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
                                Saving
                            </>
                        ) : (
                            <>
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                                Save Changes
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Modules */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[14px] font-bold text-foreground/60 tracking-tight">Modules</h2>
                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{enabledCount}/{Object.keys(modules).length} active</span>
                </div>
                <div className="border border-surface-lighter rounded-lg">
                    {Object.entries(modules).map(([key, mod], idx) => (
                        <div
                            key={key}
                            className={`flex items-center justify-between px-6 py-4 ${idx > 0 ? 'border-t border-surface-lighter' : ''}`}
                        >
                            <div>
                                <p className="text-[13px] font-bold text-foreground tracking-tight">{mod.label}</p>
                                <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{mod.description}</p>
                            </div>
                            <button
                                onClick={() => toggleModule(key)}
                                className={`w-9 h-5 rounded-full transition-all cursor-pointer relative ${mod.enabled ? 'bg-foreground' : 'bg-surface-lighter'}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-surface shadow-sm transition-all ${mod.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Limits & Default Resources */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[14px] font-bold text-foreground/60 tracking-tight">Limits</h2>
                    {defaultsSaved && <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Saved</span>}
                </div>

                {defaultsError && (
                    <div className="mb-4 px-3 py-2.5 rounded-md bg-red-500/5 border border-red-500/10">
                        <p className="text-[11px] font-bold text-red-500">{defaultsError}</p>
                    </div>
                )}

                <div className={`border border-surface-lighter rounded-lg p-6 ${defaultsLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div>
                        <p className="text-[13px] font-bold text-foreground tracking-tight">Default Server Resources</p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-0.5 mb-5">Resources allocated to new servers by default</p>
                        <div className="grid grid-cols-4 gap-5">
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
                                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{field.label}</label>
                                    <input
                                        type="number"
                                        value={serverDefaults[field.key]}
                                        onChange={(e) => setServerDefaults(prev => ({ ...prev, [field.key]: Number(e.target.value) }))}
                                        className="w-full h-9 px-3 bg-surface-light/50 border border-surface-lighter rounded-md text-[12px] font-bold text-foreground font-mono focus:outline-none focus:border-brand/20 transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end mt-5">
                            <button
                                onClick={handleSaveDefaults}
                                disabled={defaultsLoading || defaultsSaving}
                                className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {defaultsSaving ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
                                        Saving
                                    </>
                                ) : (
                                    "Save Defaults"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Access & Security */}
            <div className="mb-10">
                <h2 className="text-[14px] font-bold text-foreground/60 tracking-tight mb-4">Access & Security</h2>
                <div className="border border-surface-lighter rounded-lg p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[13px] font-bold text-foreground tracking-tight">User Registration</p>
                            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Allow new users to create accounts</p>
                        </div>
                        <button
                            onClick={() => updateSetting('registrationEnabled', !settings.registrationEnabled)}
                            className={`w-9 h-5 rounded-full transition-all cursor-pointer relative ${settings.registrationEnabled ? 'bg-foreground' : 'bg-surface-lighter'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-surface shadow-sm transition-all ${settings.registrationEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[13px] font-bold text-foreground tracking-tight">Maintenance Mode</p>
                            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Restrict access to administrators only</p>
                        </div>
                        <button
                            onClick={() => updateSetting('maintenanceMode', !settings.maintenanceMode)}
                            className={`w-9 h-5 rounded-full transition-all cursor-pointer relative ${settings.maintenanceMode ? 'bg-foreground' : 'bg-surface-lighter'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-surface shadow-sm transition-all ${settings.maintenanceMode ? 'left-[18px]' : 'left-0.5'}`} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Session Timeout (min)</label>
                            <input
                                type="number"
                                value={settings.sessionTimeout}
                                onChange={e => updateSetting('sessionTimeout', Number(e.target.value))}
                                className="w-full h-9 px-3 bg-surface-light/50 border border-surface-lighter rounded-md text-[12px] font-bold text-foreground font-mono focus:outline-none focus:border-brand/20 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">API Rate Limit (req/min)</label>
                            <input
                                type="number"
                                value={settings.apiRateLimit}
                                onChange={e => updateSetting('apiRateLimit', Number(e.target.value))}
                                className="w-full h-9 px-3 bg-surface-light/50 border border-surface-lighter rounded-md text-[12px] font-bold text-foreground font-mono focus:outline-none focus:border-brand/20 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

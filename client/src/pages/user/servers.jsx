import {
    Plus,
    Ellipsis,
    Search,
    Check,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, CpuIcon } from "@hugeicons/core-free-icons";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CenterModal from "../../components/modals/center-modal";
import { useAuth } from "../../context/auth-context.jsx";
import { Button } from "@/components/ui/button";
import AddCredits from "../economy/AddCredits";
import { motion, AnimatePresence } from "framer-motion";

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

export default function Servers() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createStep, setCreateStep] = useState(1);
    const { user, balance, currencyName } = useAuth();
    const [serverData, setServerData] = useState({
        name: "",
        description: "",
        location: null,
        software: null,
        plan: "free"
    });
    const [locations, setLocations] = useState([]);
    const [nests, setNests] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [loadingNests, setLoadingNests] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingServer, setEditingServer] = useState(null);
    const [editData, setEditData] = useState({
        name: "",
        location: null,
        software: null
    });
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [showSoftwareDropdown, setShowSoftwareDropdown] = useState(false);
    const [openActionMenuId, setOpenActionMenuId] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [serverToDelete, setServerToDelete] = useState(null);
    const [deletingServer, setDeletingServer] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [recentActivity, setRecentActivity] = useState([]);
    const [recentActivityLoading, setRecentActivityLoading] = useState(false);
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

    const availableEggs = nests.flatMap(nest =>
        (nest.eggs || []).map(egg => ({
            ...egg,
            nestId: nest.id,
            nestName: nest.name
        }))
    );

    useEffect(() => {
        if (isCreateModalOpen && createStep === 2 && locations.length === 0) {
            setLoadingLocations(true);
            request('/locations')
                .then((res) => {
                    setLocations(res?.locations || []);
                })
                .catch((err) => {
                    console.error('Failed to fetch locations:', err);
                    setLocations([]);
                })
                .finally(() => setLoadingLocations(false));
        }
    }, [isCreateModalOpen, createStep, locations.length]);

    const fetchRecentActivity = async ({ retry = false } = {}) => {
        if (!user?.id) return;
        setRecentActivityLoading(true);
        try {
            const attempts = retry ? 4 : 1;
            for (let i = 0; i < attempts; i++) {
                const res = await request('/recent-activity');
                const items = Array.isArray(res?.items) ? res.items : [];
                setRecentActivity(items);
                if (!retry) break;
                if (items.length) break;
                await new Promise(r => setTimeout(r, 300));
            }
        } catch {
            setRecentActivity([]);
        } finally {
            setRecentActivityLoading(false);
        }
    };

    useEffect(() => {
        fetchRecentActivity();
    }, [user?.id]);

    useEffect(() => {
        if (isCreateModalOpen && createStep === 3 && nests.length === 0) {
            setLoadingNests(true);
            request('/nests')
                .then((res) => {
                    setNests(res?.nests || []);
                })
                .catch((err) => {
                    console.error('Failed to fetch nests:', err);
                    setNests([]);
                })
                .finally(() => setLoadingNests(false));
        }
    }, [isCreateModalOpen, createStep, nests.length]);

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setCreateStep(1);
        setServerData({ name: "", description: "", location: null, software: null, plan: "free" });
        setLocations([]);
        setNests([]);
        setCreateServerError("");
        setCreatingServer(false);
    };

    const handleOpenEditModal = (server) => {
        setEditingServer(server);
        setEditData({
            name: server.name,
            location: null,
            software: null
        });
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingServer(null);
        setEditData({ name: "", location: null, software: null });
        setShowLocationDropdown(false);
        setShowSoftwareDropdown(false);
    };

    const handleNext = () => {
        if (createStep < 4) setCreateStep(createStep + 1);
    };

    const handleBack = () => {
        if (createStep > 1) setCreateStep(createStep - 1);
    };
    
    const [servers, setServers] = useState([]);
    const [slotsLimit, setSlotsLimit] = useState(1);
    const [loading, setLoading] = useState(false);
    const [serversError, setServersError] = useState("");
    const [creatingServer, setCreatingServer] = useState(false);
    const [createServerError, setCreateServerError] = useState("");
    const [metricsByServerId, setMetricsByServerId] = useState({});
    const [metricsLoaded, setMetricsLoaded] = useState(false);
    const socketsRef = useRef({});

    const allocationsFetchRef = useRef(0);

    const fetchServers = async () => {
        setLoading(true);
        setServersError("");

        try {
            const res = await request('/servers');
            const serversList = res?.servers || [];
            const slots = res?.slots || 1;

            setServers(serversList);
            setSlotsLimit(slots);

            const fetchId = ++allocationsFetchRef.current;

            const fetchAllocationWithRetry = async (serverId, attempts = 4) => {
                for (let i = 0; i < attempts; i++) {
                    try {
                        const allocRes = await request(`/servers/${serverId}/network/allocations`);
                        return allocRes?.primary || null;
                    } catch {
                        if (i < attempts - 1) await new Promise(r => setTimeout(r, 600));
                    }
                }
                return null;
            };

            serversList.forEach(async (s) => {
                if (fetchId !== allocationsFetchRef.current) return;
                if (s?.allocation?.ip_alias || s?.allocation?.ip) return;

                const primary = await fetchAllocationWithRetry(s.id);
                if (!primary) return;
                if (fetchId !== allocationsFetchRef.current) return;

                setServers(prev => prev.map(p => p.id === s.id ? { ...p, allocation: primary } : p));
            });
        } catch (err) {
            setServers([]);
            setServersError(err?.message || 'Failed to load servers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServers();
    }, []);

    const connectServerSocket = async (server) => {
        const id = server?.id;
        if (!id) return;
        if (socketsRef.current[id]) return;

        let statsReceived = false;
        let retry1;
        let retry2;

        try {
            const creds = await request(`/servers/${id}/websocket`);
            if (!creds?.socket || !creds?.token) return;

            const ws = new WebSocket(creds.socket);
            socketsRef.current[id] = ws;

            ws.onopen = () => {
                ws.send(JSON.stringify({ event: 'auth', args: [creds.token] }));
            };

            ws.onmessage = (event) => {
                const safeSendStats = () => {
                    try {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ event: 'send stats', args: [] }));
                        }
                    } catch {}
                };

                let msg;
                try {
                    msg = JSON.parse(event.data);
                } catch {
                    return;
                }

                if (msg?.event === 'auth success') {
                    safeSendStats();
                    retry1 = setTimeout(() => {
                        if (!statsReceived) safeSendStats();
                    }, 750);
                    retry2 = setTimeout(() => {
                        if (!statsReceived) safeSendStats();
                    }, 2000);
                    return;
                }

                if (msg?.event === 'stats' && Array.isArray(msg.args) && msg.args[0]) {
                    statsReceived = true;
                    if (retry1) clearTimeout(retry1);
                    if (retry2) clearTimeout(retry2);

                    const raw = msg.args[0];
                    let stats;
                    if (typeof raw === 'string') {
                        try {
                            stats = JSON.parse(raw);
                        } catch {
                            return;
                        }
                    } else if (raw && typeof raw === 'object') {
                        stats = raw;
                    } else {
                        return;
                    }

                    const memoryBytes = Number(stats?.memory_bytes || 0);
                    const memoryLimitBytes = Number(stats?.memory_limit_bytes || 0);
                    const diskBytes = Number(stats?.disk_bytes || 0);
                    const cpu = Number(stats?.cpu_absolute || 0);

                    const memoryPercent = memoryLimitBytes > 0 ? Math.min(100, Math.max(0, (memoryBytes / memoryLimitBytes) * 100)) : 0;

                    setMetricsByServerId(prev => ({
                        ...prev,
                        [id]: {
                            state: stats?.state,
                            cpuPercent: cpu,
                            memoryBytes,
                            memoryLimitBytes,
                            memoryPercent,
                            diskBytes,
                            uptime: stats?.uptime,
                            network: stats?.network
                        }
                    }));
                    
                    setMetricsLoaded(true);
                }
            };

            ws.onclose = (e) => {
                if (retry1) clearTimeout(retry1);
                if (retry2) clearTimeout(retry2);
                delete socketsRef.current[id];
            };

            ws.onerror = () => {
                if (retry1) clearTimeout(retry1);
                if (retry2) clearTimeout(retry2);
                try {
                    ws.close();
                } catch {}
            };
        } catch {}
    };

    useEffect(() => {
        for (const srv of servers) {
            connectServerSocket(srv);
        }

        return () => {
            for (const ws of Object.values(socketsRef.current)) {
                try {
                    ws.close();
                } catch {}
            }
            socketsRef.current = {};
        };
    }, [servers]);

    const totalServers = servers.length;
    const onlineServers = servers.filter(s => metricsByServerId[s.id]?.state === 'running').length;

    return (
        <div className="bg-surface px-10 py-10">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">Servers</h1>
                    <p className="text-[13px] font-bold text-muted-foreground mt-2">Manage and monitor your game server instances</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-all cursor-pointer"
                >
                    <Plus size={12} />
                    New Instance
                </button>
            </div>

            <div className="grid grid-cols-4 border border-surface-lighter rounded-lg overflow-hidden mb-10">
                {[
                    { label: "Slots", value: <>{totalServers} <span className="text-foreground/20 mx-0.5 font-medium">/</span> {slotsLimit}</> },
                    { label: "Online", value: onlineServers },
                    { label: "Credits", value: `${balance} ${currencyName}`, action: () => setIsCreditsModalOpen(true), actionLabel: "Add Funds" },
                    { label: "Tickets", value: "0" },
                ].map((stat, i) => (
                    <div key={i} className={`px-6 py-5 ${i > 0 ? 'border-l border-surface-lighter' : ''}`}>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{stat.label}</p>
                        <div className="flex items-baseline gap-3">
                            <p className="text-[24px] font-bold text-foreground tracking-tighter leading-none">{stat.value}</p>
                            {stat.action && (
                                <button
                                    onClick={stat.action}
                                    className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors cursor-pointer"
                                >
                                    {stat.actionLabel}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div>
                <div className="flex items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-1 bg-surface-light rounded-md p-0.5 border border-surface-lighter">
                        {[
                            { label: "All", value: "all" },
                            { label: "Running", value: "online", dot: "bg-green-500" },
                            { label: "Stopped", value: "offline", dot: "bg-red-500" },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setActiveFilter(opt.value)}
                                className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                                    activeFilter === opt.value
                                        ? 'bg-surface text-foreground shadow-sm border border-surface-lighter'
                                        : 'text-muted-foreground hover:text-foreground border border-transparent'
                                }`}
                            >
                                {opt.dot && <div className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />}
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search instances..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 pl-8 pr-4 bg-surface-light border border-surface-lighter rounded-lg text-[12px] font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/20 transition-all w-[200px]"
                        />
                    </div>
                </div>

                <div className="border border-surface-lighter rounded-lg">
                    <div className="w-full">
                        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.5fr] px-6 py-3 border-b border-surface-lighter">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Name</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Address</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Location</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Usage</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Status</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</span>
                        </div>

                        {(() => {
                            const q = (searchQuery || '').trim().toLowerCase();
                            let filtered = servers;

                            if (q) {
                                filtered = filtered.filter((s) => {
                                    const name = (s?.name || '').toLowerCase();
                                    const id = (s?.identifier || '').toLowerCase();
                                    return name.includes(q) || id.includes(q);
                                });
                            }

                            if (activeFilter !== 'all') {
                                filtered = filtered.filter((s) => {
                                    const m = metricsByServerId[s.id];
                                    const stateLower = String(m?.state || '').toLowerCase();
                                    if (activeFilter === 'online') return stateLower === 'running' || stateLower === 'online';
                                    if (activeFilter === 'offline') return stateLower === 'offline' || stateLower === 'stopped';
                                    return true;
                                });
                            }

                            if (loading || (servers.length > 0 && !metricsLoaded)) {
                                return (
                                    <div className="flex flex-col">
                                        {Array.from({ length: Math.max(3, servers.length) }).map((_, i) => (
                                            <div key={i} className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.5fr] px-6 py-4 animate-pulse ${i > 0 ? 'border-t border-surface-lighter' : ''}`}>
                                                <div className="flex flex-col gap-2">
                                                    <div className="h-3 w-28 bg-surface-lighter rounded-md" />
                                                    <div className="h-2 w-16 bg-surface-lighter rounded-md" />
                                                </div>
                                                <div className="flex items-center justify-center">
                                                    <div className="h-3 w-32 bg-surface-lighter rounded-md" />
                                                </div>
                                                <div className="flex items-center justify-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-3 bg-surface-lighter rounded-md" />
                                                        <div className="h-3 w-16 bg-surface-lighter rounded-md" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-center gap-4">
                                                    <div className="h-3 w-8 bg-surface-lighter rounded-md" />
                                                    <div className="h-3 w-8 bg-surface-lighter rounded-md" />
                                                </div>
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-surface-lighter" />
                                                    <div className="h-3 w-12 bg-surface-lighter rounded-md" />
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    <div className="w-7 h-7 rounded-md bg-surface-lighter" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }

                            if (filtered.length === 0) {
                                return (
                                    <div className="py-16 flex flex-col items-center justify-center gap-3">
                                        <HugeiconsIcon icon={CpuIcon} size={40} className="text-muted-foreground/20" />
                                        <p className="text-[12px] font-bold text-muted-foreground/40">You don't have any servers yet. Create one to get started.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="flex flex-col">
                                    {filtered.map((server, idx) => {
                                        const m = metricsByServerId[server.id];
                                        const stateLower = String(m?.state || 'offline').toLowerCase();
                                        const isOnline = stateLower === 'running' || stateLower === 'online';
                                        const isStarting = stateLower === 'starting' || stateLower === 'installing';

                                        const cpu = Number(m?.cpuPercent || 0);
                                        const mem = Number(m?.memoryPercent || 0);

                                        return (
                                            <div
                                                key={server.id}
                                                onClick={() => navigate(`/app/server/${server.identifier}/overview`)}
                                                className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.5fr] px-6 py-4 hover:bg-surface-light/50 transition-colors cursor-pointer group ${idx > 0 ? 'border-t border-surface-lighter' : ''}`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-foreground tracking-tight">{server.name}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground/50 tracking-tight mt-0.5">{server.identifier}</span>
                                                </div>

                                                <div className="flex items-center justify-center">
                                                    {server?.allocation?.ip_alias || server?.allocation?.ip ? (
                                                        <span className="text-[11px] font-bold text-muted-foreground font-mono">
                                                            {server?.allocation?.ip_alias || server?.allocation?.ip}:{server?.allocation?.port}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-muted-foreground/50">Assigning...</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-center">
                                                    <div className="flex items-center gap-2">
                                                        {server.location?.shortCode && (
                                                            <img
                                                                src={`https://flagsapi.com/${server.location.shortCode}/flat/64.png`}
                                                                alt={server.location.shortCode}
                                                                className="w-4 h-3 rounded-sm object-cover opacity-80"
                                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                                            />
                                                        )}
                                                        <span className="text-[11px] font-bold text-muted-foreground truncate max-w-[100px]">
                                                            {server.location?.description || server.location?.shortCode || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-center gap-4">
                                                    <div className="flex items-center gap-1.5 min-w-[50px]">
                                                        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">CPU</span>
                                                        <span className="text-[11px] font-bold text-muted-foreground">{Math.round(cpu)}%</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 min-w-[50px]">
                                                        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">RAM</span>
                                                        <span className="text-[11px] font-bold text-muted-foreground">{Math.round(mem)}%</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                                        isOnline ? 'bg-green-500' : isStarting ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`} />
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                                        isOnline ? 'text-green-500' : isStarting ? 'text-yellow-500' : 'text-red-500'
                                                    }`}>
                                                        {stateLower}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    <div className="relative">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenActionMenuId(openActionMenuId === server.id ? null : server.id);
                                                            }}
                                                            className="p-2 rounded-md hover:bg-surface-lighter text-foreground/60 hover:text-brand transition-all cursor-pointer"
                                                        >
                                                            <Ellipsis size={14} />
                                                        </button>
                                                        
                                                        {openActionMenuId === server.id && (
                                                            <div
                                                                className="absolute right-0 mt-2 w-36 bg-surface-light border border-surface-lighter rounded-lg shadow-lg z-50 overflow-hidden"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <div className="p-1">
                                                                    <button
                                                                        onClick={() => {
                                                                            setOpenActionMenuId(null);
                                                                            handleOpenEditModal(server);
                                                                        }}
                                                                        className="w-full px-3 py-2 text-left text-[12px] font-bold text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50 rounded-md transition-all"
                                                                    >
                                                                        Rename
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setOpenActionMenuId(null);
                                                                            setServerToDelete(server);
                                                                            setDeleteModalOpen(true);
                                                                        }}
                                                                        className="w-full px-3 py-2 text-left text-[12px] font-bold text-red-500 hover:bg-surface-lighter/50 rounded-md transition-all"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            <div className="mt-10 px-2">
                <h2 className="text-[16px] font-bold text-foreground/70 tracking-tight mb-6">Recent Activity</h2>
                {recentActivityLoading ? (
                    <div className="relative pl-5">
                        <div className="absolute left-[6px] top-0 bottom-0 w-px bg-surface-lighter" />
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="relative flex items-start gap-4 pb-6 animate-pulse">
                                <div className="absolute left-[-17px] top-1 w-[7px] h-[7px] rounded-full bg-surface-lighter" />
                                <div className="flex-1 flex items-center justify-between">
                                    <div className="h-3 w-40 bg-surface-lighter rounded-md" />
                                    <div className="h-3 w-16 bg-surface-lighter rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : recentActivity.length > 0 ? (
                    <>
                        <div className="relative pl-5">
                            <div className="absolute left-[6px] top-1 bottom-0 w-px bg-surface-lighter" />
                            {recentActivity.slice(0, 5).map((item, idx) => {
                                const e = item?.event;
                                const isLogin = e === 'login';
                                const isLogout = e === 'logout';
                                const isServerCreate = e === 'server_created';
                                const isServerDelete = e === 'server_deleted';
                                const isLast = idx === Math.min(recentActivity.length, 5) - 1;
                                const title = isLogin
                                    ? 'Logged in'
                                    : isLogout
                                    ? 'Logged out'
                                    : isServerCreate
                                    ? 'Server created'
                                    : isServerDelete
                                    ? 'Server deleted'
                                    : 'Activity';
                                const label = isServerCreate || isServerDelete
                                    ? (item?.serverName || 'Server')
                                    : (item?.email || user?.username || 'User');
                                const dotColor = isLogin ? 'bg-green-500' : isLogout ? 'bg-muted-foreground' : isServerCreate ? 'bg-brand' : isServerDelete ? 'bg-red-500' : 'bg-muted-foreground';

                                return (
                                    <div key={idx} className={`relative flex items-start gap-4 ${isLast ? '' : 'pb-6'}`}>
                                        <div className={`absolute left-[-17px] top-[5px] w-[7px] h-[7px] rounded-full ${dotColor} ring-2 ring-surface`} />
                                        <div className="flex-1 flex items-baseline justify-between min-w-0">
                                            <div className="flex items-baseline gap-2 min-w-0">
                                                <span className="text-[13px] font-bold text-foreground">{title}</span>
                                                <span className="text-[12px] font-bold text-muted-foreground truncate">{label}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground/60 whitespace-nowrap ml-4">
                                                {item?.relative || 'Just now'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {recentActivity.length > 5 && (
                            <div className="flex justify-center mt-5">
                                <button className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors cursor-pointer">
                                    View More
                                    <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-[13px] font-bold text-muted-foreground">No recent activity</p>
                )}
            </div>

            <CenterModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModal}
                maxWidth="max-w-2xl"
            >
                <div className="relative overflow-hidden">
                    <div className="h-[3px] bg-surface-lighter">
                        <div
                            className="h-full bg-brand transition-all duration-500 ease-out"
                            style={{ width: `${(createStep / 4) * 100}%` }}
                        />
                    </div>

                    <div className="px-6 pt-5 pb-0">
                        <h2 className="text-[16px] font-bold text-foreground tracking-tight">Create Server</h2>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            {createStep === 1 ? 'Server Details' :
                             createStep === 2 ? 'Select Location' :
                             createStep === 3 ? 'Select Software' :
                             'Review & Deploy'}
                        </p>
                    </div>

                    <div className="px-6 pt-6 pb-2 min-h-[280px]">
                        <AnimatePresence mode="wait">
                            {createStep === 1 && (
                                <motion.div
                                    key="step-1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-5"
                                >
                                    <div>
                                        <label className="block text-[10px] font-bold text-foreground/60 uppercase tracking-widest mb-2">Server Name</label>
                                        <input
                                            type="text"
                                            value={serverData.name}
                                            onChange={(e) => setServerData({ ...serverData, name: e.target.value })}
                                            placeholder="e.g. My Vanilla Survival"
                                            className="w-full h-10 px-4 bg-surface-light border border-surface-lighter rounded-md text-[12px] font-bold text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-brand/20 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-foreground/60 uppercase tracking-widest mb-2">Description</label>
                                        <textarea
                                            value={serverData.description}
                                            onChange={(e) => setServerData({ ...serverData, description: e.target.value })}
                                            placeholder="Optional description..."
                                            rows={3}
                                            className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-md text-[12px] font-bold text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-brand/20 transition-all resize-none"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {createStep === 2 && (
                                <motion.div
                                    key="step-2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {loadingLocations ? (
                                        <div className="py-12 text-center">
                                            <div className="w-6 h-6 border-2 border-brand/20 border-t-brand rounded-full animate-spin mx-auto mb-4" />
                                            <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">Loading locations...</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {locations.map((loc) => (
                                                <button
                                                    key={loc.id}
                                                    onClick={() => setServerData({ ...serverData, location: loc })}
                                                    className={`relative p-4 rounded-md border text-left transition-all cursor-pointer ${
                                                        serverData.location?.id === loc.id
                                                            ? 'bg-brand/5 border-brand text-foreground'
                                                            : 'bg-surface-light border-surface-lighter text-foreground/60 hover:border-brand/20'
                                                    }`}
                                                >
                                                    {serverData.location?.id === loc.id && (
                                                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                                                            <Check size={10} strokeWidth={3} className="text-surface" />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={`https://flagsapi.com/${loc.shortCode}/flat/64.png`}
                                                            alt={loc.shortCode}
                                                            className="w-6 h-4 rounded-sm object-cover"
                                                        />
                                                        <span className="text-[12px] font-bold uppercase tracking-tight">{loc.description || loc.shortCode}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {createStep === 3 && (
                                <motion.div
                                    key="step-3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {loadingNests ? (
                                        <div className="py-12 text-center">
                                            <div className="w-6 h-6 border-2 border-brand/20 border-t-brand rounded-full animate-spin mx-auto mb-4" />
                                            <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">Loading software...</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {availableEggs.map((egg) => (
                                                <button
                                                    key={egg.id}
                                                    onClick={() => setServerData({ ...serverData, software: egg })}
                                                    className={`relative p-4 rounded-md border text-left transition-all cursor-pointer ${
                                                        serverData.software?.id === egg.id
                                                            ? 'bg-brand/5 border-brand text-foreground'
                                                            : 'bg-surface-light border-surface-lighter text-foreground/60 hover:border-brand/20'
                                                    }`}
                                                >
                                                    {serverData.software?.id === egg.id && (
                                                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                                                            <Check size={10} strokeWidth={3} className="text-surface" />
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[12px] font-bold uppercase tracking-tight">{egg.name}</span>
                                                        <span className="text-[9px] font-bold text-foreground/60 uppercase tracking-widest">{egg.nestName}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {createStep === 4 && (
                                <motion.div
                                    key="step-4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-surface-light border border-surface-lighter rounded-xl overflow-hidden">
                                        <div className="px-5 py-3 border-b border-surface-lighter">
                                            <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-[0.2em]">Deployment Manifest</p>
                                        </div>
                                        <div className="divide-y divide-surface-lighter">
                                            <div className="px-5 py-4 flex items-center justify-between hover:bg-surface-highlight/50 transition-colors">
                                                <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">Instance Identity</p>
                                                <p className="text-[13px] font-bold text-foreground tracking-tight">{serverData.name}</p>
                                            </div>
                                            <div className="px-5 py-4 flex items-center justify-between hover:bg-surface-highlight/50 transition-colors">
                                                <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">Software</p>
                                                <p className="text-[13px] font-bold text-foreground tracking-tight">{serverData.software?.name}</p>
                                            </div>
                                            <div className="px-5 py-4 flex items-center justify-between hover:bg-surface-highlight/50 transition-colors">
                                                <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">Region</p>
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={`https://flagsapi.com/${serverData.location?.shortCode}/flat/64.png`}
                                                        alt={serverData.location?.shortCode}
                                                        className="w-4 h-3 rounded-sm object-cover opacity-80"
                                                    />
                                                    <p className="text-[13px] font-bold text-foreground tracking-tight">{serverData.location?.description}</p>
                                                </div>
                                            </div>
                                            <div className="px-5 py-4 flex items-center justify-between hover:bg-surface-highlight/50 transition-colors">
                                                <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">Architecture</p>
                                                <p className="text-[13px] font-bold text-foreground tracking-tight uppercase tracking-tighter">{serverData.software?.nestName}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {createServerError && (
                                        <div className="px-4 py-3 rounded-md bg-red-500/5 border border-red-500/10">
                                            <p className="text-[11px] font-bold text-red-600 uppercase tracking-tight">{createServerError}</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="px-6 py-4 border-t border-surface-lighter flex items-center justify-between">
                        <button
                            onClick={createStep === 1 ? handleCloseModal : handleBack}
                            className="px-4 py-2 text-[10px] font-bold text-foreground/60 hover:text-foreground uppercase tracking-widest transition-all cursor-pointer"
                        >
                            {createStep === 1 ? 'Cancel' : 'Back'}
                        </button>
                        {createStep < 4 ? (
                            <button
                                onClick={handleNext}
                                disabled={
                                    (createStep === 1 && !serverData.name) ||
                                    (createStep === 2 && !serverData.location) ||
                                    (createStep === 3 && !serverData.software)
                                }
                                className="h-9 px-6 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-none"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                onClick={async () => {
                                    setCreateServerError("");
                                    setCreatingServer(true);
                                    try {
                                        await request('/create-server', {
                                            method: 'POST',
                                            body: {
                                                name: serverData.name,
                                                description: serverData.description || '',
                                                locationId: serverData.location?.id,
                                                eggId: serverData.software?.id,
                                                dockerImage: serverData.software?.dockerImage,
                                                startup: serverData.software?.startup,
                                                nestId: serverData.software?.nestId,
                                                plan: serverData.plan
                                            }
                                        });
                                        await fetchServers();
                                        await fetchRecentActivity({ retry: true });
                                        handleCloseModal();
                                    } catch (err) {
                                        setCreateServerError(err?.message || 'Failed to create server');
                                    } finally {
                                        setCreatingServer(false);
                                    }
                                }}
                                disabled={creatingServer}
                                className="h-9 px-6 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-none"
                            >
                                {creatingServer ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-surface/20 border-t-surface rounded-full animate-spin" />
                                        Initializing...
                                    </>
                                ) : (
                                    'Deploy Instance'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </CenterModal>

            <CenterModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                maxWidth="max-w-xl"
            >
                <div className="p-6">
                    <h2 className="text-[16px] font-bold text-foreground mb-6">Rename Instance</h2>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-foreground/60 uppercase tracking-widest mb-2">Instance Name</label>
                            <input
                                type="text"
                                value={editData.name}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                placeholder="Enter new name"
                                className="w-full h-10 px-4 bg-surface-light border border-surface-lighter rounded-md text-[12px] font-bold text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-brand/20 transition-all"
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-surface-lighter">
                            <button
                                onClick={handleCloseEditModal}
                                className="px-4 py-2 text-[10px] font-bold text-foreground/60 hover:text-brand uppercase tracking-widest transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await request(`/servers/${editingServer.id}/rename`, {
                                            method: 'POST',
                                            body: { name: editData.name }
                                        });
                                        await fetchServers();
                                        handleCloseEditModal();
                                    } catch (err) {
                                        console.error('Failed to rename server:', err);
                                    }
                                }}
                                disabled={!editData.name || editData.name === editingServer?.name}
                                className="h-9 px-6 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-none"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </CenterModal>

            <CenterModal
                isOpen={deleteModalOpen}
                onClose={() => !deletingServer && setDeleteModalOpen(false)}
                maxWidth="max-w-md"
            >
                <div className="p-6">
                    <div className="mb-6">
                        <h2 className="text-[16px] font-bold text-foreground tracking-tight">Delete Instance</h2>
                        <p className="text-[12px] font-bold text-foreground/60 mt-1">
                            Are you sure you want to delete <span className="text-foreground">"{serverToDelete?.name}"</span>? This action cannot be undone.
                        </p>
                    </div>
                    {deleteError && (
                        <div className="px-4 py-3 rounded-md bg-red-500/5 border border-red-500/10 mb-6">
                            <p className="text-[11px] font-bold text-red-600">{deleteError}</p>
                        </div>
                    )}
                    <div className="flex items-center justify-end gap-3 mt-8">
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={deletingServer}
                            className="px-4 py-2 text-[10px] font-bold text-foreground hover:text-foreground/70 uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <Button
                            onClick={async () => {
                                setDeletingServer(true);
                                setDeleteError("");
                                try {
                                    await request(`/servers/${serverToDelete?.id}/delete`, { method: 'DELETE' });
                                    setDeleteModalOpen(false);
                                    setServerToDelete(null);
                                    await fetchServers();
                                    await fetchRecentActivity({ retry: true });
                                } catch (err) {
                                    setDeleteError(err?.message || 'Failed to delete server');
                                } finally {
                                    setDeletingServer(false);
                                }
                            }}
                            disabled={deletingServer}
                            className="h-8 px-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer shadow-none disabled:opacity-40"
                        >
                            {deletingServer ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : 'Confirm Delete'}
                        </Button>
                    </div>
                </div>
            </CenterModal>
            <AddCredits 
                isOpen={isCreditsModalOpen} 
                onClose={() => setIsCreditsModalOpen(false)} 
            />
        </div>
    );
}

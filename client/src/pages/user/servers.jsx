import { 
    Plus, 
    HardDrive, 
    ChevronDown, 
    Trash2, 
    RefreshCw, 
    Layers2, 
    Ellipsis,
    Undo2,
    Shield,
    Activity,
    Search,
    Check
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CenterModal from "../../components/modals/center-modal";
import { useAuth } from "../../context/auth-context.jsx";
import { Button } from "@/components/ui/button";

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
        software: null
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
        setServerData({ name: "", description: "", location: null, software: null });
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
    const [serversLoading, setServersLoading] = useState(false);
    const [serversError, setServersError] = useState("");
    const [creatingServer, setCreatingServer] = useState(false);
    const [createServerError, setCreateServerError] = useState("");
    const [metricsByServerId, setMetricsByServerId] = useState({});
    const [metricsLoaded, setMetricsLoaded] = useState(false);
    const socketsRef = useRef({});

    const allocationsFetchRef = useRef(0);

    const fetchServers = async () => {
        setServersLoading(true);
        setServersError("");

        try {
            const res = await request('/servers');
            const serversList = res?.servers || [];

            setServers(serversList);

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
            setServersLoading(false);
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
        <div className="bg-surface px-16 py-10">
            <div className="flex items-center justify-between gap-4 mb-4">
                <h1 className="text-[20px] font-bold text-brand tracking-tight">Servers</h1>
                <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-8 px-3 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-none"
                >
                    <Plus size={12} />
                    Create Server
                </Button>
            </div>

            {/* Overview Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 border border-surface-lighter rounded-lg p-5 flex flex-col justify-between min-h-fit">
                    <h2 className="text-[16px] font-bold text-brand mb-4">Overview</h2>
                    <div className="grid grid-cols-3 gap-8">
                        <div>
                            <p className="text-[12px] font-bold text-brand/30 uppercase tracking-[0.15em] mb-1">Slots</p>
                            <p className="text-[20px] font-bold text-brand/80">{onlineServers} <span className="text-brand/20 mx-1 font-medium">/</span> {Math.max(1, totalServers)}</p>
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-brand/30 uppercase tracking-[0.15em] mb-1">Instances</p>
                            <p className="text-[20px] font-bold text-brand/80">{onlineServers} Online</p>
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-brand/30 uppercase tracking-[0.15em] mb-1">Credits</p>
                            <div className="flex items-baseline gap-3">
                                <p className="text-[20px] font-bold text-brand/80">{balance} {currencyName}</p>
                                <button 
                                    onClick={() => navigate('/app/billing')}
                                    className="text-[10px] font-bold text-brand/30 hover:text-brand underline underline-offset-2 uppercase tracking-widest transition-colors cursor-pointer"
                                >
                                    Add Funds
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border border-surface-lighter rounded-lg p-5 pb-3 flex flex-col min-h-fit">
                    <h2 className="text-[16px] font-bold text-brand mb-3">Recent Activity</h2>
                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                        {recentActivityLoading ? (
                            <p className="text-[10px] font-bold text-brand/20 animate-pulse uppercase tracking-widest">Fetching logs...</p>
                        ) : recentActivity.length > 0 ? (
                            <div className="space-y-3">
                                {recentActivity.slice(0, 2).map((item, idx) => {
                                    const e = item?.event;
                                    const isLogin = e === 'login';
                                    const isLogout = e === 'logout';
                                    const isServerCreate = e === 'server_created';
                                    const isServerDelete = e === 'server_deleted';
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
                                    
                                    return (
                                        <div key={idx} className="flex items-center justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-bold text-brand/60 truncate">
                                                    {label} <span className="text-brand/30 font-medium">·</span> {title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {(!isServerCreate && !isServerDelete && item?.ip) && (
                                                        <span className="text-[9px] font-bold text-brand/20 tracking-tighter">{item.ip}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-bold text-brand/30 whitespace-nowrap uppercase tracking-tighter">
                                                {item?.relative || 'Just now'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-[11px] font-bold text-brand/40 italic">No recent logs</p>
                        )}
                    </div>
                    {recentActivity.length > 2 && (
                        <div className="mt-3 flex justify-center">
                            <button className="flex items-center gap-1.5 text-[10px] font-bold text-brand/30 hover:text-brand uppercase tracking-widest transition-colors cursor-pointer">
                                View More
                                <ChevronDown size={10} strokeWidth={3} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Server List Section */}
            <div className="mt-8">
                <div className="flex items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                                activeFilter === 'all' 
                                    ? 'bg-surface-highlight border border-surface-lighter text-brand' 
                                    : 'text-brand/30 hover:text-brand/60 hover:bg-surface-lighter'
                            }`}
                        >
                            All Servers
                        </button>
                        <button
                            onClick={() => setActiveFilter('online')}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                                activeFilter === 'online' 
                                    ? 'bg-surface-highlight border border-surface-lighter text-brand' 
                                    : 'text-brand/30 hover:text-brand/60 hover:bg-surface-lighter'
                            }`}
                        >
                            Running
                        </button>
                        <button
                            onClick={() => setActiveFilter('offline')}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                                activeFilter === 'offline' 
                                    ? 'bg-surface-highlight border border-surface-lighter text-brand' 
                                    : 'text-brand/30 hover:text-brand/60 hover:bg-surface-lighter'
                            }`}
                        >
                            Stopped
                        </button>
                    </div>

                    <div className="relative group">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand/30" />
                        <input
                            type="text"
                            placeholder="SEARCH INSTANCES..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 pl-9 pr-4 bg-surface-light border border-surface-lighter rounded-md text-[10px] font-bold text-brand/60 placeholder:text-brand/60 focus:outline-none focus:border-brand/20 transition-all uppercase tracking-widest w-[200px]"
                        />
                    </div>
                </div>

                <div className="bg-surface-light border border-surface-lighter rounded-xl px-[2px] pb-[2px] pt-0">
                    <div className="w-full">
                        {/* Table Headers - Positioned on the gray parent card */}
                        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.5fr] px-6 py-3">
                            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Name</span>
                            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Address</span>
                            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Usage</span>
                            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Status</span>
                            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em] text-right">Actions</span>
                        </div>

                        {/* White Inner Card for rows or empty state */}
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

                            if (serversLoading && servers.length === 0) {
                                return (
                                    <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col min-h-[210px]">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="h-16 border-b border-surface-lighter last:border-0 animate-pulse bg-brand/[0.01]" />
                                        ))}
                                    </div>
                                );
                            }

                            if (filtered.length === 0) {
                                return (
                                    <div className="bg-surface border border-surface-lighter rounded-lg py-12 flex flex-col items-center justify-center min-h-[210px]">
                                        <span className="text-[12px] font-bold text-brand/40 text-center px-6 italic">
                                             It looks a bit empty here. Let's get started by creating your first instance.
                                         </span>
                                    </div>
                                );
                            }

                            return (
                                <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col min-h-[210px]">
                                    {filtered.map((server) => {
                                        const m = metricsByServerId[server.id];
                                        const stateLower = String(m?.state || 'offline').toLowerCase();
                                        const isOnline = stateLower === 'running' || stateLower === 'online';
                                        const isStarting = stateLower === 'starting' || stateLower === 'installing';
                                        
                                        const cpu = Number(m?.cpuPercent || 0);
                                        const mem = Number(m?.memoryPercent || 0);

                                        return (
                                            <div 
                                                key={server.id} 
                                                onClick={() => navigate(`/app/server/${server.id}/overview`)}
                                                className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.5fr] px-6 py-4 hover:bg-surface-light/50 transition-colors cursor-pointer group border-b border-surface-lighter last:border-0"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-bold text-brand uppercase tracking-tight">{server.name}</span>
                                                    <span className="text-[9px] font-bold text-brand/20 uppercase tracking-tighter">{server.identifier}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    {server?.allocation?.ip_alias || server?.allocation?.ip ? (
                                                        <span className="text-[11px] font-bold text-brand/60 font-mono">
                                                            {server?.allocation?.ip_alias || server?.allocation?.ip}:{server?.allocation?.port}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-brand/20 italic">Assigning...</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col gap-0.5 min-w-[60px]">
                                                        <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest">CPU</span>
                                                        <span className="text-[11px] font-bold text-brand/60">{Math.round(cpu)}%</span>
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 min-w-[60px]">
                                                        <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest">RAM</span>
                                                        <span className="text-[11px] font-bold text-brand/60">{Math.round(mem)}%</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                                        isOnline ? 'bg-green-500' : isStarting ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`} />
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                                        isOnline ? 'text-green-600' : isStarting ? 'text-yellow-600' : 'text-red-600'
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
                                                            className="p-2 rounded-md hover:bg-surface-lighter text-brand/30 hover:text-brand transition-all cursor-pointer"
                                                        >
                                                            <Ellipsis size={14} />
                                                        </button>
                                                        
                                                        {openActionMenuId === server.id && (
                                                            <div 
                                                                className="absolute right-0 mt-2 w-32 bg-surface border border-surface-lighter rounded-md z-50 shadow-none py-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        setOpenActionMenuId(null);
                                                                        handleOpenEditModal(server);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-[11px] font-bold text-brand/60 hover:text-brand hover:bg-surface-light transition-all uppercase tracking-widest"
                                                                >
                                                                    Rename
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setOpenActionMenuId(null);
                                                                        setServerToDelete(server);
                                                                        setDeleteModalOpen(true);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-[11px] font-bold text-red-500 hover:bg-red-50 transition-all uppercase tracking-widest"
                                                                >
                                                                    Delete
                                                                </button>
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
        </div>
    );
}

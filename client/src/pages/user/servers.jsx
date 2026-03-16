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
    Check,
    Earth
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
                            className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                                activeFilter === 'online' 
                                    ? 'bg-surface-highlight border border-surface-lighter text-brand' 
                                    : 'text-brand/30 hover:text-brand/60 hover:bg-surface-lighter'
                            }`}
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Running
                        </button>
                        <button
                            onClick={() => setActiveFilter('offline')}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                                activeFilter === 'offline' 
                                    ? 'bg-surface-highlight border border-surface-lighter text-brand' 
                                    : 'text-brand/30 hover:text-brand/60 hover:bg-surface-lighter'
                            }`}
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
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
                        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.5fr] px-6 py-3">
                            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Name</span>
                            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em] text-center">Address</span>
                            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em] text-center">Location</span>
                            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em] text-center">Usage</span>
                            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em] text-center">Status</span>
                            <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em] text-right">Actions</span>
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

                            if (serversLoading || (servers.length > 0 && !metricsLoaded)) {
                                return (
                                    <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col min-h-[210px]">
                                        {Array.from({ length: Math.max(3, servers.length) }).map((_, i) => (
                                            <div key={i} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.5fr] px-6 py-4 border-b border-surface-lighter animate-pulse">
                                                <div className="flex flex-col gap-2">
                                                    <div className="h-3 w-28 bg-brand/5 rounded-sm" />
                                                    <div className="h-2 w-16 bg-brand/5 rounded-sm" />
                                                </div>
                                                <div className="flex items-center justify-center">
                                                    <div className="h-3 w-32 bg-brand/5 rounded-sm" />
                                                </div>
                                                <div className="flex items-center justify-center pr-10">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-3 bg-brand/5 rounded-sm" />
                                                        <div className="h-3 w-16 bg-brand/5 rounded-sm" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-center gap-4">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="h-1.5 w-6 bg-brand/5 rounded-full" />
                                                        <div className="h-3 w-8 bg-brand/5 rounded-sm" />
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="h-1.5 w-6 bg-brand/5 rounded-full" />
                                                        <div className="h-3 w-8 bg-brand/5 rounded-sm" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-brand/10" />
                                                    <div className="h-3 w-12 bg-brand/5 rounded-sm" />
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    <div className="w-8 h-8 rounded-md bg-brand/5" />
                                                </div>
                                            </div>
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
                                                onClick={() => navigate(`/app/server/${server.identifier}/overview`)}
                                                className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.5fr] px-6 py-4 hover:bg-surface-light/50 transition-colors cursor-pointer group border-b border-surface-lighter"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-bold text-brand uppercase tracking-tight">{server.name}</span>
                                                    <span className="text-[9px] font-bold text-brand/20 uppercase tracking-tighter">{server.identifier}</span>
                                                </div>
                                                <div className="flex items-center justify-center">
                                                    {server?.allocation?.ip_alias || server?.allocation?.ip ? (
                                                        <span className="text-[11px] font-bold text-brand/60 font-mono">
                                                            {server?.allocation?.ip_alias || server?.allocation?.ip}:{server?.allocation?.port}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-brand/20 italic">Assigning...</span>
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
                                                        <span className="text-[11px] font-bold text-brand/60 truncate max-w-[100px]">
                                                            {server.location?.description || server.location?.shortCode || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-center gap-4">
                                                    <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                                                        <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest">CPU</span>
                                                        <span className="text-[11px] font-bold text-brand/60">{Math.round(cpu)}%</span>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                                                        <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest">RAM</span>
                                                        <span className="text-[11px] font-bold text-brand/60">{Math.round(mem)}%</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-center gap-2">
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
            <CenterModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModal}
                maxWidth="max-w-2xl"
            >
                <div className="p-6">
                    <h2 className="text-[16px] font-bold text-brand mb-6">Create Server</h2>
                    
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            {[1, 2, 3, 4].map((step) => (
                                <div key={step} className="flex items-center flex-1">
                                    <div className={`flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold transition-all duration-200 ${
                                        step < createStep 
                                            ? 'bg-brand text-surface' 
                                            : step === createStep 
                                            ? 'bg-brand text-surface' 
                                            : 'bg-surface-light border border-surface-lighter text-brand/30'
                                    }`}>
                                        {step < createStep ? <Check size={12} strokeWidth={3} /> : step}
                                    </div>
                                    {step < 4 && (
                                        <div className={`flex-1 h-[1px] mx-2 ${
                                            step < createStep ? 'bg-brand' : 'bg-surface-lighter'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] font-bold text-brand/60 uppercase tracking-widest">
                            Step {createStep} of 4 · {
                                createStep === 1 ? 'Server Details' :
                                createStep === 2 ? 'Location' :
                                createStep === 3 ? 'Software' :
                                'Confirm'
                            }
                        </p>
                    </div>

                    {createStep === 1 && (
                        <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
                            <div>
                                <label className="block text-[10px] font-bold text-brand/60 uppercase tracking-widest mb-2">Server Name</label>
                                <input
                                    type="text"
                                    value={serverData.name}
                                    onChange={(e) => setServerData({ ...serverData, name: e.target.value })}
                                    placeholder="e.g. My Vanilla Survival"
                                    className="w-full h-10 px-4 bg-surface-light border border-surface-lighter rounded-md text-[12px] font-bold text-brand placeholder:text-brand/20 focus:outline-none focus:border-brand/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand/60 uppercase tracking-widest mb-2">Description</label>
                                <textarea
                                    value={serverData.description}
                                    onChange={(e) => setServerData({ ...serverData, description: e.target.value })}
                                    placeholder="Optional description..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-md text-[12px] font-bold text-brand placeholder:text-brand/20 focus:outline-none focus:border-brand/20 transition-all resize-none"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-surface-lighter">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-[10px] font-bold text-brand/60 hover:text-brand uppercase tracking-widest transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!serverData.name}
                                    className="h-9 px-6 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-none"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {createStep === 2 && (
                        <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
                            {loadingLocations ? (
                                <div className="py-12 text-center">
                                    <div className="w-6 h-6 border-2 border-brand/20 border-t-brand rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-[10px] font-bold text-brand/60 uppercase tracking-widest">Loading locations...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {locations.map((loc) => (
                                        <button
                                            key={loc.id}
                                            onClick={() => setServerData({ ...serverData, location: loc })}
                                            className={`p-4 rounded-md border text-left transition-all cursor-pointer ${
                                                serverData.location?.id === loc.id
                                                    ? 'bg-surface-highlight border-brand text-brand shadow-none'
                                                    : 'bg-surface-light border-surface-lighter text-brand/60 hover:border-brand/20'
                                            }`}
                                        >
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
                            <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-surface-lighter">
                                <button
                                    onClick={handleBack}
                                    className="px-4 py-2 text-[10px] font-bold text-brand/60 hover:text-brand uppercase tracking-widest transition-all cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!serverData.location}
                                    className="h-9 px-6 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-none"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {createStep === 3 && (
                        <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
                            {loadingNests ? (
                                <div className="py-12 text-center">
                                    <div className="w-6 h-6 border-2 border-brand/20 border-t-brand rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-[10px] font-bold text-brand/60 uppercase tracking-widest">Loading software...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {availableEggs.map((egg) => (
                                        <button
                                            key={egg.id}
                                            onClick={() => setServerData({ ...serverData, software: egg })}
                                            className={`p-4 rounded-md border text-left transition-all cursor-pointer ${
                                                serverData.software?.id === egg.id
                                                    ? 'bg-surface-highlight border-brand text-brand shadow-none'
                                                    : 'bg-surface-light border-surface-lighter text-brand/60 hover:border-brand/20'
                                            }`}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[12px] font-bold uppercase tracking-tight">{egg.name}</span>
                                                <span className="text-[9px] font-bold text-brand/60 uppercase tracking-widest">{egg.nestName}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-surface-lighter">
                                <button
                                    onClick={handleBack}
                                    className="px-4 py-2 text-[10px] font-bold text-brand/60 hover:text-brand uppercase tracking-widest transition-all cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!serverData.software}
                                    className="h-9 px-6 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-none"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {createStep === 4 && (
                        <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                            <div className="bg-surface-light border border-surface-lighter rounded-xl overflow-hidden">
                                <div className="px-5 py-3 border-b border-surface-lighter bg-brand/[0.01]">
                                    <p className="text-[10px] font-bold text-brand/40 uppercase tracking-[0.2em]">Deployment Manifest</p>
                                </div>
                                <div className="divide-y divide-surface-lighter">
                                    <div className="px-5 py-4 flex items-center justify-between group hover:bg-brand/[0.01] transition-colors">
                                        <p className="text-[10px] font-bold text-brand/30 uppercase tracking-widest">Instance Identity</p>
                                        <p className="text-[13px] font-bold text-brand tracking-tight">{serverData.name}</p>
                                    </div>
                                    <div className="px-5 py-4 flex items-center justify-between group hover:bg-brand/[0.01] transition-colors">
                                        <p className="text-[10px] font-bold text-brand/30 uppercase tracking-widest">Software</p>
                                        <p className="text-[13px] font-bold text-brand tracking-tight">{serverData.software?.name}</p>
                                    </div>
                                    <div className="px-5 py-4 flex items-center justify-between group hover:bg-brand/[0.01] transition-colors">
                                        <p className="text-[10px] font-bold text-brand/30 uppercase tracking-widest">Region</p>
                                        <div className="flex items-center gap-2">
                                            <img 
                                                src={`https://flagsapi.com/${serverData.location?.shortCode}/flat/64.png`} 
                                                alt={serverData.location?.shortCode} 
                                                className="w-4 h-3 rounded-sm object-cover opacity-80" 
                                            />
                                            <p className="text-[13px] font-bold text-brand tracking-tight">{serverData.location?.description}</p>
                                        </div>
                                    </div>
                                    <div className="px-5 py-4 flex items-center justify-between group hover:bg-brand/[0.01] transition-colors">
                                        <p className="text-[10px] font-bold text-brand/30 uppercase tracking-widest">Architecture</p>
                                        <p className="text-[13px] font-bold text-brand tracking-tight uppercase tracking-tighter">{serverData.software?.nestName}</p>
                                    </div>
                                </div>
                            </div>

                            {createServerError && (
                                <div className="px-4 py-3 rounded-md bg-red-500/5 border border-red-500/10">
                                    <p className="text-[11px] font-bold text-red-600 uppercase tracking-tight">{createServerError}</p>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-lighter">
                                <button
                                    onClick={handleBack}
                                    className="px-4 py-2 text-[10px] font-bold text-brand/40 hover:text-brand uppercase tracking-widest transition-all cursor-pointer"
                                >
                                    Back
                                </button>
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
                            </div>
                        </div>
                    )}
                </div>
            </CenterModal>

            <CenterModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                maxWidth="max-w-xl"
            >
                <div className="p-6">
                    <h2 className="text-[16px] font-bold text-brand mb-6">Rename Instance</h2>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-brand/60 uppercase tracking-widest mb-2">Instance Name</label>
                            <input
                                type="text"
                                value={editData.name}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                placeholder="Enter new name"
                                className="w-full h-10 px-4 bg-surface-light border border-surface-lighter rounded-md text-[12px] font-bold text-brand placeholder:text-brand/20 focus:outline-none focus:border-brand/20 transition-all"
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-surface-lighter">
                            <button
                                onClick={handleCloseEditModal}
                                className="px-4 py-2 text-[10px] font-bold text-brand/60 hover:text-brand uppercase tracking-widest transition-all cursor-pointer"
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
                    <h2 className="text-[16px] font-bold text-brand mb-4">Delete Instance</h2>
                    <p className="text-[12px] font-bold text-brand/60 mb-6">
                        Are you sure you want to delete <span className="text-brand">"{serverToDelete?.name}"</span>? This action is permanent and cannot be undone.
                    </p>
                    {deleteError && (
                        <div className="px-4 py-3 rounded-md bg-red-500/10 border border-red-500/20 mb-6">
                            <p className="text-[11px] font-bold text-red-500">{deleteError}</p>
                        </div>
                    )}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-lighter">
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={deletingServer}
                            className="px-4 py-2 text-[10px] font-bold text-brand/60 hover:text-brand uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
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
                            className="h-9 px-6 bg-red-500 text-white hover:bg-red-600 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-none"
                        >
                            {deletingServer ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Instance'
                            )}
                        </button>
                    </div>
                </div>
            </CenterModal>
        </div>
    );
}

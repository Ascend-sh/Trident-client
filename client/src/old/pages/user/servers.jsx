import { Box, Plus, Search, Activity, HardDrive, Cpu, Server, Check, ExternalLink, ChevronDown, Trash2, Edit, Pencil, SlidersHorizontal, RefreshCw, Layers2, Ellipsis } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CenterModal from "../../components/modals/center-modal";
import { useAuth } from "../../context/auth-context.jsx";

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
    const { user } = useAuth();
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
                console.log(`[ws] connected serverId=${id}`);
                ws.send(JSON.stringify({ event: 'auth', args: [creds.token] }));
                console.log(`[ws] auth sent serverId=${id}`);
            };

            ws.onmessage = (event) => {
                const safeSendStats = () => {
                    try {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ event: 'send stats', args: [] }));
                        }
                    } catch {
                    }
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
                console.log(`[ws] closed serverId=${id} code=${e?.code} reason=${e?.reason}`);
                delete socketsRef.current[id];
            };

            ws.onerror = () => {
                if (retry1) clearTimeout(retry1);
                if (retry2) clearTimeout(retry2);
                console.log(`[ws] error serverId=${id}`);
                try {
                    ws.close();
                } catch {
                }
            };
        } catch {
        }
    };

    useEffect(() => {
        for (const srv of servers) {
            connectServerSocket(srv);
        }

        return () => {
            for (const ws of Object.values(socketsRef.current)) {
                try {
                    ws.close();
                } catch {
                }
            }
            socketsRef.current = {};
        };
    }, [servers]);
    return (
        <div className="min-h-screen p-6 bg-surface">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-semibold text-white mb-1">Welcome back, {user?.username || "User"}</h1>
                        <p className="text-white/60 text-sm">Manage and monitor your game servers</p>
                    </div>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 hover:opacity-90 cursor-pointer bg-brand text-white" 
                    >
                        <Plus size={15} />
                        Create Server
                    </button>
                </div>
                
                <div className="flex items-end gap-6 mt-6">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className="relative pb-2 text-sm transition-colors duration-200"
                        style={{ color: activeFilter === 'all' ? '#fff' : 'rgba(255, 255, 255, 0.5)' }}
                    >
                        All Servers
                        {activeFilter === 'all' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-light"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveFilter('online')}
                        className="relative pb-2 text-sm transition-colors duration-200"
                        style={{ color: activeFilter === 'online' ? '#fff' : 'rgba(255, 255, 255, 0.5)' }}
                    >
                        Online
                        {activeFilter === 'online' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-light"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveFilter('offline')}
                        className="relative pb-2 text-sm transition-colors duration-200"
                        style={{ color: activeFilter === 'offline' ? '#fff' : 'rgba(255, 255, 255, 0.5)' }}
                    >
                        Offline
                        {activeFilter === 'offline' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-light"></div>
                        )}
                    </button>
                    <button
                        className="px-3 py-1.5 text-sm text-white/50 hover:text-white border border-surface-light rounded-md transition-colors duration-200"
                    >
                        + Add Filter
                    </button>
                </div>
            </div>


            {serversError && (
                <div className="mb-6 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/10">
                    <p className="text-sm text-red-200">{serversError}</p>
                </div>
            )}

            <div className="overflow-visible">


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
                            const state = m?.state;
                            const stateLower = String(state || '').toLowerCase();
                            
                            if (activeFilter === 'online') {
                                return stateLower === 'running' || stateLower === 'online';
                            } else if (activeFilter === 'offline') {
                                if (!state) return true;
                                return stateLower === 'offline' || stateLower === 'stopped';
                            } else if (activeFilter === 'starting') {
                                return stateLower === 'starting' || stateLower === 'installing';
                            }
                            return true;
                        });
                    }

                    const showSkeleton = (serversLoading && servers.length === 0) || (servers.length > 0 && !metricsLoaded);
                    
                    if (showSkeleton) {
                        return (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-surface-light">
                                            <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">IP Address</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Software</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Location</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Usage</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="border-b border-surface-light animate-pulse">
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <div className="h-3 w-32 bg-surface-light/50 rounded mb-1" />
                                                        <div className="h-2.5 w-24 bg-surface-light/50 rounded" />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="h-5 w-16 bg-surface-light/50 rounded" />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="h-3 w-24 bg-surface-light/50 rounded" />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="h-3 w-20 bg-surface-light/50 rounded" />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="h-3 w-40 bg-surface-light/50 rounded" />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="h-3 w-28 bg-surface-light/50 rounded" />
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="h-4 w-4 bg-surface-light/50 rounded ml-auto" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    }

                    if (filtered.length === 0) {
                        return (
                            <div className="py-16 text-center border border-surface-light rounded-lg">
                                <div className="mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-white/20 mx-auto">
                                        <path d="M16.5 7.5h-9v9h9v-9Z" />
                                        <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 0 1 9 3v.75h2.25V3a.75.75 0 0 1 1.5 0v.75H15V3a.75.75 0 0 1 1.5 0v.75h.75a3 3 0 0 1 3 3v.75H21A.75.75 0 0 1 21 9h-.75v2.25H21a.75.75 0 0 1 0 1.5h-.75V15H21a.75.75 0 0 1 0 1.5h-.75v.75a3 3 0 0 1-3 3h-.75V21a.75.75 0 0 1-1.5 0v-.75h-2.25V21a.75.75 0 0 1-1.5 0v-.75H9V21a.75.75 0 0 1-1.5 0v-.75h-.75a3 3 0 0 1-3-3v-.75H3A.75.75 0 0 1 3 15h.75v-2.25H3a.75.75 0 0 1 0-1.5h.75V9H3a.75.75 0 0 1 0-1.5h.75v-.75a3 3 0 0 1 3-3h.75V3a.75.75 0 0 1 .75-.75ZM6 6.75A.75.75 0 0 1 6.75 6h10.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V6.75Z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-medium text-white/70 mb-2">
                                    {activeFilter === 'all' ? 'No servers yet' : `No ${activeFilter} servers`}
                                </h3>
                                <p className="text-xs text-white/40 mb-6">
                                    {activeFilter === 'all' 
                                        ? 'Get started by creating your first game server.'
                                        : `You don't have any ${activeFilter} servers at the moment.`
                                    }
                                </p>
                            </div>
                        );
                    }

                    return (
                        <div className="overflow-visible">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-surface-light">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">IP Address</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Software</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Location</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Usage</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((server) => {
                                        const m = metricsByServerId[server.id];
                                        const hasLiveState = Boolean(m?.state);
                                        const state = hasLiveState ? m.state : 'fetching';
                                        const stateLower = String(state || '').toLowerCase();

                                        const isOnline = stateLower === 'running' || stateLower === 'online';
                                        const isStarting = stateLower === 'starting';
                                        const isInstalling = stateLower === 'installing';

                                        const isPending = isStarting || isInstalling;
                                        const isHealthy = isOnline;
                                        const statusTextCls = isPending
                                            ? 'text-yellow-300'
                                            : isHealthy
                                            ? 'text-green-400'
                                            : 'text-red-400';
                                        const statusDotCls = isPending
                                            ? 'bg-yellow-300'
                                            : isHealthy
                                            ? 'bg-green-400'
                                            : 'bg-red-400';
                                        const statusCls = `border border-surface-light ${statusTextCls}`;

                                        const cpu = Number(m?.cpuPercent || 0);
                                        const mem = Number(m?.memoryPercent || 0);
                                        const disk = hasLiveState && typeof m?.diskBytes === 'number' ? Math.round(m.diskBytes / 1024 / 1024) : 0;

                                        return (
                                            <tr 
                                                key={server.id} 
                                                className="border-b border-surface-light hover:bg-surface-light/30 transition-colors duration-200 cursor-pointer"
                                                onClick={() => navigate(`/app/server/${server.id}/overview`)}
                                            >
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{server.name}</p>
                                                        <p className="text-xs text-white/40">{server.identifier}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {server?.allocation?.ip_alias || server?.allocation?.ip ? (
                                                        <p className="text-sm text-white/80 font-mono">
                                                            {`${server?.allocation?.ip_alias || server?.allocation?.ip}:${server?.allocation?.port}`}
                                                        </p>
                                                    ) : (
                                                        <div className="h-3 w-28 bg-surface-light/50 rounded animate-pulse" />
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm text-white/80">{server.egg?.name || '-'}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {server.location?.shortCode && (
                                                            <img
                                                                src={`https://flagsapi.com/${server.location.shortCode}/flat/64.png`}
                                                                alt={server.location.shortCode}
                                                                className="w-5 h-4 rounded object-cover"
                                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                                            />
                                                        )}
                                                        <p className="text-sm text-white/80">{server.location?.description || server.location?.shortCode || '-'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3 text-sm text-white/70">
                                                        <span>{hasLiveState ? `${Math.round(cpu)}%` : '-'} CPU</span>
                                                        <span className="text-white/30">/</span>
                                                        <span>{hasLiveState ? `${Math.round(mem)}%` : '-'} RAM</span>
                                                        <span className="text-white/30">/</span>
                                                        <span>{hasLiveState ? `${disk}MB` : '-'} Disk</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium leading-none ${statusCls}`}>
                                                        <span className={`inline-block w-1.5 h-1.5 rounded-full relative top-px ${statusDotCls}`} />
                                                        {stateLower}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenActionMenuId(openActionMenuId === server.id ? null : server.id);
                                                            }}
                                                            className="p-1.5 rounded-lg hover:bg-surface-light transition-colors duration-200 cursor-pointer inline-flex items-center justify-center"
                                                            title="Server Actions"
                                                        >
                                                            <Ellipsis size={16} className="text-white/60" />
                                                        </button>
                                                        
                                                        {openActionMenuId === server.id && (
                                                            <div 
                                                                className="absolute right-0 mt-1 w-36 rounded-md border border-surface-light z-[9999] bg-surface-light"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <div className="py-1.5 px-1">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenActionMenuId(null);
                                                                            setEditingServerId(server.id);
                                                                        }}
                                                                        className="w-full px-2.5 py-1.5 text-left text-xs text-white hover:bg-surface-lighter transition-colors duration-200 rounded-md"
                                                                    >
                                                                        Rename
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenActionMenuId(null);
                                                                            // Handle change location
                                                                        }}
                                                                        className="w-full px-2.5 py-1.5 text-left text-xs text-white hover:bg-surface-lighter transition-colors duration-200 rounded-md"
                                                                    >
                                                                        Change Location
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenActionMenuId(null);
                                                                            // Handle change software
                                                                        }}
                                                                        className="w-full px-2.5 py-1.5 text-left text-xs text-white hover:bg-surface-lighter transition-colors duration-200 rounded-md"
                                                                    >
                                                                        Change Software
                                                                    </button>
                                                                    <div className="h-px bg-surface-light/50 my-1.5"></div>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenActionMenuId(null);
                                                                            setServerToDelete(server);
                                                                            setDeleteModalOpen(true);
                                                                        }}
                                                                        className="w-full px-2.5 py-1.5 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors duration-200 rounded-md"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })()}
            </div>

            <div className="mt-6">
                <h2 className="text-sm font-semibold text-white mb-3">Recent Activity</h2>
                <div>
                    {recentActivityLoading ? (
                        <div className="space-y-3 py-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between py-3 border-b border-surface-light animate-pulse">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="h-4 w-4 bg-surface-light/50 rounded" />
                                        <div className="min-w-0 flex-1">
                                            <div className="h-3 w-48 bg-surface-light/50 rounded mb-1" />
                                            <div className="h-2.5 w-28 bg-surface-light/50 rounded" />
                                        </div>
                                    </div>
                                    <div className="h-2.5 w-14 bg-surface-light/50 rounded ml-3" />
                                </div>
                            ))}
                        </div>
                    ) : recentActivity.length === 0 ? (
                        <div className="py-6 text-center text-xs text-white/40">No recent activity</div>
                    ) : (
                        recentActivity.slice(0, 6).map((item, idx) => {
                            const e = item?.event;
                            const isLogin = e === 'login';
                            const isLogout = e === 'logout';
                            const isServerCreate = e === 'server_created';
                            const isServerDelete = e === 'server_deleted';
                            const title = isLogin
                                ? 'Logged in to dashboard'
                                : isLogout
                                ? 'Logged out of dashboard'
                                : isServerCreate
                                ? 'Server created'
                                : isServerDelete
                                ? 'Server deleted'
                                : 'Activity';
                            const label = isServerCreate || isServerDelete
                                ? (item?.serverName || 'Server')
                                : (item?.email || user?.username || 'User');
                            return (
                                <div key={idx} className="flex items-center justify-between py-3 border-b border-surface-light hover:bg-surface-light/30 transition-colors duration-200">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <Layers2 size={16} className="text-white/40 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-white/80">
                                                <span className="font-medium">{label}</span>
                                                <span className="text-white/50"> · {title}</span>
                                                {(!isServerCreate && !isServerDelete && item?.ip) ? <span className="text-white/30"> · {item.ip}</span> : null}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-white/40 shrink-0 ml-3">{item?.relative || ''}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

           <CenterModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModal}
                maxWidth="max-w-2xl"
            >
                <div className="p-6 pb-4">
                    <h2 className="text-lg font-semibold text-white mb-4">Create Server</h2>
                    <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex items-center flex-1">
                                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-all duration-200 ${
                                    step < createStep 
                                        ? 'text-white' 
                                        : step === createStep 
                                        ? 'text-white' 
                                        : 'bg-surface-light text-white/50'
                                }`}
                                style={step <= createStep ? { backgroundColor: "var(--color-brand)" } : {}}
                                >
                                    {step < createStep ? <Check size={14} /> : step}
                                </div>
                                {step < 4 && (
                                    <div className={`flex-1 h-0.5 mx-2 transition-all duration-200 ${
                                        step < createStep ? '' : 'bg-surface-light'
                                    }`}
                                    style={step < createStep ? { backgroundColor: "var(--color-brand)" } : {}}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-white/50">
                        Step {createStep} of 4 - {
                            createStep === 1 ? 'Server Details' :
                            createStep === 2 ? 'Choose Location' :
                            createStep === 3 ? 'Select Software' :
                            'Review & Confirm'
                        }
                    </p>
                </div>

                {createStep === 1 && (
                    <div key="step-1" className="space-y-4 transition-all duration-300 ease-out animate-[fadeIn_0.3s_ease-out]">
                        <div>
                            <label className="block text-xs font-medium text-white/70 mb-2">Server Name</label>
                            <input
                                type="text"
                                value={serverData.name}
                                onChange={(e) => setServerData({ ...serverData, name: e.target.value })}
                                placeholder="e.g., My Awesome Server"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-light bg-surface-light/50 text-white placeholder:text-white/40 focus:outline-none focus:border-surface-lighter transition-colors duration-200"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-white/70 mb-2">Description</label>
                            <textarea
                                value={serverData.description}
                                onChange={(e) => setServerData({ ...serverData, description: e.target.value })}
                                placeholder="Optional description..."
                                rows={3}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-light bg-surface-light/50 text-white placeholder:text-white/40 focus:outline-none focus:border-surface-lighter transition-colors duration-200 resize-none"
                            />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-4 mt-6 border-t border-surface-light">
                            <button
                                onClick={handleCloseModal}
                                className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white rounded-lg border border-surface-light hover:border-surface-lighter transition-colors duration-200 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!serverData.name}
                                className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-brand"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {createStep === 2 && (
                    <div key="step-2" className="space-y-4 transition-all duration-300 ease-out animate-[fadeIn_0.3s_ease-out]">
                        <p className="text-xs text-white/70">Select a location for your server</p>
                        {loadingLocations ? (
                            <div className="p-8 text-center">
                                <svg className="animate-spin h-8 w-8 mx-auto text-white/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-xs text-white/50 mt-3">Loading locations...</p>
                            </div>
                        ) : locations.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-xs text-white/50">No locations available</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {locations.map((location) => (
                                    <button
                                        key={location.id}
                                        onClick={() => setServerData({ ...serverData, location: location })}
                                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                                            serverData.location?.id === location.id
                                                ? 'bg-surface-light/50'
                                                : 'border-surface-light bg-surface-light/30 hover:bg-surface-light hover:border-surface-lighter'
                                        }`}
                                        style={serverData.location?.id === location.id ? { borderColor: "var(--color-brand)" } : {}}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <img 
                                                src={`https://flagsapi.com/${location.shortCode}/flat/64.png`} 
                                                alt={location.shortCode} 
                                                className="w-7 h-5 rounded object-cover" 
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                            <h3 className="text-sm font-medium text-white">{location.description || location.shortCode}</h3>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center justify-end gap-2 pt-4 mt-6 border-t border-surface-light">
                            <button
                                onClick={handleBack}
                                className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white rounded-lg border border-surface-light hover:border-surface-lighter transition-colors duration-200 cursor-pointer"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!serverData.location}
                                className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-brand"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {createStep === 3 && (
                    <div key="step-3" className="space-y-4 transition-all duration-300 ease-out animate-[fadeIn_0.3s_ease-out]">
                        <p className="text-xs text-white/70">Choose server software</p>
                        {loadingNests ? (
                            <div className="p-8 text-center">
                                <svg className="animate-spin h-8 w-8 mx-auto text-white/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-xs text-white/50 mt-3">Loading software options...</p>
                            </div>
                        ) : availableEggs.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-xs text-white/50">No eggs available</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {availableEggs.map((egg) => (
                                    <button
                                        key={egg.id}
                                        onClick={() => setServerData({ ...serverData, software: egg })}
                                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                                            serverData.software?.id === egg.id
                                                ? 'bg-surface-light/50'
                                                : 'border-surface-light bg-surface-light/30 hover:bg-surface-light hover:border-surface-lighter'
                                        }`}
                                        style={serverData.software?.id === egg.id ? { borderColor: "var(--color-brand)" } : {}}
                                    >
                                        <div>
                                            <h3 className="text-sm font-medium text-white">{egg.name}</h3>
                                            <p className="text-xs text-white/50">{egg.nestName}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center justify-end gap-2 pt-4 mt-6 border-t border-surface-light">
                            <button
                                onClick={handleBack}
                                className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white rounded-lg border border-surface-light hover:border-surface-lighter transition-colors duration-200 cursor-pointer"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!serverData.software}
                                className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-brand"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {createStep === 4 && (
                    <div key="step-4" className="space-y-4 transition-all duration-300 ease-out animate-[fadeIn_0.3s_ease-out]">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">Ready to Create</h3>
                            <p className="text-sm text-white/60">Review your server configuration below</p>
                        </div>

                        {createServerError && (
                            <div className="px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/10">
                                <p className="text-sm text-red-200">{createServerError}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-white/50 mb-1">Server Name</p>
                                <p className="text-base text-white font-medium">{serverData.name}</p>
                            </div>

                            <div>
                                <p className="text-xs text-white/50 mb-1">Location</p>
                                <div className="flex items-center gap-2">
                                    <img 
                                        src={`https://flagsapi.com/${serverData.location?.shortCode}/flat/64.png`} 
                                        alt={serverData.location?.shortCode} 
                                        className="w-6 h-5 rounded object-cover" 
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                    <span className="text-base text-white">{serverData.location?.description || serverData.location?.shortCode}</span>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-white/50 mb-1">Software</p>
                                <p className="text-base text-white">{serverData.software?.name}</p>
                                <p className="text-sm text-white/50">{serverData.software?.nestName}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-4 mt-6 border-t border-surface-light">
                            <button
                                onClick={handleBack}
                                className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white rounded-lg border border-surface-light hover:border-surface-lighter transition-colors duration-200 cursor-pointer"
                            >
                                Back
                            </button>
                            <button
                                onClick={async () => {
                                    setCreateServerError("");
                                    setCreatingServer(true);

                                    try {
                                        const locationId = serverData.location?.id;
                                        const eggId = serverData.software?.id;

                                        await request('/create-server', {
                                            method: 'POST',
                                            body: {
                                                name: serverData.name,
                                                description: serverData.description || '',
                                                locationId,
                                                eggId,
                                                dockerImage: serverData.software?.dockerImage,
                                                startup: serverData.software?.startup,
                                                nestId: serverData.software?.nestId
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
                                className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer bg-brand"
                            >
                                {creatingServer ? (
                                    <>
                                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating...
                                    </>
                                ) : (
                                    'Create Server'
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
                title={`Edit Server - ${editingServer?.name || ''}`}
                maxWidth="max-w-xl"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-white/70 mb-2">Server Name</label>
                        <input
                            type="text"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            placeholder="Enter server name"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-surface-light bg-surface-light/50 text-white placeholder:text-white/40 focus:outline-none focus:border-surface-lighter transition-colors duration-200"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-white/70 mb-2">Location</label>
                        <button
                            onClick={() => {
                                setShowLocationDropdown(!showLocationDropdown);
                                setShowSoftwareDropdown(false);
                                if (locations.length === 0) {
                                    setLoadingLocations(true);
                                    request('/locations')
                                        .then((res) => setLocations(res?.locations || []))
                                        .catch(() => setLocations([]))
                                        .finally(() => setLoadingLocations(false));
                                }
                            }}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-surface-light bg-surface-light/50 text-left text-white/70 hover:bg-surface-light focus:outline-none focus:border-surface-lighter transition-colors duration-200 flex items-center justify-between"
                        >
                            <span>{editData.location?.description || editingServer?.location?.description || 'Select new location'}</span>
                            <ChevronDown size={16} className={`text-white/40 transition-transform duration-200 ${showLocationDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showLocationDropdown && locations.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 rounded-lg border border-surface-light bg-black/20">
                                {locations.map((location) => (
                                    <button
                                        key={location.id}
                                        onClick={() => {
                                            setEditData({ ...editData, location });
                                            setShowLocationDropdown(false);
                                        }}
                                        className={`p-2 rounded-lg border transition-all duration-200 text-left text-xs ${
                                            editData.location?.id === location.id
                                                ? 'bg-surface-light/50'
                                                : 'border-surface-light bg-surface-light/30 hover:bg-surface-light'
                                        }`}
                                        style={editData.location?.id === location.id ? { borderColor: "var(--color-brand)" } : {}}
                                    >
                                        <div className="flex items-center gap-2">
                                            <img 
                                                src={`https://flagsapi.com/${location.shortCode}/flat/64.png`} 
                                                alt={location.shortCode} 
                                                className="w-5 h-4 rounded object-cover" 
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                            <span className="text-white">{location.description || location.shortCode}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-white/70 mb-2">Server Software</label>
                        <button
                            onClick={() => {
                                setShowSoftwareDropdown(!showSoftwareDropdown);
                                setShowLocationDropdown(false);
                                if (nests.length === 0) {
                                    setLoadingNests(true);
                                    request('/nests')
                                        .then((res) => setNests(res?.nests || []))
                                        .catch(() => setNests([]))
                                        .finally(() => setLoadingNests(false));
                                }
                            }}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-surface-light bg-surface-light/50 text-left text-white/70 hover:bg-surface-light focus:outline-none focus:border-surface-lighter transition-colors duration-200 flex items-center justify-between"
                        >
                            <span>{editData.software?.name || editingServer?.egg?.name || 'Select new software'}</span>
                            <ChevronDown size={16} className={`text-white/40 transition-transform duration-200 ${showSoftwareDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showSoftwareDropdown && availableEggs.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 rounded-lg border border-surface-light bg-black/20">
                                {availableEggs.map((egg) => (
                                    <button
                                        key={egg.id}
                                        onClick={() => {
                                            setEditData({ ...editData, software: egg });
                                            setShowSoftwareDropdown(false);
                                        }}
                                        className={`p-2 rounded-lg border transition-all duration-200 text-left text-xs ${
                                            editData.software?.id === egg.id
                                                ? 'bg-surface-light/50'
                                                : 'border-surface-light bg-surface-light/30 hover:bg-surface-light'
                                        }`}
                                        style={editData.software?.id === egg.id ? { borderColor: "var(--color-brand)" } : {}}
                                    >
                                        <p className="text-white font-medium">{egg.name}</p>
                                        <p className="text-white/50 text-[10px]">{egg.nestName}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-2 border-t border-surface-light">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <button
                                    className="px-3 py-2 text-xs font-medium text-white rounded-lg bg-red-500 hover:bg-red-600 transition-colors duration-200 flex items-center gap-1.5"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                                <button
                                    className="px-3 py-2 text-xs font-medium text-white rounded-lg bg-yellow-600 hover:bg-yellow-700 transition-colors duration-200 flex items-center gap-1.5"
                                >
                                    <RefreshCw size={14} />
                                    Reinstall
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            onClick={handleCloseEditModal}
                            className="px-4 py-2 text-xs font-medium text-white rounded-lg border border-surface-light hover:bg-surface-light transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 text-xs font-medium text-white rounded-lg transition-all duration-200 hover:opacity-90 bg-brand"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </CenterModal>

            <CenterModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    if (!deletingServer) {
                        setDeleteModalOpen(false);
                        setServerToDelete(null);
                        setDeleteError("");
                    }
                }}
                maxWidth="max-w-md"
            >
                <div className="p-6 pb-4">
                    <h2 className="text-lg font-semibold text-white mb-4">Delete Server</h2>

                    <p className="text-xs text-white/60 mb-4">
                        Are you sure you want to delete <span className="font-semibold text-white">"{serverToDelete?.name}"</span>? This will permanently delete the server and all its data. This action cannot be undone.
                    </p>

                    {deleteError && (
                        <div className="px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/10 mb-4">
                            <p className="text-sm text-red-200">{deleteError}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-4 mt-6 border-t border-surface-light">
                        <button
                            onClick={() => {
                                setDeleteModalOpen(false);
                                setServerToDelete(null);
                                setDeleteError("");
                            }}
                            disabled={deletingServer}
                            className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white rounded-lg border border-surface-light hover:border-surface-lighter transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                            className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors duration-200 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {deletingServer ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5 inline mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Deleting...
                                </>
                            ) : (
                                'Delete Server'
                            )}
                        </button>
                    </div>
                </div>
            </CenterModal>
        </div>
    );
}



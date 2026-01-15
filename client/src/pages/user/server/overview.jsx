import { Play, Square, RotateCw, EthernetPort, ClockArrowUp, Fingerprint, Map, Cpu, MemoryStick, HardDrive, Network } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const HISTORY_POINTS = 30;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const appendHistory = (arr, value) => {
    const next = [...arr, value];
    if (next.length > HISTORY_POINTS) return next.slice(next.length - HISTORY_POINTS);
    return next;
};

const sanitizeConsoleLine = (line) => {
    const s = String(line ?? "");
    return s
        .replace(/\r/g, "")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1A\x1C-\x1F\x7F]/g, "");
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 8,
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
        },
    },
    scales: {
        x: {
            display: false,
        },
        y: {
            display: false,
            min: 0,
            max: 100,
        },
    },
    elements: {
        point: {
            radius: 0,
        },
        line: {
            tension: 0.4,
        },
    },
};

const createChartData = (data, color) => ({
    labels: Array.from({ length: data.length }, (_, i) => i),
    datasets: [
        {
            data: data,
            borderColor: color,
            backgroundColor: `${color}20`,
            fill: true,
            borderWidth: 2,
        },
    ],
});

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

function useServerIdFromParams() {
    const params = useParams();
    return useMemo(() => {
        const id = Number(params?.id);
        return Number.isFinite(id) && id > 0 ? id : null;
    }, [params?.id]);
}

export default function ServerOverview() {
    const serverId = useServerIdFromParams();
    const wsRef = useRef(null);
    const [wsReady, setWsReady] = useState(false);
    const [wsAuthed, setWsAuthed] = useState(false);
    const [command, setCommand] = useState("");

    const terminalRef = useRef(null);
    const xtermRef = useRef(null);
    const fitAddonRef = useRef(null);
    const [serverState, setServerState] = useState(null);
    const lastStatusLoggedRef = useRef(null);

    const [serverInfo, setServerInfo] = useState(null);
    const [primaryAllocation, setPrimaryAllocation] = useState(null);
    const [locationInfo, setLocationInfo] = useState(null);

    const [metrics, setMetrics] = useState({
        cpuPercent: 0,
        memoryBytes: 0,
        memoryLimitBytes: 0,
        memoryPercent: 0,
        diskBytes: 0,
        networkRxBytes: 0,
        networkTxBytes: 0,
        uptime: 0
    });

    const [series, setSeries] = useState({
        cpu: Array.from({ length: 10 }, () => 0),
        ram: Array.from({ length: 10 }, () => 0),
        disk: Array.from({ length: 10 }, () => 0),
        network: Array.from({ length: 10 }, () => 0)
    });
    useEffect(() => {
        if (!terminalRef.current) return;

        if (xtermRef.current) {
            try {
                xtermRef.current.dispose();
            } catch {
            }
            xtermRef.current = null;
            fitAddonRef.current = null;
        }

        terminalRef.current.innerHTML = "";

        const term = new Terminal({
            allowTransparency: true,
            rendererType: 'canvas',
            fontFamily: "Consolas, 'DejaVu Sans Mono', 'Liberation Mono', Menlo, Monaco, monospace",
            fontSize: 14,
            fontWeight: '400',
            lineHeight: 1.2,
            letterSpacing: 0,
            cursorBlink: false,
            disableStdin: true,
            convertEol: true,
            scrollback: 2000,
            theme: {
                background: "rgba(0,0,0,0)",
                foreground: "rgba(255,255,255,0.75)",
                cursor: "rgba(173,229,218,1)",
                selectionBackground: "rgba(173,229,218,0.2)",
            },
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();
        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);

        term.open(terminalRef.current);

        setTimeout(() => {
            try {
                fitAddon.fit();
                term.refresh(0, term.rows - 1);
            } catch {
            }
        }, 100);

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        const resizeObserver = new ResizeObserver(() => {
            try {
                fitAddon.fit();
            } catch {
            }
        });

        resizeObserver.observe(terminalRef.current);

        return () => {
            resizeObserver.disconnect();
            try {
                term.dispose();
            } catch {
            }
            xtermRef.current = null;
            fitAddonRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!serverId) return;

        request('/servers')
            .then((res) => {
                const found = (res?.servers || []).find((s) => s.id === serverId);
                setServerInfo(found || null);

                const locationId = Number(found?.location?.id);
                if (!Number.isFinite(locationId) || locationId <= 0) {
                    setLocationInfo(null);
                    return;
                }

                request('/locations')
                    .then((locRes) => {
                        const loc = (locRes?.locations || []).find((l) => l.id === locationId);
                        setLocationInfo(loc || null);
                    })
                    .catch(() => setLocationInfo(null));
            })
            .catch(() => {
                setServerInfo(null);
                setLocationInfo(null);
            });

        request(`/servers/${serverId}/network/allocations`)
            .then((res) => {
                setPrimaryAllocation(res?.primary || null);
            })
            .catch(() => setPrimaryAllocation(null));
    }, [serverId]);

    useEffect(() => {
        if (!serverId) return;

        let ws;
        let cancelled = false;

        const connect = async () => {
            try {
                const creds = await request(`/servers/${serverId}/websocket`);
                if (cancelled) return;
                if (!creds?.socket || !creds?.token) return;

                ws = new WebSocket(creds.socket);
                wsRef.current = ws;

                ws.onopen = () => {
                    if (cancelled) return;
                    setWsReady(true);
                    ws.send(JSON.stringify({ event: "auth", args: [creds.token] }));
                };

                ws.onmessage = (event) => {
                    let msg;
                    try {
                        msg = JSON.parse(event.data);
                    } catch {
                        return;
                    }

                    const evt = msg?.event;
                    const args = Array.isArray(msg?.args) ? msg.args : [];

                    if (evt === "auth success") {
                        setWsAuthed(true);
                        ws.send(JSON.stringify({ event: "send logs", args: [] }));
                        ws.send(JSON.stringify({ event: "send stats", args: [] }));
                        return;
                    }

                    if (evt === "console output") {
                        const line = typeof args[0] === "string" ? args[0] : "";
                        if (!line) return;
                        const cleaned = sanitizeConsoleLine(line);
                        if (!cleaned) return;

                        try {
                            xtermRef.current?.writeln(cleaned);
                        } catch {
                        }

                        return;
                    }

                    if (evt === "status") {
                        const s = typeof args[0] === "string" ? args[0] : null;
                        if (s) {
                            const normalized = s.toLowerCase();
                            setServerState(normalized);

                            if (lastStatusLoggedRef.current !== normalized) {
                                lastStatusLoggedRef.current = normalized;
                                try {
                                    xtermRef.current?.writeln(`\x1b[33m[Torqen]\x1b[0m Server marked as ${normalized}...`);
                                } catch {
                                }
                            }
                        }
                        return;
                    }

                    if (evt === "stats") {
                        const raw = args[0];
                        let stats;
                        try {
                            stats = typeof raw === 'string' ? JSON.parse(raw) : raw;
                        } catch {
                            return;
                        }

                        const s = typeof stats?.state === 'string' ? stats.state : null;
                        if (s) setServerState(s);

                        const cpuPercent = Number(stats?.cpu_absolute || 0);
                        const memoryBytes = Number(stats?.memory_bytes || 0);
                        const memoryLimitBytes = Number(stats?.memory_limit_bytes || 0);
                        const memoryPercent = memoryLimitBytes > 0 ? clamp((memoryBytes / memoryLimitBytes) * 100, 0, 100) : 0;
                        const diskBytes = Number(stats?.disk_bytes || 0);
                        const rxBytes = Number(stats?.network?.rx_bytes || 0);
                        const txBytes = Number(stats?.network?.tx_bytes || 0);
                        const uptime = Number(stats?.uptime || 0);

                        setMetrics({
                            cpuPercent,
                            memoryBytes,
                            memoryLimitBytes,
                            memoryPercent,
                            diskBytes,
                            networkRxBytes: rxBytes,
                            networkTxBytes: txBytes,
                            uptime
                        });

                        const networkKbps = (rxBytes + txBytes) / 1024;

                        setSeries(prev => ({
                            cpu: appendHistory(prev.cpu, clamp(cpuPercent, 0, 100)),
                            ram: appendHistory(prev.ram, clamp(memoryPercent, 0, 100)),
                            disk: appendHistory(prev.disk, clamp((diskBytes / (1024 * 1024)) % 100, 0, 100)),
                            network: appendHistory(prev.network, clamp(networkKbps, 0, 100))
                        }));

                        return;
                    }
                };

                ws.onclose = () => {
                    if (cancelled) return;
                    setWsReady(false);
                    setWsAuthed(false);
                    try {
                        xtermRef.current?.writeln('\x1b[33m[Torqen]\x1b[0m Console disconnected');
                    } catch {
                    }
                };

                ws.onerror = () => {
                    if (cancelled) return;
                    setWsReady(false);
                    setWsAuthed(false);
                };
            } catch {
                if (cancelled) return;
                setWsReady(false);
                setWsAuthed(false);
            }
        };

        connect();

        return () => {
            cancelled = true;
            try {
                ws?.close();
            } catch {
            }
            wsRef.current = null;
        };
    }, [serverId]);

    const [powerActionLoading, setPowerActionLoading] = useState(null);

    const normalizedState = (serverState || '').toLowerCase();
    const isOnline = normalizedState === 'running' || normalizedState === 'online';
    const isOffline = !normalizedState || normalizedState === 'offline' || normalizedState === 'stopped';
    const isTransitioning = normalizedState === 'starting' || normalizedState === 'stopping' || normalizedState === 'installing';

    const canStart = isOffline && !isTransitioning;
    const canRestart = isOnline && !isTransitioning;
    const canStop = isOnline && !isTransitioning;

    const canSendCommand = wsReady && wsAuthed;

    const setPower = async (state) => {
        if (!serverId) return;
        if (powerActionLoading) return;
        setPowerActionLoading(state);
        try {
            await request(`/servers/${serverId}/power`, {
                method: "POST",
                body: { state }
            });
        } finally {
            setPowerActionLoading(null);
        }
    };

    const sendCommand = () => { 
        const value = command.trim();
        if (!value) return;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({ event: "send command", args: [value] }));
        setCommand("");
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-white mb-1">{serverInfo?.name || 'Server'}</h1>
                        <p className="text-sm text-white/50">{serverInfo?.description || '-'}</p>
                    </div>
                    <div className="p-2 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setPower('start')}
                                disabled={!serverId || powerActionLoading || !canStart}
                                className="px-3 py-1.5 text-xs font-medium text-black rounded-lg transition-all duration-200 hover:opacity-90 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ backgroundColor: "#ADE5DA" }}
                            >
                                <Play size={14} />
                                {powerActionLoading === 'start' ? 'Starting...' : 'Start'}
                            </button>
                            <button 
                                onClick={() => setPower('restart')}
                                disabled={!serverId || powerActionLoading || !canRestart}
                                className="px-3 py-1.5 text-xs font-medium text-white rounded-lg bg-yellow-600 hover:bg-yellow-700 transition-colors duration-200 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/40"
                            >
                                <RotateCw size={14} />
                                {powerActionLoading === 'restart' ? 'Restarting...' : 'Restart'}
                            </button>
                            <button 
                                onClick={() => setPower('stop')}
                                disabled={!serverId || powerActionLoading || !canStop}
                                className="px-3 py-1.5 text-xs font-medium text-white rounded-lg bg-red-500 hover:bg-red-600 transition-colors duration-200 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/40"
                            >
                                <Square size={14} />
                                {powerActionLoading === 'stop' ? 'Stopping...' : 'Stop'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="p-3 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div className="flex items-center gap-2 mb-1">
                        <EthernetPort size={14} className="text-white/60" />
                        <p className="text-xs text-white/60">Server IP & Port</p>
                    </div>
                    <p className="text-sm font-medium text-white font-mono">
                        {primaryAllocation
                            ? `${primaryAllocation.ip_alias || primaryAllocation.ip}:${primaryAllocation.port}`
                            : '-'
                        }
                    </p>
                </div>

                <div className="p-3 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div className="flex items-center gap-2 mb-1">
                        <ClockArrowUp size={14} className="text-white/60" />
                        <p className="text-xs text-white/60">Status</p>
                    </div>
                    <p className="text-sm font-medium text-white">{normalizedState || 'fetching'}</p>
                </div>

                <div className="p-3 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div className="flex items-center gap-2 mb-1">
                        <Fingerprint size={14} className="text-white/60" />
                        <p className="text-xs text-white/60">Server UID</p>
                    </div>
                    <p className="text-sm font-medium text-white font-mono">{serverInfo?.identifier || '-'}</p>
                </div>

                <div className="p-3 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div className="flex items-center gap-2 mb-1">
                        <Map size={14} className="text-white/60" />
                        <p className="text-xs text-white/60">Location</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {locationInfo?.shortCode && (
                            <img
                                src={`https://flagsapi.com/${locationInfo.shortCode}/flat/64.png`}
                                alt={locationInfo.shortCode}
                                className="w-5 h-4 rounded object-cover"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        )}
                        <p className="text-sm font-medium text-white">{locationInfo?.description || '-'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="p-3 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Cpu size={14} className="text-white/60" />
                            <p className="text-xs text-white/60">CPU Usage</p>
                        </div>
                        <p className="text-sm font-medium text-white">{Math.round(metrics.cpuPercent)}%</p>
                    </div>
                    <div className="h-20">
                        <Line data={createChartData(series.cpu, '#60A5FA')} options={chartOptions} />
                    </div>
                </div>

                <div className="p-3 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <MemoryStick size={14} className="text-white/60" />
                            <p className="text-xs text-white/60">RAM Usage</p>
                        </div>
                        <p className="text-sm font-medium text-white">{Math.round(metrics.memoryBytes / (1024 * 1024))} MB</p>
                    </div>
                    <div className="h-20">
                        <Line data={createChartData(series.ram, '#A78BFA')} options={chartOptions} />
                    </div>
                </div>

                <div className="p-3 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <HardDrive size={14} className="text-white/60" />
                            <p className="text-xs text-white/60">Disk Usage</p>
                        </div>
                        <p className="text-sm font-medium text-white">{Math.round(metrics.diskBytes / (1024 * 1024))} MB</p>
                    </div>
                    <div className="h-20">
                        <Line data={createChartData(series.disk, '#FB923C')} options={chartOptions} />
                    </div>
                </div>

                <div className="p-3 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Network size={14} className="text-white/60" />
                            <p className="text-xs text-white/60">Network</p>
                        </div>
                        <p className="text-sm font-medium text-white">{Math.round((metrics.networkRxBytes + metrics.networkTxBytes) / 1024)} KB/s</p>
                    </div>
                    <div className="h-20">
                        <Line data={createChartData(series.network, '#4ADE80')} options={chartOptions} />
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent overflow-hidden">
                <div className="p-4 bg-black/20 h-96">
                    <div 
                        ref={terminalRef} 
                        className="w-full h-full [&_.xterm]:bg-transparent [&_.xterm-viewport]:bg-transparent [&_.xterm-screen]:bg-transparent"
                    />
                    {!serverId && (
                        <div className="text-xs text-white/50 font-mono mt-2">[Server] No server selected.</div>
                    )}
                    {serverId && !wsReady && (
                        <div className="text-xs text-white/50 font-mono mt-2">[Server] Connecting...</div>
                    )}
                    {serverId && wsReady && !wsAuthed && (
                        <div className="text-xs text-white/50 font-mono mt-2">[Server] Authorizing...</div>
                    )}
                </div>
                <div className="p-3 border-t border-white/10">
                    <input
                        type="text"
                        placeholder={canSendCommand ? "Type command..." : "Console not ready"}
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') sendCommand();
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-black/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 transition-colors duration-200 font-mono"
                        disabled={!canSendCommand}
                    />
                </div>
            </div>
        </div>
    );
}
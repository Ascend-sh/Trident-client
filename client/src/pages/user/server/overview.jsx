import { Play, Square, RotateCw, EthernetPort, ClockArrowUp, Fingerprint, Map, Cpu, MemoryStick, HardDrive, Network } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import CenterModal from "../../../components/modals/center-modal";
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

const formatUptime = (ms) => {
    const total = Math.max(0, Number(ms) || 0);
    const sec = Math.floor(total / 1000);
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    const s = String(seconds).padStart(2, '0');
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${s}s`;
    return `${hours}h ${minutes}m ${s}s`;
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false
    },
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            enabled: true,
            backgroundColor: '#121212',
            borderRadius: '0.75rem',
            padding: 6,
            bodyColor: '#fff',
            titleColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            displayColors: true,
            boxWidth: 6,
            boxHeight: 6,
            boxPadding: 3,
            cornerRadius: 4,
            titleFont: {
                size: 10,
                weight: '500'
            },
            bodyFont: {
                size: 10,
                weight: '400'
            },
            callbacks: {
                title: function() {
                    return '';
                },
                label: function(context) {
                    const label = context.dataset.label || '';
                    const value = Math.round(context.parsed.y * 10) / 10;
                    return ` ${label}: ${value}`;
                }
            }
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

    const [eulaModalOpen, setEulaModalOpen] = useState(false);
    const [acceptingEula, setAcceptingEula] = useState(false);
    const eulaTriggeredRef = useRef(false);
    const eulaCheckInFlightRef = useRef(false);

    const [serverInfo, setServerInfo] = useState(null);
    const [primaryAllocation, setPrimaryAllocation] = useState(null);
    const [locationInfo, setLocationInfo] = useState(null);
    const [metricsLoaded, setMetricsLoaded] = useState(false);

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
        networkRx: Array.from({ length: 10 }, () => 0),
        networkTx: Array.from({ length: 10 }, () => 0)
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
                        eulaTriggeredRef.current = false;
                        eulaCheckInFlightRef.current = false;
                        ws.send(JSON.stringify({ event: "send logs", args: [] }));
                        ws.send(JSON.stringify({ event: "send stats", args: [] }));
                        
                        checkEulaFile();
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

                        if (!eulaTriggeredRef.current && !eulaCheckInFlightRef.current && cleaned.toLowerCase().includes('eula')) {
                            eulaTriggeredRef.current = true;
                            setEulaModalOpen(true);
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
                        
                        setMetricsLoaded(true);

                        const rxKbps = rxBytes / 1024;
                        const txKbps = txBytes / 1024;

                        setSeries(prev => ({
                            cpu: appendHistory(prev.cpu, clamp(cpuPercent, 0, 100)),
                            ram: appendHistory(prev.ram, clamp(memoryPercent, 0, 100)),
                            disk: appendHistory(prev.disk, clamp((diskBytes / (1024 * 1024)) % 100, 0, 100)),
                            networkRx: appendHistory(prev.networkRx, clamp(rxKbps, 0, 100)),
                            networkTx: appendHistory(prev.networkTx, clamp(txKbps, 0, 100))
                        }));

                        return;
                    }
                };

                ws.onclose = () => {
                    if (cancelled) return;
                    setWsReady(false);
                    setWsAuthed(false);
                    eulaTriggeredRef.current = false;
                    eulaCheckInFlightRef.current = false;
                    try {
                        xtermRef.current?.writeln('\x1b[33m[Torqen]\x1b[0m Console disconnected');
                    } catch {
                    }
                };

                ws.onerror = () => {
                    if (cancelled) return;
                    setWsReady(false);
                    setWsAuthed(false);
                    eulaTriggeredRef.current = false;
                    eulaCheckInFlightRef.current = false;
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
    const isStarting = normalizedState === 'starting';
    const isStopping = normalizedState === 'stopping';
    const isInstalling = normalizedState === 'installing';

    const canStart = (isOffline || isStopping) && !isStarting && !isInstalling;
    const canRestart = isOnline && !isStarting && !isStopping && !isInstalling;
    const canStop = (isOnline || isStarting) && !isStopping && !isInstalling;

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

    const checkEulaFile = async () => {
        if (!serverId || eulaCheckInFlightRef.current) return;
        eulaCheckInFlightRef.current = true;

        try {
            const res = await fetch(`${API_BASE}/servers/${serverId}/files/contents?file=${encodeURIComponent('/eula.txt')}`, {
                method: "GET",
                credentials: "include"
            });

            if (!res.ok) {
                eulaTriggeredRef.current = false;
                return;
            }

            const content = (await res.text()) || '';
            const hasAcceptedEula = content.toLowerCase().includes('eula=true');

            if (!hasAcceptedEula) {
                eulaTriggeredRef.current = false;
            }
        } catch {
            eulaTriggeredRef.current = false;
        } finally {
            eulaCheckInFlightRef.current = false;
        }
    };

    const acceptEula = async () => {
        if (!serverId || acceptingEula) return;
        setAcceptingEula(true);
        eulaCheckInFlightRef.current = true;
        try {
            const res = await fetch(`${API_BASE}/servers/${serverId}/files/write?file=${encodeURIComponent('/eula.txt')}`, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain"
                },
                body: "eula=true",
                credentials: "include"
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Failed to write EULA file');
            }

            setEulaModalOpen(false);
            eulaTriggeredRef.current = false;
            eulaCheckInFlightRef.current = false;
        } catch (err) {
            try {
                xtermRef.current?.writeln(`\x1b[31m[Torqen]\x1b[0m Failed to accept EULA: ${err.message}`);
            } catch {}
            eulaTriggeredRef.current = false;
            eulaCheckInFlightRef.current = false;
        } finally {
            setAcceptingEula(false);
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-white mb-1">{serverInfo?.name || 'Server'}</h1>
                        <p className="text-sm text-white/50">{serverInfo?.description || '-'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setPower('start')}
                            disabled={!serverId || powerActionLoading || !canStart || isStarting}
                            className="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 hover:opacity-90 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            style={{ backgroundColor: "#E0FE58", color: "#18181b" }}
                        >
                            {powerActionLoading === 'start' || isStarting ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Starting...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                                    </svg>
                                    Start
                                </>
                            )}
                        </button>
                        <button 
                            onClick={() => setPower('restart')}
                            disabled={!serverId || powerActionLoading || !canRestart || isStopping}
                            className="px-3 py-1.5 text-xs font-medium text-white rounded-md border border-white/10 hover:bg-white/5 transition-colors duration-200 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {powerActionLoading === 'restart' ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Restarting...
                                </>
                            ) : (
                                <>
                                    <RotateCw size={14} />
                                    Restart
                                </>
                            )}
                        </button>
                        <button 
                            onClick={() => setPower('stop')}
                            disabled={!serverId || powerActionLoading || !canStop || isStopping}
                            className="px-3 py-1.5 text-xs font-medium text-white rounded-md border border-white/10 hover:bg-white/5 transition-colors duration-200 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {powerActionLoading === 'stop' || isStopping ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Stopping...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                        <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
                                    </svg>
                                    Stop
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {!metricsLoaded ? (
                    <>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-lg border border-white/10 bg-black/20 p-3 flex flex-col animate-pulse">
                                <div className="h-4 w-32 bg-white/10 rounded mb-1" />
                                <div className="h-3 w-20 bg-white/10 rounded" />
                            </div>
                        ))}
                    </>
                ) : (
                    <>
                        <div className="rounded-lg border border-white/10 bg-black/20 p-3 flex flex-col">
                            <p className="text-sm font-medium text-white font-mono mb-0.5">
                                {primaryAllocation
                                    ? `${primaryAllocation.ip_alias || primaryAllocation.ip}:${primaryAllocation.port}`
                                    : '-'
                                }
                            </p>
                            <p className="text-[10px] text-white/60">Server IP & Port</p>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-black/20 p-3 flex flex-col">
                            <p className="text-sm font-medium text-white mb-0.5">{(isOffline || !wsReady || !wsAuthed) ? 'Offline' : formatUptime(metrics.uptime)}</p>
                            <p className="text-[10px] text-white/60">Uptime</p>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-black/20 p-3 flex flex-col">
                            <p className="text-sm font-medium text-white font-mono mb-0.5">{serverInfo?.identifier || '-'}</p>
                            <p className="text-[10px] text-white/60">Server UID</p>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-black/20 p-3 flex flex-col">
                            <div className="flex items-center gap-2 mb-0.5">
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
                            <p className="text-[10px] text-white/60">Location</p>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {!metricsLoaded ? (
                    <>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-3 rounded-lg border border-white/10 bg-black/20 animate-pulse">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="h-3 w-20 bg-white/10 rounded" />
                                    <div className="h-4 w-12 bg-white/10 rounded" />
                                </div>
                                <div className="h-20 bg-white/10 rounded" />
                            </div>
                        ))}
                    </>
                ) : (
                    <>
                        <div className="p-3 rounded-lg border border-white/10 bg-black/20">
                            <div className="flex items-start justify-between mb-3 h-9">
                                <p className="text-[10px] text-white/60 uppercase tracking-wider">CPU Usage</p>
                                <div className="h-9 flex items-center">
                                    <p className="text-sm font-medium text-white">{Math.round(metrics.cpuPercent)}%</p>
                                </div>
                            </div>
                            <div className="h-20">
                                <Line data={createChartData(series.cpu, '#60A5FA')} options={chartOptions} />
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border border-white/10 bg-black/20">
                            <div className="flex items-start justify-between mb-3 h-9">
                                <p className="text-[10px] text-white/60 uppercase tracking-wider">RAM Usage</p>
                                <div className="h-9 flex items-center">
                                    <p className="text-sm font-medium text-white">{Math.round(metrics.memoryBytes / (1024 * 1024))} MB</p>
                                </div>
                            </div>
                            <div className="h-20">
                                <Line data={createChartData(series.ram, '#A78BFA')} options={chartOptions} />
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border border-white/10 bg-black/20">
                            <div className="flex items-start justify-between mb-3 h-9">
                                <p className="text-[10px] text-white/60 uppercase tracking-wider">Disk Usage</p>
                                <div className="h-9 flex items-center">
                                    <p className="text-sm font-medium text-white">{Math.round(metrics.diskBytes / (1024 * 1024))} MB</p>
                                </div>
                            </div>
                            <div className="h-20">
                                <Line data={createChartData(series.disk, '#FB923C')} options={chartOptions} />
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border border-white/10 bg-black/20">
                            <div className="flex items-start justify-between mb-3 h-9">
                                <p className="text-[10px] text-white/60 uppercase tracking-wider">Network</p>
                                <div className="h-9 flex flex-col justify-center items-end leading-tight">
                                    <p className="text-[11px] font-medium text-white">Download {Math.round(metrics.networkRxBytes / 1024)} KB/s</p>
                                    <p className="text-[11px] font-medium text-white/70">Upload {Math.round(metrics.networkTxBytes / 1024)} KB/s</p>
                                </div>
                            </div>
                            <div className="h-20">
                                <Line
                                    data={{
                                        labels: Array.from({ length: series.networkRx.length }, (_, i) => i),
                                        datasets: [
                                            {
                                                label: 'Download',
                                                data: series.networkRx,
                                                borderColor: '#4ADE80',
                                                backgroundColor: '#4ADE8020',
                                                fill: true,
                                                borderWidth: 2
                                            },
                                            {
                                                label: 'Upload',
                                                data: series.networkTx,
                                                borderColor: '#60A5FA',
                                                backgroundColor: '#60A5FA20',
                                                fill: true,
                                                borderWidth: 2
                                            }
                                        ]
                                    }}
                                    options={chartOptions}
                                />
                            </div>
                        </div>
                    </>
                )}
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

            <CenterModal isOpen={eulaModalOpen} onClose={() => !acceptingEula && setEulaModalOpen(false)}>
                <div className="p-6 pb-4">
                    <h2 className="text-lg font-semibold text-white mb-4">Minecraft EULA Agreement</h2>
                    <p className="text-sm text-white/70 mb-6">
                        Your server has detected that the Minecraft EULA has not been accepted. 
                        By clicking "Accept EULA", you agree to Mojang's End User License Agreement.
                    </p>
                    <p className="text-xs text-white/50 mb-6">
                        Read the full EULA at: <a href="https://account.mojang.com/documents/minecraft_eula" target="_blank" rel="noopener noreferrer" className="text-[#E0FE58] hover:underline">https://account.mojang.com/documents/minecraft_eula</a>
                    </p>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => {
                                setEulaModalOpen(false);
                                eulaTriggeredRef.current = false;
                                eulaCheckInFlightRef.current = false;
                            }}
                            disabled={acceptingEula}
                            className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white rounded-lg border border-white/10 hover:border-white/20 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={acceptEula}
                            disabled={acceptingEula}
                            className="px-3 py-1.5 text-xs font-medium text-black rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            style={{ backgroundColor: "#E0FE58" }}
                        >
                            {acceptingEula ? (
                                <>
                                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Accepting...
                                </>
                            ) : (
                                'Accept EULA'
                            )}
                        </button>
                    </div>
                </div>
            </CenterModal>
        </div>
    );
}



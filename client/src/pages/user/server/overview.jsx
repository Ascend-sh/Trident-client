import {
    Play,
    Square,
    RefreshCw,
    Copy,
    Check,
    Loader2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import ServerNav from "../../../components/navigation/server-nav";
import CenterModal from "../../../components/modals/center-modal";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const MAX_HISTORY = 30;

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

const sanitizeConsoleLine = (line) => {
    const s = String(line ?? "");
    return s
        .replace(/\r/g, "")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1A\x1C-\x1F\x7F]/g, "");
};

export default function ServerOverview() {
    const { identifier } = useParams();
    const [status, setStatus] = useState("offline");
    const [serverInfo, setServerInfo] = useState(null);
    const [primaryAllocation, setPrimaryAllocation] = useState(null);
    const [stats, setStats] = useState({
        cpu: 0,
        memory: 0,
        memoryLimit: 1024,
        disk: 0,
        diskLimit: 2048,
        uptime: 0,
        networkRx: 0,
        networkTx: 0
    });
    const [statsHistory, setStatsHistory] = useState([]);
    const [copied, setCopied] = useState(false);
    const [command, setCommand] = useState("");
    const [isConnecting, setIsConnecting] = useState(true);
    const [powerLoading, setPowerLoading] = useState(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [eulaModalOpen, setEulaModalOpen] = useState(false);
    const [acceptingEula, setAcceptingEula] = useState(false);
    const eulaTriggeredRef = useRef(false);
    const eulaCheckInFlightRef = useRef(false);
    const terminalRef = useRef(null);
    const xtermRef = useRef(null);
    const fitAddonRef = useRef(null);
    const wsRef = useRef(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            cursorBlink: false,
            disableStdin: true,
            allowTransparency: true,
            fontSize: 14,
            fontFamily: "Consolas, 'DejaVu Sans Mono', 'Liberation Mono', Menlo, Monaco, monospace",
            theme: {
                background: getComputedStyle(document.documentElement).getPropertyValue('--surface-light').trim() || "#18181b",
                foreground: "rgba(255, 255, 255, 0.8)",
                selectionBackground: "rgba(255, 255, 255, 0.1)",
            },
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);

        setTimeout(() => {
            try {
                fitAddon.fit();
            } catch (err) {
                console.error("Fit failed:", err);
            }
        }, 100);

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        const handleResize = () => {
            try {
                fitAddon.fit();
            } catch {}
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
        };
    }, []);

    const checkEulaFile = async () => {
        if (!serverInfo?.id || eulaCheckInFlightRef.current) return;
        eulaCheckInFlightRef.current = true;
        try {
            const res = await fetch(`${API_BASE}/servers/${serverInfo.id}/files/contents?file=${encodeURIComponent('/eula.txt')}`, {
                method: "GET",
                credentials: "include"
            });
            if (!res.ok) {
                eulaTriggeredRef.current = false;
                return;
            }
            const content = (await res.text()) || '';
            if (!content.toLowerCase().includes('eula=true')) {
                eulaTriggeredRef.current = false;
            }
        } catch {
            eulaTriggeredRef.current = false;
        } finally {
            eulaCheckInFlightRef.current = false;
        }
    };

    const acceptEula = async () => {
        if (!serverInfo?.id || acceptingEula) return;
        setAcceptingEula(true);
        eulaCheckInFlightRef.current = true;
        try {
            await fetch(`${API_BASE}/servers/${serverInfo.id}/files/write?file=${encodeURIComponent('/eula.txt')}`, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: "eula=true",
                credentials: "include"
            });
            setEulaModalOpen(false);
            eulaTriggeredRef.current = false;
            eulaCheckInFlightRef.current = false;
        } catch (err) {
            console.error("Failed to accept EULA:", err);
            eulaTriggeredRef.current = false;
            eulaCheckInFlightRef.current = false;
        } finally {
            setAcceptingEula(false);
        }
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

    const formatMB = (mb) => {
        if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
        return `${Math.round(mb)} MB`;
    };

    const formatBytes = (bytes) => {
        if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
        if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
        if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${bytes} B`;
    };

    const handleSendCommand = (e) => {
        if (e.key === 'Enter' && command.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ event: "send command", args: [command.trim()] }));
            setCommand("");
        }
    };

    const handlePower = async (action) => {
        if (!serverInfo?.id || powerLoading) return;
        setPowerLoading(action);
        try {
            await request(`/servers/${serverInfo.id}/power`, {
                method: "POST",
                body: { state: action }
            });
        } catch (err) {
            console.error("Power action failed:", err);
        } finally {
            setPowerLoading(null);
        }
    };

    useEffect(() => {
        if (!identifier) return;

        request('/servers')
            .then((res) => {
                const found = (res?.servers || []).find((s) =>
                    String(s.identifier || '').toLowerCase() === String(identifier || '').toLowerCase()
                );
                if (found) {
                    setServerInfo(found);

                    request(`/servers/${found.id}/network/allocations`)
                        .then((res) => {
                            setPrimaryAllocation(res?.primary || null);
                            setIsInitializing(false);
                        })
                        .catch((err) => {
                            if (err?.status === 409) {
                                setIsInitializing(true);
                            }
                            setPrimaryAllocation(null);
                        });
                }
            })
            .catch((err) => {
                console.error("Failed to fetch server info:", err);
                setServerInfo(null);
            });
    }, [identifier]);

    useEffect(() => {
        if (!isInitializing || !serverInfo?.id) return;
        const interval = setInterval(async () => {
            try {
                const res = await request(`/servers/${serverInfo.id}/network/allocations`);
                setPrimaryAllocation(res?.primary || null);
                setIsInitializing(false);
            } catch (err) {
                if (err?.status !== 409) setIsInitializing(false);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [isInitializing, serverInfo?.id]);

    useEffect(() => {
        if (!serverInfo?.id) return;

        let ws;
        let cancelled = false;
        setIsConnecting(true);

        const connect = async () => {
            try {
                const creds = await request(`/servers/${serverInfo.id}/websocket`);
                if (cancelled) return;
                if (!creds?.socket || !creds?.token) return;

                ws = new WebSocket(creds.socket);
                wsRef.current = ws;

                ws.onopen = () => {
                    if (cancelled) return;
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
                        setIsConnecting(false);
                        eulaTriggeredRef.current = false;
                        eulaCheckInFlightRef.current = false;

                        const safeSend = (event) => {
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ event, args: [] }));
                            }
                        };

                        safeSend("send logs");
                        safeSend("send stats");

                        setTimeout(() => safeSend("send stats"), 750);
                        setTimeout(() => safeSend("send stats"), 2000);

                        checkEulaFile();

                        if (xtermRef.current) {
                            xtermRef.current.writeln('\x1b[33m[Torqen]\x1b[0m Connection established successfully.');
                        }
                        return;
                    }

                    if (evt === "console output") {
                        const line = typeof args[0] === "string" ? args[0] : "";
                        if (line && xtermRef.current) {
                            const cleaned = sanitizeConsoleLine(line);
                            if (cleaned) {
                                xtermRef.current.writeln(cleaned);
                                if (!eulaTriggeredRef.current && !eulaCheckInFlightRef.current && cleaned.toLowerCase().includes('eula')) {
                                    eulaTriggeredRef.current = true;
                                    setEulaModalOpen(true);
                                }
                            }
                        }
                        return;
                    }

                    if (evt === "status") {
                        const s = typeof args[0] === "string" ? args[0] : null;
                        if (s) {
                            const normalized = s.toLowerCase();
                            setStatus(normalized);
                            if (xtermRef.current) {
                                xtermRef.current.writeln(`\r\x1b[33m[Torqen]\x1b[0m Instance marked as \x1b[1m${normalized}\x1b[0m.`);
                            }
                        }
                        return;
                    }

                    if (evt === "stats") {
                        const raw = args[0];
                        let statsData;
                        try {
                            statsData = typeof raw === 'string' ? JSON.parse(raw) : raw;
                        } catch {
                            return;
                        }

                        if (statsData?.state) setStatus(statsData.state.toLowerCase());

                        const cpuVal = Number(statsData?.cpu_absolute || 0);
                        const memVal = Number(statsData?.memory_bytes || 0) / (1024 * 1024);
                        const memLimitVal = Number(statsData?.memory_limit_bytes || 0) / (1024 * 1024);
                        const diskVal = Number(statsData?.disk_bytes || 0) / (1024 * 1024);
                        const rxVal = Number(statsData?.network?.rx_bytes || 0);
                        const txVal = Number(statsData?.network?.tx_bytes || 0);

                        setStats(prev => ({
                            ...prev,
                            cpu: cpuVal,
                            memory: memVal,
                            memoryLimit: memLimitVal,
                            disk: diskVal,
                            uptime: Number(statsData?.uptime || 0),
                            networkRx: rxVal,
                            networkTx: txVal
                        }));

                        setStatsHistory(prev => {
                            const next = [...prev, {
                                cpu: cpuVal,
                                mem: memLimitVal > 0 ? (memVal / memLimitVal) * 100 : 0,
                                disk: diskVal,
                                netRx: rxVal,
                                netTx: txVal
                            }];
                            return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
                        });
                    }
                };

                ws.onclose = () => {
                    if (!cancelled) setIsConnecting(true);
                };
            } catch (err) {
                if (err?.status === 409) {
                    setIsInitializing(true);
                    return;
                }
                console.error("Websocket connection failed:", err);
            }
        };

        connect();

        return () => {
            cancelled = true;
            if (ws) ws.close();
            wsRef.current = null;
        };
    }, [serverInfo?.id]);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const normalizedState = (status || '').toLowerCase();
    const isOnline = normalizedState === 'running' || normalizedState === 'online';
    const isOffline = !normalizedState || normalizedState === 'offline' || normalizedState === 'stopped';
    const isStarting = normalizedState === 'starting';
    const isStopping = normalizedState === 'stopping';
    const isInstalling = normalizedState === 'installing';

    const canStart = (isOffline || isStopping) && !isStarting && !isInstalling;
    const canRestart = isOnline && !isStarting && !isStopping && !isInstalling;
    const canStop = (isOnline || isStarting) && !isStopping && !isInstalling;

    const statusColor = isOnline ? 'green' : isStarting ? 'yellow' : 'red';
    const memPercent = stats.memoryLimit > 0 ? Math.min(100, (stats.memory / stats.memoryLimit) * 100) : 0;

    if (isInitializing) {
        return (
            <div className="bg-surface min-h-screen flex flex-col items-center justify-center px-16">
                <div className="flex flex-col items-center max-w-[280px]">
                    <div className="w-12 h-12 rounded-lg bg-surface-light border border-surface-lighter flex items-center justify-center overflow-hidden mb-6">
                        <img
                            src="/defaulticon.webp"
                            alt="Server"
                            className="w-full h-full object-cover opacity-80"
                        />
                    </div>
                    <div className="w-5 h-5 border-2 border-surface-lighter border-t-muted-foreground rounded-full animate-spin mb-5" />
                    <p className="text-[13px] font-bold text-foreground tracking-tight mb-1.5">Initializing Server</p>
                    <p className="text-[11px] font-bold text-muted-foreground text-center leading-relaxed">
                        Your server is being installed. This may take a few minutes. This page will update automatically.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface px-10 py-10">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-lg bg-surface-light border border-surface-lighter flex items-center justify-center overflow-hidden shrink-0">
                        <img
                            src="/defaulticon.webp"
                            alt="Server"
                            className="w-full h-full object-cover opacity-80"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">{serverInfo?.name || 'Loading...'}</h1>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full bg-${statusColor}-500`} />
                                <span className={`text-[10px] font-bold uppercase tracking-widest text-${statusColor}-500`}>{status}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 mt-1.5">
                            {serverInfo?.location && (
                                <>
                                    <div className="flex items-center gap-1.5">
                                        {serverInfo.location.shortCode && (
                                            <img
                                                src={`https://flagsapi.com/${serverInfo.location.shortCode}/flat/64.png`}
                                                alt={serverInfo.location.shortCode}
                                                className="w-4 h-3 rounded-sm object-cover opacity-80"
                                            />
                                        )}
                                        <span className="text-[13px] font-bold text-muted-foreground">{serverInfo.location.description || serverInfo.location.shortCode}</span>
                                    </div>
                                    <span className="text-muted-foreground/20">·</span>
                                </>
                            )}
                            <div className="flex items-center gap-1.5">
                                <span className="text-[13px] font-bold text-muted-foreground font-mono">
                                    {primaryAllocation
                                        ? `${primaryAllocation.ip_alias || primaryAllocation.ip}:${primaryAllocation.port}`
                                        : 'Assigning...'}
                                </span>
                                {primaryAllocation && (
                                    <button
                                        onClick={() => handleCopy(`${primaryAllocation.ip_alias || primaryAllocation.ip}:${primaryAllocation.port}`)}
                                        className="text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer"
                                    >
                                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                    </button>
                                )}
                            </div>
                            {isOnline && (
                                <>
                                    <span className="text-muted-foreground/20">·</span>
                                    <span className="text-[13px] font-bold text-muted-foreground">{formatUptime(stats.uptime)}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => handlePower('start')}
                        disabled={powerLoading || !canStart || isStarting}
                        className={`h-8 px-3.5 border border-surface-lighter rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                            powerLoading === 'start' || isStarting
                                ? 'border-yellow-500/20 text-yellow-500'
                                : 'text-muted-foreground hover:text-foreground hover:border-foreground/20'
                        }`}
                    >
                        {powerLoading === 'start' || isStarting ? (
                            <>
                                <div className="w-3 h-3 border-2 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
                                Starting
                            </>
                        ) : (
                            <>
                                <Play size={11} className="fill-current" />
                                Start
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => handlePower('restart')}
                        disabled={powerLoading || !canRestart || isStopping}
                        className="h-8 px-3.5 border border-surface-lighter rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                        {powerLoading === 'restart' ? (
                            <>
                                <div className="w-3 h-3 border-2 border-surface-lighter border-t-muted-foreground rounded-full animate-spin" />
                                Restarting
                            </>
                        ) : (
                            <>
                                <RefreshCw size={11} />
                                Restart
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => handlePower('stop')}
                        disabled={powerLoading || !canStop || isStopping}
                        className={`h-8 px-3.5 border border-surface-lighter rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                            powerLoading === 'stop' || isStopping
                                ? 'border-red-500/20 text-red-500'
                                : 'text-muted-foreground hover:text-foreground hover:border-foreground/20'
                        }`}
                    >
                        {powerLoading === 'stop' || isStopping ? (
                            <>
                                <div className="w-3 h-3 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                                Stopping
                            </>
                        ) : (
                            <>
                                <Square size={11} className="fill-current" />
                                Stop
                            </>
                        )}
                    </button>
                </div>
            </div>

            <ServerNav />

            {/* Console */}
            <div className="border border-surface-lighter rounded-lg overflow-hidden">
                <div
                    ref={terminalRef}
                    className="h-[420px] p-4 bg-surface-light overflow-hidden xterm"
                />
                <div className="px-4 py-3 bg-surface-light border-t border-surface-lighter">
                    <input
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        onKeyDown={handleSendCommand}
                        placeholder="Type a command..."
                        className="w-full bg-transparent border-none text-[12px] font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none font-mono"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 border border-surface-lighter rounded-lg overflow-hidden mt-6">
                {[
                    { label: "CPU", value: `${Math.round(stats.cpu)}%`, dataKey: "cpu" },
                    { label: "Memory", value: formatMB(stats.memory), sub: `/ ${formatMB(stats.memoryLimit)}`, dataKey: "mem" },
                    { label: "Disk", value: formatMB(stats.disk), dataKey: "disk" },
                    { label: "Network", value: `${formatBytes(stats.networkRx)} ↓`, sub: `${formatBytes(stats.networkTx)} ↑`, dataKey: "network" },
                ].map((stat, i) => (
                    <div key={i} className={`relative px-5 pt-4 pb-0 ${i > 0 ? 'border-l border-surface-lighter' : ''} overflow-hidden`}>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                        <div className="flex items-baseline gap-1.5 mb-4">
                            <p className="text-[18px] font-bold text-foreground tracking-tighter leading-none">{stat.value}</p>
                            {stat.sub && <span className="text-[11px] font-bold text-muted-foreground/40">{stat.sub}</span>}
                        </div>
                        <div className="h-[48px] -mx-5 -mb-px min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={statsHistory} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id={`grad-${stat.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.15} />
                                            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
                                        </linearGradient>
                                        {stat.dataKey === "network" && (
                                            <linearGradient id="grad-netTx" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.06} />
                                                <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
                                            </linearGradient>
                                        )}
                                    </defs>
                                    {stat.dataKey === "network" ? (
                                        <>
                                            <Area
                                                type="monotone"
                                                dataKey="netRx"
                                                stroke="var(--color-brand)"
                                                strokeWidth={1.5}
                                                fill={`url(#grad-${stat.dataKey})`}
                                                isAnimationActive={false}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="netTx"
                                                stroke="var(--color-brand)"
                                                strokeWidth={1}
                                                strokeOpacity={0.4}
                                                fill="url(#grad-netTx)"
                                                isAnimationActive={false}
                                            />
                                        </>
                                    ) : (
                                        <Area
                                            type="monotone"
                                            dataKey={stat.dataKey}
                                            stroke="var(--color-brand)"
                                            strokeWidth={1.5}
                                            fill={`url(#grad-${stat.dataKey})`}
                                            isAnimationActive={false}
                                        />
                                    )}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ))}
            </div>

            {/* EULA Modal */}
            <CenterModal isOpen={eulaModalOpen} onClose={() => !acceptingEula && setEulaModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">EULA Required</h2>
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-4">
                        This server requires you to accept the Minecraft End User License Agreement before starting.
                    </p>

                    <a
                        href="https://account.mojang.com/documents/minecraft_eula"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-brand hover:text-brand/80 uppercase tracking-widest transition-colors mb-5"
                    >
                        View Full Agreement &#8599;
                    </a>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => {
                                setEulaModalOpen(false);
                                eulaTriggeredRef.current = false;
                                eulaCheckInFlightRef.current = false;
                            }}
                            disabled={acceptingEula}
                            className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
                        >
                            Decline
                        </button>
                        <button
                            onClick={acceptEula}
                            disabled={acceptingEula}
                            className="h-8 px-5 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-pointer disabled:opacity-40"
                        >
                            {acceptingEula ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-surface/20 border-t-surface rounded-full animate-spin" />
                                    Accepting...
                                </>
                            ) : (
                                'Accept'
                            )}
                        </button>
                    </div>
                </div>
            </CenterModal>
        </div>
    );
}

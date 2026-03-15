import { 
    Play, 
    Square, 
    RefreshCw, 
    Zap, 
    Copy,
    Check
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ServerNav from "../../../components/navigation/server-nav";
import CenterModal from "../../../components/modals/center-modal";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

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
        uptime: 0
    });
    const [copied, setCopied] = useState(false);
    const [command, setCommand] = useState("");
    const [isConnecting, setIsConnecting] = useState(true);
    const [powerLoading, setPowerLoading] = useState(null);
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
                background: "#18181b",
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
                        })
                        .catch(() => setPrimaryAllocation(null));
                }
            })
            .catch((err) => {
                console.error("Failed to fetch server info:", err);
                setServerInfo(null);
            });
    }, [identifier]);

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
                        
                        // Retry stats just in case the first one was too early
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

                        setStats(prev => ({
                            ...prev,
                            cpu: Number(statsData?.cpu_absolute || 0),
                            memory: Number(statsData?.memory_bytes || 0) / (1024 * 1024),
                            memoryLimit: Number(statsData?.memory_limit_bytes || 0) / (1024 * 1024),
                            disk: Number(statsData?.disk_bytes || 0) / (1024 * 1024),
                            uptime: Number(statsData?.uptime || 0)
                        }));
                    }
                };

                ws.onclose = () => {
                    if (!cancelled) setIsConnecting(true);
                };
            } catch (err) {
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

    return (
        <div className="bg-surface px-16 py-10">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-sm bg-surface-light border border-surface-lighter flex items-center justify-center overflow-hidden shrink-0">
                        <img 
                            src="/defaulticon.webp" 
                            alt="Minecraft" 
                            className="w-full h-full object-cover opacity-80"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-[20px] font-bold text-brand tracking-tight">{serverInfo?.name || 'Loading Instance...'}</h1>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${
                                status === 'running' || status === 'online' 
                                    ? 'bg-green-500/5 border-green-500/10 text-green-600' 
                                    : status === 'starting'
                                    ? 'bg-yellow-500/5 border-yellow-500/10 text-yellow-600'
                                    : 'bg-red-500/5 border-red-500/10 text-red-600'
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    status === 'running' || status === 'online' ? 'bg-green-500' : status === 'starting' ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                                <span className="text-[9px] font-bold uppercase tracking-[0.1em]">{status}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[12px] font-bold uppercase tracking-widest">
                            <span className={`${status === 'running' || status === 'online' ? 'text-green-500' : 'text-brand/30'}`}>
                                {status === 'running' || status === 'online' ? formatUptime(stats.uptime) : 'Uptime'}
                            </span>
                            <span className="text-brand/10">•</span>
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
                                        <span className="text-brand/40">{serverInfo.location.description || serverInfo.location.shortCode}</span>
                                    </div>
                                    <span className="text-brand/10">•</span>
                                </>
                            )}
                            <div className="flex items-center gap-1.5">
                                <span className="text-brand/60">
                                    {primaryAllocation 
                                        ? `${primaryAllocation.ip_alias || primaryAllocation.ip}:${primaryAllocation.port}`
                                        : 'Assigning IP...'}
                                </span>
                                {primaryAllocation && (
                                    <button 
                                        onClick={() => handleCopy(`${primaryAllocation.ip_alias || primaryAllocation.ip}:${primaryAllocation.port}`)}
                                        className="text-brand/20 hover:text-brand transition-colors cursor-pointer"
                                        title="Copy IP"
                                    >
                                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => handlePower('start')}
                        disabled={powerLoading || !canStart || isStarting}
                        className={`h-8 px-3 border-surface-lighter hover:bg-surface-lighter transition-all rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-none text-brand/60 hover:text-brand disabled:opacity-20 disabled:cursor-not-allowed ${
                            (powerLoading === 'start' || isStarting) ? 'border-amber-600/60 text-amber-700 opacity-100!' : ''
                        }`}
                    >
                        {powerLoading === 'start' || isStarting ? (
                            <>
                                <div className="w-3 h-3 border-2 border-amber-600/20 border-t-amber-600 rounded-full animate-spin" />
                                Starting...
                            </>
                        ) : (
                            <>
                                <Play size={12} className="fill-current" />
                                Start
                            </>
                        )}
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => handlePower('restart')}
                        disabled={powerLoading || !canRestart || isStopping}
                        className="h-8 px-3 border-surface-lighter hover:bg-surface-lighter transition-all rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-none text-brand/60 hover:text-brand disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                        {powerLoading === 'restart' ? (
                            <>
                                <div className="w-3 h-3 border-2 border-brand/20 border-t-brand/60 rounded-full animate-spin" />
                                ...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={12} />
                                Restart
                            </>
                        )}
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => handlePower('stop')}
                        disabled={powerLoading || !canStop || isStopping}
                        className="h-8 px-3 border-surface-lighter hover:bg-surface-lighter transition-all rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-none text-brand/60 hover:text-brand disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                        {powerLoading === 'stop' || isStopping ? (
                            <>
                                <div className="w-3 h-3 border-2 border-brand/20 border-t-brand/60 rounded-full animate-spin" />
                                ...
                            </>
                        ) : (
                            <>
                                <Square size={12} className="fill-current" />
                                Stop
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <ServerNav />

            <div className="bg-brand rounded-sm overflow-hidden border border-brand/10 shadow-lg flex flex-col">
                <div 
                    ref={terminalRef}
                    className="h-[450px] p-4 bg-brand overflow-hidden xterm"
                />
                <div className="p-4 bg-brand/95 border-t border-white/5">
                    <input 
                        type="text" 
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        onKeyDown={handleSendCommand}
                        placeholder="TYPE COMMAND HERE..."
                        className="w-full bg-transparent border-none text-[11px] font-bold text-white placeholder:text-white/20 focus:outline-none uppercase tracking-widest"
                    />
                </div>
            </div>

            <CenterModal isOpen={eulaModalOpen} onClose={() => !acceptingEula && setEulaModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-[14px] font-bold text-brand uppercase tracking-widest mb-4">Minecraft EULA Agreement</h2>
                    <p className="text-[11px] text-brand/60 leading-relaxed mb-6">
                        Your server has detected that the Minecraft EULA has not been accepted. 
                        By clicking "Accept EULA", you agree to Mojang's End User License Agreement.
                    </p>
                    <p className="text-[10px] text-brand/40 mb-8">
                        Read the full EULA at: <a href="https://account.mojang.com/documents/minecraft_eula" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">https://account.mojang.com/documents/minecraft_eula</a>
                    </p>
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEulaModalOpen(false);
                                eulaTriggeredRef.current = false;
                                eulaCheckInFlightRef.current = false;
                            }}
                            disabled={acceptingEula}
                            className="h-8 px-4 border-surface-lighter hover:bg-surface-lighter transition-all rounded-md font-bold text-[10px] uppercase tracking-widest text-brand/40 hover:text-brand"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={acceptEula}
                            disabled={acceptingEula}
                            className="h-8 px-4 bg-brand text-surface hover:opacity-90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"
                        >
                            {acceptingEula ? (
                                <>
                                    <RefreshCw size={12} className="animate-spin" />
                                    Accepting...
                                </>
                            ) : (
                                'Accept EULA'
                            )}
                        </Button>
                    </div>
                </div>
            </CenterModal>
        </div>
    );
}

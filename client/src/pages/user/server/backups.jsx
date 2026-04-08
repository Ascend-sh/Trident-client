import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Plus, Ellipsis, Copy, Check } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CloudUploadIcon, DataRecoveryIcon } from "@hugeicons/core-free-icons";
import ServerNav from "../../../components/navigation/server-nav";
import CenterModal from "../../../components/modals/center-modal";
import { request } from "@/lib/request.js";

const API_BASE = "/api/v1/client";

function formatBytes(bytes) {
    const b = Number(bytes || 0);
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function relativeTime(iso) {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function Backups() {
    const { identifier } = useParams();
    const [serverInfo, setServerInfo] = useState(null);
    const [primaryAllocation, setPrimaryAllocation] = useState(null);
    const [status, setStatus] = useState("offline");
    const [copied, setCopied] = useState(false);
    const [backups, setBackups] = useState([]);
    const [backupLimit, setBackupLimit] = useState(0);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createName, setCreateName] = useState("");
    const [creating, setCreating] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [restoreTarget, setRestoreTarget] = useState(null);
    const [restoring, setRestoring] = useState(false);

    const [actionError, setActionError] = useState("");
    const [pollingRef] = useState({ current: null });

    const stopPolling = () => {
        if (pollingRef.current) {
            clearTimeout(pollingRef.current);
            pollingRef.current = null;
        }
    };

    const fetchBackups = (serverId, { poll = false } = {}) => {
        request(`/servers/${serverId}/backups`)
            .then(d => {
                const list = d?.backups || [];
                setBackups(list);
                if (d?.backupLimit !== undefined) setBackupLimit(d.backupLimit);

                const hasPending = list.some(b => !b.completed_at);
                stopPolling();
                if (hasPending) {
                    pollingRef.current = setTimeout(() => fetchBackups(serverId, { poll: true }), 5000);
                }
            })
            .catch(() => {
                if (poll) {
                    stopPolling();
                    pollingRef.current = setTimeout(() => fetchBackups(serverId, { poll: true }), 5000);
                }
            });
    };

    useEffect(() => {
        if (!identifier) return;
        fetch(`${API_BASE}/servers`, { credentials: "include" })
            .then(r => r.json())
            .then(d => {
                const found = (d?.servers || []).find(s =>
                    String(s.identifier || "").toLowerCase() === String(identifier || "").toLowerCase()
                );
                if (found) {
                    setServerInfo(found);
                    fetch(`${API_BASE}/servers/${found.id}/network/allocations`, { credentials: "include" })
                        .then(r => r.json())
                        .then(a => setPrimaryAllocation(a?.primary || null))
                        .catch(() => setPrimaryAllocation(null));
                    fetchBackups(found.id);
                }
            })
            .catch(() => {});
        return () => stopPolling();
    }, [identifier]);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const totalSize = backups.reduce((acc, b) => acc + Number(b.bytes || 0), 0);

    const handleCreate = async () => {
        if (!serverInfo?.id) return;
        setCreating(true);
        setActionError("");
        try {
            await request(`/servers/${serverInfo.id}/backups`, {
                method: "POST",
                body: { name: createName.trim() || undefined }
            });
            fetchBackups(serverInfo.id);
            setCreateModalOpen(false);
            setCreateName("");
        } catch (err) {
            setActionError(err?.message || "Failed to create backup");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async () => {
        if (!serverInfo?.id || !deleteTarget?.uuid) return;
        setDeleting(true);
        setActionError("");
        try {
            await request(`/servers/${serverInfo.id}/backups/${deleteTarget.uuid}`, { method: "DELETE" });
            fetchBackups(serverInfo.id);
            setDeleteTarget(null);
        } catch (err) {
            setActionError(err?.message || "Failed to delete backup");
        } finally {
            setDeleting(false);
        }
    };

    const handleRestore = async () => {
        if (!serverInfo?.id || !restoreTarget?.uuid) return;
        setRestoring(true);
        setActionError("");
        try {
            const data = await request(`/servers/${serverInfo.id}/backups/${restoreTarget.uuid}/download`);
            if (data?.url) {
                window.open(data.url, "_blank");
            }
            setRestoreTarget(null);
        } catch (err) {
            setActionError(err?.message || "Failed to download backup");
        } finally {
            setRestoring(false);
        }
    };

    const normalizedState = (status || "").toLowerCase();
    const isOnline = normalizedState === "running" || normalizedState === "online";
    const isStarting = normalizedState === "starting";
    const statusColor = isOnline ? "green" : isStarting ? "yellow" : "red";

    return (
        <div className="bg-surface px-10 py-10">
            <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-lg bg-surface-light border border-surface-lighter flex items-center justify-center overflow-hidden shrink-0">
                        <img src="/defaulticon.webp" alt="Server" className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">{serverInfo?.name || "Loading..."}</h1>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full bg-${statusColor}-500`} />
                                <span className={`text-[10px] font-bold uppercase tracking-widest text-${statusColor}-500`}>{normalizedState || "offline"}</span>
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
                                        : "Assigning..."}
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
                        </div>
                    </div>
                </div>
                {backupLimit > 0 && (
                    <button
                        onClick={() => { setCreateName(""); setActionError(""); setCreateModalOpen(true); }}
                        className="h-8 px-4 flex items-center gap-2 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer"
                    >
                        <Plus size={12} />
                        New Backup
                    </button>
                )}
            </div>

            <ServerNav />

            {backupLimit === 0 && serverInfo ? (
                <div className="border border-surface-lighter rounded-lg py-20 px-6">
                    <div className="flex flex-col items-center">
                        <HugeiconsIcon icon={DataRecoveryIcon} size={32} className="text-muted-foreground/30 mb-5" />
                        <p className="text-[15px] font-bold text-foreground tracking-tight mb-1.5">Backups are disabled</p>
                        <p className="text-[11px] font-bold text-muted-foreground/50 text-center max-w-[280px] leading-relaxed">
                            This server does not have any backup slots allocated. Contact an administrator to enable backups.
                        </p>
                    </div>
                </div>
            ) : (
            <>
            <div className="flex items-center justify-between px-1 mb-4">
                <div className="flex items-center gap-3">
                    {backupLimit > 0 && (
                        <div className="flex items-center gap-1.5">
                            {[...Array(backupLimit)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full ${i < backups.length ? 'bg-brand/50' : 'bg-surface-lighter'}`}
                                />
                            ))}
                        </div>
                    )}
                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{backups.length}{backupLimit > 0 ? `/${backupLimit}` : ''} backups used</span>
                </div>
                {backups.length > 0 && (
                    <span className="text-[10px] font-bold text-muted-foreground">{formatBytes(totalSize)} total</span>
                )}
            </div>

            {backups.length === 0 ? (
                <div className="border border-surface-lighter rounded-lg py-20 px-6 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                        <div className="w-[200px] h-[200px] rounded-full border-[2px]" style={{ borderColor: 'var(--color-brand)' }} />
                    </div>
                    <div className="relative flex flex-col items-center">
                        <div className="flex flex-col items-center gap-1 mb-6">
                            <div className="w-6 h-1 rounded-full bg-surface-lighter" />
                            <div className="w-8 h-1 rounded-full bg-surface-lighter" />
                            <div className="w-10 h-1 rounded-full bg-surface-lighter" />
                        </div>
                        <p className="text-[15px] font-bold text-foreground tracking-tight mb-1.5">Start saving snapshots</p>
                        <p className="text-[11px] font-bold text-muted-foreground/50 text-center max-w-[260px] leading-relaxed">
                            Capture your server state at any point and roll back whenever you need to.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="border border-surface-lighter rounded-lg">
                    <div className="grid grid-cols-[2fr_1fr_1fr_auto] px-6 py-3 border-b border-surface-lighter">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Name</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Size</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Created</span>
                        <span className="w-8" />
                    </div>

                    {backups.map((backup, idx) => {
                        const isPending = !backup.completed_at;

                        return isPending ? (
                            <div
                                key={backup.uuid}
                                className={`grid grid-cols-[2fr_1fr_1fr_auto] px-6 py-4 ${idx > 0 ? 'border-t border-surface-lighter' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded bg-surface-lighter animate-pulse shrink-0" />
                                    <div className="flex items-center gap-2">
                                        <div className="h-3.5 w-36 rounded bg-surface-lighter animate-pulse" />
                                        <span className="px-1.5 py-0.5 rounded bg-surface-light text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest shrink-0">
                                            Creating
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="h-3 w-16 rounded bg-surface-lighter animate-pulse" />
                                </div>
                                <div className="flex items-center">
                                    <div className="h-3 w-14 rounded bg-surface-lighter animate-pulse" />
                                </div>
                                <div className="w-8" />
                            </div>
                        ) : (
                            <div
                                key={backup.uuid}
                                className={`group grid grid-cols-[2fr_1fr_1fr_auto] px-6 py-4 hover:bg-surface-light/50 transition-colors ${idx > 0 ? 'border-t border-surface-lighter' : ''}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <HugeiconsIcon icon={CloudUploadIcon} size={16} className={`shrink-0 ${backup.is_successful ? 'text-muted-foreground' : 'text-red-500/60'}`} />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[13px] font-bold text-foreground tracking-tight truncate leading-none">
                                                {backup.name || <span className="text-muted-foreground/50 italic">Unnamed backup</span>}
                                            </p>
                                            {backup.is_locked && (
                                                <span className="px-1.5 py-0.5 rounded bg-surface-light text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest shrink-0">
                                                    Locked
                                                </span>
                                            )}
                                            {!backup.is_successful && (
                                                <span className="px-1.5 py-0.5 rounded bg-red-500/5 text-[8px] font-bold text-red-500/60 uppercase tracking-widest shrink-0">
                                                    Failed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <span className="text-[11px] font-bold text-muted-foreground font-mono">{formatBytes(backup.bytes)}</span>
                                </div>

                                <div className="flex items-center">
                                    <span className="text-[11px] font-bold text-muted-foreground">{relativeTime(backup.completed_at)}</span>
                                </div>

                                <div className="flex items-center justify-end">
                                    <div className="relative">
                                        <button
                                            onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === backup.uuid ? null : backup.uuid); }}
                                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50 transition-all cursor-pointer"
                                        >
                                            <Ellipsis size={14} />
                                        </button>

                                        {openMenuId === backup.uuid && (
                                            <div
                                                className="absolute right-0 mt-1 w-36 rounded-lg border border-surface-lighter shadow-xl z-50 overflow-hidden"
                                                style={{ backgroundColor: 'var(--surface)' }}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="p-1">
                                                    {backup.is_successful && (
                                                        <button
                                                            onClick={() => { setOpenMenuId(null); setActionError(""); setRestoreTarget(backup); }}
                                                            className="w-full px-3 py-2 text-left text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-surface-light transition-all rounded-md"
                                                        >
                                                            Download
                                                        </button>
                                                    )}
                                                    {!backup.is_locked ? (
                                                        <button
                                                            onClick={() => { setOpenMenuId(null); setActionError(""); setDeleteTarget(backup); }}
                                                            className="w-full px-3 py-2 text-left text-[11px] font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all rounded-md"
                                                        >
                                                            Delete
                                                        </button>
                                                    ) : (
                                                        <span className="block px-3 py-2 text-[11px] font-bold text-muted-foreground/20">
                                                            Locked
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            </>
            )}

            <CenterModal isOpen={createModalOpen} onClose={() => !creating && setCreateModalOpen(false)} maxWidth="max-w-sm">
                <div className="p-6">
                    <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">Create Backup</h2>
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-5">Give your backup a name to find it later.</p>

                    <input
                        type="text"
                        value={createName}
                        onChange={e => setCreateName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleCreate()}
                        placeholder="e.g. Pre-update snapshot"
                        disabled={creating}
                        autoFocus
                        className="w-full h-9 bg-surface-light/50 border border-surface-lighter rounded-md px-3 text-[12px] font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/20 transition-all disabled:opacity-40"
                    />

                    {actionError && (
                        <div className="mt-3 px-3 py-2.5 rounded-md bg-red-500/5 border border-red-500/10">
                            <p className="text-[11px] font-bold text-red-500">{actionError}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 mt-5">
                        <button
                            onClick={() => setCreateModalOpen(false)}
                            disabled={creating}
                            className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            className="h-8 px-5 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {creating ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-surface/20 border-t-surface rounded-full animate-spin" />
                                    Creating
                                </>
                            ) : (
                                "Create"
                            )}
                        </button>
                    </div>
                </div>
            </CenterModal>

            <CenterModal isOpen={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="max-w-md">
                <div className="p-6">
                    <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">Delete Backup</h2>
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-6">
                        Delete <span className="text-foreground">"{deleteTarget?.name || "this backup"}"</span>? This cannot be undone.
                    </p>

                    {actionError && (
                        <div className="mb-4 px-3 py-2.5 rounded-md bg-red-500/5 border border-red-500/10">
                            <p className="text-[11px] font-bold text-red-500">{actionError}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => setDeleteTarget(null)}
                            disabled={deleting}
                            className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="h-8 px-5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {deleting ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                                    Deleting
                                </>
                            ) : (
                                "Delete"
                            )}
                        </button>
                    </div>
                </div>
            </CenterModal>

            <CenterModal isOpen={!!restoreTarget} onClose={() => !restoring && setRestoreTarget(null)} maxWidth="max-w-md">
                <div className="p-6">
                    <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">Download Backup</h2>
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-6">
                        Download <span className="text-foreground">"{restoreTarget?.name || "this backup"}"</span> to your local machine.
                    </p>

                    {actionError && (
                        <div className="mb-4 px-3 py-2.5 rounded-md bg-red-500/5 border border-red-500/10">
                            <p className="text-[11px] font-bold text-red-500">{actionError}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => setRestoreTarget(null)}
                            disabled={restoring}
                            className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRestore}
                            disabled={restoring}
                            className="h-8 px-5 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {restoring ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-surface/20 border-t-surface rounded-full animate-spin" />
                                    Downloading
                                </>
                            ) : (
                                "Download"
                            )}
                        </button>
                    </div>
                </div>
            </CenterModal>
        </div>
    );
}

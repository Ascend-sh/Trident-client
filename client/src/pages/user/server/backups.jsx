import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Plus, Trash2, RotateCcw, HardDrive, Clock, Archive, Ellipsis, X } from "lucide-react";
import ServerNav from "../../../components/navigation/server-nav";
import CenterModal from "../../../components/modals/center-modal";
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
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) {
        const message = typeof data === "string" ? data : data?.error || data?.message || "request_failed";
        const error = new Error(message);
        error.status = res.status;
        throw error;
    }
    return data;
}

function formatBytes(bytes) {
    const b = Number(bytes || 0);
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
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

const MOCK_BACKUPS = [
    { uuid: "b1", name: "Pre-update snapshot", bytes: 1289748234, is_successful: true, is_locked: false, completed_at: new Date(Date.now() - 3600 * 1000).toISOString() },
    { uuid: "b2", name: "Weekly backup", bytes: 987654321, is_successful: true, is_locked: true, completed_at: new Date(Date.now() - 86400 * 2 * 1000).toISOString() },
    { uuid: "b3", name: "", bytes: 543210987, is_successful: false, is_locked: false, completed_at: new Date(Date.now() - 86400 * 5 * 1000).toISOString() },
];

export default function Backups() {
    const { identifier } = useParams();
    const [serverInfo, setServerInfo] = useState(null);
    const [backups, setBackups] = useState(MOCK_BACKUPS);
    const [loading, setLoading] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createName, setCreateName] = useState("");
    const [creating, setCreating] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [restoreTarget, setRestoreTarget] = useState(null);
    const [restoring, setRestoring] = useState(false);

    const [actionError, setActionError] = useState("");

    useEffect(() => {
        if (!identifier) return;
        fetch(`${API_BASE}/servers`, { credentials: "include" })
            .then(r => r.json())
            .then(d => {
                const found = (d?.servers || []).find(s =>
                    String(s.identifier || "").toLowerCase() === String(identifier || "").toLowerCase()
                );
                if (found) setServerInfo(found);
            })
            .catch(() => {});
    }, [identifier]);

    const totalSize = backups.reduce((acc, b) => acc + Number(b.bytes || 0), 0);
    const successCount = backups.filter(b => b.is_successful).length;

    const handleCreate = async () => {
        setCreating(true);
        setActionError("");
        try {
            const fake = {
                uuid: `b${Date.now()}`,
                name: createName.trim() || `Backup ${backups.length + 1}`,
                bytes: 0,
                is_successful: true,
                is_locked: false,
                completed_at: new Date().toISOString()
            };
            await new Promise(r => setTimeout(r, 600));
            setBackups(prev => [fake, ...prev]);
            setCreateModalOpen(false);
            setCreateName("");
        } catch (err) {
            setActionError(err?.message || "Failed to create backup");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        setActionError("");
        try {
            await new Promise(r => setTimeout(r, 500));
            setBackups(prev => prev.filter(b => b.uuid !== deleteTarget.uuid));
            setDeleteTarget(null);
        } catch (err) {
            setActionError(err?.message || "Failed to delete backup");
        } finally {
            setDeleting(false);
        }
    };

    const handleRestore = async () => {
        setRestoring(true);
        setActionError("");
        try {
            await new Promise(r => setTimeout(r, 800));
            setRestoreTarget(null);
        } catch (err) {
            setActionError(err?.message || "Failed to restore backup");
        } finally {
            setRestoring(false);
        }
    };

    return (
        <div className="bg-surface px-16 py-10">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-md bg-surface-light border border-surface-lighter flex items-center justify-center overflow-hidden shrink-0">
                        <img src="/defaulticon.webp" alt="Server" className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div>
                        <h1 className="text-[20px] font-bold text-foreground tracking-tight">
                            {serverInfo?.name || "Loading Instance..."}
                        </h1>
                        <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-[0.1em] mt-1">
                            Backups
                        </p>
                    </div>

                </div>
                <Button
                    onClick={() => { setCreateName(""); setActionError(""); setCreateModalOpen(true); }}
                    className="h-8 px-3 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-none"
                >
                    <Plus size={12} />
                    Create Backup
                </Button>
            </div>

            <ServerNav />


            <div className="bg-surface-light border border-surface-lighter rounded-xl px-[2px] pb-[2px] pt-0">
                <div className="w-full">
                    <div className="grid grid-cols-[2fr_1fr_1fr_0.6fr] px-6 py-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Name</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center">Size</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center">Created</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-right">Actions</span>
                    </div>


                    {backups.length === 0 ? (
                        <div className="bg-surface border border-surface-lighter rounded-lg py-16 flex flex-col items-center justify-center min-h-[210px]">
                            <Archive size={24} className="text-muted-foreground/10 mb-3" />
                            <span className="text-[12px] font-bold text-muted-foreground italic">No backups yet. Create your first one.</span>
                        </div>

                    ) : (
                        <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col min-h-[210px]">
                            {backups.map((backup, idx) => (
                                <div
                                    key={backup.uuid}
                                    className={`grid grid-cols-[2fr_1fr_1fr_0.6fr] px-6 py-4 group border-b border-surface-lighter transition-colors hover:bg-surface-light/40 ${idx === backups.length - 1 ? 'border-b-0' : ''}`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${backup.is_successful ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <div className="min-w-0">
                                            <p className="text-[12px] font-bold text-foreground truncate">
                                                {backup.name || <span className="italic text-muted-foreground">Unnamed backup</span>}
                                            </p>

                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${backup.is_successful ? 'text-green-600' : 'text-red-500'}`}>
                                                    {backup.is_successful ? "Complete" : "Failed"}
                                                </span>
                                                {backup.is_locked && (
                                                    <>
                                                        <span className="text-foreground/10">·</span>
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Locked</span>
                                                    </>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <span className="text-[11px] font-bold text-muted-foreground font-mono">{formatBytes(backup.bytes)}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="text-[11px] font-bold text-muted-foreground">{relativeTime(backup.completed_at)}</span>
                                        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">{formatDate(backup.completed_at)}</span>
                                    </div>

                                    <div className="flex items-center justify-end">
                                        <div className="relative">
                                            <button
                                                onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === backup.uuid ? null : backup.uuid); }}
                                                className="p-2 rounded-md hover:bg-surface-lighter text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                                            >
                                                <Ellipsis size={14} />
                                            </button>

                                            {openMenuId === backup.uuid && (
                                                <div
                                                    className="absolute right-0 mt-2 w-36 bg-surface border border-surface-lighter rounded-md z-50 shadow-none py-1"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={() => { setOpenMenuId(null); setActionError(""); setRestoreTarget(backup); }}
                                                        disabled={!backup.is_successful}
                                                        className="w-full px-4 py-2 text-left text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-surface-light transition-all uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                                                    >
                                                        <RotateCcw size={11} />
                                                        Restore
                                                    </button>

                                                    <button
                                                        onClick={() => { setOpenMenuId(null); setActionError(""); setDeleteTarget(backup); }}
                                                        disabled={backup.is_locked}
                                                        className="w-full px-4 py-2 text-left text-[11px] font-bold text-red-500 hover:bg-red-50 transition-all uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                                                    >
                                                        <Trash2 size={11} />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CenterModal isOpen={createModalOpen} onClose={() => !creating && setCreateModalOpen(false)} maxWidth="max-w-sm">
                <div className="p-6">
                    <div className="mb-5">
                        <h2 className="text-[16px] font-bold text-foreground tracking-tight">Create Backup</h2>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Optional name for this backup</p>
                    </div>

                    <input
                        type="text"
                        value={createName}
                        onChange={e => setCreateName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleCreate()}
                        placeholder="e.g. Pre-update snapshot"
                        disabled={creating}
                        autoFocus
                        className="w-full h-9 bg-surface-light border border-surface-lighter rounded-md px-3 text-[12px] font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/30 transition-colors disabled:opacity-50"
                    />

                    {actionError && (
                        <div className="mt-3 px-3 py-2 rounded-md bg-red-500/5 border border-red-500/10">
                            <p className="text-[11px] font-bold text-red-600">{actionError}</p>
                        </div>
                    )}
                    <div className="flex items-center justify-end gap-3 mt-5">
                        <button
                            onClick={() => setCreateModalOpen(false)}
                            disabled={creating}
                            className="px-3 py-1.5 text-[10px] font-bold text-foreground/60 hover:text-brand uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <Button
                            onClick={handleCreate}
                            disabled={creating}
                            className="h-8 px-4 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer shadow-none disabled:opacity-40"
                        >
                            {creating ? "Creating..." : "Create Backup"}
                        </Button>
                    </div>
                </div>
            </CenterModal>

            <CenterModal isOpen={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="max-w-md">
                <div className="p-6">
                    <div className="mb-6">
                        <h2 className="text-[16px] font-bold text-foreground tracking-tight">Delete Backup</h2>
                        <p className="text-[12px] font-bold text-foreground/60 mt-1">
                            Are you sure you want to delete <span className="text-foreground">"{deleteTarget?.name || "this backup"}"</span>? This action cannot be undone.
                        </p>
                    </div>
                    {actionError && (
                        <div className="px-4 py-3 rounded-md bg-red-500/5 border border-red-500/10 mb-6">
                            <p className="text-[11px] font-bold text-red-600">{actionError}</p>
                        </div>
                    )}
                    <div className="flex items-center justify-end gap-3 mt-8">
                        <button
                            onClick={() => setDeleteTarget(null)}
                            disabled={deleting}
                            className="px-4 py-2 text-[10px] font-bold text-foreground hover:text-foreground/70 uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <Button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="h-8 px-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer shadow-none disabled:opacity-40"
                        >
                            {deleting ? "Deleting..." : "Confirm Delete"}
                        </Button>
                    </div>
                </div>
            </CenterModal>

            <CenterModal isOpen={!!restoreTarget} onClose={() => !restoring && setRestoreTarget(null)} maxWidth="max-w-md">
                <div className="p-6">
                    <div className="mb-6">
                        <h2 className="text-[16px] font-bold text-foreground tracking-tight">Restore Backup</h2>
                        <p className="text-[12px] font-bold text-foreground/60 mt-1">
                            Restoring <span className="text-foreground">"{restoreTarget?.name || "this backup"}"</span> will overwrite all current server files. The server will be stopped during the restore process.
                        </p>
                    </div>
                    {actionError && (
                        <div className="px-4 py-3 rounded-md bg-red-500/5 border border-red-500/10 mb-6">
                            <p className="text-[11px] font-bold text-red-600">{actionError}</p>
                        </div>
                    )}
                    <div className="flex items-center justify-end gap-3 mt-8">
                        <button
                            onClick={() => setRestoreTarget(null)}
                            disabled={restoring}
                            className="px-4 py-2 text-[10px] font-bold text-foreground hover:text-foreground/70 uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <Button
                            onClick={handleRestore}
                            disabled={restoring}
                            className="h-8 px-4 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer shadow-none disabled:opacity-40"
                        >
                            {restoring ? "Restoring..." : "Confirm Restore"}
                        </Button>
                    </div>
                </div>
            </CenterModal>
        </div>
    );
}

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Copy, Check, Plus, Star, Ellipsis } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ConnectIcon } from "@hugeicons/core-free-icons";
import ServerNav from "../../../components/navigation/server-nav";
import CenterModal from "../../../components/modals/center-modal";
import { request } from "@/lib/request.js";

export default function Network() {
    const { identifier } = useParams();
    const [serverInfo, setServerInfo] = useState(null);
    const [primaryAllocation, setPrimaryAllocation] = useState(null);
    const [status, setStatus] = useState("offline");
    const [copied, setCopied] = useState(null);
    const [allocations, setAllocations] = useState([]);
    const [allocationLimit, setAllocationLimit] = useState(0);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [loading, setLoading] = useState(true);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [actionError, setActionError] = useState("");

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [notesTarget, setNotesTarget] = useState(null);
    const [notesValue, setNotesValue] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);

    const fetchAllocations = async (serverId) => {
        try {
            const data = await request(`/servers/${serverId}/network/allocations`);
            const allocs = (data?.allocations || []).map(a => ({
                ...a,
                is_primary: Boolean(a.is_default)
            }));
            setAllocations(allocs);
            setPrimaryAllocation(data?.primary || null);
        } catch {
            setAllocations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!identifier) return;
        request('/servers')
            .then(d => {
                const found = (d?.servers || []).find(s =>
                    String(s.identifier || "").toLowerCase() === String(identifier || "").toLowerCase()
                );
                if (found) {
                    setServerInfo(found);
                    setAllocationLimit(found.limits?.allocations || found.featureAllocations || 0);
                    fetchAllocations(found.id);
                }
            })
            .catch(() => {});
    }, [identifier]);

    useEffect(() => {
        const onDocClick = () => { setOpenMenuId(null); };
        const onKey = (e) => { if (e.key === 'Escape') setOpenMenuId(null); };
        document.addEventListener('click', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('click', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, []);

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleSetPrimary = async (allocId) => {
        if (!serverInfo?.id) return;
        setOpenMenuId(null);
        try {
            await request(`/servers/${serverInfo.id}/network/allocations/${allocId}/primary`, { method: 'POST' });
            await fetchAllocations(serverInfo.id);
        } catch {
        }
    };

    const handleCreate = async () => {
        if (!serverInfo?.id) return;
        setCreating(true);
        setActionError("");
        try {
            await request(`/servers/${serverInfo.id}/network/allocations`, { method: 'POST' });
            await fetchAllocations(serverInfo.id);
            setCreateModalOpen(false);
        } catch (err) {
            setActionError(err?.message || "Failed to create allocation");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget || !serverInfo?.id) return;
        setDeleting(true);
        setActionError("");
        try {
            await request(`/servers/${serverInfo.id}/network/allocations/${deleteTarget.id}`, { method: 'DELETE' });
            await fetchAllocations(serverInfo.id);
            setDeleteTarget(null);
        } catch (err) {
            setActionError(err?.message || "Failed to remove allocation");
        } finally {
            setDeleting(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!notesTarget || !serverInfo?.id) return;
        setSavingNotes(true);
        try {
            await request(`/servers/${serverInfo.id}/network/allocations/${notesTarget.id}`, {
                method: 'POST',
                body: { notes: notesValue.trim() }
            });
            await fetchAllocations(serverInfo.id);
            setNotesTarget(null);
            setNotesValue("");
        } catch {
        } finally {
            setSavingNotes(false);
        }

    };

    const normalizedState = (status || "").toLowerCase();
    const isOnline = normalizedState === "running" || normalizedState === "online";
    const isStarting = normalizedState === "starting";
    const statusColor = isOnline ? "green" : isStarting ? "yellow" : "red";

    const primary = allocations.find(a => a.is_primary);

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
                                        onClick={() => handleCopy(`${primaryAllocation.ip_alias || primaryAllocation.ip}:${primaryAllocation.port}`, 'header')}
                                        className="text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer"
                                    >
                                        {copied === 'header' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {allocationLimit > 0 && (
                    <button
                        onClick={() => { setActionError(""); setCreateModalOpen(true); }}
                        className="h-8 px-4 flex items-center gap-2 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer"
                    >
                        <Plus size={12} />
                        New Allocation
                    </button>
                )}
            </div>

            <ServerNav />

            <div className="flex items-center justify-between px-1 mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        {allocationLimit > 0 ? (
                            [...Array(allocationLimit)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full ${i < allocations.length ? 'bg-brand/50' : 'bg-surface-lighter'}`}
                                />
                            ))
                        ) : (
                            <div className={`w-1.5 h-1.5 rounded-full ${allocations.length > 0 ? 'bg-brand/50' : 'bg-surface-lighter'}`} />
                        )}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{allocations.length}{allocationLimit > 0 ? `/${allocationLimit}` : ''} ports allocated</span>
                </div>
                {primary && (
                    <div className="flex items-center gap-1.5">
                        <Star size={10} className="text-brand/40" />
                        <span className="text-[10px] font-bold text-muted-foreground font-mono">{primary.ip_alias || primary.ip}:{primary.port}</span>
                    </div>
                )}
            </div>

            <div className="border border-surface-lighter rounded-lg">
                <div className="grid grid-cols-[2fr_1fr_1fr_auto] px-6 py-3 border-b border-surface-lighter">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Address</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Port</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Notes</span>
                    <span className="w-8" />
                </div>

                {allocations.length === 0 ? (
                    <div className="py-16 flex items-center justify-center">
                        <span className="text-[12px] font-bold text-muted-foreground/40">No port allocations</span>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {allocations.map((alloc, idx) => (
                            <div
                                key={alloc.id}
                                className={`group grid grid-cols-[2fr_1fr_1fr_auto] px-6 py-4 hover:bg-surface-light/50 transition-colors ${idx > 0 ? 'border-t border-surface-lighter' : ''}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <HugeiconsIcon icon={ConnectIcon} size={16} className={`shrink-0 ${alloc.is_primary ? 'text-muted-foreground' : 'text-muted-foreground/40'}`} />
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[13px] font-bold text-foreground tracking-tight truncate leading-none">
                                            {alloc.ip_alias || alloc.ip}
                                        </span>
                                        {alloc.is_primary && (
                                            <span className="px-1.5 py-0.5 rounded bg-brand/[0.08] text-[8px] font-bold text-brand uppercase tracking-widest shrink-0">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-muted-foreground font-mono">{alloc.port}</span>
                                    <button
                                        onClick={() => handleCopy(`${alloc.ip_alias || alloc.ip}:${alloc.port}`, alloc.id)}
                                        className="text-muted-foreground/20 hover:text-foreground transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                    >
                                        {copied === alloc.id ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                                    </button>
                                </div>

                                <div className="flex items-center">
                                    {alloc.notes ? (
                                        <span className="text-[11px] font-bold text-muted-foreground truncate">{alloc.notes}</span>
                                    ) : (
                                        <span className="text-[11px] font-bold text-muted-foreground/20">—</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-end">
                                    <div className="relative">
                                        <button
                                            onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === alloc.id ? null : alloc.id); }}
                                            className="p-1.5 rounded-md text-muted-foreground/30 hover:text-foreground hover:bg-surface-lighter/50 transition-all cursor-pointer"
                                        >
                                            <Ellipsis size={14} />
                                        </button>

                                        {openMenuId === alloc.id && (
                                            <div
                                                className="absolute right-0 mt-1 w-40 rounded-lg border border-surface-lighter shadow-xl z-50 overflow-hidden"
                                                style={{ backgroundColor: 'var(--surface)' }}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="p-1">
                                                    {!alloc.is_primary && (
                                                        <button
                                                            onClick={() => handleSetPrimary(alloc.id)}
                                                            className="w-full px-3 py-2 text-left text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-surface-light transition-all rounded-md"
                                                        >
                                                            Set as Primary
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => { setOpenMenuId(null); setNotesValue(alloc.notes || ""); setNotesTarget(alloc); }}
                                                        className="w-full px-3 py-2 text-left text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-surface-light transition-all rounded-md"
                                                    >
                                                        Edit Notes
                                                    </button>
                                                    {!alloc.is_primary && (
                                                        <button
                                                            onClick={() => { setOpenMenuId(null); setActionError(""); setDeleteTarget(alloc); }}
                                                            className="w-full px-3 py-2 text-left text-[11px] font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all rounded-md"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CenterModal isOpen={createModalOpen} onClose={() => !creating && setCreateModalOpen(false)} maxWidth="max-w-sm">
                <div className="p-6">
                    <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">New Allocation</h2>
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-5">A random port will be assigned to your server.</p>

                    {actionError && (
                        <div className="mb-4 px-3 py-2.5 rounded-md bg-red-500/5 border border-red-500/10">
                            <p className="text-[11px] font-bold text-red-500">{actionError}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
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
                                    Allocating
                                </>
                            ) : (
                                "Allocate Port"
                            )}
                        </button>
                    </div>
                </div>
            </CenterModal>

            <CenterModal isOpen={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="max-w-md">
                <div className="p-6">
                    <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">Remove Allocation</h2>
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-6">
                        Remove port <span className="text-foreground font-mono">{deleteTarget?.port}</span> from this server? Any services using this port will lose connectivity.
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
                                    Removing
                                </>
                            ) : (
                                "Remove"
                            )}
                        </button>
                    </div>
                </div>
            </CenterModal>

            <CenterModal isOpen={!!notesTarget} onClose={() => !savingNotes && setNotesTarget(null)} maxWidth="max-w-sm">
                <div className="p-6">
                    <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">Edit Notes</h2>
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-5">
                        Add a label for port <span className="text-foreground font-mono">{notesTarget?.port}</span>
                    </p>

                    <input
                        type="text"
                        value={notesValue}
                        onChange={e => setNotesValue(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSaveNotes()}
                        placeholder="e.g. Dynmap, Votifier, Plugin API"
                        disabled={savingNotes}
                        autoFocus
                        className="w-full h-9 bg-surface-light/50 border border-surface-lighter rounded-md px-3 text-[12px] font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/20 transition-all disabled:opacity-40"
                    />

                    <div className="flex items-center justify-end gap-2 mt-5">
                        <button
                            onClick={() => setNotesTarget(null)}
                            disabled={savingNotes}
                            className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveNotes}
                            disabled={savingNotes}
                            className="h-8 px-5 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {savingNotes ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-surface/20 border-t-surface rounded-full animate-spin" />
                                    Saving
                                </>
                            ) : (
                                "Save"
                            )}
                        </button>
                    </div>
                </div>
            </CenterModal>
        </div>
    );
}

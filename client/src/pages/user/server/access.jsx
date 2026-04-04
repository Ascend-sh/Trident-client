import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Copy, Check } from "lucide-react";
import ServerNav from "../../../components/navigation/server-nav";
import CenterModal from "../../../components/modals/center-modal";

const API_BASE = "/api/v1/client";

const MOCK_MEMBERS = [];


export default function Access() {
    const { identifier } = useParams();
    const [serverInfo, setServerInfo] = useState(null);
    const [primaryAllocation, setPrimaryAllocation] = useState(null);
    const [status, setStatus] = useState("offline");
    const [copied, setCopied] = useState(false);
    const [members, setMembers] = useState(MOCK_MEMBERS);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviting, setInviting] = useState(false);
    const [inviteError, setInviteError] = useState("");

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [actionError, setActionError] = useState("");

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
                }
            })
            .catch(() => {});
    }, [identifier]);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        setInviting(true);
        setInviteError("");
        try {
            await new Promise(r => setTimeout(r, 600));
            const fake = {
                id: Date.now(),
                email: inviteEmail.trim(),
                permissions: ["control.console"],
                created_at: new Date().toISOString()
            };
            setMembers(prev => [...prev, fake]);
            setInviteOpen(false);
            setInviteEmail("");
        } catch (err) {
            setInviteError(err?.message || "Failed to invite user");
        } finally {
            setInviting(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        setActionError("");
        try {
            await new Promise(r => setTimeout(r, 500));
            setMembers(prev => prev.filter(m => m.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (err) {
            setActionError(err?.message || "Failed to remove user");
        } finally {
            setDeleting(false);
        }
    };

    const normalizedState = (status || "").toLowerCase();
    const isOnline = normalizedState === "running" || normalizedState === "online";
    const isStarting = normalizedState === "starting";
    const statusColor = isOnline ? "green" : isStarting ? "yellow" : "red";

    return (
        <div className="bg-surface px-10 py-10">
            {/* Header */}
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
                {members.length > 0 && (
                    <button
                        onClick={() => { setInviteEmail(""); setInviteError(""); setInviteOpen(true); }}
                        className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer"
                    >
                        Invite
                    </button>
                )}
            </div>

            <ServerNav />

            {members.length === 0 ? (
                <div className="border border-surface-lighter rounded-lg py-20 px-6 relative overflow-hidden">
                    {/* Abstract collaboration visual */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035]">
                        <div className="relative w-[280px] h-[280px]">
                            <div className="absolute top-1/2 left-1/2 -translate-x-[65%] -translate-y-1/2 w-[180px] h-[180px] rounded-full border-[2px]" style={{ borderColor: 'var(--color-brand)' }} />
                            <div className="absolute top-1/2 left-1/2 -translate-x-[35%] -translate-y-1/2 w-[180px] h-[180px] rounded-full border-[2px]" style={{ borderColor: 'var(--color-brand)' }} />
                        </div>
                    </div>

                    <div className="relative flex flex-col items-center">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-surface-light border border-surface-lighter" />
                            <div className="w-[2px] h-[2px] rounded-full bg-muted-foreground/20" />
                            <div className="w-[2px] h-[2px] rounded-full bg-muted-foreground/20" />
                            <div className="w-[2px] h-[2px] rounded-full bg-muted-foreground/20" />
                            <div className="w-8 h-8 rounded-full border-[1.5px] border-dashed border-surface-lighter" />
                        </div>
                        <p className="text-[15px] font-bold text-foreground tracking-tight mb-1.5">Collaborate on this server</p>
                        <p className="text-[11px] font-bold text-muted-foreground/50 text-center max-w-[280px] leading-relaxed mb-7">
                            Share granular access with teammates — choose exactly which controls they can use.
                        </p>
                        <button
                            onClick={() => { setInviteEmail(""); setInviteError(""); setInviteOpen(true); }}
                            className="h-9 px-6 bg-brand text-surface hover:bg-brand/90 transition-all rounded-lg font-bold text-[10px] uppercase tracking-widest cursor-pointer"
                        >
                            Send First Invite
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1 mb-3">
                        <p className="text-[11px] font-bold text-muted-foreground/40">
                            {members.length} user{members.length !== 1 ? "s" : ""} with access
                        </p>
                    </div>

                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="group border border-surface-lighter rounded-lg hover:border-muted-foreground/10 transition-all"
                        >
                            <div className="flex items-center justify-between px-5 py-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="relative">
                                        <img
                                            src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(member.email)}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                                            alt={member.email}
                                            className="w-9 h-9 rounded-full border border-surface-lighter bg-surface-light shrink-0"
                                        />
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-surface border-2 border-surface flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-bold text-foreground tracking-tight leading-none">{member.email}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground/30 mt-1">
                                            {new Date(member.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        {(member.permissions || []).map(p => (
                                            <span key={p} className="px-2 py-0.5 rounded bg-surface-light text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                                                {p.replace("control.", "").replace("file.", "")}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="w-px h-4 bg-surface-lighter opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <button
                                        onClick={() => { setActionError(""); setDeleteTarget(member); }}
                                        className="text-[10px] font-bold text-muted-foreground/20 hover:text-red-500 uppercase tracking-widest transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                    >
                                        Revoke
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Invite Modal */}
            <CenterModal isOpen={inviteOpen} onClose={() => !inviting && setInviteOpen(false)} maxWidth="max-w-sm">
                <div className="p-6">
                    <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">Invite User</h2>
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-5">Grant access to this instance</p>

                    <input
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleInvite()}
                        placeholder="user@example.com"
                        disabled={inviting}
                        autoFocus
                        className="w-full h-9 bg-surface-light/50 border border-surface-lighter rounded-md px-3 text-[12px] font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/20 transition-all disabled:opacity-40"
                    />

                    {inviteError && (
                        <div className="mt-3 px-3 py-2.5 rounded-md bg-red-500/5 border border-red-500/10">
                            <p className="text-[11px] font-bold text-red-500">{inviteError}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 mt-5">
                        <button
                            onClick={() => setInviteOpen(false)}
                            disabled={inviting}
                            className="h-8 px-4 border border-surface-lighter rounded-md text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleInvite}
                            disabled={inviting || !inviteEmail.trim()}
                            className="h-8 px-5 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {inviting ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-surface/20 border-t-surface rounded-full animate-spin" />
                                    Inviting
                                </>
                            ) : (
                                "Send Invite"
                            )}
                        </button>
                    </div>
                </div>
            </CenterModal>

            {/* Delete Modal */}
            <CenterModal isOpen={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="max-w-md">
                <div className="p-6">
                    <h2 className="text-[16px] font-bold text-foreground tracking-tight mb-1">Remove User</h2>
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-6">
                        Remove <span className="text-foreground font-bold">{deleteTarget?.email}</span> from this instance? They will lose all access immediately.
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
        </div>
    );
}

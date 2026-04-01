import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Plus, Trash2, Ellipsis, Copy, Check } from "lucide-react";
import ServerNav from "../../../components/navigation/server-nav";
import CenterModal from "../../../components/modals/center-modal";
import { Button } from "@/components/ui/button";

const API_BASE = "/api/v1/client";

const MOCK_MEMBERS = [];

const AVATAR_SEEDS = ["alex", "blake", "casey", "drew"];

function AvatarGroup() {
    return (
        <div className="flex -space-x-4 mb-5">
            {AVATAR_SEEDS.map((seed, i) => (
                <img
                    key={seed}
                    src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                    alt={seed}
                    className="w-12 h-12 rounded-lg border-2 border-surface bg-surface-light object-cover"
                    style={{ zIndex: AVATAR_SEEDS.length - i }}
                />
            ))}
        </div>
    );
}

export default function Access() {
    const { identifier } = useParams();
    const [serverInfo, setServerInfo] = useState(null);
    const [primaryAllocation, setPrimaryAllocation] = useState(null);
    const [status, setStatus] = useState("offline");
    const [copied, setCopied] = useState(false);
    const [members, setMembers] = useState(MOCK_MEMBERS);
    const [openMenuId, setOpenMenuId] = useState(null);

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

    return (
        <div className="bg-surface px-16 py-10">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-md bg-surface-light border border-surface-lighter flex items-center justify-center overflow-hidden shrink-0">
                        <img src="/defaulticon.webp" alt="Minecraft" className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-[20px] font-bold text-foreground tracking-tight">{serverInfo?.name || "Loading Instance..."}</h1>

                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${
                                isOnline
                                    ? "bg-green-500/5 border-green-500/10 text-green-600"
                                    : isStarting
                                    ? "bg-yellow-500/5 border-yellow-500/10 text-yellow-600"
                                    : "bg-red-500/5 border-red-500/10 text-red-600"
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500" : isStarting ? "bg-yellow-500" : "bg-red-500"}`} />
                                <span className="text-[9px] font-bold uppercase tracking-[0.1em]">{normalizedState || "offline"}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[12px] font-bold uppercase tracking-widest">
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
                                        <span className="text-muted-foreground">{serverInfo.location.description || serverInfo.location.shortCode}</span>
                                    </div>
                                    <span className="text-muted-foreground/10">•</span>

                                </>
                            )}
                             <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground/80">
                                    {primaryAllocation
                                        ? `${primaryAllocation.ip_alias || primaryAllocation.ip}:${primaryAllocation.port}`
                                        : "Assigning IP..."}
                                </span>
                                {primaryAllocation && (
                                    <button
                                        onClick={() => handleCopy(`${primaryAllocation.ip_alias || primaryAllocation.ip}:${primaryAllocation.port}`)}
                                        className="text-muted-foreground/30 hover:text-foreground transition-colors cursor-pointer"
                                    >
                                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <ServerNav />

            {members.length === 0 ? (
                <div className="bg-surface-light border border-surface-lighter rounded-xl flex flex-col items-center justify-center py-20 px-6">
                    <AvatarGroup />
                    <h2 className="text-[15px] font-bold text-foreground tracking-tight mb-1.5">No Subusers</h2>
                    <p className="text-[12px] font-bold text-muted-foreground text-center max-w-[280px] leading-relaxed">
                        Invite teammates to collaborate on this instance with scoped permissions.
                    </p>

                    <button
                        onClick={() => { setInviteEmail(""); setInviteError(""); setInviteOpen(true); }}
                        className="mt-6 h-8 px-4 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer flex items-center gap-2 shadow-none"
                    >
                        <Plus size={12} />
                        Add Access
                    </button>
                </div>
            ) : (
                <div className="bg-surface-light border border-surface-lighter rounded-xl px-[2px] pb-[2px] pt-0">
                    <div className="w-full">
                        <div className="grid grid-cols-[2fr_1fr_0.5fr] px-6 py-3">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">User</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Permissions</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-right">Actions</span>
                        </div>

                        <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden">
                            {members.map((member, idx) => (
                                <div
                                    key={member.id}
                                    className={`grid grid-cols-[2fr_1fr_0.5fr] px-6 py-4 border-b border-surface-lighter hover:bg-surface-light/40 transition-colors ${idx === members.length - 1 ? "border-b-0" : ""}`}
                                >
                                    <div className="flex items-center gap-3">
                                            <img
                                            src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(member.email)}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                                            alt={member.email}
                                            className="w-8 h-8 rounded-lg border border-surface-lighter bg-surface-light shrink-0"
                                        />
                                        <span className="text-[12px] font-bold text-foreground">{member.email}</span>

                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {(member.permissions || []).slice(0, 2).map(p => (
                                            <span key={p} className="px-2 py-0.5 rounded bg-surface/40 border border-surface-lighter text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                {p.replace("control.", "").replace("file.", "")}
                                            </span>
                                        ))}
                                        {(member.permissions || []).length > 2 && (
                                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                                +{member.permissions.length - 2} more
                                            </span>
                                        )}

                                    </div>
                                    <div className="flex items-center justify-end">
                                        <div className="relative">
                                            <button
                                                onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === member.id ? null : member.id); }}
                                                className="p-2 rounded-md hover:bg-surface-lighter text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                                            >
                                                <Ellipsis size={14} />
                                            </button>

                                            {openMenuId === member.id && (
                                                <div
                                                    className="absolute right-0 mt-2 w-32 bg-surface border border-surface-lighter rounded-md z-50 shadow-none py-1"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={() => { setOpenMenuId(null); setActionError(""); setDeleteTarget(member); }}
                                                        className="w-full px-4 py-2 text-left text-[11px] font-bold text-red-500 hover:bg-red-50 transition-all uppercase tracking-widest flex items-center gap-2"
                                                    >
                                                        <Trash2 size={11} />
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <CenterModal isOpen={inviteOpen} onClose={() => !inviting && setInviteOpen(false)} maxWidth="max-w-sm">
                <div className="p-6">
                    <div className="mb-5">
                        <h2 className="text-[16px] font-bold text-foreground tracking-tight">Invite User</h2>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Grant access to this instance</p>
                    </div>

                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Email address</label>
                    <input
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleInvite()}
                        placeholder="user@example.com"
                        disabled={inviting}
                        autoFocus
                        className="w-full h-9 bg-surface-light border border-surface-lighter rounded-md px-3 text-[12px] font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/30 transition-colors disabled:opacity-50"
                    />

                    {inviteError && (
                        <div className="mt-3 px-3 py-2 rounded-md bg-red-500/5 border border-red-500/10">
                            <p className="text-[11px] font-bold text-red-600">{inviteError}</p>
                        </div>
                    )}
                    <div className="flex items-center justify-end gap-3 mt-5">
                        <button
                            onClick={() => setInviteOpen(false)}
                            disabled={inviting}
                            className="px-3 py-1.5 text-[10px] font-bold text-brand/40 hover:text-brand uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <Button
                            onClick={handleInvite}
                            disabled={inviting || !inviteEmail.trim()}
                            className="h-8 px-4 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer shadow-none disabled:opacity-40"
                        >
                            {inviting ? "Inviting..." : "Send Invite"}
                        </Button>
                    </div>
                </div>
            </CenterModal>

            <CenterModal isOpen={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="max-w-md">
                <div className="p-6">
                    <div className="mb-6">
                        <h2 className="text-[16px] font-bold text-brand tracking-tight">Remove User</h2>
                        <p className="text-[12px] font-bold text-brand/40 mt-1">
                            Remove <span className="text-brand">{deleteTarget?.email}</span> from this instance? They will lose all access immediately.
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
                            className="px-4 py-2 text-[10px] font-bold text-brand hover:text-brand/70 uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <Button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="h-8 px-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer shadow-none disabled:opacity-40"
                        >
                            {deleting ? "Removing..." : "Confirm Remove"}
                        </Button>
                    </div>
                </div>
            </CenterModal>
        </div>
    );
}

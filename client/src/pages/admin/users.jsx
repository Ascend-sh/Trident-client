import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { request } from "@/lib/request.js";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0, perPage: 50 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ page, per_page: 50 });
        if (search) params.set("username", search);
        request(`/admin/users?${params.toString()}`)
            .then(data => {
                setUsers(data?.users || []);
                setPagination(data?.pagination || { currentPage: 1, totalPages: 1, total: 0, perPage: 50 });
            })
            .catch(() => setUsers([]))
            .finally(() => setLoading(false));
    }, [page, search]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    };

    return (
        <div className="bg-surface px-10 py-10">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">Users</h1>
                    <p className="text-[13px] font-bold text-muted-foreground mt-2">Manage all panel accounts and their roles</p>
                </div>
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search username..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            className="h-8 pl-8 pr-4 text-[12px] font-bold bg-transparent border border-surface-lighter rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/20 w-52 transition-all"
                        />
                    </div>
                    <button
                        type="button"
                        className="h-8 px-4 flex items-center gap-2 bg-brand text-surface hover:bg-brand/90 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                    >
                        <Plus size={12} />
                        Create User
                    </button>
                </form>
            </div>

            <div className="flex items-center justify-between px-1 mb-4">
                <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                    {pagination.total} {pagination.total === 1 ? "user" : "users"} total
                </span>
                {pagination.totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="w-7 h-7 flex items-center justify-center border border-surface-lighter rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            <ChevronLeft size={13} />
                        </button>
                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                            {page} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={page >= pagination.totalPages}
                            className="w-7 h-7 flex items-center justify-center border border-surface-lighter rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            <ChevronRight size={13} />
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="border border-surface-lighter rounded-lg py-20 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                        <span className="text-[11px] font-bold text-muted-foreground/50">Loading users...</span>
                    </div>
                </div>
            ) : users.length === 0 ? (
                <div className="border border-surface-lighter rounded-lg py-20 px-6 flex flex-col items-center justify-center">
                    <p className="text-[15px] font-bold text-foreground tracking-tight mb-1.5">No users found</p>
                    <p className="text-[11px] font-bold text-muted-foreground/50">
                        {search ? `No results for "${search}"` : "No panel users exist yet."}
                    </p>
                </div>
            ) : (
                <div className="border border-surface-lighter rounded-lg">
                    <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] px-6 py-3 border-b border-surface-lighter">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Username</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Role</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Servers</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">2FA</span>
                    </div>
                    {users.map((user, idx) => (
                        <div
                            key={user.id}
                            className={`group grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] px-6 py-3.5 items-center cursor-pointer hover:bg-surface-lighter/30 transition-colors ${idx < users.length - 1 ? "border-b border-surface-lighter" : ""}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <img
                                    src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${user.username}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                                    alt={user.username}
                                    className="w-6 h-6 rounded-full bg-surface-lighter shrink-0"
                                />
                                <span className="text-[11px] font-bold text-foreground truncate">{user.username}</span>
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground truncate">{user.email}</span>
                            <span className="text-[11px] font-bold text-muted-foreground">
                                {user.isAdmin ? "Admin" : "User"}
                            </span>
                            <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                                {user.serverCount}
                            </span>
                            <span className="text-[11px] font-bold text-muted-foreground">
                                {user.has2fa ? "Enabled" : "Disabled"}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end">
                                <HugeiconsIcon icon={MoreHorizontalIcon} size={16} className="text-muted-foreground" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

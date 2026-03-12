import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Database, Calendar, Users, Archive, Network, Power, Settings, ClipboardClock, Undo2, Wallet, PanelLeft, MoreVertical, LogOut } from "lucide-react";
import { useState } from "react";
import { logout, useAuth } from "../../context/auth-context.jsx";

export default function ServerNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const serverId = params?.id;
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { user, balance, currencyName, refresh } = useAuth();

    const base = serverId ? `/app/server/${serverId}` : "/app/server";

    const navLinks = [
        { path: `${base}/overview`, icon: LayoutDashboard, label: "Overview" },
        { path: `${base}/files`, icon: FolderOpen, label: "Files" },
        { path: `${base}/databases`, icon: Database, label: "Databases" },
        { path: `${base}/schedule`, icon: Calendar, label: "Schedule" },
        { path: `${base}/users`, icon: Users, label: "Users" },
        { path: `${base}/backups`, icon: Archive, label: "Backups" },
        { path: `${base}/network`, icon: Network, label: "Network" },
        { path: `${base}/startup`, icon: Power, label: "Startup" },
        { path: `${base}/settings`, icon: Settings, label: "Settings" },
        { path: `${base}/activity`, icon: ClipboardClock, label: "Activity" },
    ];

    return (
        <aside className="w-64 h-screen flex flex-col border-r border-white/10" style={{ backgroundColor: "#1F1F1E" }}>
            <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between">
                <img src="/Logo.png" alt="Torqen" className="h-8" />
                <button className="text-white/60 hover:text-white transition-colors duration-200">
                    <PanelLeft size={20} />
                </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <Link
                    to="/app/home"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors duration-200 bg-black/20 mb-3"
                >
                    <Undo2 size={18} className="flex-shrink-0" />
                    <span className="text-sm font-medium leading-none">Back to Servers</span>
                </Link>

                {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                                location.pathname === link.path
                                    ? "text-white"
                                    : "text-white/60 hover:text-white hover:bg-white/5"
                            }`}
                            style={location.pathname === link.path ? { backgroundColor: "#40413F" } : {}}
                        >
                            <Icon size={18} className="flex-shrink-0" />
                            <span className="text-sm font-medium leading-none">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mx-3 mb-3">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2.5">
                        <Wallet size={15} className="text-white/60" />
                        <span className="text-xs text-white/70 font-medium">Balance</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{balance} {currencyName}</span>
                </div>
            </div>

            <div className="p-3 border-t border-white/10 relative">
                <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/80 hover:bg-white/5 transition-colors duration-200"
                >
                    <div className="w-8 h-8 flex items-center justify-center text-sm font-semibold text-black" style={{ backgroundColor: "#FCD34D", borderRadius: "7px" }}>
                        {(user?.username?.[0] || user?.email?.[0] || "U").toUpperCase()}
                    </div>
                    <div className="flex-1 text-left min-w-0 flex flex-col justify-center">
                        <p className="text-xs font-medium text-white truncate leading-tight">{user?.username || "Account"}</p>
                        <p className="text-[11px] text-white/50 truncate leading-tight">{user?.email || ""}</p>
                    </div>
                    <MoreVertical size={15} className="text-white/40 flex-shrink-0" />
                </button>

                {userMenuOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setUserMenuOpen(false)}
                        />
                        <div 
                            className="absolute bottom-0 left-full ml-2 z-50 w-52 rounded-lg border border-white/10 overflow-hidden shadow-xl"
                            style={{ backgroundColor: "#1F1F1E" }}
                        >
                            <div className="px-3 py-2 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 flex items-center justify-center text-xs font-semibold text-black" style={{ backgroundColor: "#FCD34D", borderRadius: "6px" }}>
                                        {(user?.username?.[0] || user?.email?.[0] || "U").toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-white truncate">{user?.username || "Account"}</p>
                                        <p className="text-[10px] text-white/50 truncate">{user?.email || ""}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-1.5">
                                <Link
                                    to="/app/account/settings"
                                    onClick={() => setUserMenuOpen(false)}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors duration-200"
                                >
                                    <Settings size={14} />
                                    <span className="text-xs font-medium">Settings</span>
                                </Link>

                                <button
                                    onClick={async () => {
                                        setUserMenuOpen(false);
                                        try {
                                            await logout();
                                            await refresh();
                                        } finally {
                                            navigate("/", { replace: true });
                                        }
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-colors duration-200"
                                >
                                    <LogOut size={14} />
                                    <span className="text-xs font-medium">Logout</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
}





import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, User, HeadphonesIcon, MoreVertical, PanelLeft, Wallet, ChevronDown, Settings, Shield, Palette, Earth, HardDrive, Package, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { account, logout } from "../../utils/auth";

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [accountOpen, setAccountOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        let cancelled = false;

        account()
            .then((res) => {
                if (!cancelled) setUser(res?.user || null);
            })
            .catch(() => {
                if (!cancelled) setUser(null);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const navItems = [
        { path: "/app/home", label: "Dashboard", icon: LayoutDashboard },
        { path: "/app/store", label: "Store", icon: ShoppingCart },
        { path: "/app/support", label: "Support", icon: HeadphonesIcon },
    ];

    const accountItems = [
        { path: "/app/account/settings", label: "Settings", icon: Settings },
        { path: "/app/account/security", label: "Security", icon: Shield },
    ];

    const adminItems = [
        { path: "/admin/overview", label: "Overview", icon: LayoutDashboard },
        { path: "/admin/customizations", label: "Customizations", icon: Palette },
        { path: "/admin/locations", label: "Locations", icon: Earth },
        { path: "/admin/nodes", label: "Nodes", icon: HardDrive },
        { path: "/admin/software", label: "Software", icon: Package },
    ];

    return (
        <aside className="w-64 h-screen flex flex-col border-r border-white/10" style={{ backgroundColor: "#0A1618" }}>
            <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between">
                <img src="/Logo.png" alt="Torqen" className="h-8" />
                <button className="text-white/60 hover:text-white transition-colors duration-200">
                    <PanelLeft size={20} />
                </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <div className="px-3 mb-3">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">General</p>
                </div>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                                location.pathname === item.path
                                    ? "text-white"
                                    : "text-white/60 hover:text-white hover:bg-white/5"
                            }`}
                            style={location.pathname === item.path ? { backgroundColor: "rgba(173, 229, 218, 0.1)" } : {}}
                        >
                            <Icon size={18} className="flex-shrink-0" />
                            <span className="text-sm font-medium leading-none">{item.label}</span>
                        </Link>
                    );
                })}

                <div>
                    <button
                        onClick={() => setAccountOpen(!accountOpen)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                            location.pathname.startsWith("/app/account")
                                ? "text-white"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                        style={location.pathname.startsWith("/app/account") ? { backgroundColor: "rgba(173, 229, 218, 0.1)" } : {}}
                    >
                        <User size={18} className="flex-shrink-0" />
                        <span className="text-sm font-medium leading-none flex-1 text-left">Account</span>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${accountOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`overflow-hidden transition-all duration-200 ${accountOpen ? 'max-h-40' : 'max-h-0'}`}>
                        <div className="ml-3 mt-1 space-y-1">
                            {accountItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                                            location.pathname === item.path
                                                ? "text-white"
                                                : "text-white/60 hover:text-white hover:bg-white/5"
                                        }`}
                                        style={location.pathname === item.path ? { backgroundColor: "rgba(173, 229, 218, 0.1)" } : {}}
                                    >
                                        <Icon size={16} className="flex-shrink-0" />
                                        <span className="text-xs font-medium leading-none">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {user?.isAdmin && (
                    <>
                        <div className="px-3 mt-4 mb-3">
                            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Administrative</p>
                        </div>
                        {adminItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                                        location.pathname === item.path
                                            ? "text-white"
                                            : "text-white/60 hover:text-white hover:bg-white/5"
                                    }`}
                                    style={location.pathname === item.path ? { backgroundColor: "rgba(173, 229, 218, 0.1)" } : {}}
                                >
                                    <Icon size={18} className="flex-shrink-0" />
                                    <span className="text-sm font-medium leading-none">{item.label}</span>
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            <div className="mx-3 mb-3">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2.5">
                        <Wallet size={15} className="text-white/60" />
                        <span className="text-xs text-white/70 font-medium">Balance</span>
                    </div>
                    <span className="text-sm font-semibold text-white">250 TQN</span>
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
                            style={{ backgroundColor: "#0A1618" }}
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
};

export default Sidebar;

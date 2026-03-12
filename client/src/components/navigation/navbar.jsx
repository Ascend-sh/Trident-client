import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
    HardDrive,
    ShoppingCart, 
    HeadphonesIcon, 
    Sun,
    Moon,
    User,
    Bell,
    ChevronDown,
    LogOut,
    Shield,
    Settings
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { logout, useAuth } from "@/context/auth-context.jsx";

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, balance, currencyName, refresh } = useAuth();
    const [isDark, setIsDark] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const navItems = [
        { path: "/app/home", label: "Servers", icon: HardDrive },
        { path: "/app/store", label: "Store", icon: ShoppingCart },
        { path: "/app/support", label: "Support", icon: HeadphonesIcon },
        { path: "/app/account/settings", label: "Settings", icon: Settings },
    ];

    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        setUserMenuOpen(false);
        try {
            await logout();
            await refresh();
        } finally {
            navigate("/", { replace: true });
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const avatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${user?.username || 'user'}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    return (
        <header className="w-full h-16 bg-surface-light border-b border-surface-lighter flex items-center justify-between px-16 sticky top-0 z-50">
            {/* Left: Branding & Team */}
            <div className="flex items-center gap-3">
                <Link to="/app/home" className="flex items-center">
                    <img src="/Logo-dark.png" alt="Torqen" className="h-7" />
                </Link>
                
                <span className="text-brand/20 font-light text-xl">/</span>
                
                <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-surface-lighter transition-colors cursor-pointer group border border-transparent hover:border-surface-lighter">
                    <span className="text-sm font-medium text-brand/70 group-hover:text-brand">No Instance Selected</span>
                    <ChevronDown size={14} className="text-brand/40 group-hover:text-brand" />
                </button>
            </div>

            {/* Right: Navlinks, Credits, Utils, Profile */}
            <div className="flex items-center gap-2">
                {/* Main Navigation */}
                <div className="flex items-center gap-1 mr-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link key={item.path} to={item.path}>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer group ${
                                    active ? "bg-surface-highlight border border-surface-lighter" : "hover:bg-surface-lighter"
                                }`}>
                                    <Icon size={14} className={active ? "text-brand" : "text-brand/40 group-hover:text-brand/70"} />
                                    <span className={`text-[12px] font-bold ${
                                        active ? "text-brand" : "text-brand/50 group-hover:text-brand/70"
                                    }`}>
                                        {item.label}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="h-8 w-px bg-surface-lighter mx-1" />

                {/* Utils & Profile */}
                <div className="flex items-center gap-3 ml-1">
                    <div className="bg-surface-highlight px-3 py-1 rounded-full border border-surface-lighter text-[10px] font-bold text-brand/70 uppercase tracking-wider">
                        {balance} {currencyName}
                    </div>

                    <button className="text-brand/40 hover:text-brand transition-colors cursor-pointer">
                        <Bell size={18} />
                    </button>

                    <button 
                        onClick={() => setIsDark(!isDark)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-highlight transition-colors text-brand/40 hover:text-brand cursor-pointer border border-transparent hover:border-surface-lighter"
                    >
                        {isDark ? <Moon size={16} /> : <Sun size={16} />}
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center focus:outline-none"
                        >
                            <img 
                                src={avatarUrl}
                                alt="Avatar"
                                className="w-8 h-8 rounded-full cursor-pointer hover:opacity-90 transition-opacity bg-white border border-surface-lighter"
                            />
                        </button>

                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-surface-light border border-surface-lighter rounded-lg shadow-none z-[100] overflow-hidden animate-in fade-in zoom-in duration-150">
                                {/* Dropdown Header */}
                                <div className="p-3 border-b border-surface-lighter bg-surface-lighter/20">
                                    <div className="flex items-center gap-2.5">
                                        <img 
                                            src={avatarUrl}
                                            alt="Avatar"
                                            className="w-7 h-7 rounded-full bg-white border border-surface-lighter"
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <p className="text-[12px] font-bold text-brand truncate leading-none mb-0.5">
                                                {user?.username || "Account"}
                                            </p>
                                            <p className="text-[9px] font-medium text-brand/40 truncate leading-none uppercase tracking-wider">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dropdown Actions */}
                                <div className="p-1">
                                    {user?.isAdmin && (
                                        <Link 
                                            to="/app/admin/overview" 
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-brand/60 hover:text-brand hover:bg-surface-lighter transition-all group"
                                        >
                                            <Shield size={13} className="group-hover:text-brand" />
                                            <span className="text-[11px] font-bold">Admin Dashboard</span>
                                        </Link>
                                    )}
                                    
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-red-500/60 hover:text-red-500 hover:bg-red-50/50 transition-all group cursor-pointer"
                                    >
                                        <LogOut size={13} className="group-hover:text-red-500" />
                                        <span className="text-[11px] font-bold">Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;

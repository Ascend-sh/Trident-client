import { Link, useLocation, useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Home04Icon,
    Ticket03Icon,
    CreditCardChangeIcon,
    Settings03Icon,
    Search01Icon,
    CommandIcon,
    Notification01Icon,
    Sun03Icon,
    Moon02Icon,
    Logout01Icon,
    PlusSignIcon,
    MoreHorizontalIcon,
    DashboardBrowsingIcon,
} from "@hugeicons/core-free-icons";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logout, useAuth } from "@/context/auth-context.jsx";
import { useCustomization } from "@/context/customization-context.jsx";
import { useTheme } from "@/hooks/use-theme";
import AddCredits from "../../pages/economy/AddCredits";

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, balance, currencyName, refresh } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const customization = useCustomization();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutProgress, setLogoutProgress] = useState(0);
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const navItems = [
        { path: "/app/home", label: "Home", icon: Home04Icon },
        { path: "/app/support", label: "Support", icon: Ticket03Icon },
        { path: "/app/billing", label: "Billing", icon: CreditCardChangeIcon },
        { path: "/app/account/settings", label: "Settings", icon: Settings03Icon },
    ];

    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setLogoutProgress(0);

        const duration = 800;
        const interval = 10;
        const step = 100 / (duration / interval);

        const timer = setInterval(() => {
            setLogoutProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return Math.min(100, prev + step);
            });
        }, interval);

        try {
            await new Promise(r => setTimeout(r, duration + 100));
            await logout();
            await refresh();
            navigate("/", { replace: true });
        } catch (error) {
            console.error("Logout failed:", error);
            setIsLoggingOut(false);
            clearInterval(timer);
        }
    };

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
        <>
            <aside className="w-64 h-screen bg-surface-light flex flex-col shrink-0 sticky top-0 relative z-10">
                <div className="px-5 h-14 flex items-center mb-2">
                    <Link to="/app/home" className="flex items-center">
                        <img src={customization.logoUrl} alt={customization.siteName} className="h-7 dark:invert" />
                    </Link>
                </div>

                <div className="px-3 pb-2 space-y-0.5">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50">
                        <HugeiconsIcon icon={Search01Icon} size={18} />
                        <span className="text-[13px] font-bold flex-1 text-left">Search</span>
                        <div className="flex items-center gap-1">
                            <kbd className="w-5 h-5 flex items-center justify-center rounded bg-surface-lighter/80 text-muted-foreground">
                                <HugeiconsIcon icon={CommandIcon} size={10} />
                            </kbd>
                            <kbd className="w-5 h-5 flex items-center justify-center rounded bg-surface-lighter/80 text-[10px] font-bold text-muted-foreground">
                                K
                            </kbd>
                        </div>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50">
                        <HugeiconsIcon icon={Notification01Icon} size={18} />
                        <span className="text-[13px] font-bold">Notifications</span>
                    </button>
                </div>

                <div className="mx-3 h-px bg-surface-lighter mb-2" />

                <nav className="flex-1 px-3 py-0 flex flex-col gap-[3px]">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link key={item.path} to={item.path}>
                                <div className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                                    active
                                        ? "bg-brand/[0.08] text-brand"
                                        : "text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50"
                                }`}>
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-brand rounded-full" />
                                    )}
                                    <HugeiconsIcon icon={item.icon} size={18} />
                                    <span className="text-[13px] font-bold">
                                        {item.label}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-3 pb-4">
                    <button
                        onClick={() => setIsCreditsModalOpen(true)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-lighter/30 transition-all cursor-pointer group/credits"
                    >
                        <div className="flex items-baseline gap-2">
                            <span className="text-[13px] font-bold text-foreground leading-none">{balance}</span>
                            <span className="text-[10px] font-bold text-muted-foreground leading-none">Credits</span>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-surface-lighter/50 text-muted-foreground flex items-center justify-center group-hover/credits:bg-brand group-hover/credits:text-surface transition-all">
                            <HugeiconsIcon icon={PlusSignIcon} size={10} className="transition-transform group-hover/credits:rotate-90" />
                        </div>
                    </button>

                    <div className="my-2" />

                    <div className="relative flex items-center justify-between px-2" ref={menuRef}>
                        <div className="flex items-center gap-3 min-w-0">
                            <img
                                src={avatarUrl}
                                alt="Avatar"
                                className="w-8 h-8 rounded-full bg-white border border-surface-lighter shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="text-[13px] font-bold text-foreground truncate leading-none mb-1">
                                    {user?.username || "Account"}
                                </p>
                                <p className="text-[10px] font-bold text-muted-foreground truncate leading-none tracking-wider">
                                    {user?.email ? user.email.split('@')[0].slice(0, 9) + '•••' : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            {!customization.isDark && (
                                <div className="flex items-center bg-surface-lighter/40 rounded-full p-[3px]">
                                    <button
                                        onClick={() => isDark && toggleTheme()}
                                        className={`w-6 h-5 flex items-center justify-center rounded-full transition-all cursor-pointer ${!isDark ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <HugeiconsIcon icon={Sun03Icon} size={11} />
                                    </button>
                                    <button
                                        onClick={() => !isDark && toggleTheme()}
                                        className={`w-6 h-5 flex items-center justify-center rounded-full transition-all cursor-pointer ${isDark ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <HugeiconsIcon icon={Moon02Icon} size={11} />
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50 transition-all cursor-pointer"
                            >
                                <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                            </button>
                        </div>

                        {userMenuOpen && (
                            <div className="absolute bottom-0 left-full ml-2 w-52 border border-surface-lighter rounded-lg shadow-lg z-[100] overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
                                <div className="px-3 py-2.5 border-b border-surface-lighter flex items-center gap-2.5">
                                    <img
                                        src={avatarUrl}
                                        alt="Avatar"
                                        className="w-7 h-7 rounded-full bg-white border border-surface-lighter shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-bold text-foreground truncate leading-none mb-1">
                                            {user?.username || "Account"}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground truncate leading-none">
                                            {user?.email || ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-1">
                                    {user?.isAdmin && (
                                        <Link
                                            to="/app/admin/overview"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50 transition-all"
                                        >
                                            <HugeiconsIcon icon={DashboardBrowsingIcon} size={16} />
                                            <span className="text-[12px] font-bold">Admin Dashboard</span>
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50 transition-all cursor-pointer"
                                    >
                                        <HugeiconsIcon icon={Logout01Icon} size={16} />
                                        <span className="text-[12px] font-bold">Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            <AnimatePresence>
                {isLoggingOut && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="fixed inset-0 z-[1000] bg-surface flex flex-col items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="flex flex-col items-center w-full max-w-[240px] gap-8"
                        >
                            <img src={customization.logoUrl} alt={customization.siteName} className="h-8 opacity-20" />

                            <div className="w-full h-[2px] bg-brand/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-brand/40 transition-all duration-150 ease-out"
                                    style={{ width: `${logoutProgress}%` }}
                                />
                            </div>

                            <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-[0.2em]">
                                Logging out ...
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AddCredits
                isOpen={isCreditsModalOpen}
                onClose={() => setIsCreditsModalOpen(false)}
            />
        </>
    );
};

export default Navbar;

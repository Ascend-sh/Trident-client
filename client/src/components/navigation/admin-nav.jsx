import { Link, useLocation, useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Home04Icon,
    CreditCardChangeIcon,
    Package01Icon,
    Notification01Icon,
    Logout01Icon,
    ArrowTurnBackwardIcon,
    MapingIcon,
    ThirdBracketIcon,
    PaintBrush03Icon,
    Sun01Icon,
    Moon02Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logout, useAuth } from "@/context/auth-context.jsx";
import { useCustomization } from "@/context/customization-context.jsx";
import { useTheme } from "@/hooks/use-theme";

const AdminNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, balance, currencyName, refresh } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const customization = useCustomization();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutProgress, setLogoutProgress] = useState(0);

    const navItems = [
        { path: "/app/admin/overview", label: "Overview", icon: Home04Icon },
        { path: "/app/admin/payments", label: "Transactions", icon: CreditCardChangeIcon },
        { path: "/app/admin/software", label: "Software", icon: Package01Icon },
        { path: "/app/admin/locations", label: "Locations", icon: MapingIcon },
        { path: "/app/admin/configs", label: "Configs", icon: ThirdBracketIcon },
        { path: "/app/admin/customization", label: "Customization", icon: PaintBrush03Icon },
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

    const avatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${user?.username || 'user'}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    return (
        <>
            <aside className="w-64 h-screen bg-surface-light flex flex-col shrink-0 sticky top-0">
                <div className="px-5 h-14 flex items-center mb-2">
                    <Link to="/app/home" className="flex items-center">
                        <img src={customization.logoUrl} alt={customization.siteName} className="h-7 dark:invert" />
                    </Link>
                </div>

                <div className="px-3 pb-2 space-y-0.5">
                    <Link to="/app/home">
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer group border border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50">
                            <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={18} />
                            <span className="text-[13px] font-bold">Exit Admin</span>
                        </div>
                    </Link>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer group border border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50">
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
                    {!customization.isDark && (
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer group border border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50 mb-2"
                        >
                            <HugeiconsIcon icon={isDark ? Sun01Icon : Moon02Icon} size={18} />
                            <span className="text-[13px] font-bold">{isDark ? "Light Mode" : "Dark Mode"}</span>
                        </button>
                    )}

                    <div className="flex items-center justify-between px-2">
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
                        <button
                            onClick={handleLogout}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-lighter/50 transition-all cursor-pointer shrink-0"
                        >
                            <HugeiconsIcon icon={Logout01Icon} size={18} />
                        </button>
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
        </>
    );
};

export default AdminNav;

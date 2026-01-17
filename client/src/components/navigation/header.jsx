import { Search, Bell, HelpCircle, Sun, Moon, Gift, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import CenterModal from "../modals/center-modal";
import SearchModal from "../modals/search-modal";

const Header = () => {
    const [isDark, setIsDark] = useState(true);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notificationVisible, setNotificationVisible] = useState(false);
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const helpUrl = "https://docs.torqen.com/help";

    useEffect(() => {
        if (notificationOpen) {
            setNotificationVisible(true);
        } else {
            setNotificationVisible(false);
        }
    }, [notificationOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchModalOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const notifications = [
        { id: 1, type: "success", title: "Server Created", message: "Production Server is now online", time: "2m ago", read: false },
        { id: 2, type: "info", title: "Daily Reward", message: "You earned 50 TQN coins", time: "1h ago", read: false },
        { id: 3, type: "warning", title: "Maintenance Soon", message: "Scheduled maintenance in 2 hours", time: "3h ago", read: true },
    ];

    return (
        <header className="h-14 border-b border-white/10 flex items-center justify-between px-6" style={{ backgroundColor: "#18181b" }}>
            <div className="flex items-center gap-4 flex-1">
                <button 
                    onClick={() => setSearchModalOpen(true)}
                    className="relative max-w-xs w-full text-left"
                >
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    <div className="w-full pl-8 pr-14 py-1.5 text-xs rounded-md border border-white/10 bg-white/5 text-white/40 focus:outline-none focus:border-white/20 transition-colors duration-200 hover:border-white/20">
                        Search...
                    </div>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                        <kbd className="px-1 py-0.5 text-[9px] rounded border border-white/10 bg-white/5 text-white/40">
                            ⌘
                        </kbd>
                        <kbd className="px-1 py-0.5 text-[9px] rounded border border-white/10 bg-white/5 text-white/40">
                            K
                        </kbd>
                    </div>
                </button>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5 border border-white/10 p-0.5" style={{ borderRadius: "6px" }}>
                    <button 
                        onClick={() => setIsDark(true)}
                        className={`p-1 transition-colors duration-200 ${isDark ? 'text-white' : 'text-white/40'}`}
                        style={isDark ? { backgroundColor: "#27272a", borderRadius: "4px" } : {}}
                    >
                        <Moon size={13} />
                    </button>
                    <button 
                        onClick={() => setIsDark(false)}
                        className={`p-1 transition-colors duration-200 ${!isDark ? 'text-white' : 'text-white/40'}`}
                        style={!isDark ? { backgroundColor: "#27272a", borderRadius: "4px" } : {}}
                    >
                        <Sun size={13} />
                    </button>
                </div>
                <button 
                    onClick={() => setHelpModalOpen(true)}
                    className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors duration-200"
                >
                    <HelpCircle size={18} />
                </button>
                <div className="relative">
                    <button 
                        onClick={() => setNotificationOpen(!notificationOpen)}
                        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors duration-200 relative"
                    >
                        <Bell size={18} />
                        {notifications.some(n => !n.read) && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: "#EF4444" }}></span>
                        )}
                    </button>

                    {notificationOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setNotificationOpen(false)}
                            />
                            <div 
                                className={`absolute top-full right-0 mt-2 z-50 w-80 rounded-lg border border-white/10 overflow-hidden transition-all duration-200 ${
                                    notificationVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                                }`}
                                style={{ backgroundColor: "#18181b" }}
                            >
                                <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-xs font-semibold text-white">Notifications</h3>
                                    <button className="text-xs text-white/50 hover:text-white transition-colors duration-200">
                                        Mark all read
                                    </button>
                                </div>

                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center">
                                            <p className="text-xs text-white/50">No notifications</p>
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <button
                                                key={notification.id}
                                                className={`w-full px-3 py-2 border-b border-white/10 hover:bg-white/5 transition-colors duration-200 text-left ${
                                                    !notification.read ? 'bg-white/5' : ''
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h4 className="text-xs font-medium text-white truncate">{notification.title}</h4>
                                                    {!notification.read && (
                                                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: "#14b8a6" }}></span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-white/60 mb-1">{notification.message}</p>
                                                <span className="text-[10px] text-white/40">{notification.time}</span>
                                            </button>
                                        ))
                                    )}
                                </div>

                                <div className="p-1.5 border-t border-white/10">
                                    <button className="w-full text-center text-xs font-medium text-white/60 hover:text-white py-1.5 rounded-lg hover:bg-white/5 transition-colors duration-200">
                                        View all
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <CenterModal
                isOpen={helpModalOpen}
                onClose={() => setHelpModalOpen(false)}
                maxWidth="max-w-md"
            >
                <div className="p-6 pb-4">
                    <h2 className="text-lg font-semibold text-white mb-4">External Redirect</h2>

                    <p className="text-sm text-white/60 mb-4">
                        You're about to be redirected outside the dashboard to the following URL:
                    </p>

                    <div className="p-3 rounded-lg border border-white/10 bg-white/5 mb-6">
                        <p className="text-xs text-white/70 break-all font-mono">{helpUrl}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                        <button
                            onClick={() => setHelpModalOpen(false)}
                            className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white rounded-lg border border-white/10 hover:border-white/20 transition-colors duration-200 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                window.open(helpUrl, '_blank');
                                setHelpModalOpen(false);
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
                            style={{ backgroundColor: "#14b8a6", color: "#18181b" }}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </CenterModal>

            <SearchModal 
                isOpen={searchModalOpen}
                onClose={() => setSearchModalOpen(false)}
            />
        </header>
    );
};

export default Header;




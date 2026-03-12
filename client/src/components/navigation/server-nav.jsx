import { Link, useLocation, useParams } from "react-router-dom";
import { 
    LayoutDashboard, 
    FolderOpen, 
    Database, 
    Calendar, 
    Users, 
    Archive, 
    Network, 
    Power, 
    Settings, 
    ClipboardClock, 
    Undo2, 
    Sun,
    Moon,
    Bell,
    ChevronDown,
    HardDrive
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/auth-context.jsx";
import { Button } from "@/components/ui/button";

export default function ServerNav() {
    const location = useLocation();
    const params = useParams();
    const serverId = params?.id;
    const { user, balance, currencyName } = useAuth();
    const [isDark, setIsDark] = useState(false);

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

    const isActive = (path) => location.pathname === path;

    return (
        <header className="w-full h-16 bg-surface-light border-b border-surface-lighter flex items-center justify-between px-16 sticky top-0 z-50">
            {/* Left: Branding & Team */}
            <div className="flex items-center gap-6">
                <Link to="/app/home" className="flex items-center">
                    <img src="/Logo-dark.png" alt="Torqen" className="h-7" />
                </Link>
                
                <span className="text-brand/20 font-light text-xl">/</span>
                
                <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-surface-lighter transition-colors cursor-pointer group border border-transparent hover:border-surface-lighter">
                    <span className="text-sm font-medium text-brand/70 group-hover:text-brand">Personal Instance</span>
                    <ChevronDown size={14} className="text-brand/40 group-hover:text-brand" />
                </button>
            </div>

            {/* Right: Server Nav, Exit, Utils, Profile */}
            <div className="flex-1 flex items-center justify-end gap-2">
                {/* Server Specific Navigation */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[50%] lg:max-w-none">
                    <Link to="/app/home" className="pr-2 mr-2 border-r border-surface-lighter">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-brand/40 hover:text-brand hover:bg-surface-lighter transition-colors cursor-pointer gap-2 font-bold text-[12px]"
                        >
                            <Undo2 size={14} />
                            Exit
                        </Button>
                    </Link>

                    {navLinks.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link key={item.path} to={item.path}>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer group ${
                                    active ? "bg-white border border-surface-lighter shadow-[0_1px_2px_rgba(0,0,0,0.02)]" : "hover:bg-surface-lighter"
                                }`}>
                                    <Icon size={14} className={active ? "text-brand" : "text-brand/40 group-hover:text-brand/70"} />
                                    <span className={`text-[12px] font-bold whitespace-nowrap ${
                                        active ? "text-brand" : "text-brand/50 group-hover:text-brand/70"
                                    }`}>
                                        {item.label}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="h-8 w-px bg-surface-lighter mx-2 flex-shrink-0" />

                {/* Utils & Profile */}
                <div className="flex items-center gap-4 ml-2 flex-shrink-0">
                    <div className="bg-white px-3 py-1 rounded-full border border-surface-lighter text-[10px] font-bold text-brand/70 uppercase tracking-wider">
                        {balance} {currencyName}
                    </div>

                    <button 
                        onClick={() => setIsDark(!isDark)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-brand/40 hover:text-brand cursor-pointer border border-transparent hover:border-surface-lighter"
                    >
                        {isDark ? <Moon size={16} /> : <Sun size={16} />}
                    </button>

                    <div className="flex items-center gap-3 pl-2 border-l border-surface-lighter">
                        <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
                            {(user?.username?.[0] || user?.email?.[0] || "U").toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

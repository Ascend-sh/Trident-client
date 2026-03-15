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
} from "lucide-react";

export default function ServerNav() {
    const location = useLocation();
    const params = useParams();
    const identifier = params?.identifier;

    const base = identifier ? `/app/server/${identifier}` : "/app/server";

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
        <nav className="flex items-center gap-1 mb-8 overflow-x-auto no-scrollbar">
            {navLinks.map((item) => {
                const active = isActive(item.path);
                return (
                    <Link key={item.path} to={item.path} className="relative">
                        <div className={`flex items-center gap-2 px-4 py-3 transition-all cursor-pointer group`}>
                            <span className={`text-[11px] font-bold uppercase tracking-widest whitespace-nowrap ${
                                active ? "text-brand" : "text-brand/40 group-hover:text-brand/70"
                            }`}>
                                {item.label}
                            </span>
                        </div>
                        {active && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand rounded-full" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

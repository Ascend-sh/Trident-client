import { Link, useLocation, useParams } from "react-router-dom";
import { 
    LayoutDashboard, 
    FolderOpen, 
    Users, 
    Archive, 
    ShieldCheck, 
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
        { path: `${base}/users`, icon: Users, label: "Players" },
        { path: `${base}/backups`, icon: Archive, label: "Backups" },
        { path: `${base}/access`, icon: ShieldCheck, label: "Access" },
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

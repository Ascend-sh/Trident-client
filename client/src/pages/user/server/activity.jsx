import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ServerNav from "../../../components/navigation/server-nav";

export default function Activity() {
    const { identifier } = useParams();
    const [serverInfo, setServerInfo] = useState(null);

    useEffect(() => {
        if (!identifier) return;
        fetch(`/api/v1/client/servers`, { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                const found = (data?.servers || []).find(s => 
                    String(s.identifier || '').toLowerCase() === String(identifier || '').toLowerCase()
                );
                if (found) setServerInfo(found);
            })
            .catch(err => console.error("Failed to fetch server info:", err));
    }, [identifier]);

    return (
        <div className="bg-surface px-16 py-10">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-sm bg-surface-light border border-surface-lighter flex items-center justify-center overflow-hidden shrink-0">
                        <img 
                            src="/defaulticon.webp" 
                            alt="Server Icon" 
                            className="w-full h-full object-cover opacity-80"
                        />
                    </div>
                    <div>
                        <h1 className="text-[20px] font-bold text-brand tracking-tight">
                            {serverInfo?.name || 'Loading Instance...'}
                        </h1>
                        <p className="text-[12px] font-bold text-brand/30 uppercase tracking-[0.1em] mt-1">
                            View instance audit logs
                        </p>
                    </div>
                </div>
            </div>

            <ServerNav />

            <div className="bg-surface-light border border-surface-lighter rounded-lg p-12 flex flex-col items-center justify-center min-h-[300px]">
                <span className="text-[12px] font-bold text-brand/40 text-center px-6 italic">
                    Activity logs are coming soon.
                </span>
            </div>
        </div>
    );
}

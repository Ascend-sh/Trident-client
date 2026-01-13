import { Box, Plus, Search, Activity, HardDrive, Cpu, SlidersHorizontal, Pencil, Gift, MessageCircle, Check } from "lucide-react";
import { useState, useEffect } from "react";
import CenterModal from "../../components/modals/center-modal";
import { useAuth } from "../../context/auth-context.jsx";

const API_BASE = "/api/v1/client";

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include"
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = typeof data === "string" ? data : data?.error || data?.message || "request_failed";
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default function Servers() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createStep, setCreateStep] = useState(1);
    const { user } = useAuth();
    const [serverData, setServerData] = useState({
        name: "",
        location: null,
        software: null
    });
    const [locations, setLocations] = useState([]);
    const [nests, setNests] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [loadingNests, setLoadingNests] = useState(false);

    const availableEggs = nests.flatMap(nest =>
        (nest.eggs || []).map(egg => ({
            ...egg,
            nestId: nest.id,
            nestName: nest.name
        }))
    );

    useEffect(() => {
        if (isCreateModalOpen && createStep === 2 && locations.length === 0) {
            setLoadingLocations(true);
            request('/locations')
                .then((res) => {
                    setLocations(res?.locations || []);
                })
                .catch((err) => {
                    console.error('Failed to fetch locations:', err);
                    setLocations([]);
                })
                .finally(() => setLoadingLocations(false));
        }
    }, [isCreateModalOpen, createStep, locations.length]);

    useEffect(() => {
        if (isCreateModalOpen && createStep === 3 && nests.length === 0) {
            setLoadingNests(true);
            request('/nests')
                .then((res) => {
                    setNests(res?.nests || []);
                })
                .catch((err) => {
                    console.error('Failed to fetch nests:', err);
                    setNests([]);
                })
                .finally(() => setLoadingNests(false));
        }
    }, [isCreateModalOpen, createStep, nests.length]);

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setCreateStep(1);
        setServerData({ name: "", location: null, software: null });
        setLocations([]);
        setNests([]);
    };

    const handleNext = () => {
        if (createStep < 4) setCreateStep(createStep + 1);
    };

    const handleBack = () => {
        if (createStep > 1) setCreateStep(createStep - 1);
    };
    
    const servers = [];
    
    // Active state placeholder (not in use for now)
    // const servers = [
    //     { id: 1, name: "Production Server", uid: "SRV-001-PROD", software: "Minecraft", status: "online", cpu: "45%", ram: "2.4GB / 8GB", uptime: "15 days" },
    //     { id: 2, name: "Development Server", uid: "SRV-002-DEV", software: "Pterodactyl", status: "online", cpu: "23%", ram: "1.2GB / 4GB", uptime: "7 days" },
    //     { id: 3, name: "Testing Server", uid: "SRV-003-TEST", software: "Node.js", status: "offline", cpu: "0%", ram: "0GB / 4GB", uptime: "0 days" },
    // ];

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: "#091416" }}>
            <div className="mb-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="text-xl font-semibold text-white mb-1">Welcome back, {user?.username || "User"}</h1>
                        <p className="text-xs text-white/60">Manage and monitor your servers</p>
                    </div>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-black rounded-lg transition-all duration-200 hover:opacity-90" 
                        style={{ backgroundColor: "#ADE5DA" }}
                    >
                        <Plus size={14} />
                        Create Server
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <div className="p-3 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <p className="text-xs text-white/60 mb-1">Total Servers</p>
                    <p className="text-xl font-semibold text-white">{servers.length}</p>
                </div>

                <div className="p-3 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <p className="text-xs text-white/60 mb-1">Online</p>
                    <p className="text-xl font-semibold text-white">{servers.filter(s => s.status === 'online').length}</p>
                </div>

                <div className="p-3 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <p className="text-xs text-white/60 mb-1">Offline</p>
                    <p className="text-xl font-semibold text-white">{servers.filter(s => s.status === 'offline').length}</p>
                </div>

                <div className="p-3 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <p className="text-xs text-white/60 mb-1">Balance</p>
                    <p className="text-xl font-semibold text-white">{user?.balance || 0} TQN</p>
                </div>
            </div>

            <div className="border border-white/10 rounded-lg overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">Your Servers</h2>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search servers..."
                                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 transition-colors duration-200"
                            />
                        </div>
                        <button className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors duration-200">
                            <SlidersHorizontal size={14} />
                        </button>
                    </div>
                </div>

                {servers.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-white/30 mx-auto mb-4">
                            <path d="M16.5 7.5h-9v9h9v-9Z" />
                            <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 0 1 9 3v.75h2.25V3a.75.75 0 0 1 1.5 0v.75H15V3a.75.75 0 0 1 1.5 0v.75h.75a3 3 0 0 1 3 3v.75H21A.75.75 0 0 1 21 9h-.75v2.25H21a.75.75 0 0 1 0 1.5h-.75V15H21a.75.75 0 0 1 0 1.5h-.75v.75a3 3 0 0 1-3 3h-.75V21a.75.75 0 0 1-1.5 0v-.75h-2.25V21a.75.75 0 0 1-1.5 0v-.75H9V21a.75.75 0 0 1-1.5 0v-.75h-.75a3 3 0 0 1-3-3v-.75H3A.75.75 0 0 1 3 15h.75v-2.25H3a.75.75 0 0 1 0-1.5h.75V9H3a.75.75 0 0 1 0-1.5h.75v-.75a3 3 0 0 1 3-3h.75V3a.75.75 0 0 1 .75-.75ZM6 6.75A.75.75 0 0 1 6.75 6h10.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V6.75Z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-sm font-medium text-white/50 mb-2">No Active Servers</h3>
                        <p className="text-xs text-white/40 max-w-sm mx-auto">
                            You don't have any servers on your account yet
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left px-3 py-2 text-[11px] font-medium text-white/50 uppercase tracking-wider">Server</th>
                                    <th className="text-left px-3 py-2 text-[11px] font-medium text-white/50 uppercase tracking-wider">Software</th>
                                    <th className="text-left px-3 py-2 text-[11px] font-medium text-white/50 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-3 py-2 text-[11px] font-medium text-white/50 uppercase tracking-wider">Resources</th>
                                    <th className="text-right px-3 py-2 text-[11px] font-medium text-white/50 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {servers.map((server) => (
                                    <tr key={server.id} className="hover:bg-white/5 transition-colors duration-200">
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/10">
                                                    <Box size={16} className="text-white/60" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-white mb-0.5">{server.name}</h3>
                                                    <p className="text-[11px] text-white/50">{server.uid}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="text-xs text-white/70">{server.software}</span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                                server.status === 'online' 
                                                    ? 'bg-green-500/20 text-green-400' 
                                                    : 'bg-red-500/20 text-red-400'
                                            }`}>
                                                {server.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] text-white/50">CPU</span>
                                                    <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: server.cpu, backgroundColor: "#ADE5DA" }}></div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] text-white/50">RAM</span>
                                                    <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: `${(parseFloat(server.ram.split('/')[0]) / parseFloat(server.ram.split('/')[1])) * 100}%`, backgroundColor: "#ADE5DA" }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="px-3 py-1.5 text-xs font-medium text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors duration-200">
                                                    Edit
                                                </button>
                                                <button className="px-3 py-1.5 text-xs font-medium text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors duration-200">
                                                    Manage
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                <div className="p-4 rounded-lg border border-white/10 overflow-hidden relative">
                    <div 
                        className="absolute inset-0 bg-cover bg-center" 
                        style={{ backgroundImage: "url('/Dailybg.webp')" }}
                    ></div>
                    <div className="absolute inset-0 bg-black/90"></div>
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Gift size={24} style={{ color: "#ADE5DA" }} />
                            <div>
                                <h3 className="text-sm font-semibold text-white mb-0.5">Daily Rewards</h3>
                                <p className="text-xs text-white/50">Claim your daily TQN coins</p>
                            </div>
                        </div>
                        <button className="px-3 py-1.5 text-xs font-medium text-black rounded-lg transition-all duration-200 hover:opacity-90" style={{ backgroundColor: "#ADE5DA" }}>
                            Claim Now
                        </button>
                    </div>
                </div>

                <div className="p-4 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(88, 101, 242, 0.15)" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white mb-0.5">Discord Community</h3>
                                <p className="text-xs text-white/50">Join for discussion and support</p>
                            </div>
                        </div>
                        <button className="px-3 py-1.5 text-xs font-medium text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors duration-200">
                            Join Discord
                        </button>
                    </div>
                </div>
            </div>

            <CenterModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModal}
                title="Create Server"
                maxWidth="max-w-2xl"
            >
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex items-center flex-1">
                                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-all duration-200 ${
                                    step < createStep 
                                        ? 'text-black' 
                                        : step === createStep 
                                        ? 'text-black' 
                                        : 'bg-white/10 text-white/50'
                                }`}
                                style={step <= createStep ? { backgroundColor: "#ADE5DA" } : {}}
                                >
                                    {step < createStep ? <Check size={14} /> : step}
                                </div>
                                {step < 4 && (
                                    <div className={`flex-1 h-0.5 mx-2 transition-all duration-200 ${
                                        step < createStep ? '' : 'bg-white/10'
                                    }`}
                                    style={step < createStep ? { backgroundColor: "#ADE5DA" } : {}}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-white/50">
                        Step {createStep} of 4 - {
                            createStep === 1 ? 'Server Details' :
                            createStep === 2 ? 'Choose Location' :
                            createStep === 3 ? 'Select Software' :
                            'Review & Confirm'
                        }
                    </p>
                </div>

                {createStep === 1 && (
                    <div key="step-1" className="space-y-4 transition-all duration-300 ease-out animate-[fadeIn_0.3s_ease-out]">
                        <div>
                            <label className="block text-xs font-medium text-white/70 mb-2">Server Name</label>
                            <input
                                type="text"
                                value={serverData.name}
                                onChange={(e) => setServerData({ ...serverData, name: e.target.value })}
                                placeholder="e.g., My Awesome Server"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 transition-colors duration-200"
                            />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-4">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-xs font-medium text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!serverData.name}
                                className="px-4 py-2 text-xs font-medium text-black rounded-lg transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: "#ADE5DA" }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {createStep === 2 && (
                    <div key="step-2" className="space-y-4 transition-all duration-300 ease-out animate-[fadeIn_0.3s_ease-out]">
                        <p className="text-xs text-white/70">Select a location for your server</p>
                        {loadingLocations ? (
                            <div className="p-8 text-center">
                                <svg className="animate-spin h-8 w-8 mx-auto text-white/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-xs text-white/50 mt-3">Loading locations...</p>
                            </div>
                        ) : locations.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-xs text-white/50">No locations available</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {locations.map((location) => (
                                    <button
                                        key={location.id}
                                        onClick={() => setServerData({ ...serverData, location: location })}
                                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                                            serverData.location?.id === location.id
                                                ? 'bg-white/10'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                        style={serverData.location?.id === location.id ? { borderColor: "#ADE5DA" } : {}}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <img 
                                                src={`https://flagsapi.com/${location.shortCode}/flat/64.png`} 
                                                alt={location.shortCode} 
                                                className="w-7 h-5 rounded object-cover" 
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                            <h3 className="text-sm font-medium text-white">{location.description || location.shortCode}</h3>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center justify-end gap-2 pt-4">
                            <button
                                onClick={handleBack}
                                className="px-4 py-2 text-xs font-medium text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors duration-200"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!serverData.location}
                                className="px-4 py-2 text-xs font-medium text-black rounded-lg transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: "#ADE5DA" }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {createStep === 3 && (
                    <div key="step-3" className="space-y-4 transition-all duration-300 ease-out animate-[fadeIn_0.3s_ease-out]">
                        <p className="text-xs text-white/70">Choose server software</p>
                        {loadingNests ? (
                            <div className="p-8 text-center">
                                <svg className="animate-spin h-8 w-8 mx-auto text-white/40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-xs text-white/50 mt-3">Loading software options...</p>
                            </div>
                        ) : availableEggs.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-xs text-white/50">No eggs available</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {availableEggs.map((egg) => (
                                    <button
                                        key={egg.id}
                                        onClick={() => setServerData({ ...serverData, software: egg })}
                                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                                            serverData.software?.id === egg.id
                                                ? 'bg-white/10'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                        style={serverData.software?.id === egg.id ? { borderColor: "#ADE5DA" } : {}}
                                    >
                                        <div>
                                            <h3 className="text-sm font-medium text-white">{egg.name}</h3>
                                            <p className="text-xs text-white/50">{egg.nestName}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center justify-end gap-2 pt-4">
                            <button
                                onClick={handleBack}
                                className="px-4 py-2 text-xs font-medium text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors duration-200"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!serverData.software}
                                className="px-4 py-2 text-xs font-medium text-black rounded-lg transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: "#ADE5DA" }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {createStep === 4 && (
                    <div key="step-4" className="space-y-4 transition-all duration-300 ease-out animate-[fadeIn_0.3s_ease-out]">
                        <p className="text-xs text-white/70">Review your server configuration</p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between py-2.5 border-b border-white/10">
                                <span className="text-xs text-white/50">Server Name</span>
                                <span className="text-sm font-medium text-white">{serverData.name}</span>
                            </div>
                            <div className="flex items-center justify-between py-2.5 border-b border-white/10">
                                <span className="text-xs text-white/50">Location</span>
                                <div className="flex items-center gap-2">
                                    <img 
                                        src={`https://flagsapi.com/${serverData.location?.shortCode}/flat/64.png`} 
                                        alt={serverData.location?.shortCode} 
                                        className="w-5 h-4 rounded object-cover" 
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                    <span className="text-sm font-medium text-white">{serverData.location?.description || serverData.location?.shortCode}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-2.5">
                                <span className="text-xs text-white/50">Software</span>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-white">{serverData.software?.name}</p>
                                    <p className="text-xs text-white/40">{serverData.software?.nestName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-4">
                            <button
                                onClick={handleBack}
                                className="px-4 py-2 text-xs font-medium text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors duration-200"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-xs font-medium text-black rounded-lg transition-all duration-200 hover:opacity-90"
                                style={{ backgroundColor: "#ADE5DA" }}
                            >
                                Create Server
                            </button>
                        </div>
                    </div>
                )}
            </CenterModal>
        </div>
    );
}

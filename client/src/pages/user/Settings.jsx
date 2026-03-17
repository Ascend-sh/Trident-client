import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    User as UserIcon,
    Mail,
    Save,
    Activity,
    Pencil
} from "lucide-react";
import { useAuth } from "@/context/auth-context.jsx";
import { Button } from "@/components/ui/button";
import { 
    Card, 
    CardHeader, 
    CardTitle, 
    CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const Settings = () => {
    const { user, refresh } = useAuth();
    
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [recentActivity, setRecentActivity] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [isEditingUsername, setIsEditingUsername] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                username: user.username || "",
                email: user.email || ""
            }));
        }
    }, [user]);

    const fetchActivity = async () => {
        if (!user?.id) return;
        setActivityLoading(true);
        try {
            const res = await request('/recent-activity');
            setRecentActivity(Array.isArray(res?.items) ? res.items : []);
        } catch {
            setRecentActivity([]);
        } finally {
            setActivityLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity();
    }, [user?.id]);
    
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (saveStatus) setSaveStatus(null);
    };

    const handleSave = async () => {
        if (formData.password && formData.password !== formData.confirmPassword) {
            setSaveStatus('error');
            setErrorMessage("Passwords do not match");
            return;
        }

        setIsSaving(true);
        setSaveStatus(null);
        setErrorMessage("");

        try {
            const body = {};
            if (formData.username && formData.username !== user?.username) body.username = formData.username;
            if (formData.email && formData.email !== user?.email) body.email = formData.email;
            if (formData.password) body.password = formData.password;

            if (Object.keys(body).length === 0) {
                setIsSaving(false);
                return;
            }

            await request('/account', { method: 'PATCH', body });

            await refresh();
            setSaveStatus('success');
            setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
            setIsEditingUsername(false);
            fetchActivity();
            
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            setSaveStatus('error');
            setErrorMessage(error.message || "An error occurred while saving");
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = 
        (formData.username !== user?.username && formData.username.trim() !== "") || 
        (formData.email !== user?.email && formData.email.trim() !== "") || 
        (formData.password !== "");

    const avatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${formData.username || 'user'}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    return (
        <div className="bg-surface px-16 py-10">
            <div className="flex items-center justify-between gap-4 mb-8">
                <h1 className="text-[20px] font-bold text-brand tracking-tight">Account Settings</h1>
                <div className="flex items-center gap-4">
                    <AnimatePresence mode="wait">
                        {saveStatus === 'error' && (
                            <motion.div 
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center gap-2 text-red-500 font-bold text-[10px] uppercase tracking-tight"
                            >
                                <AlertCircle size={12} />
                                {errorMessage}
                            </motion.div>
                        )}
                        {saveStatus === 'success' && (
                            <motion.div 
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center gap-2 text-green-500 font-bold text-[10px] uppercase tracking-tight"
                            >
                                <CheckCircle2 size={12} />
                                Synchronized
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <AnimatePresence>
                        {hasChanges && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, x: 10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95, x: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="h-8 px-4 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-none"
                                >
                                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <><Save size={12} /> Update Account</>}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="space-y-6">
                <Card className="bg-transparent border-surface-lighter shadow-none font-sans rounded-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-6 px-4 pb-6 border-b border-surface-lighter">
                        <div className="w-16 h-16 rounded-xl bg-white border border-surface-lighter overflow-hidden p-0.5">
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-[10px]" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                {isEditingUsername ? (
                                    <Input 
                                        autoFocus
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        onBlur={() => !hasChanges && setIsEditingUsername(false)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSave();
                                            if (e.key === 'Escape') setIsEditingUsername(false);
                                        }}
                                        className="h-7 w-48 bg-surface-light border-surface-lighter text-[16px] font-bold text-brand uppercase focus-visible:ring-brand/5 focus-visible:border-brand/20 rounded-md"
                                    />
                                ) : (
                                    <div 
                                        className="group flex items-center gap-2 cursor-pointer transition-all"
                                        onClick={() => setIsEditingUsername(true)}
                                    >
                                        <CardTitle className="text-[16px] font-bold text-brand uppercase tracking-tight">
                                            {formData.username}
                                        </CardTitle>
                                        <Pencil size={12} className="text-brand/20 group-hover:text-brand/60 transition-colors opacity-0 group-hover:opacity-100" />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-[10px] font-bold text-brand/40 uppercase tracking-widest lowercase">
                                    email: {formData.email}
                                </span>
                                <span className="text-brand/40">•</span>
                                <span className="text-[10px] font-bold text-brand/40 uppercase tracking-widest">
                                    role: {user?.isAdmin ? "Administrator" : "Standard Operator"}
                                </span>
                                <span className="text-brand/40">•</span>
                                <span className="text-[10px] font-bold text-brand/40 uppercase tracking-widest">
                                    Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pt-6 pb-2 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-brand/40 uppercase tracking-widest px-1">New Password</Label>
                                <Input 
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="CRYPTOGRAPHIC_KEY_ENTRY"
                                    className="h-9 bg-surface-light border-surface-lighter text-[11px] font-bold text-brand placeholder:text-brand/40 focus-visible:ring-brand/5 focus-visible:border-brand/20 rounded-md"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-brand/40 uppercase tracking-widest px-1">Verify Password</Label>
                                <Input 
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="VERIFY_KEY_INTEGRITY"
                                    className="h-9 bg-surface-light border-surface-lighter text-[11px] font-bold text-brand placeholder:text-brand/40 focus-visible:ring-brand/5 focus-visible:border-brand/20 rounded-md"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-surface-lighter flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[14px] font-bold text-brand/80 uppercase tracking-tight">Two-Factor Authentication</span>
                                <span className="text-[11px] font-bold text-brand/40 uppercase tracking-tight">Multi-factor enforcement via Google Authenticator, Authy, or Microsoft</span>
                            </div>
                            <Button 
                                className="h-8 px-4 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest border-0 shadow-none cursor-pointer"
                            >
                                Enable MFA
                            </Button>
                        </div>

                        <div className="pt-6 border-t border-surface-lighter flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[14px] font-bold text-brand/80 uppercase tracking-tight">Account Lifecycle</span>
                                <span className="text-[11px] font-bold text-brand/40 uppercase tracking-tight">Permanent instance decommissioning or session termination</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="ghost" 
                                    className="h-8 px-4 text-brand/70 hover:text-brand transition-all rounded-md font-bold text-[10px] uppercase tracking-widest border border-brand/20 shadow-none cursor-pointer"
                                >
                                    Deactivate
                                </Button>
                                <Button 
                                    className="h-8 px-4 bg-red-500 text-white hover:bg-red-600 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest border-0 shadow-none cursor-pointer"
                                    onClick={() => {
                                        if (window.confirm("ARE_YOU_SURE? This action is irreversible.")) {
                                            console.log("ACCOUNT_TERMINATION_INITIATED");
                                        }
                                    }}
                                >
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-0">

                    <div className="bg-surface-light border border-surface-lighter rounded-xl px-[2px] pb-[2px] pt-0">
                        <div className="w-full">
                            <div className="grid grid-cols-[1.5fr_1fr_1fr] px-6 py-3">
                                <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em]">Activity Event</span>
                                <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em] text-center">Address</span>
                                <span className="text-[10px] font-bold text-brand/60 uppercase tracking-[0.2em] text-right">Relative Time</span>
                            </div>
                            <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col min-h-[210px]">
                                {activityLoading && recentActivity.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center animate-pulse gap-3">
                                        <Activity size={24} className="text-brand/10 mb-2" />
                                        <span className="text-[10px] font-bold text-brand/20 uppercase tracking-[0.2em]">Querying Security Audit Logs...</span>
                                    </div>
                                ) : recentActivity.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                                        <span className="text-[12px] font-bold text-brand/40 italic">No security incidents detected.</span>
                                    </div>
                                ) : (
                                    recentActivity.map((item, idx) => (
                                        <div 
                                            key={idx} 
                                            className="grid grid-cols-[1.5fr_1fr_1fr] px-6 py-4 hover:bg-surface-light/50 transition-colors group border-b border-surface-lighter last:border-0 items-center"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-bold text-brand uppercase tracking-tight">
                                                    {item.event === 'login' ? 'Authentication Success' : 
                                                     item.event === 'logout' ? 'Session Termination' : 
                                                     item.event === 'server_created' ? 'Instance Deployed' : 
                                                     item.event === 'server_deleted' ? 'Instance Decommissioned' : 'Identity Updated'}
                                                </span>
                                                <span className="text-[9px] font-bold text-brand/20 uppercase tracking-tighter">{item.event}</span>
                                            </div>
                                            <div className="flex items-center justify-center">
                                                <span className="text-[11px] font-bold text-brand/60 font-mono tracking-tighter">{item.ip || 'INTERNAL'}</span>
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <span className="text-[11px] font-bold text-brand/40 uppercase tracking-tight">{item.relative}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;

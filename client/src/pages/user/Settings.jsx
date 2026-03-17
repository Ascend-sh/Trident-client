import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    User,
    Mail,
    Lock,
    Save,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Loader2
} from "lucide-react";
import { useAuth } from "@/context/auth-context.jsx";
import { Button } from "@/components/ui/button";

const API_BASE = "/api/v1/client";

const Settings = () => {
    const { user, refresh } = useAuth();
    
    const [formData, setFormData] = useState({
        username: user?.username || "",
        email: user?.email || "",
        password: "",
        confirmPassword: ""
    });
    
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setSaveStatus(null);
    };

    const handleSave = async () => {
        // Validation
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

            const response = await fetch(`${API_BASE}/account`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                credentials: "include"
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to update profile");
            }

            await refresh(); // Refresh user context
            setSaveStatus('success');
            setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
            
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error("Save error:", error);
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

    return (
        <div className="bg-surface px-8 lg:px-16 py-10 min-h-[calc(100vh-64px)] overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                
                {/* Header Sequence */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10 lg:mb-16"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-[20px] font-bold text-brand tracking-tight">Account Settings</h1>
                            <p className="text-[11px] font-bold text-brand/40 uppercase tracking-widest mt-1">Manage your profile and security</p>
                        </div>
                        
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/5 border border-brand/10">
                            <ShieldCheck size={14} className="text-brand" />
                            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Protected Area</span>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Profile Section */}
                        <motion.section 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <h2 className="text-[16px] font-bold text-brand mb-4">Profile Information</h2>
                            
                            <div className="bg-transparent border border-surface-lighter rounded-lg p-6 space-y-6">
                                
                                <div>
                                    <label className="text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-3 block">Username</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/40">
                                            <User size={16} />
                                        </span>
                                        <input 
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            placeholder="Your username"
                                            className="w-full h-12 pl-12 pr-4 bg-surface-light rounded-lg text-[14px] font-bold transition-all duration-200 focus:outline-none border border-surface-lighter text-brand focus:border-brand/30 hover:border-brand/20"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-3 block">Email Address</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/40">
                                            <Mail size={16} />
                                        </span>
                                        <input 
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Your email address"
                                            className="w-full h-12 pl-12 pr-4 bg-surface-light rounded-lg text-[14px] font-bold transition-all duration-200 focus:outline-none border border-surface-lighter text-brand focus:border-brand/30 hover:border-brand/20"
                                        />
                                    </div>
                                </div>

                            </div>
                        </motion.section>

                        {/* Security Section */}
                        <motion.section 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <h2 className="text-[16px] font-bold text-brand mb-4">Security Settings</h2>
                            
                            <div className="bg-transparent border border-surface-lighter rounded-lg p-6 space-y-6">
                                
                                <div>
                                    <label className="text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-3 block">New Password</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/40">
                                            <Lock size={16} />
                                        </span>
                                        <input 
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Leave blank to keep current password"
                                            className="w-full h-12 pl-12 pr-4 bg-surface-light rounded-lg text-[14px] font-bold transition-all duration-200 focus:outline-none border border-surface-lighter text-brand focus:border-brand/30 hover:border-brand/20"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-3 block">Confirm New Password</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/40">
                                            <Lock size={16} />
                                        </span>
                                        <input 
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Confirm new password"
                                            className="w-full h-12 pl-12 pr-4 bg-surface-light rounded-lg text-[14px] font-bold transition-all duration-200 focus:outline-none border border-surface-lighter text-brand focus:border-brand/30 hover:border-brand/20"
                                        />
                                    </div>
                                </div>

                            </div>
                        </motion.section>

                    </div>

                    {/* Summary Sidebar */}
                    <div className="relative border-t border-surface-lighter pt-8 lg:pt-0 lg:border-t-0">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="sticky top-8 bg-transparent border border-surface-lighter rounded-lg p-6 flex flex-col"
                        >
                            <h2 className="text-[16px] font-bold text-brand mb-6">Account Overview</h2>
                            
                            <div className="space-y-4 flex-1">
                                <div className="flex items-center justify-between pb-4 border-b border-surface-lighter">
                                    <span className="text-[11px] font-bold text-brand/40 uppercase tracking-widest">Account Status</span>
                                    <span className="text-[12px] font-bold text-brand flex items-center gap-1.5">
                                        <CheckCircle2 size={14} className="text-green-500" />
                                        Active
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between pb-4 border-b border-surface-lighter">
                                    <span className="text-[11px] font-bold text-brand/40 uppercase tracking-widest">Joined</span>
                                    <span className="text-[12px] font-bold text-brand">
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between pb-4 border-b border-surface-lighter">
                                    <span className="text-[11px] font-bold text-brand/40 uppercase tracking-widest">Role</span>
                                    <span className="text-[12px] font-bold text-brand">
                                        {user?.isAdmin ? "Administrator" : "Member"}
                                    </span>
                                </div>
                            </div>

                            <AnimatePresence>
                                {saveStatus === 'error' && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2 text-red-500"
                                    >
                                        <AlertCircle size={14} />
                                        <span className="text-[11px] font-bold">{errorMessage}</span>
                                    </motion.div>
                                )}
                                
                                {saveStatus === 'success' && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-6 p-3 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2 text-green-500"
                                    >
                                        <CheckCircle2 size={14} />
                                        <span className="text-[11px] font-bold">Profile updated successfully!</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="mt-8 pt-6 border-t border-surface-lighter">
                                <Button 
                                    onClick={handleSave}
                                    disabled={!hasChanges || isSaving}
                                    className="w-full h-12 bg-brand text-surface hover:bg-brand/90 transition-all rounded-lg font-bold text-[11px] uppercase tracking-widest group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                                >
                                    {isSaving ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin" />
                                            Saving...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Save size={16} />
                                            Save Changes
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Settings;

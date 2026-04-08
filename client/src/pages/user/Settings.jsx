import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { useAuth } from "@/context/auth-context.jsx";
import { request } from "@/lib/request.js";

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
        <div className="bg-surface px-10 py-10">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">Settings</h1>
                    <p className="text-[13px] font-bold text-muted-foreground mt-2">Manage your account and security preferences</p>
                </div>
                <div className="flex items-center gap-4">
                    {saveStatus === 'error' && (
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errorMessage}</span>
                    )}
                    {saveStatus === 'success' && (
                        <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Saved</span>
                    )}
                    {hasChanges && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
                                    Saving
                                </>
                            ) : (
                                <>
                                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-10">
                <h2 className="text-[14px] font-bold text-foreground/60 tracking-tight mb-4">Profile</h2>
                <div className="border border-surface-lighter rounded-lg p-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-full bg-white border border-surface-lighter overflow-hidden shrink-0">
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                {isEditingUsername ? (
                                    <input
                                        autoFocus
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        onBlur={() => !hasChanges && setIsEditingUsername(false)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSave();
                                            if (e.key === 'Escape') setIsEditingUsername(false);
                                        }}
                                        className="h-7 w-48 px-2 bg-surface-light/50 border border-surface-lighter rounded-md text-[16px] font-bold text-foreground focus:outline-none focus:border-brand/20 transition-all"
                                    />
                                ) : (
                                    <div
                                        className="group flex items-center gap-2 cursor-pointer"
                                        onClick={() => setIsEditingUsername(true)}
                                    >
                                        <span className="text-[16px] font-bold text-foreground tracking-tight">{formData.username}</span>
                                        <HugeiconsIcon icon={PencilEdit01Icon} size={12} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[11px] font-bold text-muted-foreground">{formData.email}</span>
                                <span className="text-muted-foreground/20">·</span>
                                <span className="text-[11px] font-bold text-muted-foreground">{user?.isAdmin ? "Admin" : "Member"}</span>
                                <span className="text-muted-foreground/20">·</span>
                                <span className="text-[11px] font-bold text-muted-foreground">Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-10">
                <h2 className="text-[14px] font-bold text-foreground/60 tracking-tight mb-4">Security</h2>
                <div className="border border-surface-lighter rounded-lg p-6 space-y-6">
                    <div>
                        <p className="text-[13px] font-bold text-foreground tracking-tight">Change Password</p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Update your password to keep your account secure</p>
                    </div>
                    <div className="grid grid-cols-2 gap-5 -mt-2">
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="New password"
                            className="w-full h-9 px-3 bg-surface-light/50 border border-surface-lighter rounded-md text-[12px] font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/20 transition-all"
                        />
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm password"
                            className="w-full h-9 px-3 bg-surface-light/50 border border-surface-lighter rounded-md text-[12px] font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/20 transition-all"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[13px] font-bold text-foreground tracking-tight">Two-Factor Authentication</p>
                            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Protect your account with an authenticator app</p>
                        </div>
                        <button className="h-8 px-5 border border-surface-lighter text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer">
                            Enable
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-10">
                <h2 className="text-[14px] font-bold text-foreground/60 tracking-tight mb-4">Danger Zone</h2>
                <div className="border border-surface-lighter rounded-lg p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[13px] font-bold text-foreground tracking-tight">Deactivate Account</p>
                            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Temporarily disable your account</p>
                        </div>
                        <button className="h-8 px-5 border border-surface-lighter text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer">
                            Deactivate
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[13px] font-bold text-foreground tracking-tight">Delete Account</p>
                            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Permanently remove your account and all data</p>
                        </div>
                        <button
                            onClick={() => {
                                if (window.confirm("Are you sure? This action is irreversible.")) {
                                    console.log("Account deletion initiated");
                                }
                            }}
                            className="h-8 px-5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-md font-bold text-[10px] uppercase tracking-widest cursor-pointer"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-10">
                <h2 className="text-[14px] font-bold text-foreground/60 tracking-tight mb-4">Recent Activity</h2>
                <div className="border border-surface-lighter rounded-lg">
                    <div className="grid grid-cols-[1.5fr_1fr_1fr] px-6 py-3 border-b border-surface-lighter">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Event</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Address</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Time</span>
                    </div>

                    {activityLoading && recentActivity.length === 0 ? (
                        <div className="flex flex-col">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className={`grid grid-cols-[1.5fr_1fr_1fr] px-6 py-4 animate-pulse ${i > 0 ? 'border-t border-surface-lighter' : ''}`}>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="h-3 w-32 bg-surface-lighter rounded-md" />
                                        <div className="h-2 w-16 bg-surface-lighter rounded-md" />
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <div className="h-3 w-24 bg-surface-lighter rounded-md" />
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <div className="h-3 w-16 bg-surface-lighter rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recentActivity.length === 0 ? (
                        <div className="py-12 flex items-center justify-center">
                            <span className="text-[12px] font-bold text-muted-foreground/40">No recent activity</span>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {recentActivity.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`grid grid-cols-[1.5fr_1fr_1fr] px-6 py-4 hover:bg-surface-light/50 transition-colors ${idx > 0 ? 'border-t border-surface-lighter' : ''}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-bold text-foreground tracking-tight">
                                            {item.event === 'login' ? 'Logged in' :
                                                item.event === 'logout' ? 'Logged out' :
                                                    item.event === 'server_created' ? 'Server created' :
                                                        item.event === 'server_deleted' ? 'Server deleted' : 'Account updated'}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground/50 mt-0.5">{item.event}</span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <span className="text-[11px] font-bold text-muted-foreground font-mono">{item.ip || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <span className="text-[11px] font-bold text-muted-foreground">{item.relative}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;

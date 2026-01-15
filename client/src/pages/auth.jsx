import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register, useAuth } from "../context/auth-context.jsx";

export default function Auth() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        username: "",
    });

    const { status, refresh } = useAuth();

    useEffect(() => {
        if (status === "authenticated") {
            navigate("/app/home", { replace: true });
        }
    }, [status, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            if (isLogin) {
                await login({ email: formData.email, password: formData.password });
                await refresh();
                navigate("/app/home");
                return;
            }

            await register({ username: formData.username, email: formData.email, password: formData.password });
            setIsLogin(true);
            setFormData({ ...formData, password: "" });
            setSuccess("Account created. Please log in.");
        } catch (err) {
            setError(err?.message || "auth_failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#18181b" }}>
            <div className="w-full border-t border-b border-white/10 flex justify-center">
                <div className="flex py-3 mx-auto gap-8">
                    <div 
                        className="w-12 flex-shrink-0 -my-3" 
                        style={{ 
                            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, #27272a 10px, #27272a 11px)",
                        }}
                    />
                    <div className="w-[450px] py-8">
                    <div className="mb-6">
                        <img src="/Logo.png" alt="Torqen" className="h-12 mb-3" />
                        <p className="text-white/60 text-lg">
                            {isLogin ? "Welcome back, sign in to continue" : "Get started with Torqen"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                    {success && (
                        <div className="px-4 py-3 rounded-lg border border-white/10 bg-white/5">
                            <p className="text-sm text-white/80">{success}</p>
                        </div>
                    )}
                    {error && (
                        <div className="px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/10">
                            <p className="text-sm text-red-200">{error}</p>
                        </div>
                    )}
                    {!isLogin && (
                        <div>
                            <label className="block text-white/80 text-sm mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-opacity-100 transition-all duration-200"
                                placeholder="Enter your username"
                                required={!isLogin}
                                autoComplete="new-username"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-white/80 text-sm mb-2">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-opacity-100 transition-all duration-200"
                            placeholder="Enter your email"
                            required
                            autoComplete="new-email"
                        />
                    </div>

                    <div>
                        <label className="block text-white/80 text-sm mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-opacity-100 transition-all duration-200"
                            placeholder="Enter your password"
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    {isLogin && (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                className="text-sm text-white/60 hover:text-white/80 transition-colors duration-200 cursor-pointer"
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-200 hover:opacity-90 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ backgroundColor: "#14b8a6", color: "#18181b" }}
                    >
                        {isLoading && (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isLogin ? "Login" : "Create Account"}
                    </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-white/60 text-sm">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => {
                                    setError("");
                                    setSuccess("");
                                    setIsLogin(!isLogin);
                                }}
                                className="transition-colors duration-200 cursor-pointer"
                                style={{ color: "#14b8a6" }}
                            >
                                {isLogin ? "Create one" : "Login"}
                            </button>
                        </p>
                    </div>

                    <p className="mt-8 text-center text-white/40 text-xs">
                        By continuing, you agree to our Terms of Service and Privacy Policy
                    </p>
                    </div>
                    <div 
                        className="w-12 flex-shrink-0 -my-3" 
                        style={{ 
                            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, #27272a 10px, #27272a 11px)",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}



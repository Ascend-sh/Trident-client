import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { login, register, useAuth } from "@/context/auth-context.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, ChevronLeft, ShieldCheck } from "lucide-react";

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
            setFormData({ email: "", password: "", username: "" });
            setSuccess("Account created. Please log in.");
        } catch (err) {
            setError(err?.message || "Authentication failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-surface overflow-hidden">
            <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 py-8 relative z-10 bg-surface">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[400px] mx-auto lg:mx-0 pb-12"
                >
                    <div className={`${isLogin ? 'mb-24' : 'mb-12'} flex items-center gap-2 group -ml-1`}>
                        <img src="/Logo-dark.png" alt="Torqen" className="h-10 transition-transform duration-300" />
                    </div>

                    <div className="space-y-2 mb-10">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            {isLogin ? "Welcome back" : "Create an account"}
                        </h1>

                        <p className="text-foreground/50 text-base">
                            {isLogin 
                                ? "Enter your details to manage your servers." 
                                : "Start your high-performance gaming journey."}
                        </p>

                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="absolute opacity-0 -z-50 pointer-events-none h-0 w-0 overflow-hidden">
                            <input type="text" name="fake-username-autofill" />
                            <input type="password" name="fake-password-autofill" />
                        </div>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <Alert className="bg-red-500/5 border-red-500/10 text-red-600">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <Alert className="bg-green-500/5 border-green-500/10 text-green-600">
                                        <AlertDescription>{success}</AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-5">
                            {!isLogin && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-2"
                                >
                                    <Label htmlFor="username" className="text-brand/70 font-medium">Username</Label>
                                    <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        placeholder="yourname"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required={!isLogin}
                                        autoComplete="username-new"
                                        className="h-11 bg-surface-light border-transparent focus:border-brand/10 focus:bg-surface transition-all duration-200 ring-offset-transparent focus-visible:ring-brand/5 shadow-none"
                                    />
                                </motion.div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-foreground/70 font-medium">{isLogin ? "Email or Username" : "Email address"}</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type={isLogin ? "text" : "email"}
                                    placeholder={isLogin ? "name@example.com or username" : "name@example.com"}

                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    autoComplete="off-email"
                                    className="h-11 bg-surface-light border-transparent focus:border-brand/10 focus:bg-surface transition-all duration-200 ring-offset-transparent focus-visible:ring-brand/5 shadow-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" name="password" className="text-foreground/70 font-medium">Password</Label>
                                    {isLogin && (
                                        <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                            Forgot password?
                                        </button>
                                    )}
                                </div>

                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    autoComplete="new-password"
                                    className="h-11 bg-surface-light border-transparent focus:border-brand/10 focus:bg-surface transition-all duration-200 ring-offset-transparent focus-visible:ring-brand/5 shadow-none"
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full h-11 bg-brand text-surface hover:bg-brand/90 transition-all rounded-lg font-semibold group cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Just a moment...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    {isLogin ? "Sign In" : "Get Started"}
                                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-surface-light text-center lg:text-left">
                        <button
                            onClick={() => {
                                setError("");
                                setSuccess("");
                                setIsLogin(!isLogin);
                            }}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
                        >

                            {isLogin ? (
                                <>
                                    <span>New to Torqen?</span>
                                    <span className="font-semibold text-brand underline underline-offset-4 decoration-brand/20 group-hover:decoration-brand/100 transition-all">Create an account</span>
                                </>
                            ) : (
                                <>
                                    <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                                    <span>Back to login</span>
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>

                <div className={`mt-auto ${isLogin ? 'pt-0' : 'pt-10'} flex items-center justify-center lg:justify-start gap-6 text-[10px] text-muted-foreground uppercase tracking-widest font-bold`}>
                    <div className="flex items-center gap-1.5">
                        v0.5.0-beta
                    </div>
                    <span>&copy; {new Date().getFullYear()} Torqen. All rights reserved.</span>
                </div>

            </div>

            <div className="hidden lg:block relative overflow-hidden">
                <img 
                    src="/authpreviewimg.webp" 
                    alt="Auth Preview" 
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-brand/5 backdrop-blur-[2px]"></div>
                
                <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end z-10">
                    <div className="space-y-1">
                        <div className="h-1 w-12 bg-white/20 rounded-full"></div>
                        <div className="h-1 w-8 bg-white/10 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

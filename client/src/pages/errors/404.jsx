import { useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
            <div className="flex flex-col items-center max-w-[320px] w-full text-center">
                <div className="mb-8">
                    <h1 className="text-[64px] font-bold text-brand/5 tracking-tighter leading-none select-none">
                        404
                    </h1>
                </div>

                <div className="space-y-2 mb-10">
                    <h2 className="text-[20px] font-bold text-brand tracking-tight">
                        Page not found
                    </h2>
                    <p className="text-[13px] font-medium text-brand/40 leading-relaxed">
                        The requested coordinate does not exist or has been moved.
                    </p>
                </div>

                <Button 
                    onClick={() => navigate("/app/home")}
                    className="h-10 w-full bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-none cursor-pointer"
                >
                    <Undo2 size={12} strokeWidth={3} />
                    Back to Dashboard
                </Button>

                <div className="mt-20 pt-10 border-t border-surface-light w-full flex items-center justify-center gap-6 text-[9px] text-brand/30 uppercase tracking-widest font-bold">
                    <span>v0.5.0-beta</span>
                    <span>&copy; {new Date().getFullYear()} Torqen. All rights reserved.</span>
                </div>
            </div>
        </div>
    );
}

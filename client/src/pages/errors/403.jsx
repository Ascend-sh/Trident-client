import { useNavigate } from "react-router-dom";
import { ShieldAlert, Undo2 } from "lucide-react";

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#091416" }}>
      <div className="text-center">
        <img src="/Logo.png" alt="Torqen" className="h-16 mx-auto mb-8" />
        
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center border border-white/10 bg-white/5">
            <ShieldAlert size={48} className="text-white/40" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold mb-4" style={{ color: "#ADE5DA" }}>403</h1>
        
        <h2 className="text-2xl font-semibold text-white mb-2">Access Forbidden</h2>
        
        <p className="text-white/50 mb-8 max-w-md mx-auto">
          You don't have permission to access this page. Admin privileges are required.
        </p>
        
        <button
          onClick={() => navigate("/app/home")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90"
          style={{ backgroundColor: "#ADE5DA", color: "#091416" }}
        >
          <Undo2 size={16} />
          Return Home
        </button>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#091416" }}>
      <div className="text-center">
        <img src="/Logo.png" alt="Torqen" className="h-16 mx-auto mb-8" />
        
        <h1 className="text-8xl font-bold mb-4" style={{ color: "#ADE5DA" }}>404</h1>
        
        <h2 className="text-2xl font-semibold text-white mb-2">Page Not Found</h2>
        
        <p className="text-white/50 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <button
          onClick={() => navigate("/app/home")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={{ backgroundColor: "#ADE5DA", color: "#091416" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#98D4C9"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ADE5DA"}
        >
          <Undo2 size={16} />
          Return Home
        </button>
      </div>
    </div>
  );
}
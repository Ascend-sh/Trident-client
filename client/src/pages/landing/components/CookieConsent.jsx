import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      // Show after a small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-800 p-4 rounded-xl shadow-2xl flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Cookie className="w-5 h-5 text-[#b0f97d]" />
            <span>Cookie Policy</span>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-zinc-500 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        
        <p className="text-zinc-400 text-sm leading-relaxed">
          We use cookies to enhance your browsing experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            className="flex-1 bg-[#b0f97d] hover:bg-[#a0f06d] text-zinc-900 font-semibold py-2 px-4 rounded-lg text-sm transition transform active:scale-95 cursor-pointer"
          >
            Accept
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-2 px-4 rounded-lg text-sm border border-zinc-700 transition cursor-pointer"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

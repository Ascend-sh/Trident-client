import { useState, useEffect } from 'react';

const loadingMessages = [
  "Preparing your dashboard...",
  "Loading resources...",
  "Fetching server data...",
  "Almost there...",
  "Setting things up...",
  "Initializing components...",
  "Getting everything ready...",
  "Loading your workspace...",
  "Syncing with servers...",
  "Establishing connection...",
  "Retrieving information...",
  "Processing request...",
];

export default function GlobalLoader({ onLoadingComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message] = useState(() => loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 80);

    const fadeTimer = setTimeout(() => {
      setProgress(100);
      setIsFadingOut(true);
    }, 500);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      if (onLoadingComplete) {
        onLoadingComplete();
      }
    }, 800);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-300" 
      style={{ 
        backgroundColor: "#121212",
        opacity: isFadingOut ? 0 : 1
      }}
    >
      <img src="/Logo.png" alt="Torqen" className="h-12 mb-6" />
      
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-white/80 font-medium">{message}</p>

        <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: "#E0FE58",
            }}
          />
        </div>
      </div>
    </div>
  );
}

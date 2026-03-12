import { useState, useEffect } from 'react';

export default function GlobalLoader({ onLoadingComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 500);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      if (onLoadingComplete) {
        onLoadingComplete();
      }
    }, 800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-300 bg-surface" 
      style={{ 
        opacity: isFadingOut ? 0 : 1
      }}
    >
      <img src="/Logo.png" alt="Torqen" className="h-12 mb-8" />
      <div className="relative">
        <div className="w-12 h-12 border-3 rounded-full animate-spin" style={{ 
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderTopColor: "var(--color-brand)"
        }}></div>
      </div>
    </div>
  );
}

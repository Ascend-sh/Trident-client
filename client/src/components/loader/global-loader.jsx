import { useState, useEffect } from 'react';

export default function GlobalLoader({ onLoadingComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 600;
    const interval = 10;
    const step = 100 / (duration / interval);
    
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return Math.min(100, prev + step);
      });
    }, interval);

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, duration);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      if (onLoadingComplete) {
        onLoadingComplete();
      }
    }, duration + 300);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed top-16 inset-x-0 bottom-0 z-[40] flex flex-col items-center justify-center transition-opacity duration-300 bg-surface" 
      style={{ 
        opacity: isFadingOut ? 0 : 1
      }}
    >
      <div className="flex flex-col items-center w-full max-w-[240px]">
        <img src="/Logo-dark.png" alt="Torqen" className="h-8 mb-8" />
        
        <div className="w-full h-[2px] bg-brand/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="mt-4 text-[10px] font-bold text-brand/20 uppercase tracking-[0.2em]">
          Loading System
        </p>
      </div>
    </div>
  );
}

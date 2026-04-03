import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/use-theme';

export default function GlobalLoader({ onLoadingComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    const duration = 600;
    
    // Start progress animation on mount
    requestAnimationFrame(() => {
      setIsAnimating(true);
    });

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
        <img 
          src={isDark ? "/Logo.png" : "/Logo-dark.png"} 
          alt="Torqen" 
          className="h-8 mb-8" 
        />
        
        <div className="w-full h-[2px] bg-brand/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ width: isAnimating ? '100%' : '0%' }}
          />
        </div>
        
        <p className="mt-4 text-[10px] font-bold text-foreground/60 uppercase tracking-[0.2em]">
          Torqen v0.5.0-beta (Swell)
        </p>
      </div>
    </div>
  );
}

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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-300 bg-surface"
      style={{
        opacity: isFadingOut ? 0 : 1
      }}
    >
      <div className="flex flex-col items-center w-full max-w-[200px] gap-6">
        <img
          src={isDark ? "/Logo.png" : "/Logo-dark.png"}
          alt="Torqen"
          className="h-6 opacity-40"
        />

        <div className="w-full h-[2px] bg-brand/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand/40 transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ width: isAnimating ? '100%' : '0%' }}
          />
        </div>
      </div>
    </div>
  );
}

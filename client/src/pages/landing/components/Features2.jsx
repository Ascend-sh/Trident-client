import { useState, useEffect, useRef } from "react";
import { Package, FolderOpen, Terminal, History } from "lucide-react";
import consoleImg from '../assets/Console.webp';
import fileManagerImg from '../assets/FileManager.webp';
import modsPluginsImg from '../assets/Mod&Plugins.webp';
import versionImg from '../assets/Version.webp';

export default function Features2() {
  const [activePreview, setActivePreview] = useState("console");
  const [progress, setProgress] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(true);
  const [containerHeight, setContainerHeight] = useState(0);
  const imageRef = useRef(null);

  const previews = [
    {
      id: "console",
      title: "Console",
      description: "Real-time server console",
      icon: Terminal,
      image: consoleImg,
    },
    {
      id: "files",
      title: "File Manager",
      description: "Edit files directly in browser",
      icon: FolderOpen,
      image: fileManagerImg,
    },
    {
      id: "plugins",
      title: "Plugin & Modpack Installer",
      description: "Install plugins and modpacks with one click",
      icon: Package,
      image: modsPluginsImg,
    },
    {
      id: "version",
      title: "Version Changer",
      description: "Switch server versions instantly",
      icon: History,
      image: versionImg,
    },
  ];

  useEffect(() => {
    // Reset progress and image state when active preview changes
    setProgress(0);
    setImageError(false);
    setImageLoaded(false);

    // Check if image is already cached/loaded
    if (imageRef.current) {
      if (imageRef.current.complete && imageRef.current.naturalHeight !== 0) {
        setImageLoaded(true);
      }
    }

    // Progress bar animation (5 seconds)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + 2; // Increment by 2% every 100ms (5 seconds total)
      });
    }, 100);

    // Auto-switch to next preview after 5 seconds
    const switchTimeout = setTimeout(() => {
      const currentIndex = previews.findIndex((p) => p.id === activePreview);
      const nextIndex = (currentIndex + 1) % previews.length;
      setActivePreview(previews[nextIndex].id);
    }, 5000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(switchTimeout);
    };
  }, [activePreview]);

  const handleImageLoad = () => {
    // Capture the height after image loads to maintain consistent container size
    if (imageRef.current) {
      setContainerHeight(imageRef.current.offsetHeight);
    }
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true); // Set to true to hide skeleton
  };

  return (
    <section className="bg-zinc-900 border-t-2 border-zinc-800 py-12 sm:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header - Center Aligned */}
        <div className="mb-8 sm:mb-10 flex flex-col items-center text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
            Intuitive <span className="text-[#b0f97d]">Web Panel</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
            Manage your server with ease using our intuitive web-based control
            panel
          </p>
        </div>

        {/* Preview Image Container */}
        <div className="mb-6 sm:mb-8 relative max-w-6xl mx-auto">
          {/* Main Preview Image Card */}
          <div className="bg-transparent border border-zinc-700 rounded-xl overflow-hidden relative z-10 shadow-2xl">
            {/* Window Title Bar */}
            <div className="bg-transparent border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1 bg-transparent rounded-md border border-zinc-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-zinc-500"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-xs text-zinc-400 font-medium tracking-wide">
                  lodgichost.pro
                </span>
              </div>
              <div className="flex items-center gap-4">
                {/* Minimize */}
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 11 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors"
                >
                  <path d="M1 5.5H10" stroke="currentColor" strokeWidth="1" />
                </svg>
                {/* Maximize/Restore */}
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 11 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors"
                >
                  <rect
                    x="2.5"
                    y="2.5"
                    width="8"
                    height="8"
                    stroke="currentColor"
                    strokeWidth="1"
                    fill="none"
                  />
                  <path
                    d="M0.5 8.5V0.5H8.5"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </svg>
                {/* Close */}
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 11 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors"
                >
                  <path
                    d="M1 1L10 10M10 1L1 10"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </svg>
              </div>
            </div>

            <div
              className="w-full flex items-center justify-center relative transition-all duration-300 bg-transparent"
              style={{
                minHeight: containerHeight ? `${containerHeight}px` : "auto",
              }}
            >
              {imageError ? (
                <div className="flex flex-col items-center justify-center gap-3 p-8">
                  <div className="w-16 h-16 rounded-sm bg-zinc-700 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-zinc-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                  <p className="text-zinc-500 text-sm">Preview Image</p>
                </div>
              ) : (
                <>
                  {/* Loading skeleton */}
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
                  )}

                  <img
                    ref={imageRef}
                    key={activePreview}
                    src={previews.find((p) => p.id === activePreview)?.image}
                    alt={previews.find((p) => p.id === activePreview)?.title}
                    className={`w-full h-auto max-h-[600px] object-contain rounded-sm transition-opacity duration-300 ${
                      imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                  />
                </>
              )}
            </div>
            
            {/* Window Footer / Status Bar */}
            <div className="bg-transparent border-t border-zinc-800 h-6 w-full"></div>
          </div>
        </div>

        {/* Selector Pills */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {previews.map((preview) => {
            const Icon = preview.icon;
            const isActive = activePreview === preview.id;

            return (
              <button
                type="button"
                key={preview.id}
                onClick={() => setActivePreview(preview.id)}
                aria-pressed={isActive}
                className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-all relative overflow-hidden ${
                  isActive
                    ? "bg-[#b0f97d] border-[#b0f97d] text-zinc-900 shadow-md scale-105"
                    : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {/* Progress Bar (Bottom Line) */}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 h-0.5 bg-zinc-900/20 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                )}

                <Icon
                  className={isActive ? "text-zinc-900" : "text-current"}
                  size={16}
                />
                <span className="text-sm font-semibold">{preview.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

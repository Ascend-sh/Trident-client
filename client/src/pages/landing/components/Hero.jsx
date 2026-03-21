import { Link } from "react-router-dom";
import { Zap, Shield, Gamepad2, ArrowRight, ChevronRight } from "lucide-react";
import heroBg from '../assets/heroBg.webp';

export default function Hero() {
  return (
    <>
      {/* Hero section with background image extending to header */}
      <section className="bg-zinc-900 flex items-center relative overflow-hidden py-24 -mt-[72px] pt-[140px] pb-24">
        {/* Background Image with Fade, Blur, and Dark Tint */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt=""
            className="w-full h-full object-cover blur-sm"
          />
          {/* Dark tint overlay */}
          <div className="absolute inset-0 bg-zinc-900/60"></div>
          
          {/* Small Faded Grid Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.15]" 
            style={{
              backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
              maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)"
            }}
          ></div>

          {/* Strong fade overlay - almost all faded except top right */}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-900"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/90 via-zinc-900/50 to-transparent"></div>
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col items-center text-center">
            {/* Main Content */}
            <div className="flex flex-col items-center gap-6 pb-4 max-w-3xl">
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                  <span className="text-[#b0f97d] drop-shadow-sm">
                    Minecraft Hosting
                  </span>{" "}
                  <br className="hidden sm:block" />
                  Made Simple.
                </h1>
                <p className="text-lg sm:text-xl text-zinc-300 leading-relaxed max-w-2xl mx-auto">
                  Deploy in <span className="text-white font-medium">under 60 seconds</span>. 
                  Enterprise hardware, DDoS protection, and automated backups—
                  <span className="text-zinc-100"> premium performance for less.</span>
                </p>
              </div>

              {/* Minimalist Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3 py-2">
                <div className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/60 px-4 py-2 rounded-lg">
                  <Zap className="text-[#b0f97d]" size={18} />
                  <span className="text-zinc-200 text-sm font-medium">Instant Setup</span>
                </div>

                <div className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/60 px-4 py-2 rounded-lg">
                  <Shield className="text-[#b0f97d]" size={18} />
                  <span className="text-zinc-200 text-sm font-medium">DDoS Protection</span>
                </div>

                <div className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/60 px-4 py-2 rounded-lg">
                  <Gamepad2 className="text-[#b0f97d]" size={18} />
                  <span className="text-zinc-200 text-sm font-medium">Mod Support</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 mb-2">
                <button
                  type="button"
                  className="group bg-[#b0f97d] text-zinc-900 font-semibold px-6 sm:px-8 py-3 rounded-lg hover:bg-[#a0f06d] transition text-base cursor-pointer flex items-center justify-center gap-2"
                >
                  Start Your Server Now
                  <ChevronRight
                    size={20}
                    className="group-hover:hidden transition"
                  />
                  <ArrowRight
                    size={20}
                    className="hidden group-hover:block transition"
                  />
                </button>
                <button
                  type="button"
                  className="border-2 border-[#b0f97d] text-[#b0f97d] font-semibold px-6 sm:px-8 py-3 rounded-lg hover:bg-[#b0f97d] hover:text-zinc-900 transition text-base cursor-pointer"
                >
                  View Pricing
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

export default function ModpackSection() {
  const modImports = import.meta.glob('../assets/mods/*.png', { eager: true, import: 'default' });
  const modpacks = Object.values(modImports);

  useEffect(() => {
    const id = "modpack-marquee-keyframes";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      @keyframes marqueeLeft {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      @keyframes marqueeRight {
        0% { transform: translateX(-50%); }
        100% { transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const firstRow = modpacks.slice(0, 13);
  const secondRow = modpacks.slice(13, 26);

  return (
    <section className="bg-[#18181b] border-t border-zinc-800 py-5 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Text Content - Center Aligned */}
        <div className="flex flex-col gap-3 items-center text-center mb-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            All the <span className="text-[#b0f97d]">Modpacks</span> You'll{" "}
            <span className="text-[#b0f97d]">Ever Need</span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto">
            We offer 15,000+ modpacks that can be installed with just one click.
          </p>
          <Link
            to="/modpacks"
            className="inline-flex items-center justify-center gap-2 bg-[#b0f97d] text-zinc-900 font-semibold px-5 py-2 rounded-lg hover:bg-[#a0f06d] transition text-sm cursor-pointer"
          >
            Get Started Now
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Modpack Marquee */}
        <div className="relative">
          {/* Left edge fade */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-12 md:w-16 bg-gradient-to-r from-[#18181b] to-transparent z-20" />
          {/* Right edge fade */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-12 md:w-16 bg-gradient-to-l from-[#18181b] to-transparent z-20" />

          <div className="space-y-3 overflow-hidden">
            {/* Top row – scroll left */}
            <div className="overflow-hidden">
              <div
                className="flex w-max gap-3"
                style={{ animation: "marqueeLeft 60s linear infinite" }}
              >
                {[...firstRow, ...firstRow, ...firstRow].map((mod, i) => (
                  <div
                    key={`top-${i}`}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-zinc-700/50 hover:border-[#b0f97d]/50 transition cursor-pointer flex-shrink-0"
                  >
                    <img
                      src={mod}
                      alt={`Modpack ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom row – scroll right */}
            <div className="overflow-hidden">
              <div
                className="flex w-max gap-3"
                style={{ animation: "marqueeRight 60s linear infinite" }}
              >
                {[...secondRow, ...secondRow, ...secondRow].map((mod, i) => (
                  <div
                    key={`bottom-${i}`}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-zinc-700/50 hover:border-[#b0f97d]/50 transition cursor-pointer flex-shrink-0"
                  >
                    <img
                      src={mod}
                      alt={`Modpack ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

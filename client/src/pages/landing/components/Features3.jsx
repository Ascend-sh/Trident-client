import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import globe from '../assets/Globe.png';
import amdEpyc from '../assets/AmdEpyc.png';
import ryzen from '../assets/Ryzen.png';
import ram from '../assets/Ram.png';

const PING_ATTEMPTS = 2;

export default function Features3() {
  // Public fast endpoints per region (approximate)
  const [locations, setLocations] = useState([
    {
      id: "us-w",
      label: "North America West",
      code: "US",
      url: "https://1.1.1.1/cdn-cgi/trace", // Cloudflare
      ping: "… ms",
    },
    {
      id: "us-e",
      label: "North America East",
      code: "US",
      url: "https://www.google.com/generate_204", // Google
      ping: "… ms",
    },
    {
      id: "eu",
      label: "Europe",
      code: "DE",
      url: "https://www.cloudflare.com/cdn-cgi/trace",
      ping: "… ms",
    },
    {
      id: "asia",
      label: "Asia",
      code: "SG",
      url: "https://www.google.com/generate_204",
      ping: "… ms",
    },
    {
      id: "au",
      label: "Australia",
      code: "AU",
      url: "https://1.0.0.1/cdn-cgi/trace",
      ping: "… ms",
    },
  ]);

  const ddosFeatures = [
    "Flood/volumetric attacks on network interfaces",
    "Connection attacks on TCP/UDP",
    "High/low-frequency attacks on the application",
  ];

  const measureRegion = async (locIndex) => {
    const loc = locations[locIndex];

    // Skip ping for "Soon" locations if any
    if (loc.isSoon) return;

    const times = [];

    for (let i = 0; i < PING_ATTEMPTS; i++) {
      const cacheBust = `cb=${Date.now()}-${i}`;
      const url =
        loc.url + (loc.url.includes("?") ? "&" + cacheBust : "?" + cacheBust);

      const start = performance.now();
      try {
        const res = await fetch(url, {
          method: "GET",
          mode: "no-cors",
          cache: "no-store",
        });
        // With no-cors we cannot read response, but timing still works.
        if (res) {
          const end = performance.now();
          times.push(end - start);
        }
      } catch {
        // ignore
      }
    }

    let display = "– ms";
    if (times.length > 0) {
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      display = `${avg} ms`;
    }

    setLocations((prev) =>
      prev.map((l, idx) => (idx === locIndex ? { ...l, ping: display } : l)),
    );
  };

  useEffect(() => {
    locations.forEach((_, idx) => {
      measureRegion(idx);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePingAll = () => {
    setLocations((prev) => prev.map((l) => ({ ...l, ping: "… ms" })));
    locations.forEach((_, idx) => {
      measureRegion(idx);
    });
  };

  const cardBase =
    "relative overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-lg";

  return (
    <section className="bg-zinc-900 border-t-2 border-zinc-800 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="mb-8 sm:mb-10 flex flex-col items-center text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
            Global <span className="text-[#b0f97d]">Performance</span> &{" "}
            <span className="text-[#b0f97d]">Hardware</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
            Powered by enterprise-grade hardware and protected by advanced DDoS
            mitigation across our global network.
          </p>
        </div>

        {/* Top Grid: Locations & DDoS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          {/* Global Locations Card */}
          <div
            className={`${cardBase} p-3 sm:p-4 transition-colors duration-200 group h-full`}
          >
            {/* Green top accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#b0f97d]" />

            {/* Globe BG */}
            <div className="absolute right-[-25%] bottom-[-25%] w-[80%] opacity-10 pointer-events-none select-none transition-transform duration-700 group-hover:rotate-12">
              <img
                src={globe}
                alt=""
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
                Global Locations
              </h3>
              <p className="text-zinc-400 mb-4 max-w-sm text-xs sm:text-sm leading-relaxed">
                With data centers around the world, low-latency gaming is just a
                click away.
              </p>

              <div className="space-y-2 mb-auto">
                {locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="flex items-center gap-2 max-w-md"
                  >
                    <img
                      src={`https://flagsapi.com/${loc.code}/flat/24.png`}
                      alt={loc.label}
                      className="w-4 h-auto rounded-sm opacity-80"
                      loading="lazy"
                    />
                    <span className="text-zinc-300 font-medium text-xs sm:text-sm flex-1">
                      {loc.label}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-semibold tabular-nums ${loc.ping !== "… ms" ? "text-[#b0f97d]" : "text-zinc-600"}`}
                    >
                      {loc.ping}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handlePingAll}
                  className="bg-zinc-800/70 hover:bg-zinc-800 text-zinc-200 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b0f97d]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                >
                  Ping All Locations
                </button>
              </div>
            </div>
          </div>

          {/* DDoS Protection Card */}
          <div
            className={`${cardBase} p-3 sm:p-4 transition-colors duration-200 group h-full`}
          >
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
                Advanced DDoS Protection
              </h3>
              <p className="text-zinc-400 mb-3 text-xs sm:text-sm leading-relaxed">
                Our servers are protected against DDoS attacks at the network
                (L3), transport (L4), and application (L7) layers in data
                centers around the world.
              </p>

              <div className="h-px bg-zinc-800/80 w-full mb-3" />

              <h4 className="text-white font-semibold mb-2.5 text-xs sm:text-sm">
                We protect your servers against all types of DDoS attacks
              </h4>

              <ul className="space-y-2">
                {ddosFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="mt-0.5 bg-[#b0f97d]/10 p-1 rounded-full flex-shrink-0">
                      <Check size={12} className="text-[#b0f97d]" />
                    </div>
                    <span className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Grid: Hardware */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 3: CPU 1 (AMD EPYC) */}
          <div
            className={`${cardBase} p-4 min-h-[160px] group transition-colors`}
          >
            <div
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, #b0f97d 0%, transparent 30%, transparent 70%, #b0f97d 100%)",
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                padding: "1px",
              }}
            />
            <div className="relative z-10 max-w-[65%]">
              <h3 className="text-base sm:text-lg font-bold text-white mb-1 leading-tight">
                AMD EPYC™ 9000
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                Enterprise Performance
              </p>
            </div>
            <div className="absolute right-[-15%] bottom-[-15%] w-[55%] sm:w-[60%] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
              <img
                src={amdEpyc}
                alt="AMD EPYC"
                className="w-full h-auto object-contain drop-shadow-2xl"
                loading="lazy"
              />
            </div>
          </div>

          {/* Card 4: CPU 2 (Ryzen) */}
          <div
            className={`${cardBase} p-4 min-h-[160px] group transition-colors`}
          >
            <div
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, #b0f97d 0%, transparent 30%, transparent 70%, #b0f97d 100%)",
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                padding: "1px",
              }}
            />
            <div className="relative z-10 max-w-[65%]">
              <h3 className="text-base sm:text-lg font-bold text-white mb-1 leading-tight">
                Ryzen 9 5900X
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                High Clock Speeds
              </p>
            </div>
            <div className="absolute right-[-15%] bottom-[-24%] w-[45%] sm:w-[50%] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
              <img
                src={ryzen}
                alt="AMD Ryzen"
                className="w-full h-auto object-contain drop-shadow-2xl"
                loading="lazy"
              />
            </div>
          </div>

          {/* Card 5: RAM */}
          <div
            className={`${cardBase} p-4 min-h-[160px] group transition-colors`}
          >
            <div
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, #b0f97d 0%, transparent 30%, transparent 70%, #b0f97d 100%)",
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                padding: "1px",
              }}
            />
            <div className="relative z-10 max-w-[65%]">
              <h3 className="text-base sm:text-lg font-bold text-white mb-1 leading-tight">
                DDR5 RAM
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400">Next-Gen Speed</p>
            </div>
            <div className="absolute right-[-15%] bottom-[-22%] w-[55%] sm:w-[60%] transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-6">
              <img
                src={ram}
                alt="DDR5 RAM"
                className="w-full h-auto object-contain drop-shadow-2xl"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

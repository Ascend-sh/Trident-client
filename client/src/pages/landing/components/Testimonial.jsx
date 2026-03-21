import { useEffect } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Alex",
    role: "Survival Server Owner",
    seed: "alex-survival",
    text: "LodgicHost keeps our world lag‑free even with 50+ players online.",
  },
  {
    name: "Mia",
    role: "Modpack Enthusiast",
    seed: "mia-modpack",
    text: "One‑click modpacks and rollbacks saved us so much setup time.",
  },
  {
    name: "Nova",
    role: "Community Admin",
    seed: "nova-community",
    text: "Backups and DDoS protection mean we never worry about attacks.",
  },
  {
    name: "Ethan",
    role: "Mini‑games Host",
    seed: "ethan-minigames",
    text: "Snappy panel and low ping from EU to NA players.",
  },
  {
    name: "Luna",
    role: "SMP Creator",
    seed: "luna-smp",
    text: "Support always answers quickly when we need a tweak or upgrade.",
  },
  {
    name: "Kai",
    role: "Network Owner",
    seed: "kai-network",
    text: "Scaling to more nodes was painless and pricing stayed fair.",
  },
];

function Avatar({ seed, name }) {
  const src = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(
    seed,
  )}`;
  return (
    <img
      src={src}
      alt={`${name}'s avatar`}
      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-800 border border-zinc-700"
      loading="lazy"
    />
  );
}

function Card({ t }) {
  return (
    <div className="min-w-[200px] sm:min-w-[240px] max-w-[240px] sm:max-w-xs bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-lg p-3 sm:p-4 mx-1.5 sm:mx-2 flex-shrink-0">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar seed={t.seed} name={t.name} />
          <div>
            <p className="text-xs sm:text-sm font-semibold text-white">{t.name}</p>
            <p className="text-[10px] sm:text-xs text-zinc-500">{t.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[#b0f97d] text-[10px] sm:text-xs">
          <Star size={12} fill="#b0f97d" />
          <span>5.0</span>
        </div>
      </div>
      <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{t.text}</p>
    </div>
  );
}

export default function Testimonial() {
  useEffect(() => {
    const id = "testimonial-marquee-keyframes";
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

  const firstRow = testimonials.slice(0, 3);
  const secondRow = testimonials.slice(3, 6);

  return (
    <section className="bg-zinc-900 border-t-2 border-zinc-800 py-12 sm:py-16">
      {/* Slightly wider container, less outer background showing */}
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4">
        {/* Header - Center Aligned */}
        <div className="mb-6 sm:mb-8 flex flex-col items-center text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Loved by{" "}
            <span className="text-[#b0f97d]">Minecraft Communities</span>
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm md:text-base max-w-xl mx-auto">
            Real feedback from players, creators, and network owners hosting
            their worlds on LodgicHost.
          </p>
        </div>

        {/* Outer wrapper: rows + fades */}
        <div className="relative">
          {/* Left edge fade using exact bg color #18181b */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-12 md:w-16 bg-[linear-gradient(to_right,#18181b,#18181b,#18181b00)] z-20" />
          {/* Right edge fade */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-12 md:w-16 bg-[linear-gradient(to_left,#18181b,#18181b,#18181b00)] z-20" />

          <div className="space-y-3 sm:space-y-4 overflow-hidden">
            {/* Top row – scroll left infinitely */}
            <div className="overflow-hidden">
              <div
                className="flex w-max gap-4"
                style={{ animation: "marqueeLeft 40s linear infinite" }}
              >
                {[...firstRow, ...firstRow, ...firstRow, ...firstRow].map(
                  (t, i) => (
                    <Card key={`top-${i}`} t={t} />
                  ),
                )}
              </div>
            </div>

            {/* Bottom row – scroll right infinitely */}
            <div className="overflow-hidden">
              <div
                className="flex w-max gap-4"
                style={{ animation: "marqueeRight 40s linear infinite" }}
              >
                {[...secondRow, ...secondRow, ...secondRow, ...secondRow].map(
                  (t, i) => (
                    <Card key={`bottom-${i}`} t={t} />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

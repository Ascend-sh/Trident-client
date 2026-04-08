import { Server, Zap, Shield, Headphones, ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import feature1 from '../assets/Feature1.png';
import software from '../assets/Software.png';
import startImg from '../assets/Start.png';
import modpacks from '../assets/Modpacks.png';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function Features() {
  const chartData = {
    labels: ["0s", "10s", "20s", "30s", "40s", "50s", "60s"],
    datasets: [
      {
        label: "Setup Progress",
        data: [0, 25, 35, 60, 70, 90, 100],
        borderColor: "#b0f97d",
        backgroundColor: "rgba(176, 249, 125, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
        min: 0,
        max: 100,
      },
    },
  };

  return (
    <section id="features" className="bg-zinc-900 border-t-2 border-zinc-800 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header - Center Aligned */}
        <div className="mb-8 sm:mb-10 flex flex-col items-center text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
            Why Choose <span className="text-[#b0f97d]">LodgicHost</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
            Experience premium Minecraft hosting with cutting-edge technology
            and unmatched support
          </p>
        </div>

        {/* Asymmetric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-6xl mx-auto">
          {/* Tall Vertical Card - Left Side spanning 2 rows */}
          <div className="group md:row-span-2 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-lg overflow-hidden transition flex flex-col relative">
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
            ></div>
            <div className="p-3 sm:p-4 relative z-10">
              <h3 className="text-base font-bold text-white mb-1.5">
                Affordable Pricing
              </h3>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-2.5">
                Get premium Minecraft hosting starting at just $1/month.
                High-performance servers without breaking the bank. No hidden
                fees, just transparent pricing.
              </p>
              <a
                href="#pricing"
                className="inline-flex items-center gap-1.5 text-white text-xs sm:text-sm font-medium underline decoration-transparent hover:text-[#b0f97d] hover:decoration-[#b0f97d] transition-all"
              >
                Get your server now
                <ArrowRight size={14} />
              </a>
            </div>
            <div className="mt-auto relative z-10">
              <img
                src={feature1}
                alt="Affordable Pricing"
                className="w-full h-40 sm:h-48 lg:h-56 object-cover object-top"
                loading="lazy"
              />
            </div>
          </div>

          {/* Horizontal Card - Top Right spanning 2 columns */}
          <div className="group md:col-span-1 lg:col-span-2 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-lg p-3 sm:p-4 transition flex flex-col pb-0 relative">
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
            ></div>
            <h3 className="text-base font-bold text-white mb-1.5 relative z-10">
              All Your Favorite Minecraft Software
            </h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-2.5 relative z-10">
              Support for Fabric, Forge, Paper, Spigot, Bukkit, Purpur, Vanilla,
              and more. One-click installation for all major server types and
              modpacks.
            </p>
            <div className="mt-auto mb-3 sm:mb-4 relative z-10">
              <img
                src={software}
                alt="Minecraft Software"
                className="w-36 sm:w-40 lg:w-48 h-auto object-contain"
                loading="lazy"
              />
            </div>
          </div>

          {/* Medium Card - Bottom Middle with Start.png and chart */}
          <div className="group bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-lg overflow-hidden transition flex flex-col relative min-h-[180px]">
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
            ></div>
            <div className="p-3 sm:p-4 pb-1.5 relative z-10">
              <h3 className="text-base font-bold text-white mb-1.5">
                Instant Setup
              </h3>
              <p className="text-zinc-400 text-xs sm:text-sm mb-1.5">
                Deploy your server in under 60 seconds. No technical knowledge
                required.
              </p>
            </div>

            {/* Start icon positioned below subhead, nudged right */}
            <img
              src={startImg}
              alt="Start"
              className="absolute top-14 sm:top-16 left-3 sm:left-5 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain pointer-events-none z-10"
              loading="lazy"
            />

            {/* Chart fills remaining height */}
            <div className="flex-1 relative z-10">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Medium Card - Bottom Right */}
          <div className="group bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-lg overflow-hidden transition flex flex-col relative">
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
            ></div>
            <div className="p-3 sm:p-4 relative z-10">
              <h3 className="text-base font-bold text-white mb-1.5">
                Modpack & Plugin Installer
              </h3>
              <p className="text-zinc-400 text-xs sm:text-sm">
                Browse and install thousands of modpacks and plugins with a
                single click. No manual setup required.
              </p>
            </div>
            <div className="mt-auto -mb-2 sm:-mb-4 relative z-10">
              <img
                src={modpacks}
                alt="Modpack Installer"
                className="w-full h-28 sm:h-32 object-cover object-top"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

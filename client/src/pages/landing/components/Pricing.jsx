import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import PricingCard from "./props/PricingCard";
import popularCard from '../assets/PopularCard.png';
import visa from '../assets/visa.svg';
import mastercard from '../assets/mastercard.svg';
import americanExpress from '../assets/american-express.svg';
import paypal from '../assets/paypal.svg';
import paysafecard from '../assets/paysafecard.svg';

export default function Pricing() {
  const [billing, setBilling] = useState("monthly");
  const [showAll, setShowAll] = useState(false);

  const plans = [
    {
      name: "Free",
      recommendedPlayers: "up to 5",
      monthlyBase: 0,
      popular: false,
      specs: ["2 GB RAM • 1 vCPU", "15 GB NVMe storage", "1 Database"],
    },
    {
      name: "Cobblestone",
      recommendedPlayers: "5–15",
      monthlyBase: 4.99,
      popular: true,
      specs: ["4 GB RAM • 2 vCPU", "35 GB NVMe storage", "3 Databases"],
    },
    {
      name: "Oak",
      recommendedPlayers: "15–30",
      monthlyBase: 9.99,
      popular: false,
      specs: ["8 GB RAM • 3 vCPU", "75 GB NVMe storage", "5 Databases"],
    },
    // Extra plans
    {
      name: "Birch",
      recommendedPlayers: "30–50",
      monthlyBase: 13.99,
      popular: false,
      specs: ["12 GB RAM • 4 vCPU", "120 GB NVMe storage", "10 Databases"],
    },
    {
      name: "Spruce",
      recommendedPlayers: "50–80",
      monthlyBase: 16.99,
      popular: false,
      specs: ["16 GB RAM • 5 vCPU", "160 GB NVMe storage", "Unlimited Databases"],
    },
    {
      name: "Obsidian",
      recommendedPlayers: "80+",
      monthlyBase: 24.99,
      popular: false,
      specs: ["24 GB RAM • 6 vCPU", "240 GB NVMe storage", "Unlimited Databases"],
    },
  ];

  const pillBase =
    "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors";

  const formatPrice = (value) =>
    Number.isInteger(value) ? String(value) : value.toFixed(2);

  const getPriceInfo = (plan) => {
    const m = plan.monthlyBase;

    if (billing === "monthly") {
      return {
        displayPrice: formatPrice(m),
        originalPrice: null,
        suffix: "/month",
      };
    }

    if (billing === "quarterly") {
      const original = m * 3;
      const discounted = original * 0.9; // 10% off
      return {
        displayPrice: formatPrice(discounted),
        originalPrice: formatPrice(original),
        suffix: "/3 mo",
      };
    }

    // yearly
    const original = m * 12;
    const discounted = original * 0.8; // 20% off
    return {
      displayPrice: formatPrice(discounted),
      originalPrice: formatPrice(original),
      suffix: "/year",
    };
  };

  const renderPlan = (plan) => {
    const { displayPrice, originalPrice, suffix } = getPriceInfo(plan);

    return (
      <div key={plan.name} className="relative">
        {plan.popular && (
          <div className="absolute -top-12 right-2 w-44 h-12 overflow-hidden pointer-events-none z-20">
            <img
              src={popularCard}
              alt="Popular plan"
              className="w-full h-auto object-cover object-top"
              loading="lazy"
            />
          </div>
        )}
        <PricingCard
          plan={{
            ...plan,
            price: displayPrice,
            originalPrice,
            priceSuffix: suffix,
          }}
        />
      </div>
    );
  };

  return (
    <section id="pricing" className="bg-zinc-900 border-t-2 border-zinc-800 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header + duration selector - Center Aligned Stack */}
        <div className="mb-8 sm:mb-10 flex flex-col items-center text-center gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              Flexible <span className="text-brand">plans</span> for every{" "}
              <span className="text-brand">server</span>
            </h2>
            <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto">
              Start small or scale to hundreds of players with transparent
              pricing, predictable performance, and no hidden limits.
            </p>
          </div>

          {/* Duration selector - Centered */}
          <div className="flex flex-col items-center w-full md:w-auto mb-10">
            <div className="w-full max-w-[260px] sm:max-w-[280px] flex flex-col gap-1">
              <div className="grid grid-cols-3 text-center">
                <span />
                <span className="flex justify-center">
                  <span className="inline-flex items-center justify-center text-[9px] sm:text-[10px] font-semibold text-zinc-900 px-1.5 sm:px-2 py-0.5 rounded-full bg-brand">
                    10% off
                  </span>
                </span>
                <span className="flex justify-center">
                  <span className="inline-flex items-center justify-center text-[9px] sm:text-[10px] font-semibold text-zinc-900 px-1.5 sm:px-2 py-0.5 rounded-full bg-brand">
                    20% off
                  </span>
                </span>
              </div>

              <div className="mt-1 inline-flex items-center bg-zinc-800/90 border border-zinc-700 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 w-full justify-center gap-2 sm:gap-4 md:gap-6">
                <button
                  type="button"
                  onClick={() => setBilling("monthly")}
                  aria-pressed={billing === "monthly"}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-semibold transition-colors ${
                    billing === "monthly"
                      ? "bg-[#b0f97d] text-zinc-900"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBilling("quarterly")}
                  aria-pressed={billing === "quarterly"}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-semibold transition-colors ${
                    billing === "quarterly"
                      ? "bg-[#b0f97d] text-zinc-900"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  Quarterly
                </button>
                <button
                  type="button"
                  onClick={() => setBilling("yearly")}
                  aria-pressed={billing === "yearly"}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-semibold transition-colors ${
                    billing === "yearly"
                      ? "bg-[#b0f97d] text-zinc-900"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Base pricing grid (first 3 plans) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
          {plans.slice(0, 3).map(renderPlan)}
        </div>

        {/* Extra plans with smooth expand/collapse */}
        <div
          className={`transition-all duration-300 ease-out overflow-hidden ${
            showAll
              ? "max-h-[2000px] mt-4 sm:mt-5 opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
            {plans.slice(3).map(renderPlan)}
          </div>
        </div>

        {/* View more / View less toggle */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            aria-expanded={showAll}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white px-4 py-2 rounded-full border border-zinc-700 hover:border-brand transition"
          >
            {showAll ? "View less plans" : "View more plans"}
            {showAll ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Bottom line */}
        <div className="mt-6 sm:mt-8 text-sm text-zinc-500 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-3">
          <p className="text-xs sm:text-sm">
            Need something custom?{" "}
            <button type="button" className="text-brand hover:underline">
              Talk to us about higher tiers
            </button>
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-zinc-500">
              Accepted payment methods:
            </span>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <img
                src={visa}
                alt="Visa"
                className="h-4 sm:h-5 w-auto"
                loading="lazy"
              />
              <img
                src={mastercard}
                alt="Mastercard"
                className="h-4 sm:h-5 w-auto"
                loading="lazy"
              />
              <img
                src={americanExpress}
                alt="American Express"
                className="h-4 sm:h-5 w-auto"
                loading="lazy"
              />
              <img
                src={paypal}
                alt="PayPal"
                className="h-4 sm:h-5 w-auto"
                loading="lazy"
              />
              <img
                src={paysafecard}
                alt="Paysafecard"
                className="h-4 sm:h-5 w-auto"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

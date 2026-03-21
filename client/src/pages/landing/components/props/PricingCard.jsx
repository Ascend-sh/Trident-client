// src/components/props/PricingCard.jsx
import {
  Cpu,
  MemoryStick,
  Database,
  Ticket,
  ArrowRight,
} from "lucide-react";
import popularCardBg from '../../assets/popularcardbg.png';

export default function PricingCard({ plan }) {
  const isPopular = plan.popular;
  const icons = [Cpu, MemoryStick, Database];
  const defaultIconColor = "text-zinc-400";
  const hasDiscount = Boolean(plan.originalPrice);

  return (
    <div
      className={
        isPopular
          ? "relative flex flex-col rounded-lg border-2 border-[#b0f97d] p-5 overflow-hidden"
          : "relative flex flex-col rounded-lg border p-5 bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700"
      }
    >
      {/* Background for Popular Card */}
      {isPopular && (
        <>
          <div
            className="absolute inset-0 z-0"
            style={{
              maskImage: "linear-gradient(to top right, transparent 0%, black 60%)",
              WebkitMaskImage:
                "linear-gradient(to top right, transparent 0%, black 60%)",
            }}
          >
            <img
              src={popularCardBg}
              alt=""
              className="w-full h-full object-cover opacity-60"
            />
          </div>
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#2BFF00]/60 via-[#2BFF00]/30 to-transparent opacity-90" />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#2BFF00]/40 to-transparent z-0 pointer-events-none" />
        </>
      )}

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="mb-3 mt-1">
          <h3
            className={`text-lg font-semibold ${
              isPopular ? "text-white drop-shadow-sm" : "text-white"
            }`}
          >
            {plan.name}
          </h3>
          <p
            className={`text-[11px] font-medium ${
              isPopular ? "text-zinc-100" : "text-zinc-500"
            }`}
          >
            Recommended for {plan.recommendedPlayers} players
          </p>
        </div>

        {/* Price + discount */}
        <div className="mb-4 space-y-2">
          <div className="flex items-baseline gap-2">
            {/* main price */}
            <div className="flex items-baseline gap-1">
              <span
                className={`text-base ${
                  isPopular ? "text-white" : "text-zinc-400"
                }`}
              >
                €
              </span>
              <span
                className={`text-3xl font-bold ${
                  isPopular ? "text-white drop-shadow-sm" : "text-white"
                }`}
              >
                {plan.price}
              </span>
              <span
                className={`text-sm font-medium ${
                  isPopular ? "text-white" : "text-zinc-500"
                }`}
              >
                {plan.priceSuffix || "/month"}
              </span>
            </div>

            {/* original price when discounted */}
            {hasDiscount && (
              <div
                className={`flex items-baseline gap-1 text-xs line-through ${
                  isPopular ? "text-zinc-200" : "text-zinc-500"
                }`}
              >
                <span>€</span>
                <span>{plan.originalPrice}</span>
              </div>
            )}
          </div>

          <div
            className={`text-[11px] font-medium px-2 py-1 rounded-md inline-flex items-center gap-1 ${
              isPopular
                ? "bg-zinc-900/90 text-[#b0f97d] shadow-sm"
                : "bg-[#b0f97d]/10 text-[#b0f97d]"
            }`}
          >
            <Ticket size={12} className="text-[#b0f97d]" />
            <span>10% off on your first purchase</span>
          </div>
        </div>

        {/* Specs with icons */}
        <ul className="space-y-2 mb-4 text-sm">
          {plan.specs.map((spec, idx) => {
            const Icon = icons[idx] || Cpu;
            return (
              <li key={idx} className="flex items-start gap-2">
                <Icon
                  size={14}
                  className={
                    isPopular
                      ? "text-white mt-0.5"
                      : `${defaultIconColor} mt-0.5`
                  }
                />
                <span
                  className={
                    isPopular ? "text-white font-medium" : "text-zinc-300"
                  }
                >
                  {spec}
                </span>
              </li>
            );
          })}
        </ul>

        {/* CTA */}
        <button
          type="button"
          className={
            isPopular
              ? "mt-auto w-full py-2 rounded-md text-sm font-semibold bg-zinc-900 text-[#b0f97d] hover:bg-zinc-800 transition-colors inline-flex items-center justify-center gap-2 shadow-lg"
              : "mt-auto w-full py-2 rounded-md text-sm font-semibold bg-zinc-800 text-white hover:bg-zinc-700 transition-colors inline-flex items-center justify-center gap-2"
          }
        >
          <span>Configure now</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

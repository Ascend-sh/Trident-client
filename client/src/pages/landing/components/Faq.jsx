// src/components/Faq.jsx
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How fast is server setup?",
    answer:
      "Your Minecraft server is provisioned and ready to join in under 60 seconds once payment is confirmed.",
  },
  {
    question: "Can I install modpacks and plugins?",
    answer:
      "Yes. Use our panel to install popular modpacks and plugins with one click, or upload your own JARs.",
  },
  {
    question: "Do you offer DDoS protection?",
    answer:
      "All plans include always-on DDoS protection to keep your players connected during attacks.",
  },
  {
    question: "Can I upgrade or downgrade later?",
    answer:
      "You can change plans at any time from the panel. Resources are adjusted with minimal downtime.",
  },
  {
    question: "Where are your servers located?",
    answer:
      "We host in multiple regions so you can choose the closest location to your player base.",
  },
  {
    question: "Is there a refund policy?",
    answer:
      "If you are not satisfied, contact support within the first 72 hours and we will work with you on a refund.",
  },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="text-left bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 hover:border-zinc-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 transition flex flex-col gap-1"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm md:text-base font-semibold text-white">
          {item.question}
        </h3>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>
      <div
        className={`text-xs md:text-sm text-zinc-400 transition-[max-height,opacity,margin-top] duration-200 ease-out overflow-hidden ${
          isOpen ? "max-h-48 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
        }`}
      >
        <div className="border-t border-zinc-700/60 pt-2">{item.answer}</div>
      </div>
    </button>
  );
}

export default function Faq() {
  // start with all FAQs closed
  const [openStates, setOpenStates] = useState(() => faqs.map(() => false));

  const toggleIndex = (index) => {
    setOpenStates((prev) =>
      prev.map((open, i) => (i === index ? !open : open)),
    );
  };

  const leftColumn = faqs.slice(0, 3);
  const rightColumn = faqs.slice(3, 6);

  return (
    <section id="faq" className="bg-zinc-900 border-t border-zinc-800 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header - Center Aligned */}
        <div className="mb-6 sm:mb-8 flex flex-col items-center text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Frequently Asked <span className="text-[#b0f97d]">Questions</span>
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm md:text-base max-w-xl mx-auto">
            Answers to the most common questions about LodgicHost hosting.
          </p>
        </div>

        {/* Two completely separate columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
          {/* Left column: first 3 FAQs */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {leftColumn.map((item, idx) => {
              const index = idx; // 0–2
              return (
                <FaqItem
                  key={item.question}
                  item={item}
                  isOpen={openStates[index]}
                  onToggle={() => toggleIndex(index)}
                />
              );
            })}
          </div>

          {/* Right column: last 3 FAQs */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {rightColumn.map((item, idx) => {
              const index = 3 + idx; // 3–5
              return (
                <FaqItem
                  key={item.question}
                  item={item}
                  isOpen={openStates[index]}
                  onToggle={() => toggleIndex(index)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DollarSign, MessageCircle, Menu, X, ChevronDown } from "lucide-react";
import logoNoBG from '../assets/Logo-noBG.png';

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState({ code: "GB", name: "EN" });
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleLang = () => setIsLangOpen(!isLangOpen);

  const languages = [
    { code: "GB", name: "EN" },
    { code: "CZ", name: "CZ" },
  ];

  const handleLangSelect = (lang) => {
    setSelectedLang(lang);
    setIsLangOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="sticky top-0 z-50">
      {/* Top Alert Bar */}
      <div className="bg-[#b0f97d] border-b border-[#a0f06d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-2.5 text-center">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0"
            >
              <path d="M2 9a3 3 0 1 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M9 9h.01" />
              <path d="m15 9-6 6" />
              <path d="M15 15h.01" />
            </svg>
            <span className="text-xs sm:text-sm text-zinc-900 font-medium">
              Use code
            </span>
            <span className="bg-[#9ee65c] text-zinc-900 font-bold text-xs sm:text-sm px-2.5 py-0.5 rounded-md shadow-sm">
              WELCOME!
            </span>
            <span className="text-xs sm:text-sm text-zinc-900 font-medium">
              for
            </span>
            <span className="text-xs sm:text-sm text-zinc-900 font-bold">
              10% OFF
            </span>
            <span className="text-xs sm:text-sm text-zinc-900 font-medium">
              on first purchase
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar - Transparent with conditional backdrop */}
      <nav
        className={`backdrop-blur-md transition-colors duration-300 ${isScrolled ? "bg-zinc-900/90" : "bg-transparent"}`}
      >
        <div className="relative flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
          {/* Left - Logo (Absolute positioned) */}
          <Link
            to="/"
            className="absolute left-4 sm:left-6 flex items-center gap-2 text-xl sm:text-2xl font-bold text-[#b0f97d] hover:text-[#a0f06d] transition"
            aria-label="LodgicHost Home"
          >
            <img
              src={logoNoBG}
              alt="LodgicHost Logo"
              className="w-6 h-6 sm:w-8 sm:h-8"
              loading="lazy"
            />
            <span>LodgicHost</span>
          </Link>

          {/* Center - Nav Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6">
            <a
              href="#pricing"
              className="flex items-center gap-2 text-zinc-200 hover:text-[#b0f97d] transition group"
            >
              <DollarSign size={20} />
              <span>Pricing</span>
            </a>

            <Link
              to="/support"
              className="flex items-center gap-2 text-zinc-200 hover:text-[#b0f97d] transition group"
            >
              <MessageCircle size={20} />
              <span>Support</span>
            </Link>

            <Link
              to="/more"
              className="flex items-center gap-1 text-zinc-200 hover:text-[#b0f97d] transition group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
              <span>More</span>
            </Link>

            <a
              href="https://discord.gg/MxDWYG4Dat"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition group"
              aria-label="Join our Discord server"
            >
              <img
                src="https://cdn.simpleicons.org/discord/e4e4e7"
                alt=""
                className="w-5 h-5 group-hover:hidden"
                loading="lazy"
              />
              <img
                src="https://cdn.simpleicons.org/discord/b0f97d"
                alt=""
                className="w-5 h-5 hidden group-hover:block"
                loading="lazy"
              />
              <span className="text-zinc-200 group-hover:text-[#b0f97d] transition">
                Discord
              </span>
            </a>
          </div>

          {/* Right - Language Selector + Get Started Button (Desktop) - Absolute positioned */}
          <div className="hidden md:flex items-center gap-3 absolute right-4 sm:right-6">
            {/* Language Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={toggleLang}
                className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-md border border-zinc-700 rounded-lg px-3 py-1.5 hover:border-[#b0f97d] transition cursor-pointer"
              >
                <img
                  src={`https://flagsapi.com/${selectedLang.code}/flat/24.png`}
                  alt={selectedLang.name}
                  className="w-4 h-4"
                  loading="lazy"
                />
                <span className="text-white text-sm font-medium">
                  {selectedLang.name}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-zinc-400 transition-transform ${isLangOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isLangOpen && (
                <div className="absolute top-full mt-2 right-0 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-lg overflow-hidden shadow-xl min-w-[120px] z-50">
                  {languages.map((lang, index) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLangSelect(lang)}
                      className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 transition cursor-pointer ${
                        selectedLang.code === lang.code ? "bg-zinc-800" : ""
                      } ${index !== languages.length - 1 ? "border-b border-zinc-700/50" : ""}`}
                    >
                      <img
                        src={`https://flagsapi.com/${lang.code}/flat/24.png`}
                        alt={lang.name}
                        className="w-4 h-4"
                        loading="lazy"
                      />
                      <span
                        className={`text-sm font-medium ${selectedLang.code === lang.code ? "text-[#b0f97d]" : "text-zinc-300"}`}
                      >
                        {lang.name}
                      </span>
                      {selectedLang.code === lang.code && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="ml-auto text-[#b0f97d]"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/auth"
              className="bg-[#b0f97d] text-zinc-900 font-semibold px-6 py-2 rounded-lg hover:bg-[#a0f06d] transition cursor-pointer"
            >
              Get Started
            </Link>
          </div>

            {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={toggleMenu}
            className="md:hidden absolute right-4 sm:right-6 text-zinc-200 hover:text-[#b0f97d] transition"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 px-4 sm:px-6 py-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <a
                href="#pricing"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 text-zinc-200 hover:text-[#b0f97d] transition py-2"
              >
                <DollarSign size={20} />
                <span>Pricing</span>
              </a>

              <Link
                to="/support"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 text-zinc-200 hover:text-[#b0f97d] transition py-2"
              >
                <MessageCircle size={20} />
                <span>Support</span>
              </Link>

              <Link
                to="/more"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-1 text-zinc-200 hover:text-[#b0f97d] transition py-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
                <span>More</span>
              </Link>

              <a
                href="https://discord.gg/MxDWYG4Dat"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-zinc-200 hover:text-[#b0f97d] transition py-2"
                aria-label="Join our Discord server"
              >
                <img
                  src="https://cdn.simpleicons.org/discord/e4e4e7"
                  alt=""
                  className="w-5 h-5"
                  loading="lazy"
                />
                <span>Discord</span>
              </a>

              {/* Language Selector (Mobile) */}
              <div className="border-t border-zinc-800 pt-3 mt-2">
                <p className="text-zinc-500 text-xs mb-2 font-medium">
                  Language
                </p>
                <div className="flex gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLangSelect(lang)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition cursor-pointer bg-zinc-900/50 backdrop-blur-md ${
                        selectedLang.code === lang.code
                          ? "border-[#b0f97d] text-[#b0f97d]"
                          : "border-zinc-700 hover:border-zinc-600 text-zinc-300"
                      }`}
                    >
                      <img
                        src={`https://flagsapi.com/${lang.code}/flat/24.png`}
                        alt={lang.name}
                        className="w-4 h-4"
                        loading="lazy"
                      />
                      <span className="text-sm font-medium">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Link
                to="/auth"
                className="bg-[#b0f97d] text-zinc-900 font-semibold px-6 py-2.5 rounded-lg hover:bg-[#a0f06d] transition mt-2 cursor-pointer text-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}

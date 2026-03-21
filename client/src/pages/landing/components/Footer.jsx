// src/components/Footer.jsx
import { Link } from "react-router-dom";
import logoNoBG from '../assets/Logo-noBG.png';
import visa from '../assets/visa.svg';
import mastercard from '../assets/mastercard.svg';
import americanExpress from '../assets/american-express.svg';
import paypal from '../assets/paypal.svg';
import paysafecard from '../assets/paysafecard.svg';

export default function Footer() {
  return (
    <footer className="bg-zinc-900 border-t-2 border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Top row: brand + nav + contact */}
        <div className="flex flex-col gap-6 sm:gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand + short copy */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <img
                src={logoNoBG}
                alt="LodgicHost Logo"
                className="w-6 h-6 sm:w-7 sm:h-7"
                loading="lazy"
              />
              <h2 className="text-base sm:text-lg font-semibold text-white">
                LodgicHost
              </h2>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400">
              Affordable Minecraft server hosting with instant setup, DDoS
              protection, and easy modpack support.
            </p>
          </div>

          {/* Separator (mobile) */}
          <div className="h-px bg-zinc-800 md:hidden" />

          {/* Links */}
          <div className="flex flex-1 flex-wrap gap-6 sm:gap-8 md:flex-row md:justify-end">
            <div>
              <h4 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Product
              </h4>
              <div className="mt-2 sm:mt-3 flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <a href="#pricing" className="text-zinc-300 hover:text-white">
                  Pricing
                </a>
                <a href="#features" className="text-zinc-300 hover:text-white">
                  Features
                </a>
                <a href="#faq" className="text-zinc-300 hover:text-white">
                  FAQ
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Company
              </h4>
              <div className="mt-2 sm:mt-3 flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <a href="#" className="text-zinc-300 hover:text-white">
                  About
                </a>
                <a href="#" className="text-zinc-300 hover:text-white">
                  Status
                </a>
                <a href="#" className="text-zinc-300 hover:text-white">
                  Terms &amp; Privacy
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Support
              </h4>
              <div className="mt-2 sm:mt-3 flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <a
                  href="https://discord.gg/tNyejvNB7Z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-white"
                >
                  Discord
                </a>
                <a
                  href="https://discord.gg/tNyejvNB7Z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-white"
                >
                  Help Center
                </a>
                <a
                  href="https://discord.gg/tNyejvNB7Z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-white"
                >
                  Report an Issue
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Middle separator */}
        <div className="mt-6 sm:mt-8 h-px bg-zinc-800" />

        {/* Bottom row: payments + copyright */}
        <div className="mt-4 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-xs text-zinc-500">
              Accepted payment methods
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

          <p className="text-[10px] sm:text-xs text-zinc-500">
            © {new Date().getFullYear()} LodgicHost. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

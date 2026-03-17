import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CreditCard,
    Smartphone,
    Bitcoin,
    Wallet,
    ShieldCheck,
    ArrowRight,
    CheckCircle2,
    Coins
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

const PAYMENT_METHODS = [
    {
        id: "paypal",
        name: "PayPal",
        description: "Pay securely via your PayPal account",
        icon: Wallet,
        color: "text-brand",
        bg: "bg-transparent",
        border: "border-brand/10"
    },
    {
        id: "paysafecard",
        name: "Paysafecard",
        description: "Prepaid online payment method",
        icon: ShieldCheck,
        color: "text-brand",
        bg: "bg-transparent",
        border: "border-brand/10"
    },
    {
        id: "crypto",
        name: "Cryptocurrency",
        description: "Pay with BTC, ETH, LTC and more",
        icon: Bitcoin,
        color: "text-brand",
        bg: "bg-transparent",
        border: "border-brand/10"
    },
    {
        id: "upi",
        name: "UPI",
        description: "Instant bank transfer via UPI apps",
        icon: Smartphone,
        color: "text-brand",
        bg: "bg-transparent",
        border: "border-brand/10"
    }
];

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

export default function AddCredits() {
    const { balance, currencyName } = useAuth();
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [customAmount, setCustomAmount] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAmountSelect = (amount) => {
        setSelectedAmount(amount);
        setCustomAmount("");
    };

    const handleCustomAmountChange = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setCustomAmount(val);
        setSelectedAmount(val ? Number(val) : null);
    };

    const handleProceed = () => {
        if (!selectedMethod || (!selectedAmount && !customAmount)) return;
        setIsProcessing(true);
        // Simulate API call for payment checkout
        setTimeout(() => setIsProcessing(false), 2000);
    };

    return (
        <div className="bg-surface px-8 lg:px-16 py-10 min-h-[calc(100vh-64px)] overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                {/* Header Sequence */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col gap-2 mb-10"
                >
                    <div className="flex items-center gap-3">

                        <div>
                            <h1 className="text-[20px] font-bold text-brand tracking-tight">Add Credits</h1>
                            <p className="text-[11px] font-bold text-brand/40 uppercase tracking-widest mt-1">Top up your account balance</p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-8">
                    {/* Main Content Area */}
                    <div className="space-y-8">
                        {/* Step 1: Select Payment Method */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <h2 className="text-[16px] font-bold text-brand mb-4">Select Payment Method</h2>

                            <div className="flex flex-col gap-3">
                                {PAYMENT_METHODS.map((method) => {
                                    const isSelected = selectedMethod === method.id;
                                    const Icon = method.icon;

                                    return (
                                        <div
                                            key={method.id}
                                            onClick={() => {
                                                setSelectedMethod(method.id);
                                                // Small scroll offset for UX
                                                window.scrollTo({ top: 300, behavior: "smooth" });
                                            }}
                                            className={`relative overflow-hidden cursor-pointer group rounded-lg border transition-all duration-300 ${isSelected
                                                    ? 'bg-transparent border-brand/50 shadow-[0_0_20px_rgba(255,255,255,0.02)]'
                                                    : 'bg-transparent border-surface-lighter hover:border-brand/20'
                                                }`}
                                        >
                                            <div className="px-6 py-4 flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-md flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${method.bg} ${method.color} ${method.border} border`}>
                                                    <Icon size={18} strokeWidth={2} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-[13px] font-bold text-brand tracking-tight">{method.name}</h3>
                                                </div>
                                                <div className={`transition-all duration-300 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                                                    <CheckCircle2 size={18} className="text-brand" />
                                                </div>
                                            </div>
                                            {/* Selection glow indicator */}
                                            {isSelected && (
                                                <div className="absolute inset-0 border border-brand/20 rounded-lg pointer-events-none" />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.section>

                        {/* Step 2: Choose Amount (Appears conditionally) */}
                        <AnimatePresence>
                            {selectedMethod && (
                                <motion.section
                                    key="amount-section"
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-8 border-t border-surface-lighter">
                                        <h2 className="text-[16px] font-bold text-brand mb-4">Choose Amount</h2>

                                        <div className="bg-surface border border-surface-lighter rounded-lg p-6">
                                            <div className="mb-6">
                                                <label className="text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-3 block">Preset Amounts</label>
                                                <div className="flex flex-wrap gap-3">
                                                    {PRESET_AMOUNTS.map((amt) => {
                                                        const isSelected = selectedAmount === amt && !customAmount;
                                                        return (
                                                            <button
                                                                key={amt}
                                                                onClick={() => handleAmountSelect(amt)}
                                                                className={`px-6 py-3 rounded-lg text-[14px] font-bold transition-all duration-200 cursor-pointer ${isSelected
                                                                        ? 'bg-brand text-surface shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                                                        : 'bg-surface-light border border-surface-lighter text-brand/60 hover:border-brand/30 hover:text-brand'
                                                                    }`}
                                                            >
                                                                €{amt}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-brand/40 uppercase tracking-widest mb-3 block">Or Custom Amount</label>
                                                <div className="relative max-w-xs">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/40 font-bold text-[14px]">€</span>
                                                    <input
                                                        type="text"
                                                        value={customAmount}
                                                        onChange={handleCustomAmountChange}
                                                        placeholder="0.00"
                                                        className={`w-full h-12 pl-8 pr-4 bg-surface-light rounded-lg text-[14px] font-bold transition-all duration-200 focus:outline-none ${customAmount
                                                                ? 'border border-brand/50 text-brand'
                                                                : 'border border-surface-lighter text-brand/60 focus:border-brand/30 hover:border-brand/20'
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="relative">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="sticky top-8 bg-surface border border-surface-lighter rounded-lg p-6 flex flex-col"
                        >
                            <h2 className="text-[16px] font-bold text-brand mb-6">Payment Summary</h2>

                            <div className="space-y-4 flex-1">
                                <div className="flex items-center justify-between pb-4 border-b border-surface-lighter">
                                    <span className="text-[11px] font-bold text-brand/40 uppercase tracking-widest">Current Balance</span>
                                    <span className="text-[12px] font-bold text-brand">{balance || 0} {currencyName || 'Credits'}</span>
                                </div>

                                <div className="flex items-center justify-between pb-4 border-b border-surface-lighter">
                                    <span className="text-[11px] font-bold text-brand/40 uppercase tracking-widest">Selected Method</span>
                                    <span className="text-[12px] font-bold text-brand">
                                        {selectedMethod ? PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name : 'None'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pb-4 border-b border-surface-lighter">
                                    <span className="text-[11px] font-bold text-brand/40 uppercase tracking-widest">Amount to Add</span>
                                    <span className="text-[14px] font-bold text-brand">
                                        {selectedAmount ? `€${selectedAmount}` : '—'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-[12px] font-bold text-brand uppercase tracking-widest">Total to Pay</span>
                                    <span className="text-[18px] font-bold text-brand">
                                        {selectedAmount ? `€${selectedAmount}` : '—'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-surface-lighter">
                                <Button
                                    onClick={handleProceed}
                                    disabled={!selectedMethod || (!selectedAmount && !customAmount) || isProcessing}
                                    className="w-full h-12 bg-brand text-surface hover:bg-brand/90 transition-all rounded-lg font-bold text-[11px] uppercase tracking-widest group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                                >
                                    {isProcessing ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-surface/20 border-t-surface rounded-full animate-spin" />
                                            Processing...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            Proceed to Payment
                                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </Button>
                                <p className="text-[9px] font-bold text-brand/30 uppercase tracking-widest mt-4 text-center leading-relaxed">
                                    By proceeding, you agree to our Terms of Service & Refund Policy. Secure, encrypted checkout.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

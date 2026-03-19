import { useState } from "react";
import { X, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import CenterModal from "@/components/modals/center-modal";

const PAYMENT_METHODS = [
    {
        id: "paypal",
        image: "/paypal.png",
        description: "avg arrival time : instant",
        recommended: true
    },
    {
        id: "paysafecard",
        image: "/paysafe.png",
        description: "avg arrival time : 1 - 2 mins",
        recommended: false
    },
    {
        id: "crypto",
        image: "/crypto.png",
        description: "avg arrival time : 5 - 10 mins",
        recommended: false
    },
    {
        id: "upi",
        image: "/upi.png",
        description: "avg arrival time : instant",
        recommended: false
    }
];

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

const variants = {
    enter: (direction) => ({
        x: direction > 0 ? 20 : -20,
        opacity: 0
    }),
    center: {
        x: 0,
        opacity: 1
    },
    exit: (direction) => ({
        x: direction < 0 ? 20 : -20,
        opacity: 0
    })
};

export default function AddCredits({ isOpen, onClose }) {
    const { balance, currencyName } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [direction, setDirection] = useState(0);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProceed = () => {
        if (currentStep < 3) {
            setDirection(1);
            setCurrentStep(currentStep + 1);
        } else {
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                onClose();
            }, 2000);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setDirection(-1);
            setCurrentStep(currentStep - 1);
        }
    };

    const renderStepIndicator = () => (
        <div className="flex gap-1.5 mb-6">
            {[1, 2, 3].map((step) => (
                <div
                    key={step}
                    className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${step <= currentStep ? 'bg-brand' : 'bg-brand/10'
                        }`}
                />
            ))}
        </div>
    );

    return (
        <CenterModal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-[520px]"
        >
            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center">
                        <h2 className="text-[16px] font-bold text-brand tracking-tight">Add Credits</h2>
                        <span className="ml-3 text-[10px] font-bold text-brand/40 uppercase tracking-widest mt-0.5">({currentStep} Of 3)</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-brand/20 hover:text-brand hover:bg-brand/5 transition-all cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {renderStepIndicator()}

                <div className="relative overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction} initial={false}>
                        <motion.div
                            key={currentStep}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 400, damping: 40 },
                                opacity: { duration: 0.15 }
                            }}
                            className="space-y-6"
                        >
                            {currentStep === 1 && (
                                <>
                                    <section className="space-y-3">
                                        <p className="text-[12px] font-bold text-brand/60 leading-relaxed">
                                            Select your credit amount and payment method to add credits.
                                        </p>
                                        <div className="grid grid-cols-5 gap-2">
                                            {PRESET_AMOUNTS.map((amt) => {
                                                const isSelected = selectedAmount === amt;
                                                return (
                                                    <button
                                                        key={amt}
                                                        onClick={() => setSelectedAmount(amt)}
                                                        className={`h-9 rounded-md text-[11px] font-bold transition-all cursor-pointer ${isSelected
                                                                ? 'bg-brand text-surface shadow-none'
                                                                : 'bg-surface-light border border-surface-lighter text-brand/40 hover:text-brand hover:border-brand/20'
                                                            }`}
                                                    >
                                                        €{amt}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </section>

                                    <section className="space-y-2.5 pt-1">
                                        <div className="bg-surface-light border border-surface-lighter rounded-xl p-[2px] overflow-hidden">
                                            <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col divide-y divide-surface-lighter">
                                                {PAYMENT_METHODS.map((method) => {
                                                    const isSelected = selectedMethod === method.id;
                                                    return (
                                                        <div
                                                            key={method.id}
                                                            onClick={() => setSelectedMethod(method.id)}
                                                            className={`cursor-pointer group flex items-center justify-between px-5 py-4 hover:bg-surface-light/30 transition-all ${isSelected ? 'bg-brand/[0.06]' : ''
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-4 flex-1">
                                                                <img
                                                                    src={method.image}
                                                                    alt={method.id}
                                                                    className={`${method.id === 'crypto' ? 'h-8' : 'h-7'} w-auto object-contain transition-transform group-hover:scale-105`}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[10px] font-bold text-brand/40 uppercase tracking-widest whitespace-nowrap">
                                                                    {method.description}
                                                                </span>
                                                                <div className="w-2" />
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </section>
                                </>
                            )}

                            {currentStep === 2 && (
                                <section className="space-y-4 py-4">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-bold text-brand/40 uppercase tracking-widest">Payment Details</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="p-4 rounded-xl bg-surface-light border border-surface-lighter space-y-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-brand/40 uppercase tracking-widest">Account Email / ID</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter payment account detail..."
                                                    className="w-full h-10 bg-surface border border-surface-lighter rounded-md px-3 text-[12px] text-brand placeholder:text-brand/10 focus:outline-none focus:border-brand/20 transition-all"
                                                />
                                            </div>
                                            <p className="text-[9px] font-bold text-brand/20 uppercase tracking-widest leading-relaxed">
                                                Ensure your information matches your {selectedMethod} account to avoid delays.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {currentStep === 3 && (
                                <section className="space-y-4 py-4">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-bold text-brand/40 uppercase tracking-widest">Order Summary</span>
                                    </div>
                                    <div className="rounded-xl bg-surface-light border border-surface-lighter overflow-hidden">
                                        <div className="p-5 bg-surface border-b border-surface-lighter flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-brand/20 uppercase tracking-widest">Package Value</span>
                                                <span className="text-[14px] font-bold text-brand mt-0.5">€{selectedAmount}.00 EUR</span>
                                            </div>
                                            <img
                                                src={PAYMENT_METHODS.find(m => m.id === selectedMethod)?.image}
                                                alt="method"
                                                className="h-6 w-auto object-contain"
                                            />
                                        </div>
                                        <div className="p-5 space-y-3">
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <span className="text-brand/40 uppercase tracking-tight">Transaction Fee</span>
                                                <span className="text-brand">€0.00</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] font-bold pt-3 border-t border-brand/5">
                                                <span className="text-brand/40 uppercase tracking-tight">Credits to add</span>
                                                <span className="text-brand">+{selectedAmount * 10} {currencyName}</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="pt-6 border-t border-surface-lighter flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-brand/60 uppercase tracking-widest">total amount payable</span>
                        <span className="text-[20px] font-bold text-brand tracking-tighter leading-none mt-0.5">
                            {selectedAmount ? `€${selectedAmount}.00` : '—'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {currentStep > 1 && (
                            <button
                                onClick={handleBack}
                                className="h-8 px-3 text-brand/40 hover:text-brand text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                            >
                                Back
                            </button>
                        )}
                        <Button
                            onClick={handleProceed}
                            disabled={!selectedMethod || !selectedAmount || isProcessing}
                            className="h-8 px-3 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest group disabled:opacity-30 shadow-none cursor-pointer"
                        >
                            {isProcessing ? (
                                <div className="w-3.5 h-3.5 border-2 border-surface/20 border-t-surface rounded-full animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    {currentStep === 1 ? 'Continue Payment' : currentStep === 2 ? 'Review Order' : 'Finalize Checkout'}
                                    <ArrowRight size={12} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </CenterModal>
    );
}
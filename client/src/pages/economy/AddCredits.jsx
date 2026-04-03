import { useState } from "react";
import { X, ArrowRight, CheckCircle2, Info, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import CenterModal from "@/components/modals/center-modal";

const API_BASE = "/api/v1/client";

const PAYMENT_METHODS = [
    {
        id: "paypal",
        image: "/paypal.png",
        name: "PayPal / Cards",
        description: "avg arrival time : instant",
        recommended: true
    },
    {
        id: "upi",
        image: "/upi.png",
        name: "UPI (Manual)",
        description: "avg arrival time : 10-20 mins",
        recommended: false
    },
    {
        id: "paysafecard",
        image: "/paysafe.png",
        description: "Coming Soon",
        recommended: false
    },
    {
        id: "crypto",
        image: "/crypto.png",
        description: "Coming Soon",
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
    const { balance, currencyName, refresh } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [direction, setDirection] = useState(0);
    const [selectedMethod, setSelectedMethod] = useState("paypal");
    const [selectedAmount, setSelectedAmount] = useState(10);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // UPI Specific
    const [upiData, setUpiData] = useState(null);
    const [utrNumber, setUtrNumber] = useState("");

    const handleProceed = async () => {
        if (currentStep === 1) {
            // If UPI, pre-fetch conversion data to show in Step 2
            if (selectedMethod === "upi") {
                setIsProcessing(true);
                try {
                    const res = await fetch(`${API_BASE}/payments/upi/create`, {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ amount: selectedAmount }),
                        credentials: 'include'
                    });
                    const data = await res.json();
                    if (data.paymentId) {
                        setUpiData(data);
                    } else throw new Error();
                } catch (e) {
                    alert("Failed to initiate UPI.");
                    setIsProcessing(false);
                    return;
                }
                setIsProcessing(false);
            }
            setDirection(1);
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setDirection(1);
            setCurrentStep(3);
        } else {
            // Finalize
            setIsProcessing(true);
            if (selectedMethod === "paypal") {
                try {
                    const res = await fetch(`${API_BASE}/payments/create`, {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ amount: selectedAmount }),
                        credentials: 'include'
                    });
                    const data = await res.json();
                    if (data.approvalUrl) {
                        window.location.href = data.approvalUrl;
                    } else throw new Error();
                } catch (e) {
                    alert("PayPal failed.");
                    setIsProcessing(false);
                }
            } else if (selectedMethod === "upi") {
                if (!utrNumber || utrNumber.length < 6) {
                    alert("Invalid UTR Number.");
                    setIsProcessing(false);
                    return;
                }
                try {
                    const res = await fetch(`${API_BASE}/payments/upi/submit`, {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ paymentId: upiData.paymentId, utr: utrNumber }),
                        credentials: 'include'
                    });
                    const data = await res.json();
                    if (data.success) {
                        setDirection(1);
                        setCurrentStep(4); // Success screen
                    } else throw new Error();
                } catch (e) {
                    alert("UTR Submission failed.");
                } finally {
                    setIsProcessing(false);
                }
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setDirection(-1);
            setCurrentStep(currentStep - 1);
        }
    };

    const handleClose = () => {
        setCurrentStep(1);
        setUpiData(null);
        setUtrNumber("");
        setIsProcessing(false);
        onClose();
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
        <CenterModal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-[520px]">
            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center">
                        <h2 className="text-[16px] font-bold text-foreground tracking-tight">Add Credits</h2>
                        <span className="ml-3 text-[10px] font-bold text-foreground/60 uppercase tracking-widest mt-0.5">
                            ({currentStep > 3 ? 3 : currentStep} Of 3)
                        </span>
                    </div>
                    <button onClick={handleClose} className="p-1 rounded-md text-foreground/60 hover:text-brand hover:bg-brand/5 transition-all cursor-pointer">
                        <X size={16} />
                    </button>
                </div>

                {currentStep <= 3 && renderStepIndicator()}

                <div className="relative overflow-hidden min-h-[350px]">
                    <AnimatePresence mode="wait" custom={direction} initial={false}>
                        <motion.div
                            key={currentStep}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ x: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.15 } }}
                            className="space-y-6"
                        >
                            {currentStep === 1 && (
                                <>
                                    <section className="space-y-3">
                                        <p className="text-[12px] font-bold text-foreground/60 leading-relaxed uppercase tracking-tight">
                                            Select Credit Amount
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
                                                                : 'bg-surface-light border border-surface-lighter text-foreground/60 hover:text-brand hover:border-brand/20'
                                                            }`}
                                                    >
                                                        ${amt}
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
                                                    const isLocked = !['paypal', 'upi'].includes(method.id);
                                                    return (
                                                        <div
                                                            key={method.id}
                                                            onClick={() => !isLocked && setSelectedMethod(method.id)}
                                                            className={`cursor-pointer group flex items-center justify-between px-5 py-4 hover:bg-surface-light/30 transition-all ${
                                                                isSelected ? 'bg-brand/[0.06]' : ''
                                                            } ${isLocked ? 'opacity-30 grayscale pointer-events-none' : ''}`}
                                                        >
                                                            <div className="flex items-center gap-4 flex-1">
                                                                <img
                                                                    src={method.image}
                                                                    alt={method.id}
                                                                    className={`${method.id === 'crypto' ? 'h-8' : 'h-7'} w-auto object-contain transition-transform group-hover:scale-105`}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest whitespace-nowrap">
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
                                        <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">
                                            {selectedMethod === 'upi' ? 'Scan & Pay with UPI' : 'Payment Details'}
                                        </span>
                                    </div>
                                    
                                    {selectedMethod === 'upi' ? (
                                        <div className="space-y-4 flex flex-col items-center">
                                            <div className="p-3 bg-white rounded-2xl shadow-lg border border-brand/5">
                                                <img 
                                                    src="/src/assets/qrcode.png" 
                                                    alt="QR" 
                                                    className="w-40 h-40"
                                                    onError={(e) => e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=LODGIC@UPI&pn=Lodgic&am=${upiData?.inrAmount}&cu=INR`}
                                                />
                                            </div>
                                            <div className="text-center space-y-1">
                                                <span className="text-[14px] font-bold text-foreground">Amount: ₹{upiData?.inrAmount}</span>
                                                <p className="text-[9px] font-bold text-foreground/60 uppercase tracking-widest">Scan with any UPI App (GPay, PhonePe, etc.)</p>
                                            </div>
                                            <div className="w-full space-y-2">
                                                <label className="text-[9px] font-bold text-foreground/60 uppercase tracking-widest">Transaction UTR Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="12-digit reference number"
                                                    value={utrNumber}
                                                    onChange={(e) => setUtrNumber(e.target.value)}
                                                    className="w-full h-11 bg-surface border border-surface-lighter rounded-md px-4 text-[13px] font-bold text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-brand/20"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="p-4 rounded-xl bg-surface-light border border-surface-lighter space-y-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-foreground/60 uppercase tracking-widest">Account Email / ID</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter payment account detail..."
                                                        className="w-full h-10 bg-surface border border-surface-lighter rounded-md px-3 text-[12px] text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-brand/20 transition-all"
                                                    />
                                                </div>
                                                <p className="text-[9px] font-bold text-foreground/60 uppercase tracking-widest leading-relaxed">
                                                    Ensure your information matches your {selectedMethod} account to avoid delays.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}

                            {currentStep === 3 && (
                                <section className="space-y-4 py-4">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">Order Summary</span>
                                    </div>
                                    <div className="rounded-xl bg-surface-light border border-surface-lighter overflow-hidden">
                                        <div className="p-5 bg-surface border-b border-surface-lighter flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-foreground/60 uppercase tracking-widest">Package Value</span>
                                                <span className="text-[14px] font-bold text-foreground mt-0.5">${selectedAmount}.00 USD</span>
                                            </div>
                                            <img
                                                src={PAYMENT_METHODS.find(m => m.id === selectedMethod)?.image}
                                                alt="method"
                                                className="h-6 w-auto object-contain"
                                            />
                                        </div>
                                        <div className="p-5 space-y-3">
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <span className="text-foreground/60 uppercase tracking-tight">Processing Fee</span>
                                                <span className="text-foreground">
                                                    {selectedMethod === 'upi' ? `$${(selectedAmount * 0.05).toFixed(2)}` : '$0.00'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] font-bold pt-3 border-t border-brand/5">
                                                <span className="text-foreground/60 uppercase tracking-tight">Credits to add</span>
                                                <span className="text-foreground">+{selectedAmount} {currencyName}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedMethod === 'upi' && (
                                        <div className="flex gap-2 items-center text-[9px] font-bold text-amber-500/80 uppercase tracking-tighter px-1">
                                            <Info size={12} />
                                            <span>Manual verification takes 10-20 minutes after finalization.</span>
                                        </div>
                                    )}
                                </section>
                            )}

                            {currentStep === 4 && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-12 flex flex-col items-center text-center space-y-6"
                                >
                                    <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center">
                                        <CheckCircle2 size={32} className="text-foreground" strokeWidth={3} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-[20px] font-bold text-foreground tracking-tight">Request Received</h3>
                                        <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest max-w-[280px] leading-relaxed">
                                            Our team is verifying your payment. Credits will be added shortly.
                                        </p>
                                    </div>
                                    <Button onClick={handleClose} className="h-10 bg-brand text-surface hover:bg-brand/90 font-bold uppercase tracking-[0.2em] text-[10px] rounded-xl px-10">
                                        Done
                                    </Button>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {currentStep <= 3 && (
                    <div className="pt-6 border-t border-surface-lighter flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-foreground/60 uppercase tracking-widest">total amount payable</span>
                            <span className="text-[20px] font-bold text-foreground tracking-tighter leading-none mt-0.5">
                                {selectedAmount ? `$${selectedAmount}.00` : '—'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {currentStep > 1 && (
                                <button
                                    onClick={handleBack}
                                    className="h-8 px-3 text-foreground/60 hover:text-brand text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                                >
                                    Back
                                </button>
                            )}
                            <Button
                                onClick={handleProceed}
                                disabled={!selectedMethod || !selectedAmount || isProcessing}
                                className="h-9 px-4 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[10px] uppercase tracking-widest group disabled:opacity-30 shadow-none cursor-pointer"
                            >
                                {isProcessing ? (
                                    <Loader2 className="animate-spin" size={14} />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {currentStep === 1 ? 'Continue Payment' : currentStep === 2 ? 'Review Order' : 'Finalize Checkout'}
                                        <ArrowRight size={12} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </CenterModal>
    );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CreditCard,
    Plus,
    Download,
    History,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/auth-context.jsx";
import { Button } from "@/components/ui/button";
import { 
    Card, 
    CardHeader, 
    CardTitle, 
    CardContent
} from "@/components/ui/card";
import AddCredits from "../economy/AddCredits";

const API_BASE = "/api/v1/client";

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include"
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "request_failed");
  }

  return data;
}

const Billing = () => {
    const { user, balance, currencyName, refresh } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await request('/payments');
            setPayments(res.payments || []);
        } catch (error) {
            console.error("Failed to fetch payments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paymentId = params.get('paymentId');
        const payerId = params.get('PayerID');
        const status = params.get('status');

        console.log("Billing Page Load:", { status, paymentId, payerId });

        if (status === 'success' && paymentId && payerId) {
            console.log("Detected PayPal return. Initiating execution...");
            const executePayment = async () => {
                setLoading(true);
                try {
                    const res = await request('/payments/execute', { 
                        method: 'POST', 
                        body: { paymentId, payerId } 
                    });
                    console.log("Execution successful:", res);
                    // Refresh balance and history
                    await refresh();
                    await fetchPayments();
                    // Clear params from URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                } catch (error) {
                    console.error("Execution failed:", error);
                    alert("Payment execution failed: " + error.message);
                } finally {
                    setLoading(false);
                }
            };
            executePayment();
        } else if (status === 'cancel') {
            alert("Payment was cancelled.");
            window.history.replaceState({}, document.title, window.location.pathname);
            fetchPayments();
        } else {
            fetchPayments();
        }
    }, []);

    const handleDownloadInvoice = (paymentId) => {
        window.open(`/app/billing/invoice/${paymentId}`, '_blank');
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={12} className="text-green-500" />;
            case 'pending': return <Clock size={12} className="text-amber-500" />;
            case 'failed': return <XCircle size={12} className="text-red-500" />;
            default: return null;
        }
    };

    return (
        <div className="bg-surface px-16 py-10">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[20px] font-bold text-brand tracking-tight">Billing & Finance</h1>
                    <p className="text-[11px] font-bold text-brand/40 uppercase tracking-widest mt-1">Manage your credits and transaction history</p>
                </div>
                <Button 
                    onClick={() => setIsCreditsModalOpen(true)}
                    className="h-9 px-5 bg-brand text-surface hover:bg-brand/90 transition-all rounded-md font-bold text-[11px] uppercase tracking-[0.1em] flex items-center gap-2 cursor-pointer shadow-none"
                >
                    <Plus size={14} strokeWidth={3} /> Add Credits
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card className="bg-surface-light border-surface-lighter shadow-none rounded-xl overflow-hidden col-span-1">
                    <CardHeader className="pb-2">
                        <span className="text-[9px] font-bold text-brand/40 uppercase tracking-widest">Available Balance</span>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[32px] font-bold text-brand tracking-tighter">{balance}</span>
                            <span className="text-[14px] font-bold text-brand/40 uppercase tracking-widest">{currencyName}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-brand/5 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-brand/30 uppercase tracking-tight">Exchange Rate</span>
                            <span className="text-[10px] font-bold text-brand/60">1.00 USD = 1.00 {currencyName}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-surface-light border-surface-lighter shadow-none rounded-xl overflow-hidden col-span-1 lg:col-span-2">
                    <CardHeader className="pb-2">
                        <span className="text-[9px] font-bold text-brand/40 uppercase tracking-widest">Pricing Policy</span>
                    </CardHeader>
                    <CardContent className="flex flex-col h-full justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand/20" />
                                <span className="text-[11px] font-bold text-brand/60 uppercase tracking-tight">Automated hourly billing for active instances</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand/20" />
                                <span className="text-[11px] font-bold text-brand/60 uppercase tracking-tight">Credits never expire while your account is active</span>
                            </div>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-brand/40 group cursor-pointer hover:text-brand transition-colors">
                            <span className="text-[10px] font-bold uppercase tracking-widest">View Detailed Resource Pricing</span>
                            <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <History size={14} className="text-brand/40" />
                    <span className="text-[11px] font-bold text-brand/60 uppercase tracking-widest">Transaction History</span>
                </div>

                <div className="bg-surface-light border border-surface-lighter rounded-xl px-[2px] pb-[2px]">
                    <div className="w-full">
                        <div className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr_0.5fr] px-6 py-4">
                            <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest">Transaction ID</span>
                            <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest text-center">Amount</span>
                            <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest text-center">Status</span>
                            <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest text-center">Date</span>
                            <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest text-right">Invoice</span>
                        </div>
                        <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col min-h-[300px]">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center animate-pulse gap-3">
                                    <div className="w-8 h-8 rounded-full border-2 border-brand/10 border-t-brand/40 animate-spin" />
                                    <span className="text-[10px] font-bold text-brand/20 uppercase tracking-[0.2em]">Accessing Financial Records...</span>
                                </div>
                            ) : payments.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center text-center px-4">
                                    <div className="w-12 h-12 rounded-full bg-brand/[0.03] flex items-center justify-center mb-4">
                                        <History size={20} className="text-brand/10" />
                                    </div>
                                    <span className="text-[12px] font-bold text-brand/40 italic">Transaction history is currently empty.</span>
                                </div>
                            ) : (
                                payments.map((payment) => (
                                    <div 
                                        key={payment.id} 
                                        className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr_0.5fr] px-6 py-4 hover:bg-surface-light/50 transition-colors group border-b border-surface-lighter last:border-0 items-center"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-brand uppercase tracking-tight truncate max-w-[180px]">
                                                {payment.id}
                                            </span>
                                            <span className="text-[8px] font-bold text-brand/20 uppercase tracking-tighter">{payment.provider}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[12px] font-bold text-brand">+${payment.amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-1.5">
                                            {getStatusIcon(payment.status)}
                                            <span className={`text-[10px] font-bold uppercase tracking-tight ${
                                                payment.status === 'completed' ? 'text-brand' : 'text-brand/40'
                                            }`}>
                                                {payment.status}
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[10px] font-bold text-brand/40 uppercase tracking-tight">
                                                {new Date(payment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <button 
                                                onClick={() => handleDownloadInvoice(payment.id)}
                                                disabled={payment.status !== 'completed'}
                                                className="p-2 rounded-md hover:bg-brand/5 text-brand/20 hover:text-brand transition-all disabled:opacity-0 cursor-pointer group/dl"
                                            >
                                                <Download size={14} className="group-hover/dl:scale-110 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AddCredits 
                isOpen={isCreditsModalOpen} 
                onClose={() => {
                    setIsCreditsModalOpen(false);
                    fetchPayments();
                    refresh();
                }} 
            />
        </div>
    );
};

export default Billing;

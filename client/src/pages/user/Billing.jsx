import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Download,
    History,
    CheckCircle2,
    XCircle,
    Clock,
    Rocket
} from "lucide-react";
import { useAuth } from "@/context/auth-context.jsx";
import { request } from "@/lib/request.js";

const Billing = () => {
    const { user, balance, currencyName, refresh } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

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



        if (status === 'success' && paymentId && payerId) {

            const executePayment = async () => {
                setLoading(true);
                try {
                    const res = await request('/payments/execute', { 
                        method: 'POST', 
                        body: { paymentId, payerId } 
                    });

                    await refresh();
                    await fetchPayments();

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
                    <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">Billing</h1>
                    <p className="text-[14px] font-bold text-muted-foreground mt-2">Manage your credits, transaction history and subscriptions</p>
                </div>

            </div>

            <div className="mb-8">
                <div className="px-2 mb-4">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Subscription Overview</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="border border-surface-lighter rounded-lg p-5 flex flex-col justify-between min-h-fit">
                        <h2 className="text-[16px] font-bold text-foreground mb-4">Current Plan</h2>
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <span className="inline-block px-2.5 py-0.5 rounded-md bg-surface-highlight border border-surface-lighter text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Free tier</span>
                                <p className="text-[16px] font-bold text-muted-foreground uppercase tracking-[0.1em]">$0.00 / month</p>
                            </div>
                            <button className="h-8 px-4 rounded-md bg-brand text-surface hover:bg-brand/90 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap flex items-center gap-2">
                                <Rocket size={12} strokeWidth={2.5} />
                                Upgrade
                            </button>
                        </div>
                    </div>

                    <div className="border border-surface-lighter rounded-lg p-5">
                        <h2 className="text-[16px] font-bold text-foreground mb-6">Usage Summary</h2>
                        <div className="grid grid-cols-2 gap-10">
                            <div>
                                <p className="text-[18px] font-bold text-foreground mb-2">1.7 GB / 2 GB</p>

                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex-1 h-1.5 rounded-full bg-brand/5 overflow-hidden">
                                        <div className="h-full rounded-full bg-brand" style={{ width: '85%' }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-foreground/60">85%</span>
                                </div>
                                <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">RAM Usage</p>
                            </div>
                            <div>
                                <p className="text-[18px] font-bold text-foreground mb-2">2 GB / 5 GB</p>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex-1 h-1.5 rounded-full bg-brand/5 overflow-hidden">
                                        <div className="h-full rounded-full bg-brand" style={{ width: '40%' }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-foreground/60">40%</span>
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Disk Usage</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="px-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Transaction History</span>
                </div>


                <div className="bg-surface-light border border-surface-lighter rounded-xl px-[2px] pb-[2px]">
                    <div className="w-full">
                        <div className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr_0.5fr] px-6 py-4">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Transaction ID</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center">Amount</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center">Status</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center">Date</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-right">Invoice</span>
                        </div>

                        <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col min-h-[300px]">
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center animate-pulse gap-3">
                                    <div className="w-8 h-8 rounded-full border-2 border-brand/10 border-t-brand/40 animate-spin" />
                                    <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-[0.2em]">Accessing Financial Records...</span>
                                </div>
                            ) : payments.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center text-center px-4">
                                    <div className="w-12 h-12 rounded-full bg-brand/[0.03] flex items-center justify-center mb-4">
                                        <History size={20} className="text-foreground/60" />
                                    </div>
                                    <span className="text-[12px] font-bold text-foreground/60 italic">Transaction history is currently empty.</span>
                                </div>
                            ) : (
                                payments.map((payment) => (
                                    <div 
                                        key={payment.id} 
                                        className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr_0.5fr] px-6 py-4 hover:bg-surface-light/50 transition-colors group border-b border-surface-lighter last:border-0 items-center"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-foreground uppercase tracking-tight truncate max-w-[180px]">
                                                {payment.id}
                                            </span>
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">{payment.provider}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[12px] font-bold text-foreground">+${payment.amount.toFixed(2)}</span>
                                        </div>

                                        <div className="flex items-center justify-center gap-1.5">
                                            {getStatusIcon(payment.status)}
                                            <span className={`text-[10px] font-bold uppercase tracking-tight ${
                                                payment.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'
                                            }`}>
                                                {payment.status}
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                                {new Date(payment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-end">
                                            <button 
                                                onClick={() => handleDownloadInvoice(payment.id)}
                                                disabled={payment.status !== 'completed'}
                                                className="p-2 rounded-md hover:bg-brand/5 text-foreground/60 hover:text-brand transition-all disabled:opacity-0 cursor-pointer group/dl"
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

            <div className="space-y-4 mt-8">
                <div className="flex items-center justify-between px-2">
                    <span className="text-[11px] font-bold text-foreground/60 uppercase tracking-widest">Payment Methods</span>
                    <button className="h-7 px-3 rounded-md bg-brand text-surface hover:bg-brand/90 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer">
                        + Add Method
                    </button>
                </div>

                <div className="border border-surface-lighter rounded-lg overflow-hidden">
                    <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                        <span className="text-[12px] font-bold text-foreground/60 italic">No payment methods saved.</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Billing;

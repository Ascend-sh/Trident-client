import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Search, 
    Filter, 
    MoreHorizontal, 
    ArrowRight, 
    History,
    IndianRupee,
    AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/auth-context.jsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const API_BASE = "/api/v1/client";

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include"
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || data?.message || "request_failed");
  }
  return data;
}

const AdminTransactions = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await request('/admin/payments');
            setPayments(res.payments || []);
        } catch (error) {
            console.error("Failed to fetch payments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleAction = async (paymentId, action) => {
        setProcessingId(paymentId);
        try {
            await request('/admin/payments/process', {
                method: 'POST',
                body: { paymentId, action }
            });
            await fetchPayments();
        } catch (error) {
            console.error("Action failed:", error);
            alert("Action failed: " + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'completed': return "bg-green-500/10 text-green-500 border-green-500/20";
            case 'pending': return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case 'failed': return "bg-red-500/10 text-red-500 border-red-500/20";
            default: return "bg-brand/10 text-brand border-brand/20";
        }
    };

    const StatusIcon = ({ status }) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={12} />;
            case 'pending': return <Clock size={12} />;
            case 'failed': return <XCircle size={12} />;
            default: return null;
        }
    };

    const filteredPayments = payments.filter(p => 
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.providerId && p.providerId.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="bg-surface px-16 py-10 min-h-screen">
            <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                    <h1 className="text-[24px] font-bold text-brand tracking-tighter">Financial Ledger</h1>
                    <p className="text-[10px] font-bold text-brand/30 uppercase tracking-[0.2em]">Transaction Oversight & Auditing</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/30 group-focus-within:text-brand transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search ID, User, or UTR..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-surface-light border border-surface-lighter rounded-xl h-11 pl-11 pr-5 text-[12px] font-bold text-brand placeholder:text-brand/20 focus:outline-none focus:border-brand/40 transition-all w-[300px] shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Statistics can go here */}
                <Card className="bg-brand/[0.02] border-brand/5 rounded-2xl p-6">
                    <CardContent className="p-0 space-y-2">
                        <span className="text-[9px] font-bold text-brand/40 uppercase tracking-widest">Awaiting Verification</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[32px] font-bold text-brand tracking-tighter">
                                {payments.filter(p => p.status === 'pending' && p.provider === 'upi').length}
                            </span>
                            <span className="text-[12px] font-bold text-brand/20 uppercase">Manual UPI Requests</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-surface-light border border-surface-lighter rounded-3xl p-[2px] shadow-sm">
                <div className="bg-surface rounded-[22px] overflow-hidden">
                    <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.5fr_1fr] px-8 py-5 border-b border-surface-lighter bg-surface-light/50">
                        <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest">Transaction & User</span>
                        <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest text-center">Amount (USD)</span>
                        <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest text-center">Local Amount</span>
                        <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest text-center">Provider Status</span>
                        <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest">Provider ID / UTR</span>
                        <span className="text-[9px] font-bold text-brand/30 uppercase tracking-widest text-right">Administrative Actions</span>
                    </div>

                    <div className="divide-y divide-surface-lighter min-h-[400px]">
                        {loading ? (
                            <div className="h-[400px] flex flex-col items-center justify-center gap-4 animate-pulse">
                                <div className="w-8 h-8 rounded-full border-2 border-brand/10 border-t-brand/40 animate-spin" />
                                <span className="text-[10px] font-bold text-brand/10 uppercase tracking-[0.3em]">Accessing Secured Ledger...</span>
                            </div>
                        ) : filteredPayments.length === 0 ? (
                            <div className="h-[400px] flex flex-col items-center justify-center text-center px-10 gap-3">
                                <div className="w-16 h-16 rounded-3xl bg-brand/5 flex items-center justify-center">
                                    <AlertCircle size={32} className="text-brand/10" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-[14px] font-bold text-brand/60 uppercase tracking-tight">No Transactions Found</h3>
                                    <p className="text-[11px] font-bold text-brand/30 uppercase tracking-widest">Either the database is empty or the ledger is restricted.</p>
                                </div>
                            </div>
                        ) : (
                            filteredPayments.map((p) => (
                                <div key={p.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1.5fr_1fr] px-8 py-6 hover:bg-surface-light/30 transition-all group items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-bold text-brand leading-none truncate max-w-[180px]">{p.id}</span>
                                        <span className="text-[9px] font-bold text-brand/40 uppercase tracking-tight mt-1.5 flex items-center gap-1.5">
                                            User ID: {p.userId} • <span className="text-brand/80">{p.username}</span>
                                        </span>
                                    </div>

                                    <div className="text-center font-bold text-[14px] text-brand">
                                        ${Number(p.amount).toFixed(2)}
                                    </div>

                                    <div className="text-center">
                                        {p.localAmount ? (
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-bold text-brand">{p.localCurrency} {p.localAmount}</span>
                                                <span className="text-[8px] font-bold text-brand/20 uppercase">Inc. processing fees</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-bold text-brand/20 uppercase tracking-widest">—</span>
                                        )}
                                    </div>

                                    <div className="flex justify-center">
                                        <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-tight flex items-center gap-1.5 ${getStatusStyles(p.status)}`}>
                                            <StatusIcon status={p.status} />
                                            {p.status}
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-brand/60 font-mono tracking-tight bg-surface-light px-2 py-0.5 rounded border border-surface-lighter">
                                                {p.providerId || "N/A"}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-bold text-brand/30 uppercase tracking-tighter mt-1">{p.provider} channel</span>
                                    </div>

                                    <div className="flex items-center justify-end gap-2">
                                        {p.status === 'pending' && p.provider === 'upi' ? (
                                            <>
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleAction(p.id, 'approve')}
                                                    disabled={processingId === p.id}
                                                    className="h-8 bg-green-500 hover:bg-green-600 text-surface text-[10px] font-bold uppercase px-3 rounded-lg shadow-lg shadow-green-500/10"
                                                >
                                                    {processingId === p.id ? "..." : "Approve"}
                                                </Button>
                                                <Button 
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAction(p.id, 'disapprove')}
                                                    disabled={processingId === p.id}
                                                    className="h-8 border-red-500/20 text-red-500 hover:bg-red-500/5 text-[10px] font-bold uppercase px-3 rounded-lg"
                                                >
                                                    Deny
                                                </Button>
                                            </>
                                        ) : (
                                            <span className="text-[9px] font-bold text-brand/10 uppercase tracking-[0.2em] font-italic">No Actions Available</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminTransactions;

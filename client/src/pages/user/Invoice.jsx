import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
    Download, 
    Printer, 
    ChevronLeft,
    CheckCircle2,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE = "/api/v1/client";

const Invoice = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPayment = async () => {
        try {
            const res = await fetch(`${API_BASE}/payments/${id}/invoice`, { credentials: 'include' });
            const data = await res.json();
            if (data.payment) setPayment(data.payment);
        } catch (error) {
            console.error("Failed to fetch invoice:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayment();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand/10 border-t-brand/40" />
            </div>
        );
    }

    if (!payment) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
                <p className="text-gray-500 mb-6">The requested transaction could not be located in our records.</p>
                <Button onClick={() => navigate('/app/billing')}>Return to Billing</Button>
            </div>
        );
    }

    const dateStr = new Date(payment.createdAt).toLocaleDateString();
    const invoiceNum = payment.id.replace('PAY-', 'INV-');

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans print:bg-white">
            {/* Top Toolbar - Hidden on print */}
            <div className="max-w-[850px] w-full mx-auto px-6 py-8 flex items-center justify-between print:hidden">
                <button 
                    onClick={() => navigate('/app/billing')}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors text-sm font-bold uppercase tracking-widest"
                >
                    <ChevronLeft size={16} /> Back to Billing
                </button>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={handlePrint}
                        className="h-9 px-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-gray-200 hover:bg-gray-100"
                    >
                        <Printer size={14} /> Print / Save PDF
                    </Button>
                </div>
            </div>

            {/* Invoice Container */}
            <div className="max-w-[850px] w-full mx-auto px-6 pb-20">
                <div className="bg-white border border-gray-100 shadow-sm print:border-0 print:shadow-none p-12 rounded-2xl print:p-0">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-16">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <img src="/Logo-dark.png" alt="Torqen" className="h-8 grayscale brightness-0 opacity-80" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Issuer</p>
                                <p className="text-sm font-bold text-gray-900">Torqen Hosting Ltd.</p>
                                <p className="text-sm text-gray-500">financial@torqen.com</p>
                                <p className="text-sm text-gray-500">Global Infrastructure Services</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-bold text-gray-900 tracking-tighter mb-4 uppercase">Invoice</h2>
                            <div className="space-y-2">
                                <div className="flex justify-end gap-4">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoice No.</span>
                                    <span className="text-sm font-mono font-bold text-gray-900">{invoiceNum}</span>
                                </div>
                                <div className="flex justify-end gap-4">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Issue Date</span>
                                    <span className="text-sm font-bold text-gray-900">{dateStr}</span>
                                </div>
                                <div className="flex justify-end gap-4">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-green-100">
                                        <CheckCircle2 size={10} /> {payment.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 w-full mb-12" />

                    {/* Billing Details */}
                    <div className="grid grid-cols-2 gap-12 mb-16">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Billed To</p>
                            <p className="text-sm font-bold text-gray-900">User ID: {payment.userId}</p>
                            <p className="text-sm text-gray-500">Internal Reference Customer</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Payment Method</p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-900 uppercase">{payment.provider}</span>
                                <span className="text-sm text-gray-400 font-mono text-[11px]">({payment.id})</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-16">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-900/10">
                                    <th className="py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</th>
                                    <th className="py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quantity</th>
                                    <th className="py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unit Price</th>
                                    <th className="py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="py-8">
                                        <p className="text-sm font-bold text-gray-900 mb-1">Infrastructure Credit Allocation</p>
                                        <p className="text-[11px] text-gray-400">Torqen ({payment.credits} TQN Credits)</p>
                                    </td>
                                    <td className="py-8 text-center text-sm font-bold text-gray-900">1</td>
                                    <td className="py-8 text-right text-sm font-bold text-gray-900">${payment.amount.toFixed(2)}</td>
                                    <td className="py-8 text-right text-sm font-bold text-gray-900">${payment.amount.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-16">
                        <div className="w-[300px] space-y-4">
                            <div className="flex justify-between items-center px-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subtotal</span>
                                <span className="text-sm font-bold text-gray-900">${payment.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center px-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tax (VAT 0%)</span>
                                <span className="text-sm font-bold text-gray-900">$0.00</span>
                            </div>
                            <div className="h-px bg-gray-900/10 w-full my-2" />
                            <div className="flex justify-between items-center bg-gray-900 p-4 rounded-xl">
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Total Amount</span>
                                <span className="text-xl font-bold text-white tracking-tighter">${payment.amount.toFixed(2)} USD</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100/50 flex items-start gap-4">
                        <ShieldCheck size={18} className="text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-[11px] font-bold text-gray-900 uppercase tracking-tight mb-1">Electronic Payment Authentication</p>
                            <p className="text-[10px] leading-relaxed text-gray-500 uppercase tracking-tighter">
                                This document serves as a digital receipt for services rendered. Verified by Torqen Infrastructure Services. 
                                Payment received via {payment.provider} portal.
                            </p>
                        </div>
                    </div>

                    <div className="mt-20 text-center">
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">Thank you for using Torqen</p>
                    </div>
                </div>
            </div>

            {/* Print specific CSS */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { margin: 0; }
                    body { margin: 1.6cm; }
                    .print\\:hidden { display: none !important; }
                    .print\\:border-0 { border: 0 !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:bg-white { background: white !important; }
                }
            ` }} />
        </div>
    );
};

export default Invoice;

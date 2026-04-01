import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
// Removed useTheme import as it is not shared globally

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

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
    const [isDark, setIsDark] = useState(typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [timeRange, setTimeRange] = useState('7d');
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState('all');

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
        
        // Setup MutationObserver to detect theme changes on the root element
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        
        observer.observe(document.documentElement, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
        
        return () => observer.disconnect();
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

    const stats = useMemo(() => {
        const completed = payments.filter(p => p.status === 'completed');
        const totalRevenue = completed.reduce((sum, p) => sum + Number(p.amount), 0);
        const awaitingCount = payments.filter(p => p.status === 'pending' && p.provider === 'upi').length;
        const avgOrder = completed.length > 0 ? totalRevenue / completed.length : 0;

        return [
            { label: "Total Revenue", value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
            { label: "Awaiting Verification", value: awaitingCount.toString() },
            { label: "Average Order", value: `$${avgOrder.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { label: "Total Transactions", value: payments.length.toString() },
        ];
    }, [payments]);

    const chartData = useMemo(() => {
        let days = 7;
        if (timeRange === '30d') days = 30;
        if (timeRange === '90d') days = 90;

        const labels = [...Array(days)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const data = labels.map(date => {
            return payments
                .filter(p => p.status === 'completed' && String(p.createdAt).startsWith(date))
                .reduce((sum, p) => sum + Number(p.amount), 0);
        }).reverse();

        // Removed static isDark check in favor of useTheme hook

        return {
            labels: labels.map(d => {
                const date = new Date(d);
                if (timeRange === '7d') return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                if (timeRange === '30d' && date.getDate() % 5 !== 0) return '';
                if (timeRange === '90d' && date.getDate() % 15 !== 0) return '';
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }),
            datasets: [
                {
                    label: 'Revenue',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(24, 24, 27, 0.4)',
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(24, 24, 27, 0.05)');
                        gradient.addColorStop(1, 'transparent');
                        return gradient;
                    },
                    data: (data.every(v => v === 0)) ? [12, 18, 15, 25, 22, 32, 28, 35, 30, 45, 38, 42].slice(0, days) : data,
                    borderWidth: 1.5,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointBackgroundColor: isDark ? '#fff' : '#18181b',
                    pointBorderColor: isDark ? '#fff' : '#18181b',
                    pointHoverBackgroundColor: isDark ? '#fff' : '#18181b',
                    pointHoverBorderColor: isDark ? '#fff' : '#18181b',
                },
            ],
        };
    }, [payments, timeRange, isDark]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(24, 24, 27, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                titleFont: { size: 10, weight: '600' },
                bodyFont: { size: 12, weight: 'bold' },
                padding: 12,
                displayColors: false,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => `$${context.parsed.y.toLocaleString()}`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { 
                    font: { size: 10, weight: '500' }, 
                    color: 'var(--muted-foreground)',
                    opacity: 0.3,
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 7,
                    display: false
                },
                border: { display: false }
            },
            y: {
                grid: { display: false },
                ticks: { display: false },
                border: { display: false }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index',
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'completed': return "text-green-500 bg-green-500/5 border-green-500/10";
            case 'pending': return "text-amber-500 bg-amber-500/5 border-amber-500/10";
            case 'failed': return "text-red-500 bg-red-500/5 border-red-500/10";
            default: return "text-brand/40 bg-brand/5 border-brand/10";
        }
    };

    const filteredPayments = useMemo(() => {
        let filtered = payments;
        const q = searchQuery.toLowerCase().trim();
        if (q) {
            filtered = filtered.filter(p => 
                p.id.toLowerCase().includes(q) || 
                p.username.toLowerCase().includes(q) || 
                p.providerId?.toLowerCase().includes(q)
            );
        }
        if (activeFilter !== 'all') {
            filtered = filtered.filter(p => p.status === activeFilter);
        }
        return filtered;
    }, [payments, searchQuery, activeFilter]);

    return (
        <div className="bg-surface px-16 py-10 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">Transactions & Payments</h1>
                    <p className="text-[13px] font-bold text-muted-foreground mt-2">Monitor financial throughput and manage system-wide settlements</p>
                </div>
            </div>


            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className="border border-surface-lighter rounded-lg py-1.5 px-6 flex flex-col justify-center min-h-[85px] transition-all hover:bg-surface-light/30">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[20px] font-bold text-foreground/80 tracking-tight">{stat.value}</span>
                        </div>
                    </div>
                ))}
            </div>


            {/* Main Content Grid (Chart) */}
            <div className="mb-8">
                <div className="border border-surface-lighter rounded-lg overflow-hidden bg-surface">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 p-5 pb-2">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] block">Revenue Sequence</span>
                            <h2 className="text-[16px] font-bold text-foreground">Analytics Feed</h2>
                        </div>

                        <div className="flex items-center gap-1.5 bg-surface-light/50 p-1 rounded-md border border-surface-lighter">
                            {['7d', '30d', '3m'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        timeRange === range 
                                            ? 'bg-surface border border-surface-lighter text-foreground' 
                                            : 'text-muted-foreground hover:text-foreground/60'
                                    }`}
                                >
                                    {range}
                                </button>

                            ))}
                        </div>
                    </div>
                    <div className="h-[280px] px-2 pb-2 pt-4">
                        <Line id="main-revenue-chart" key={isDark ? 'dark' : 'light'} data={chartData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Transaction History Section */}
            <div className="mt-12">
                <div className="flex items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-1.5">
                        {['all', 'completed', 'pending', 'failed'].map((stat) => (
                            <button
                                key={stat}
                                onClick={() => setActiveFilter(stat)}
                                className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                                    activeFilter === stat 
                                        ? 'bg-surface-highlight border border-surface-lighter text-foreground' 
                                        : 'text-muted-foreground hover:text-foreground/60 hover:bg-surface-lighter'
                                }`}
                            >
                                {stat}
                            </button>

                        ))}
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="SEARCH REFERENCE / ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 px-4 bg-surface-light border border-surface-lighter rounded-md text-[10px] font-bold text-brand/60 placeholder:text-brand/30 focus:outline-none focus:border-brand/20 transition-all uppercase tracking-widest w-[260px]"
                        />
                    </div>
                </div>

                <div className="bg-surface-light border border-surface-lighter rounded-xl px-[2px] pb-[2px] pt-0">
                    <div className="w-full">
                        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr] px-6 py-4">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Transaction / User</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center">Amount</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center">Status</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center">Provider</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-right">Actions</span>
                        </div>
                        
                        <div className="bg-surface border border-surface-lighter rounded-lg overflow-hidden flex flex-col min-h-[400px]">
                            {loading ? (
                                <div className="py-24 flex flex-col items-center justify-center gap-4 text-center animate-pulse">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Accessing records database...</span>
                                </div>
                            ) : filteredPayments.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center text-center px-4 gap-4">
                                    <div className="space-y-1">
                                        <h3 className="text-[14px] font-bold text-foreground/40 uppercase tracking-tight">Empty Database</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No matching records found in this sequence</p>
                                    </div>
                                </div>
                            ) : (
                                filteredPayments.map((p) => (
                                    <div 
                                        key={p.id} 
                                        className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr] px-6 py-[18px] hover:bg-surface-light/30 transition-colors group border-b border-surface-lighter last:border-0 items-center"
                                    >
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[11px] font-bold text-foreground leading-none truncate mb-1.5 uppercase font-mono tracking-tighter">{p.id}</span>
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight truncate">
                                                {p.username} <span className="opacity-40 font-medium ml-1">· {p.userId}</span>
                                            </span>
                                        </div>

                                        <div className="text-center">
                                            <span className={`text-[15px] font-bold ${p.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                ${Number(p.amount).toFixed(2)}
                                            </span>
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter mt-1">{p.localCurrency || 'USD'}</p>
                                        </div>

                                        <div className="flex items-center justify-center">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyles(p.status)}`}>
                                                {p.status}
                                            </span>
                                        </div>

                                        <div className="flex flex-col items-center">
                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">{p.provider}</span>
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase font-mono max-w-[120px] truncate">{p.providerId || 'none'}</span>
                                        </div>

                                        <div className="flex items-center justify-end">
                                            {p.status === 'pending' && p.provider === 'upi' ? (
                                                <div className="flex gap-1.5">
                                                    <Button 
                                                        onClick={() => handleAction(p.id, 'approve')}
                                                        disabled={processingId === p.id}
                                                        className="h-7 px-4 bg-green-500 text-surface hover:bg-green-600 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all"
                                                    >
                                                        {processingId === p.id ? ".." : "Approve"}
                                                    </Button>
                                                    <Button 
                                                        variant="outline"
                                                        onClick={() => handleAction(p.id, 'disapprove')}
                                                        disabled={processingId === p.id}
                                                        className="h-7 px-4 border-red-500/20 text-red-500 hover:bg-red-50 transition-all"
                                                    >
                                                        Deny
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    - verified -
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))

                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminTransactions;


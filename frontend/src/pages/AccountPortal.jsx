import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Wallet, TrendingUp, Search, Clock,
    ArrowUpRight, Users, CreditCard, ChevronRight,
    Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';

const AccountPortal = () => {
    const [fees, setFees] = useState([]);
    const [summary, setSummary] = useState({ total_revenue: 0, pending_dues: 0, receipts_generated: 0 });
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [recordingPayment, setRecordingPayment] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const { user } = useAuth();

    const fetchData = async () => {
        try {
            const [feesRes, summaryRes] = await Promise.all([
                api.get('/staff/fee-status'),
                api.get('/staff/financial-summary')
            ]);
            setFees(feesRes.data);
            setSummary(summaryRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
        if (user?.id) {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//localhost:8000/ws/${user.id}`;
            const socket = new WebSocket(wsUrl);
            socket.onmessage = (event) => {
                if (event.data === 'FEES_UPDATED') fetchData();
            };
            return () => socket.close();
        }
    }, [user?.id]);

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/staff/record-payment', null, {
                params: { student_id: recordingPayment.student_id, amount: parseFloat(paymentAmount) }
            });
            setRecordingPayment(null);
            setPaymentAmount('');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || "Payment failed");
        } finally {
            setLoading(false);
        }
    };

    const filtered = fees.filter(f => {
        const nameStr = (f.student_name || '').toLowerCase();
        const idStr = (f.student_id?.toString() || '');
        const searchStr = searchTerm.toLowerCase();
        return nameStr.includes(searchStr) || idStr.includes(searchStr);
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-text flex items-center">
                        <Wallet className="mr-3 h-8 w-8 text-ブランド-primary text-brand-primary" />
                        Accounts Section
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">Fee processing, revenue tracking, and ledger management</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text" placeholder="Find student ledger..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all shadow-sm"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Revenue', val: `₹${summary.total_revenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Outstandings', val: `₹${summary.pending_dues.toLocaleString()}`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Receipts', val: summary.receipts_generated, icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Accounts', val: fees.length, icon: Users, color: 'text-slate-600', bg: 'bg-slate-50' }
                ].map((s, i) => (
                    <div key={i} className="bg-brand-card p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
                        <div className={`${s.bg} p-2 rounded-xl w-fit mb-4`}>
                            <s.icon className={`h-5 w-5 ${s.color}`} />
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
                        <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</p>
                    </div>
                ))}
            </div>

            <div className="bg-brand-card rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden min-h-[500px]">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
                    <h3 className="font-black text-brand-text uppercase tracking-tight text-sm">Student Ledgers</h3>
                    <span className="text-xs font-bold text-slate-400 tracking-tight italic">Last updated: Just now</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5">Full Name</th>
                                <th className="px-8 py-5">Student UID</th>
                                <th className="px-8 py-5">Course Fee</th>
                                <th className="px-8 py-5">Paid Amount</th>
                                <th className="px-8 py-5">Dues</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filtered.map(f => (
                                <tr key={f.id} className="hover:bg-brand-primary/[0.02] transition-colors group">
                                    <td className="px-8 py-6 font-bold text-brand-text flex items-center">
                                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black mr-3 uppercase text-slate-400 shadow-sm border border-brand-primary/[0.05]">
                                            {f.student_name[0]}
                                        </div>
                                        {f.student_name}
                                    </td>
                                    <td className="px-8 py-6 text-slate-400 font-mono tracking-tighter">#{f.student_id}</td>
                                    <td className="px-8 py-6 font-bold">₹{f.total_amount.toLocaleString()}</td>
                                    <td className="px-8 py-6 text-emerald-600 font-bold">₹{f.paid_amount.toLocaleString()}</td>
                                    <td className="px-8 py-6">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight ${f.due_amount === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {f.due_amount === 0 ? 'Fully Paid' : `₹${f.due_amount.toLocaleString()} DUE`}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {f.due_amount > 0 ? (
                                            <button
                                                onClick={() => { setRecordingPayment(f); setPaymentAmount(f.due_amount); }}
                                                className="px-5 py-2.5 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand-primary/10 hover:scale-105 active:scale-95 transition-all flex items-center ml-auto"
                                            >
                                                <ArrowUpRight className="h-3 w-3 mr-2" /> Record
                                            </button>
                                        ) : (
                                            <div className="flex items-center justify-end text-emerald-600 font-black text-[10px] uppercase italic">
                                                <CheckCircle2 className="h-4 w-4 mr-2" /> Clearance OK
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {recordingPayment && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-brand-primary/10">
                        <div className="p-8 border-b border-slate-100 bg-brand-primary/[0.02] flex items-center">
                            <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center mr-4">
                                <CreditCard className="h-6 w-6 text-brand-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-brand-text uppercase tracking-tight">Record Payment</h3>
                                <p className="text-xs text-slate-400 font-medium">Processing entry for {recordingPayment.student_name}</p>
                            </div>
                        </div>
                        <form onSubmit={handleRecordPayment} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Amount to pay (₹)</label>
                                <input
                                    type="number" required max={recordingPayment.due_amount}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 outline-none font-bold text-lg"
                                    value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                                <div className="mt-2 flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg w-fit">
                                    <AlertCircle className="h-3 w-3 mr-1.5" />
                                    Maximum allowed: ₹{recordingPayment.due_amount.toLocaleString()}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button" onClick={() => setRecordingPayment(null)}
                                    className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all font-inter"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={loading}
                                    className="flex-3 px-8 py-4 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center min-w-[140px]"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountPortal;

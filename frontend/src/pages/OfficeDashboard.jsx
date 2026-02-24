import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    CreditCard,
    DollarSign,
    FileText,
    ArrowUpRight,
    CheckCircle,
    Clock,
    Download,
    Users,
    UserPlus,
    UserCheck,
    UserX,
    ShieldAlert,
    Check,
    X
} from 'lucide-react';

const OfficeDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('accounts');

    // Accounts State
    const [fees, setFees] = useState([]);
    const [financialStats, setFinancialStats] = useState(null);
    const [loadingAccounts, setLoadingAccounts] = useState(false);

    // Admissions State
    const [admissions, setAdmissions] = useState([]);
    const [loadingAdmissions, setLoadingAdmissions] = useState(false);

    // Admin/Leaves State
    const [leaves, setLeaves] = useState([]);
    const [loadingLeaves, setLoadingLeaves] = useState(false);

    useEffect(() => {
        if (activeTab === 'accounts') {
            fetchFinancialData();
        } else if (activeTab === 'admissions') {
            fetchAdmissions();
        } else if (activeTab === 'admin') {
            fetchLeaves();
        }

        // Establish Real-Time WebSocket Connection
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//localhost:8000/ws/${user?.id || 1}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => console.log('Office WS Connected');
        socket.onmessage = (event) => {
            const msg = event.data;
            if (msg === 'FEES_UPDATED' && activeTab === 'accounts') fetchFinancialData();
            if (msg === 'ADMISSIONS_UPDATED' && activeTab === 'admissions') fetchAdmissions();
            if (msg === 'LEAVES_UPDATED' && activeTab === 'admin') fetchLeaves();
        };
        socket.onclose = () => console.log('Office WS Disconnected');

        return () => socket.close();
    }, [activeTab, user?.id]);

    // --- Data Fetchers ---
    const fetchFinancialData = async () => {
        try {
            const [feesRes, statsRes] = await Promise.all([
                api.get('/office/fee-status'),
                api.get('/office/financial-summary')
            ]);
            setFees(feesRes.data);
            setFinancialStats(statsRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAdmissions = async () => {
        try {
            const res = await api.get('/office/admissions');
            setAdmissions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchLeaves = async () => {
        try {
            const res = await api.get('/office/leaves');
            setLeaves(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // --- Actions ---
    const recordPayment = async (studentId) => {
        const amount = prompt("Enter payment amount:");
        if (!amount || isNaN(amount)) return;

        setLoadingAccounts(true);
        try {
            await api.post(`/office/record-payment?student_id=${studentId}&amount=${parseFloat(amount)}`);
            fetchFinancialData();
            alert("Payment recorded successfully!");
        } catch (err) {
            alert("Error recording payment");
        } finally {
            setLoadingAccounts(false);
        }
    };

    const handleAdmissionAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this admission?`)) return;
        setLoadingAdmissions(true);
        try {
            const res = await api.post(`/office/admissions/${id}/${action}`);
            alert(res.data.message + (res.data.temp_password ? ` Temp Password: ${res.data.temp_password}` : ''));
            fetchAdmissions();
        } catch (err) {
            alert(`Error processing admission: ${err.response?.data?.detail || err.message}`);
        } finally {
            setLoadingAdmissions(false);
        }
    };

    const handleLeaveAction = async (id, actionStatus) => {
        setLoadingLeaves(true);
        try {
            await api.post(`/office/leaves/${id}/action`, { status: actionStatus });
            fetchLeaves();
            alert(`Leave ${actionStatus} successfully`);
        } catch (err) {
            alert(`Error processing leave: ${err.response?.data?.detail || err.message}`);
        } finally {
            setLoadingLeaves(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header & Navigation Elements */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600 uppercase tracking-tight">
                        Administration Hub
                    </h2>
                    <p className="text-slate-400 mt-1">Manage accounts, prospective students, and office approvals.</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-xl">
                    {['accounts', 'admissions', 'admin'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 flex items-center gap-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {tab === 'accounts' && <DollarSign size={16} />}
                            {tab === 'admissions' && <UserPlus size={16} />}
                            {tab === 'admin' && <ShieldAlert size={16} />}
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* ACCOUNTS TAB */}
            {activeTab === 'accounts' && (
                <div className="space-y-8 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg border border-emerald-500 relative overflow-hidden group">
                            <DollarSign className="absolute -top-4 -right-4 h-32 w-32 opacity-10 group-hover:scale-110 transition-transform" />
                            <p className="text-emerald-100 text-sm font-medium uppercase tracking-widest">Total Revenue</p>
                            <p className="text-4xl font-black mt-2 text-white">
                                ${financialStats?.total_revenue?.toLocaleString() || "0"}
                            </p>
                        </div>

                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Pending Dues</p>
                            <p className="text-4xl font-black mt-2 text-red-400">
                                ${financialStats?.pending_dues?.toLocaleString() || "0"}
                            </p>
                        </div>

                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Receipts Handled</p>
                            <p className="text-4xl font-black mt-2 text-cyan-400">
                                {financialStats?.receipts_generated || 0}
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-700">
                            <h3 className="text-lg font-bold">Student Fee Records</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-500 text-sm border-b border-slate-700">
                                        <th className="px-6 py-4 font-semibold uppercase tracking-wider">Student Name</th>
                                        <th className="px-6 py-4 font-semibold uppercase tracking-wider">Total Amount</th>
                                        <th className="px-6 py-4 font-semibold uppercase tracking-wider">Paid</th>
                                        <th className="px-6 py-4 font-semibold uppercase tracking-wider">Remaining</th>
                                        <th className="px-6 py-4 font-semibold uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {fees.map(fee => (
                                        <tr key={fee.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{fee.student_name}</td>
                                            <td className="px-6 py-4 text-slate-300">${fee.total_amount.toLocaleString()}</td>
                                            <td className="px-6 py-4"><span className="text-emerald-400 font-semibold">${fee.paid_amount.toLocaleString()}</span></td>
                                            <td className="px-6 py-4">
                                                <span className={`font-semibold ${fee.due_amount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    ${fee.due_amount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => recordPayment(fee.student_id)}
                                                    disabled={loadingAccounts}
                                                    className="px-4 py-2 bg-emerald-600/10 text-emerald-400 font-bold rounded-lg hover:bg-emerald-600 hover:text-white transition-all text-xs uppercase"
                                                >
                                                    Record Payment
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {fees.length === 0 && (
                                        <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No fee records found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ADMISSIONS TAB */}
            {activeTab === 'admissions' && (
                <div className="space-y-8 animate-slide-up">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                            <h3 className="text-lg font-bold flex items-center gap-2"><UserPlus size={20} className="text-indigo-400" /> Prospective Students</h3>
                        </div>
                        <div className="p-6 grid gap-4 grid-cols-1 lg:grid-cols-2">
                            {admissions.map(req => (
                                <div key={req.id} className="flex flex-col justify-between p-6 bg-slate-900 border border-slate-700 rounded-xl relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div>
                                            <h4 className="text-xl font-bold text-white">{req.first_name} {req.last_name}</h4>
                                            <p className="text-slate-400 text-sm mt-1">{req.email} • {req.phone_number}</p>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            req.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                                        <div className="bg-slate-800 p-3 rounded-lg border border-slate-700/50">
                                            <p className="text-xs text-slate-500 uppercase font-black tracking-wider">Desired Course</p>
                                            <p className="text-indigo-300 font-medium">{req.desired_course}</p>
                                        </div>
                                        <div className="bg-slate-800 p-3 rounded-lg border border-slate-700/50">
                                            <p className="text-xs text-slate-500 uppercase font-black tracking-wider">Previous GPA</p>
                                            <p className="text-white font-medium">{req.previous_gpa}</p>
                                        </div>
                                    </div>

                                    {req.status === 'Pending' && (
                                        <div className="flex gap-2 relative z-10">
                                            <button
                                                onClick={() => handleAdmissionAction(req.id, 'approve')}
                                                disabled={loadingAdmissions}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors text-sm uppercase"
                                            >
                                                <UserCheck size={18} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleAdmissionAction(req.id, 'reject')}
                                                disabled={loadingAdmissions}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-bold rounded-xl transition-all border border-red-600/20 text-sm uppercase"
                                            >
                                                <UserX size={18} /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {admissions.length === 0 && (
                                <p className="text-slate-500 col-span-full py-8 text-center bg-slate-900 rounded-xl border border-slate-800 border-dashed">No admission inquiries pending.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ADMIN / EXAM CELL TAB */}
            {activeTab === 'admin' && (
                <div className="space-y-8 animate-slide-up">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                            <h3 className="text-lg font-bold flex items-center gap-2"><ShieldAlert size={20} className="text-amber-400" /> Leave Approvals</h3>
                        </div>
                        <div className="divide-y divide-slate-700/50">
                            {leaves.map(leave => (
                                <div key={leave.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-slate-700/20 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-bold text-white text-lg">Leave Request #{leave.id}</h4>
                                            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${leave.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                leave.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                    'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                                }`}>
                                                {leave.status}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 mt-1">
                                            <span className="text-slate-300 font-medium">Reason:</span> {leave.reason}
                                        </p>
                                        <div className="flex gap-4 mt-3 text-sm">
                                            <div className="bg-slate-900 px-3 py-1.5 rounded text-slate-300 border border-slate-700">
                                                From: <span className="text-amber-300">{leave.start_date}</span>
                                            </div>
                                            <div className="bg-slate-900 px-3 py-1.5 rounded text-slate-300 border border-slate-700">
                                                To: <span className="text-amber-300">{leave.end_date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {leave.status === 'Pending' && (
                                        <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                                            <button
                                                onClick={() => handleLeaveAction(leave.id, 'Approved')}
                                                disabled={loadingLeaves}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors text-sm uppercase"
                                            >
                                                <Check size={18} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleLeaveAction(leave.id, 'Rejected')}
                                                disabled={loadingLeaves}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-bold rounded-xl transition-all border border-red-600/20 text-sm uppercase"
                                            >
                                                <X size={18} /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {leaves.length === 0 && (
                                <p className="text-slate-500 py-12 text-center">No leave requests pending.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfficeDashboard;

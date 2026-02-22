import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    CreditCard,
    DollarSign,
    FileText,
    ArrowUpRight,
    CheckCircle,
    Clock,
    Download
} from 'lucide-react';

const OfficeDashboard = () => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchFees();
    }, []);

    const fetchFees = async () => {
        try {
            const res = await api.get('/office/fee-status');
            setFees(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const recordPayment = async (studentId) => {
        const amount = prompt("Enter payment amount:");
        if (!amount) return;

        setLoading(true);
        try {
            await api.post(`/office/record-payment?student_id=${studentId}&amount=${parseFloat(amount)}`);
            fetchFees();
            alert("Payment recorded successfully!");
        } catch (err) {
            alert("Error recording payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg border border-emerald-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-emerald-100 text-sm font-medium">Total Fees Collected</p>
                            <p className="text-3xl font-extrabold mt-1 text-white">$4.2M</p>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg">
                            <DollarSign className="text-white" size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-emerald-100 text-xs">
                        <ArrowUpRight size={14} className="mr-1" /> 12% increase from last month
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">Pending Duess</p>
                            <p className="text-3xl font-extrabold mt-1 text-white">$840K</p>
                        </div>
                        <div className="bg-indigo-500/10 p-2 rounded-lg">
                            <Clock className="text-indigo-400" size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-slate-500 text-xs text-red-400">
                        Due by August 30th
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">Receipts Generated</p>
                            <p className="text-3xl font-extrabold mt-1 text-white">412</p>
                        </div>
                        <div className="bg-cyan-500/10 p-2 rounded-lg">
                            <FileText className="text-cyan-400" size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-slate-500 text-xs">
                        <CheckCircle size={14} className="mr-1 text-emerald-400" /> All records synchronized
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold">Student Fee Records</h3>
                    <div className="flex space-x-2">
                        <button className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm transition-colors flex items-center">
                            <Download size={16} className="mr-2" /> Export PDF
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-sm border-b border-slate-700">
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Student ID</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Total Amount</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Paid</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Remaining</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {fees.map(fee => (
                                <tr key={fee.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{fee.student_id}</td>
                                    <td className="px-6 py-4 text-slate-300">${fee.total_amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-emerald-400 font-semibold">${fee.paid_amount.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-semibold ${fee.due_amount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            ${fee.due_amount.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => recordPayment(fee.student_id)}
                                            disabled={loading}
                                            className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm underline decoration-indigo-500/30 underline-offset-4"
                                        >
                                            Record Payment
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OfficeDashboard;

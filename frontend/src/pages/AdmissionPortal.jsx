import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    UserPlus, CheckCircle2, X, ClipboardList, Search,
    GraduationCap, Clock, Mail, Phone, Calculator
} from 'lucide-react';

const AdmissionPortal = () => {
    const [admissions, setAdmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();

    const fetchAdmissions = async () => {
        try {
            const res = await api.get('/staff/admissions');
            setAdmissions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAdmissions();
        if (user?.id) {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//localhost:8000/ws/${user.id}`;
            const socket = new WebSocket(wsUrl);
            socket.onmessage = (event) => {
                if (event.data === 'ADMISSIONS_UPDATED') fetchAdmissions();
            };
            return () => socket.close();
        }
    }, [user?.id]);

    const handleAction = async (id, action) => {
        setLoading(true);
        try {
            await api.post(`/staff/admissions/${id}/${action}`);
            fetchAdmissions();
        } catch (err) {
            alert(err.response?.data?.detail || "Action failed");
        } finally {
            setLoading(false);
        }
    };

    const filtered = admissions.filter(a => {
        const nameStr = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
        const emailStr = (a.email || '').toLowerCase();
        const searchStr = searchTerm.toLowerCase();
        return nameStr.includes(searchStr) || emailStr.includes(searchStr);
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-text flex items-center">
                        <GraduationCap className="mr-3 h-8 w-8 text-brand-primary" />
                        Admission Desk
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">Reviewing new student applications and seeding accounts</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text" placeholder="Find applicant..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all shadow-sm"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Apps', val: admissions.length, icon: ClipboardList, color: 'text-brand-primary', bg: 'bg-indigo-50' },
                    { label: 'Pending', val: admissions.filter(a => a.status === 'Pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Processed', val: admissions.filter(a => a.status !== 'Pending').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                ].map((s, i) => (
                    <div key={i} className="bg-brand-card p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center">
                        <div className={`${s.bg} p-3 rounded-2xl mr-4`}>
                            <s.icon className={`h-6 w-6 ${s.color}`} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
                            <p className="text-2xl font-black text-brand-text">{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-brand-card rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                    <h3 className="font-black text-brand-text uppercase tracking-tight text-sm">Application Stream</h3>
                </div>
                <div className="flex flex-col divide-y divide-slate-100">
                    {filtered.map(a => (
                        <div key={a.id} className="p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:bg-slate-50/50 transition-all group">
                            <div className="flex items-center flex-1">
                                <div className="h-16 w-16 bg-white border-2 border-slate-100 rounded-[1.5rem] flex items-center justify-center text-2xl font-black text-brand-primary shadow-sm group-hover:scale-110 transition-transform">
                                    {a.first_name[0]}
                                </div>
                                <div className="ml-5">
                                    <h4 className="text-lg font-black text-brand-text">{a.first_name} {a.last_name}</h4>
                                    <div className="flex flex-wrap gap-4 mt-1">
                                        <span className="flex items-center text-xs font-bold text-slate-400"><Mail className="h-3 w-3 mr-1" /> {a.email}</span>
                                        <span className="flex items-center text-xs font-bold text-slate-400"><Phone className="h-3 w-3 mr-1" /> {a.phone_number}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-start lg:items-center gap-2 flex-1">
                                <span className="bg-indigo-100/50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    {a.desired_course}
                                </span>
                                <div className="flex items-center text-sm font-bold text-brand-text">
                                    <Calculator className="h-4 w-4 mr-2 text-slate-400" />
                                    GPA: {a.previous_gpa}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full lg:w-auto">
                                {a.status === 'Pending' ? (
                                    <>
                                        <button
                                            onClick={() => handleAction(a.id, 'approve')}
                                            disabled={loading}
                                            className="flex-1 lg:flex-none px-8 py-3 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            Approve & Seed
                                        </button>
                                        <button
                                            onClick={() => handleAction(a.id, 'reject')}
                                            disabled={loading}
                                            className="flex-1 lg:flex-none px-8 py-3 bg-white border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                                        >
                                            Reject
                                        </button>
                                    </>
                                ) : (
                                    <div className={`px-6 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center ${a.status === 'Approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'
                                        }`}>
                                        {a.status === 'Approved' ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                                        {a.status}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="p-20 text-center">
                            <p className="text-slate-300 italic font-medium">No admission records matching your search</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdmissionPortal;

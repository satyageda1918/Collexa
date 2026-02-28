import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Users,
    Settings,
    ShieldCheck,
    UserPlus,
    Search,
    MoreVertical,
    Check,
    X,
    Loader2,
    ClipboardList,
    GraduationCap,
    Wallet,
    AlertCircle,
    CheckCircle2,
    Clock
} from 'lucide-react';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [admissions, setAdmissions] = useState([]);
    const [fees, setFees] = useState([]);
    const [stats, setStats] = useState({ total_students: 0, total_faculty: 0, system_status: 'Checking...', active_sessions: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'STUDENT',
        department: '', year: '', section: '', phone_number: '', address: ''
    });

    const refreshData = async () => {
        try {
            const [usersRes, leavesRes, statsRes, admissionsRes, feesRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/office/leaves'), // Admin can use office endpoints
                api.get('/admin/dashboard-stats'),
                api.get('/office/admissions'),
                api.get('/office/fee-status')
            ]);
            setUsers(usersRes.data);
            setLeaves(leavesRes.data);
            setStats(statsRes.data);
            setAdmissions(admissionsRes.data);
            setFees(feesRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        refreshData();
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//localhost:8000/ws/${user?.id || 1}`;
        const socket = new WebSocket(wsUrl);
        socket.onmessage = (event) => {
            if (['USERS_UPDATED', 'LEAVES_UPDATED', 'FEES_UPDATED', 'ADMISSIONS_UPDATED'].includes(event.data)) {
                refreshData();
            }
        };
        return () => socket.close();
    }, [user?.id]);

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingUser) {
                const payload = { ...formData };
                if (payload.password === '********') delete payload.password;
                payload.year = payload.year ? parseInt(payload.year) : null;
                await api.put(`/admin/users/${editingUser.id}`, payload);
            } else {
                await api.post('/admin/users', { ...formData, year: formData.year ? parseInt(formData.year) : 1 });
            }
            setIsModalOpen(false);
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'STUDENT', department: '', year: '', section: '', phone_number: '', address: '' });
            refreshData();
        } catch (err) {
            alert(err.response?.data?.detail || "Error saving user");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try { await api.delete(`/admin/users/${id}`); refreshData(); }
        catch (err) { alert(err.response?.data?.detail); }
    };

    const handleLeaveAction = async (id, status) => {
        try {
            await api.post(`/office/leaves/${id}/action`, { status });
            refreshData();
        } catch (err) { console.error(err); }
    };

    const handleAdmissionAction = async (id, action) => {
        try {
            await api.post(`/office/admissions/${id}/${action}`);
            refreshData();
        } catch (err) { alert(err.response?.data?.detail); }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Students', val: stats.total_students, color: 'text-brand-primary' },
                    { label: 'Faculty', val: stats.total_faculty, color: 'text-indigo-600' },
                    { label: 'Status', val: stats.system_status, color: 'text-emerald-600' },
                    { label: 'Active', val: stats.active_sessions, color: 'text-brand-text' }
                ].map((s, i) => (
                    <div key={i} className="bg-brand-card p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                        <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.val}</p>
                    </div>
                ))}
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto shadow-inner border border-slate-200/50">
                {[
                    { id: 'users', label: 'Users', icon: Users },
                    { id: 'leaves', label: 'Leaves', icon: ClipboardList },
                    { id: 'admissions', label: 'Admissions', icon: GraduationCap },
                    { id: 'fees', label: 'Finances', icon: Wallet }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-white text-brand-primary shadow-sm scale-105'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <tab.icon className={`h-4 w-4 mr-2 ${activeTab === tab.id ? 'text-brand-primary' : 'text-slate-400'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-brand-card rounded-[32px] border border-slate-200 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                {activeTab === 'users' && (
                    <>
                        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/30 gap-4">
                            <div>
                                <h3 className="text-2xl font-black text-brand-text">Directory</h3>
                                <p className="text-xs text-slate-400 font-medium tracking-tight">Manage all student, teacher, and staff accounts</p>
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text" placeholder="Search accounts..."
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all"
                                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => { setEditingUser(null); setFormData({ name: '', email: '', password: '', role: 'STUDENT', department: '', year: '', section: '', phone_number: '', address: '' }); setIsModalOpen(true); }}
                                    className="bg-brand-primary hover:bg-brand-hover text-white px-6 py-3 rounded-xl text-sm font-black flex items-center transition-all shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95"
                                >
                                    <UserPlus className="h-4 w-4 mr-2" /> CREATE
                                </button>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100 bg-white">
                            {filteredUsers.map(u => (
                                <div key={u.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                    <div className="flex items-center">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-xl font-black mr-4 uppercase text-slate-400 border border-slate-200 group-hover:bg-brand-primary group-hover:text-white group-hover:border-brand-primary transition-all">
                                            {u.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-brand-text">{u.name}</p>
                                            <div className="flex space-x-2 items-center mt-0.5">
                                                <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                                                        u.role === 'TEACHER' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-emerald-100 text-emerald-700'
                                                    }`}>{u.role}</span>
                                                <span className="text-sm text-slate-400 font-medium">{u.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => {
                                            setEditingUser(u);
                                            const p = u.student_profile || u.teacher_profile || {};
                                            setFormData({
                                                name: u.name,
                                                email: u.email,
                                                role: u.role,
                                                password: '********',
                                                department: p.department || '',
                                                year: p.year || '',
                                                section: p.section || '',
                                                phone_number: p.phone_number || '',
                                                address: p.address || ''
                                            });
                                            setIsModalOpen(true);
                                        }} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-brand-primary hover:border-brand-primary rounded-xl transition-all">
                                            <Settings className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleDeleteUser(u.id)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-600 rounded-xl transition-all">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'leaves' && (
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-brand-text">Leave Requests</h3>
                            <span className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                                {leaves.filter(l => l.status === 'Pending').length} Pending
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                            {leaves.map(l => (
                                <div key={l.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center mr-3">
                                                <Clock className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-400">Student #{l.student_id}</p>
                                                <p className="text-sm font-bold text-brand-text">Submitted {new Date(l.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${l.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>{l.status}</span>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Reason</p>
                                        <p className="text-sm text-slate-700 italic">"{l.reason}"</p>
                                        <div className="mt-3 text-xs font-bold text-slate-500 border-t border-slate-200/50 pt-2">
                                            Duration: {l.start_date} to {l.end_date}
                                        </div>
                                    </div>
                                    {l.status === 'Pending' && (
                                        <div className="flex gap-3">
                                            <button onClick={() => handleLeaveAction(l.id, 'Approved')} className="flex-1 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-black uppercase hover:bg-brand-hover transition-all flex items-center justify-center">
                                                <CheckCircle2 className="h-4 w-4 mr-2" /> APPROVE
                                            </button>
                                            <button onClick={() => handleLeaveAction(l.id, 'Rejected')} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-slate-50 transition-all flex items-center justify-center">
                                                <X className="h-4 w-4 mr-2" /> REJECT
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'admissions' && (
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-brand-text">New Admissions</h3>
                            <p className="text-xs text-slate-400 font-medium">Review and auto-generate student accounts</p>
                        </div>
                        <div className="space-y-4">
                            {admissions.map(a => (
                                <div key={a.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center flex-1">
                                        <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center mr-4 text-indigo-500 font-black">
                                            {a.first_name?.[0] || 'A'}
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-brand-text">{a.first_name} {a.last_name}</p>
                                            <div className="flex gap-3 text-xs font-medium text-slate-400 uppercase tracking-tight">
                                                <span>{a.desired_course}</span>
                                                <span className="text-slate-200 font-light">|</span>
                                                <span>GPA: {a.previous_gpa}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-10 text-xs font-bold text-slate-500">
                                        <div className="flex flex-col items-center">
                                            <p className="text-[10px] text-slate-300 uppercase mb-1">Email</p>
                                            <p>{a.email}</p>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <p className="text-[10px] text-slate-300 uppercase mb-1">Status</p>
                                            <span className={`px-2 py-0.5 rounded capitalize ${a.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{a.status}</span>
                                        </div>
                                    </div>
                                    {a.status === 'Pending' ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAdmissionAction(a.id, 'approve')} className="px-6 py-3 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/10 hover:scale-105 active:scale-95 transition-all">APPROVE & SEED</button>
                                            <button onClick={() => handleAdmissionAction(a.id, 'reject')} className="px-6 py-3 border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">REJECT</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-emerald-600 font-bold text-xs uppercase italic">
                                            <CheckCircle2 className="h-4 w-4 mr-2" /> Processed
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'fees' && (
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem]">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Revenue</p>
                                <p className="text-2xl font-black text-emerald-800 mt-1">₹{fees.reduce((acc, f) => acc + f.paid_amount, 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem]">
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Outstanding</p>
                                <p className="text-2xl font-black text-amber-800 mt-1">₹{fees.reduce((acc, f) => acc + f.due_amount, 0).toLocaleString()}</p>
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-brand-text mb-6">Fee Ledgers</h3>
                        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5">Full Name</th>
                                        <th className="px-8 py-5">UID</th>
                                        <th className="px-8 py-5">Total Fee</th>
                                        <th className="px-8 py-5">Paid</th>
                                        <th className="px-8 py-5">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {fees.map(f => (
                                        <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5 font-bold text-slate-700">{f.student_name}</td>
                                            <td className="px-8 py-5 text-slate-400 font-mono">#{f.student_id}</td>
                                            <td className="px-8 py-5 font-bold">₹{f.total_amount.toLocaleString()}</td>
                                            <td className="px-8 py-5 text-emerald-600 font-bold">₹{f.paid_amount.toLocaleString()}</td>
                                            <td className="px-8 py-5">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${f.due_amount === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {f.due_amount === 0 ? 'Clear' : `₹${f.due_amount} DUE`}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-brand-text uppercase tracking-tight">{editingUser ? 'Edit User Profile' : 'Register New User'}</h3>
                                <p className="text-xs text-slate-400 font-medium">{editingUser ? `Updating UID: ${editingUser.id}` : 'Fill in the details for a new system user'}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleUserSubmit} className="max-h-[70vh] overflow-y-auto">
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Full Name</label>
                                        <input type="text" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-primary outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Email Address</label>
                                        <input type="email" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-primary outline-none" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">{editingUser ? 'Reset Password' : 'Password'}</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-primary outline-none" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Role</label>
                                        <select className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                            <option value="STUDENT">STUDENT</option>
                                            <option value="TEACHER">TEACHER</option>
                                            <option value="ADMIN">ADMIN</option>
                                            <option value="OFFICE">OFFICE</option>
                                        </select>
                                    </div>
                                    {(formData.role === 'STUDENT' || formData.role === 'TEACHER') && (
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Dept</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-primary outline-none" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
                                        </div>
                                    )}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Phone</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-mono" value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Address</label>
                                        <textarea className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none resize-none h-20" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 border border-slate-200 bg-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 px-6 py-4 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    {loading ? 'Processing...' : (editingUser ? 'Update Database' : 'Register User')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;

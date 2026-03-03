import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Users,
    Settings,
    UserPlus,
    Search,
    X,
    CheckCircle2,
    Trash2
} from 'lucide-react';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ total_students: 0, total_faculty: 0, system_status: 'Checking...', active_sessions: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL'); // New filter state

    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'STUDENT',
        roll_number: '', department: '', year: '', section: '', phone_number: '', address: ''
    });

    const refreshData = async () => {
        try {
            const [usersRes, statsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/dashboard-stats')
            ]);
            setUsers(usersRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        refreshData();
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//localhost:8000/ws/${user?.id || 'guest'}`;
        const socket = new WebSocket(wsUrl);
        socket.onmessage = (event) => {
            if (['USERS_UPDATED'].includes(event.data)) {
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
            setFormData({ name: '', email: '', password: '', role: 'STUDENT', roll_number: '', department: '', year: '', section: '', phone_number: '', address: '' });
            refreshData();
        } catch (err) {
            alert(err.response?.data?.detail || "Error saving user");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        setLoading(true);
        try {
            await api.delete(`/admin/users/${userToDelete.id}`);
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            refreshData();
        } catch (err) {
            alert(err.response?.data?.detail || "Error deleting user");
        } finally {
            setLoading(false);
        }
    };


    const handleAdmissionAction = async (id, action) => {
        try {
            await api.post(`/staff/admissions/${id}/${action}`);
            refreshData();
        } catch (err) { alert(err.response?.data?.detail); }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

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
                    { id: 'users', label: 'User Management', icon: Users }
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
                        <div className="p-8 border-b border-slate-100 flex flex-col gap-6 bg-slate-50/30">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 className="text-2xl font-black text-brand-text">Directory</h3>
                                    <p className="text-xs text-slate-400 font-medium tracking-tight">Manage all student, teacher, and departmental accounts</p>
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

                            {/* Role Filter Badges */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'ALL', label: 'All Users', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
                                    { value: 'STUDENT', label: 'Students', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                                    { value: 'TEACHER', label: 'Teachers', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
                                    { value: 'ADMIN', label: 'Admins', color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
                                    { value: 'ADMISSION', label: 'Admission', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
                                    { value: 'EXAM', label: 'Exam Cell', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                                    { value: 'ACCOUNT', label: 'Accounts', color: 'bg-teal-100 text-teal-700 hover:bg-teal-200' }
                                ].map(filter => (
                                    <button
                                        key={filter.value}
                                        onClick={() => setRoleFilter(filter.value)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${roleFilter === filter.value
                                            ? 'ring-2 ring-brand-primary ring-offset-2 scale-105 ' + filter.color
                                            : filter.color
                                            }`}
                                    >
                                        {filter.label}
                                        <span className="ml-2 opacity-60">
                                            ({users.filter(u => filter.value === 'ALL' || u.role === filter.value).length})
                                        </span>
                                    </button>
                                ))}
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
                                        <button onClick={() => { setUserToDelete(u); setIsDeleteModalOpen(true); }} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-600 rounded-xl transition-all">
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
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
                                            <option value="ADMISSION">ADMISSION DEPT</option>
                                            <option value="EXAM">EXAM CELL</option>
                                            <option value="ACCOUNT">ACCOUNT SECTION</option>
                                        </select>
                                    </div>
                                    {(formData.role === 'STUDENT' || formData.role === 'TEACHER') && (
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Dept</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-primary outline-none" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
                                        </div>
                                    )}
                                    {formData.role === 'STUDENT' && (
                                        <>
                                            <div className="col-span-2 md:col-span-1">
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Roll Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. CS2024001"
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-primary outline-none font-mono"
                                                    value={formData.roll_number}
                                                    onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-span-2 md:col-span-1">
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Year</label>
                                                <input type="number" min="1" max="5" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} />
                                            </div>
                                            <div className="col-span-2 md:col-span-1">
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Section</label>
                                                <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none" value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} />
                                            </div>
                                        </>
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

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <div className="p-8 text-center">
                            <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="h-10 w-10 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-black text-brand-text mb-2">Are you sure?</h3>
                            <p className="text-slate-500 font-medium px-4">
                                You are about to permanently delete <span className="text-brand-text font-bold">"{userToDelete?.name}"</span> and all associated academic records. This cannot be undone.
                            </p>
                        </div>
                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                            <button
                                onClick={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
                                className="flex-1 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                            >
                                BACK OFF
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={loading}
                                className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {loading ? 'DELETING...' : 'DELETE FOREVER'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;

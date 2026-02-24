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
    X
} from 'lucide-react';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [stats, setStats] = useState({ total_students: 0, total_faculty: 0, system_status: 'Checking...', active_sessions: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'STUDENT',
        department: '',
        year: '',
        section: ''
    });

    const refreshData = async () => {
        try {
            const [usersRes, leavesRes, statsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/leave-requests'),
                api.get('/admin/dashboard-stats')
            ]);
            setUsers(usersRes.data);
            setLeaves(leavesRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        refreshData();

        // Establish Real-Time WebSocket Connection
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//localhost:8000/ws/${user?.id || 1}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => console.log('Admin WS Connected');
        socket.onmessage = (event) => {
            const msg = event.data;
            if (['USERS_UPDATED', 'LEAVES_UPDATED', 'FEES_UPDATED', 'ADMISSIONS_UPDATED'].includes(msg)) {
                console.log('Real-time update received:', msg);
                refreshData(); // Instantly refresh data on event
            }
        };
        socket.onclose = () => console.log('Admin WS Disconnected');

        return () => socket.close();
    }, [user?.id]);

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingUser) {
                await api.put(`/admin/users/${editingUser.id}`, {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role
                });
            } else {
                await api.post('/admin/users', formData);
            }
            setIsModalOpen(false);
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'STUDENT', department: '', year: '', section: '' });
            refreshData();
        } catch (err) {
            alert(err.response?.data?.detail || "Error saving user");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`/admin/users/${id}`);
            refreshData();
        } catch (err) {
            alert(err.response?.data?.detail || "Error deleting user");
        }
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setFormData({
            ...formData,
            name: user.name,
            email: user.email,
            role: user.role,
            password: '********' // Placeholder
        });
        setIsModalOpen(true);
    };

    const handleLeaveAction = async (id, status) => {
        try {
            await api.post(`/admin/leave-requests/${id}/approve?status=${status}`);
            refreshData();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-brand-card p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm">Total Students</p>
                    <p className="text-3xl font-bold mt-2 text-brand-text">{stats.total_students}</p>
                </div>
                <div className="bg-brand-card p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm">Total Faculty</p>
                    <p className="text-3xl font-bold mt-2 text-brand-text">{stats.total_faculty}</p>
                </div>
                <div className="bg-brand-card p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm">System Status</p>
                    <p className={`text-xl font-bold mt-2 ${stats.system_status.includes('Go') ? 'text-emerald-600' : 'text-amber-500'}`}>{stats.system_status}</p>
                </div>
                <div className="bg-brand-card p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm">Active Sessions</p>
                    <p className="text-3xl font-bold mt-2 text-brand-text">{stats.active_sessions}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Management */}
                <div className="bg-brand-card rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-brand-text">User Management</h3>
                        <button
                            onClick={() => { setEditingUser(null); setFormData({ name: '', email: '', password: '', role: 'STUDENT', department: '', year: '', section: '' }); setIsModalOpen(true); }}
                            className="bg-brand-primary hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
                        >
                            <UserPlus className="h-4 w-4 mr-1" /> Add User
                        </button>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                        {users.map(u => (
                            <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold mr-3 uppercase text-brand-primary border border-indigo-100">
                                        {u.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-brand-text">{u.name}</p>
                                        <p className="text-xs text-slate-500 uppercase">{u.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleEditClick(u)}
                                        className="p-2 text-slate-400 hover:text-brand-primary hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        <Settings className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leave Approvals */}
                <div className="bg-brand-card rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-brand-text">Leave Approvals</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {leaves.filter(l => l.status === "Pending").map(leave => (
                            <div key={leave.id} className="p-4 space-y-3 shadow-sm mx-4 my-2 border border-slate-50 rounded-xl">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-brand-text">Student ID: {leave.student_id}</p>
                                        <p className="text-xs text-slate-500">{new Date(leave.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleLeaveAction(leave.id, "Approved")}
                                            className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition-colors"
                                        >
                                            <Check className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleLeaveAction(leave.id, "Rejected")}
                                            className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                    "{leave.reason}"
                                </p>
                            </div>
                        ))}
                        {leaves.filter(l => l.status === "Pending").length === 0 && (
                            <div className="p-8 text-center">
                                <p className="text-slate-400 italic text-sm font-medium">No pending leave requests</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-black text-brand-text">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleUserSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                                    <input
                                        type="text" required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                                        placeholder="Enter name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                    <input
                                        type="email" required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                                        placeholder="email@college.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                {!editingUser && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Initial Password</label>
                                        <input
                                            type="text" required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 font-medium font-mono"
                                            placeholder="Enter password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">User Role</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all font-medium"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="STUDENT">STUDENT</option>
                                        <option value="TEACHER">TEACHER</option>
                                        <option value="ADMIN">ADMIN</option>
                                        <option value="OFFICE">OFFICE</option>
                                    </select>
                                </div>
                                {(formData.role === 'STUDENT' || formData.role === 'TEACHER') && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                                        <input
                                            type="text" required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                                            placeholder="e.g. CS, ME"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        />
                                    </div>
                                )}
                                {formData.role === 'STUDENT' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Current Year</label>
                                            <input
                                                type="number" required
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                                                placeholder="1-4"
                                                value={formData.year}
                                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Section</label>
                                            <input
                                                type="text" required
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                                                placeholder="A, B, C"
                                                value={formData.section}
                                                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="pt-4 flex space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-colors uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-4 bg-brand-primary text-white font-black rounded-2xl hover:bg-brand-hover transition-all shadow-lg active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
                                >
                                    {loading ? 'Processing...' : (editingUser ? 'Save Changes' : 'Create User')}
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

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    TrendingUp,
    Calendar,
    BookOpen,
    AlertTriangle,
    ChevronRight,
    QrCode,
    CreditCard,
    MessageSquare,
    ClipboardList,
    CheckCircle,
    XCircle,
    RotateCcw,
    Bell,
    Settings,
    User,
    MapPin,
    Phone,
    Mail,
    Save
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const StudentDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [profile, setProfile] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [marks, setMarks] = useState([]);
    const [fees, setFees] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        phone_number: '',
        address: ''
    });

    const [qrValue, setQrValue] = useState('');
    const [payAmount, setPayAmount] = useState('');
    const [feedback, setFeedback] = useState({ teacher_id: '', rating: 5, comment: '' });
    const [leaveRequest, setLeaveRequest] = useState({ reason: '', start_date: '', end_date: '' });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profileRes, attendanceRes, marksRes, feesRes, leavesRes, notificationsRes] = await Promise.all([
                api.get('/student/profile'),
                api.get('/student/attendance'),
                api.get('/student/marks'),
                api.get('/student/fees'),
                api.get('/student/leave-requests'),
                api.get('/student/notifications')
            ]);
            setProfile(profileRes.data);
            setProfileForm({
                name: profileRes.data.name,
                email: profileRes.data.email,
                phone_number: profileRes.data.student_profile?.phone_number || '',
                address: profileRes.data.student_profile?.address || ''
            });
            setAttendance(attendanceRes.data);
            setMarks(marksRes.data);
            setFees(feesRes.data);
            setLeaves(leavesRes.data);
            setNotifications(notificationsRes.data);

            // AI Prediction
            const attnPct = attendanceRes.data.length > 0
                ? (attendanceRes.data.filter(a => a.status === 'Present').length / attendanceRes.data.length) * 100
                : 75;

            const avgMarks = marksRes.data.length > 0
                ? marksRes.data.reduce((acc, m) => acc + m.internal_marks, 0) / marksRes.data.length
                : 80;

            const predRes = await api.post('/ai/predict', {
                attendance_pct: attnPct,
                internal_marks: avgMarks,
                assignment_scores: 8.5,
                gpa: profileRes.data.student_profile?.gpa || 3.5
            });
            setPrediction(predRes.data);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Establish Real-Time WebSocket Connection
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//localhost:8000/ws/${user?.id || 1}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => console.log('Student WS Connected');
        socket.onmessage = (event) => {
            const msg = event.data;
            if (['FEES_UPDATED', 'ATTENDANCE_UPDATED', 'LEAVES_UPDATED', 'NEW_NOTIFICATION'].includes(msg)) {
                console.log('Real-time update received:', msg);
                fetchData(); // Instantly refresh data on event
            }
        };
        socket.onclose = () => console.log('Student WS Disconnected');

        return () => socket.close();
    }, [user?.id]);

    const handleQrSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/student/mark-attendance', null, { params: { qr_code_data: qrValue } });
            alert("Attendance marked successfully!");
            setQrValue('');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || "Error marking attendance");
        }
    };

    const handleFeePayment = async (e) => {
        e.preventDefault();
        try {
            await api.post('/student/pay-fee', null, { params: { amount: parseFloat(payAmount) } });
            alert("Payment successful!");
            setPayAmount('');
            fetchData();
        } catch (err) {
            alert("Error processing payment");
        }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/student/feedback', feedback);
            alert("Feedback submitted! Thank you.");
            setFeedback({ teacher_id: '', rating: 5, comment: '' });
        } catch (err) {
            alert("Error submitting feedback");
        }
    };

    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/student/leave-request', leaveRequest);
            alert("Leave request submitted!");
            setLeaveRequest({ reason: '', start_date: '', end_date: '' });
            fetchData();
        } catch (err) {
            alert("Error submitting leave request");
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put('/student/profile', profileForm);
            alert("Profile updated successfully!");
            setIsEditingProfile(false);
            fetchData();
        } catch (err) {
            alert("Error updating profile");
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.post(`/student/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error("Error marking notification as read");
        }
    };

    const attendanceStats = {
        present: attendance.filter(a => a.status === 'Present').length,
        total: attendance.length || 100, // Fallback for UI if empty
    };

    const attendanceData = {
        labels: ['Present', 'Absent'],
        datasets: [{
            data: [attendanceStats.present, attendanceStats.total - attendanceStats.present],
            backgroundColor: ['#4f46e5', '#1e293b'],
            borderWidth: 0
        }]
    };

    if (loading) return <div className="flex items-center justify-center h-64"><RotateCcw className="animate-spin h-8 w-8 text-indigo-500" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Student Portal</h1>
                    <p className="text-slate-400 font-medium">Welcome back, {profile?.name}</p>
                </div>
                <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
                    {['overview', 'attendance', 'academics', 'fees', 'services', 'profile'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all relative"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-slate-950">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-4 w-80 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                    <h3 className="text-sm font-black uppercase tracking-widest">Notifications</h3>
                                    <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white"><XCircle size={16} /></button>
                                </div>
                                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                className={`p-6 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/30 transition-all ${!n.is_read ? 'bg-indigo-500/5' : ''}`}
                                                onClick={() => markAsRead(n.id)}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className={`text-sm font-bold ${!n.is_read ? 'text-indigo-400' : 'text-white'}`}>{n.title}</p>
                                                    {!n.is_read && <div className="h-2 w-2 bg-indigo-500 rounded-full mt-1"></div>}
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                                                <p className="text-[10px] text-slate-600 font-bold mt-2 uppercase">{new Date(n.created_at).toLocaleDateString()}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No notifications</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Based on Tabs */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                                <TrendingUp className="absolute -top-4 -right-4 h-32 w-32 opacity-10 group-hover:scale-110 transition-transform" />
                                <h3 className="text-lg font-bold opacity-80 uppercase tracking-widest">Academic Status</h3>
                                <p className="text-5xl font-black mt-4">{profile?.student_profile?.gpa || '3.8'}</p>
                                <p className="text-sm opacity-60 mt-2 font-bold uppercase">Current Cumulative GPA</p>
                            </div>
                            <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden">
                                <AlertTriangle className="absolute -top-4 -right-4 h-32 w-32 text-indigo-500/10" />
                                <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">AI Risk Level</h3>
                                <p className="text-5xl font-black mt-4 text-white uppercase italic">{prediction?.risk_level || 'LOW'}</p>
                                <p className="text-sm text-slate-500 mt-2 font-bold uppercase">Based on recent performance</p>
                            </div>
                        </div>

                        {/* Recent Activity Simulations */}
                        <div className="bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden shadow-xl">
                            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                                <h3 className="text-xl font-bold uppercase tracking-tighter">Recent Updates</h3>
                                <ChevronRight className="text-slate-600" />
                            </div>
                            <div className="divide-y divide-slate-800">
                                {marks.slice(0, 3).map((m, i) => (
                                    <div key={i} className="p-6 flex items-center hover:bg-slate-800/30 transition-colors">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                            <ClipboardList size={24} />
                                        </div>
                                        <div className="ml-6">
                                            <p className="text-base font-bold text-white">Result Published: Semester {m.semester}</p>
                                            <p className="text-sm text-slate-500 font-medium">Internal: {m.internal_marks} | External: {m.external_marks}</p>
                                        </div>
                                    </div>
                                ))}
                                {leaves.slice(0, 2).map((l, i) => (
                                    <div key={i} className="p-6 flex items-center hover:bg-slate-800/30 transition-colors">
                                        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                                            <Calendar size={24} />
                                        </div>
                                        <div className="ml-6">
                                            <p className="text-base font-bold text-white">Leave Request {l.status}</p>
                                            <p className="text-sm text-slate-500 font-medium">{l.reason}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Attendance Doughnut short */}
                        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
                            <h3 className="text-lg font-bold uppercase tracking-widest text-slate-400 mb-6">Attendance Overview</h3>
                            <div className="relative h-48 flex items-center justify-center">
                                <Doughnut data={attendanceData} options={{ cutout: '85%', plugins: { legend: { display: false } } }} />
                                <div className="absolute text-center">
                                    <p className="text-3xl font-black text-white">{Math.round((attendanceStats.present / attendanceStats.total) * 100)}%</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Avg Presence</p>
                                </div>
                            </div>
                        </div>

                        {/* QR Quick Access */}
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className="w-full bg-white text-slate-900 p-8 rounded-[2rem] font-black uppercase text-center shadow-2xl hover:scale-[1.02] transition-transform flex flex-col items-center gap-4"
                        >
                            <QrCode size={48} />
                            <span className="tracking-tighter text-xl">Quick QR Attendance</span>
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
                        <h3 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-4">
                            <QrCode className="text-indigo-500" /> QR SCANNER
                        </h3>
                        <form onSubmit={handleQrSubmit} className="space-y-6">
                            <div className="p-8 border-2 border-dashed border-slate-700 rounded-3xl flex flex-col items-center gap-6 bg-slate-950">
                                <div className="h-48 w-48 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 relative overflow-hidden">
                                    <div className="absolute top-0 w-full h-1 bg-indigo-500 animate-scan shadow-[0_0_15px_#4f46e5]"></div>
                                    <QrCode size={80} className="text-slate-700" />
                                </div>
                                <p className="text-sm text-slate-500 text-center font-bold px-4 uppercase">Simulate scanning by entering the QR code string below</p>
                            </div>
                            <input
                                type="text"
                                value={qrValue}
                                onChange={(e) => setQrValue(e.target.value)}
                                placeholder="ATTENDANCE|1|1|1"
                                className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-white font-bold focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                            />
                            <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all uppercase tracking-widest shadow-lg active:scale-95">
                                Mark Attendance
                            </button>
                        </form>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
                        <h3 className="text-2xl font-black uppercase italic mb-8">Attendance History</h3>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {attendance.length > 0 ? attendance.map((a, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${a.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {a.status === 'Present' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">Slot {a.hour_slot}</p>
                                            <p className="text-xs text-slate-500 font-bold">{a.date}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${a.status === 'Present' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {a.status}
                                    </span>
                                </div>
                            )) : <p className="text-slate-500 font-bold text-center py-20 uppercase tracking-widest">No records found</p>}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'academics' && (
                <div className="space-y-8">
                    <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden">
                        <h3 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-4">
                            <BookOpen className="text-indigo-500" /> Academic Results
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest">Semester</th>
                                        <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest">Subject ID</th>
                                        <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest">Internal</th>
                                        <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest">External</th>
                                        <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest">Total</th>
                                        <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {marks.map((m, i) => (
                                        <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                                            <td className="py-6 font-black text-white">{m.semester}</td>
                                            <td className="py-6 font-bold text-slate-400">#SUB-00{m.subject_id}</td>
                                            <td className="py-6 font-bold text-white">{m.internal_marks}</td>
                                            <td className="py-6 font-bold text-white">{m.external_marks}</td>
                                            <td className="py-6 font-black text-indigo-400">{m.internal_marks + m.external_marks}</td>
                                            <td className="py-6">
                                                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase px-2 py-1 rounded-md">Pass</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'fees' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
                        <h3 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-4">
                            <CreditCard className="text-indigo-500" /> Fee Details
                        </h3>
                        <div className="space-y-6">
                            {fees.map((f, i) => (
                                <div key={i} className="p-8 bg-slate-950 rounded-3xl border border-slate-800 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 bg-indigo-600/10 rounded-bl-3xl">
                                        <CreditCard size={20} className="text-indigo-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 relative z-10">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Total Fee</p>
                                            <p className="text-2xl font-black text-white">₹{f.total_amount}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Paid Amount</p>
                                            <p className="text-2xl font-black text-emerald-400">₹{f.paid_amount}</p>
                                        </div>
                                        <div className="col-span-2 pt-4 border-t border-slate-800">
                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1 text-center">Remaining Balance</p>
                                            <p className="text-5xl font-black text-white text-center italic">₹{f.due_amount}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
                        <h3 className="text-2xl font-black uppercase italic mb-8">Make a Payment</h3>
                        <form onSubmit={handleFeePayment} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-4">Enter Amount to Pay</label>
                                <input
                                    type="number"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    placeholder="e.g. 5000"
                                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-5 text-2xl font-black text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                />
                            </div>
                            <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                                <p className="text-xs text-slate-400 font-medium text-center">Simulated secure payment via Stripe/Razorpay sandbox</p>
                            </div>
                            <button type="submit" className="w-full py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest shadow-xl flex items-center justify-center gap-4">
                                <CreditCard size={20} />
                                Process Payment
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'services' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Faculty Feedback */}
                    <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
                        <h3 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-4">
                            <MessageSquare className="text-indigo-500" /> Faculty Feedback
                        </h3>
                        <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-4">Teacher ID</label>
                                    <input
                                        type="number"
                                        required
                                        value={feedback.teacher_id}
                                        onChange={(e) => setFeedback({ ...feedback, teacher_id: parseInt(e.target.value) })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-4">Rating (1-5)</label>
                                    <select
                                        value={feedback.rating}
                                        onChange={(e) => setFeedback({ ...feedback, rating: parseInt(e.target.value) })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold"
                                    >
                                        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-4">Comments</label>
                                <textarea
                                    required
                                    rows="4"
                                    value={feedback.comment}
                                    onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold"
                                    placeholder="Share your experience..."
                                ></textarea>
                            </div>
                            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all uppercase tracking-widest">
                                Submit Feedback
                            </button>
                        </form>
                    </div>

                    {/* Leave Request */}
                    <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
                        <h3 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-4">
                            <Calendar className="text-indigo-500" /> APPLY FOR LEAVE
                        </h3>
                        <form onSubmit={handleLeaveSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-4">Reason</label>
                                <input
                                    type="text"
                                    required
                                    value={leaveRequest.reason}
                                    onChange={(e) => setLeaveRequest({ ...leaveRequest, reason: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold"
                                    placeholder="Medical / Personal etc."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-4">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={leaveRequest.start_date}
                                        onChange={(e) => setLeaveRequest({ ...leaveRequest, start_date: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-4">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={leaveRequest.end_date}
                                        onChange={(e) => setLeaveRequest({ ...leaveRequest, end_date: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-amber-600 text-white font-black rounded-2xl hover:bg-amber-500 transition-all uppercase tracking-widest">
                                Submit Request
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20"></div>
                            <div className="relative z-10">
                                <div className="h-32 w-32 rounded-full bg-slate-800 border-4 border-slate-900 mx-auto flex items-center justify-center mb-6 overflow-hidden">
                                    <User size={64} className="text-indigo-500" />
                                </div>
                                <h3 className="text-2xl font-black text-white">{profile?.name}</h3>
                                <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest mt-1">Student | {profile?.student_profile?.department}</p>

                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Year</p>
                                        <p className="text-lg font-black text-white">{profile?.student_profile?.year}</p>
                                    </div>
                                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Section</p>
                                        <p className="text-lg font-black text-white">{profile?.student_profile?.section}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 space-y-6">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Account Security</h4>
                            <button className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3">
                                <Settings size={18} /> Change Password
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 h-full">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black uppercase italic">Personal Information</h3>
                                {!isEditingProfile ? (
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="px-6 py-2 bg-indigo-600/10 text-indigo-400 font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-sm uppercase tracking-widest"
                                    >
                                        Edit Profile
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsEditingProfile(false)}
                                        className="px-6 py-2 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-slate-700 transition-all text-sm uppercase tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            disabled={!isEditingProfile}
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 pl-12 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="email"
                                            disabled={!isEditingProfile}
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 pl-12 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="tel"
                                            disabled={!isEditingProfile}
                                            value={profileForm.phone_number}
                                            onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                                            placeholder="+91 00000 00000"
                                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 pl-12 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Residential Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-4 text-slate-500" size={18} />
                                        <textarea
                                            rows="4"
                                            disabled={!isEditingProfile}
                                            value={profileForm.address}
                                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                            placeholder="Enter your permanent address"
                                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 pl-12 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed focus:border-indigo-500 outline-none transition-all"
                                        ></textarea>
                                    </div>
                                </div>

                                {isEditingProfile && (
                                    <div className="md:col-span-2 pt-4">
                                        <button
                                            type="submit"
                                            className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"
                                        >
                                            <Save size={20} /> Save Changes
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
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
    Save,
    Clock,
    ShieldCheck
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
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('overview');
    const [profile, setProfile] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [marks, setMarks] = useState([]);
    const [fees, setFees] = useState([]);
    const [config, setConfig] = useState({ results_published: false });
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSemester, setSelectedSemester] = useState('all');
    const [grievance, setGrievance] = useState({ title: '', description: '', category: 'Academic' });
    const [activeService, setActiveService] = useState('grievance'); // 'grievance' or 'feedback'

    // Attendance filters
    const [attendanceFilters, setAttendanceFilters] = useState({
        semester: 'all',
        subject: 'all',
        date: '',
        startDate: '',
        endDate: ''
    });

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
            const [profileRes, attendanceRes, marksRes, feesRes, notificationsRes, configRes] = await Promise.all([
                api.get('/student/profile'),
                api.get('/student/attendance'),
                api.get('/student/marks'),
                api.get('/student/fees'),
                api.get('/student/notifications'),
                api.get('/staff/exam/config')
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
            setNotifications(notificationsRes.data);
            setConfig(configRes.data);

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
    }, []);

    // WebSocket for real-time updates (currently disabled - can be enabled when backend is ready)
    // useEffect(() => {
    //     if (!user?.id) return;

    //     const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    //     const wsUrl = `${wsProtocol}//localhost:8000/ws/${user.id}`;
    //     let socket = null;

    //     try {
    //         socket = new WebSocket(wsUrl);
    //         socket.onopen = () => console.log('Student WS Connected');
    //         socket.onmessage = (event) => {
    //             const msg = event.data;
    //             if (['FEES_UPDATED', 'ATTENDANCE_UPDATED', 'CONFIG_UPDATED', 'NEW_NOTIFICATION'].includes(msg)) {
    //                 fetchData();
    //             }
    //         };
    //     } catch (error) {
    //         console.warn('WebSocket disabled');
    //     }

    //     return () => {
    //         if (socket) socket.close(1000);
    //     };
    // }, [user?.id]);

    // Handle tab changes and browser navigation
    useEffect(() => {
        // Get tab from URL hash or default to overview
        const hash = location.hash.replace('#', '');
        if (hash && ['overview', 'attendance', 'academics', 'fees', 'services', 'profile'].includes(hash)) {
            setActiveTab(hash);
        }
    }, [location.hash]);

    // Update URL hash when tab changes
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        navigate(`#${tab}`, { replace: true });
    };

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

    const handleGrievanceSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/student/grievance', grievance);
            alert("Grievance submitted successfully. We'll review it soon.");
            setGrievance({ title: '', description: '', category: 'Academic' });
        } catch (err) {
            alert("Error submitting grievance");
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
                <div className="flex items-center gap-4">
                    {activeTab !== 'overview' && (
                        <button
                            onClick={() => handleTabChange('overview')}
                            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:border-indigo-500 transition-all"
                            title="Back to Home"
                        >
                            <ChevronRight className="rotate-180" size={20} />
                        </button>
                    )}
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Student Portal</h1>
                        <p className="text-slate-400 font-medium">Welcome back, {profile?.name}</p>
                    </div>
                </div>
                <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
                    {['overview', 'attendance', 'academics', 'fees', 'services', 'profile'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
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
                <div className="space-y-8">
                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                            <TrendingUp className="absolute -top-4 -right-4 h-32 w-32 opacity-10 group-hover:scale-110 transition-transform" />
                            <h3 className="text-sm font-bold opacity-80 uppercase tracking-widest">Academic Status</h3>
                            <p className="text-5xl font-black mt-4">{profile?.student_profile?.gpa || '3.8'}</p>
                            <p className="text-xs opacity-60 mt-2 font-bold uppercase">Current Cumulative GPA</p>
                        </div>
                        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden">
                            <AlertTriangle className="absolute -top-4 -right-4 h-32 w-32 text-indigo-500/10" />
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">AI Risk Level</h3>
                            <p className="text-5xl font-black mt-4 text-white uppercase italic">{prediction?.risk_level || 'LOW'}</p>
                            <p className="text-xs text-slate-500 mt-2 font-bold uppercase">Based on recent performance</p>
                        </div>
                        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden">
                            <Calendar className="absolute -top-4 -right-4 h-32 w-32 text-indigo-500/10" />
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Attendance</h3>
                            <p className="text-5xl font-black mt-4 text-white">{Math.round((attendanceStats.present / attendanceStats.total) * 100)}%</p>
                            <p className="text-xs text-slate-500 mt-2 font-bold uppercase">Overall Presence</p>
                        </div>
                    </div>

                    {/* Quick Action Cards */}
                    <div>
                        <h3 className="text-2xl font-black uppercase italic mb-6 text-white">Quick Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Scan Attendance Card */}
                            <button
                                onClick={() => handleTabChange('attendance')}
                                className="bg-gradient-to-br from-emerald-600 to-emerald-900 p-8 rounded-[2rem] shadow-xl hover:scale-[1.02] transition-all text-left group relative overflow-hidden"
                            >
                                <div className="absolute -top-8 -right-8 h-32 w-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform"></div>
                                <QrCode className="h-12 w-12 text-white mb-4 relative z-10" />
                                <h4 className="text-xl font-black text-white uppercase tracking-tight relative z-10">Scan Attendance</h4>
                                <p className="text-sm text-emerald-100 mt-2 font-medium relative z-10">Mark your attendance using QR code</p>
                            </button>

                            {/* View Attendance Card */}
                            <button
                                onClick={() => handleTabChange('attendance')}
                                className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[2rem] shadow-xl hover:scale-[1.02] hover:border-indigo-500 transition-all text-left group"
                            >
                                <Calendar className="h-12 w-12 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">View Attendance</h4>
                                <p className="text-sm text-slate-400 mt-2 font-medium">Check your attendance records</p>
                            </button>

                            {/* View Results Card */}
                            <button
                                onClick={() => handleTabChange('academics')}
                                className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[2rem] shadow-xl hover:scale-[1.02] hover:border-indigo-500 transition-all text-left group"
                            >
                                <BookOpen className="h-12 w-12 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">View Results</h4>
                                <p className="text-sm text-slate-400 mt-2 font-medium">Check your exam results</p>
                            </button>

                            {/* Pay Fees Card */}
                            <button
                                onClick={() => handleTabChange('fees')}
                                className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[2rem] shadow-xl hover:scale-[1.02] hover:border-indigo-500 transition-all text-left group"
                            >
                                <CreditCard className="h-12 w-12 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">Pay Fees</h4>
                                <p className="text-sm text-slate-400 mt-2 font-medium">Make online fee payments</p>
                            </button>

                            {/* Submit Grievance Card */}
                            <button
                                onClick={() => {
                                    setActiveService('grievance');
                                    handleTabChange('services');
                                }}
                                className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[2rem] shadow-xl hover:scale-[1.02] hover:border-indigo-500 transition-all text-left group"
                            >
                                <AlertTriangle className="h-12 w-12 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">Submit Grievance</h4>
                                <p className="text-sm text-slate-400 mt-2 font-medium">Report issues or concerns</p>
                            </button>

                            {/* Faculty Feedback Card */}
                            <button
                                onClick={() => {
                                    setActiveService('feedback');
                                    handleTabChange('services');
                                }}
                                className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[2rem] shadow-xl hover:scale-[1.02] hover:border-indigo-500 transition-all text-left group"
                            >
                                <MessageSquare className="h-12 w-12 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">Faculty Feedback</h4>
                                <p className="text-sm text-slate-400 mt-2 font-medium">Rate and review your teachers</p>
                            </button>

                            {/* Profile Settings Card */}
                            <button
                                onClick={() => handleTabChange('profile')}
                                className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[2rem] shadow-xl hover:scale-[1.02] hover:border-indigo-500 transition-all text-left group"
                            >
                                <User className="h-12 w-12 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">Profile Settings</h4>
                                <p className="text-sm text-slate-400 mt-2 font-medium">Update your personal information</p>
                            </button>

                            {/* Fee History Card */}
                            <button
                                onClick={() => handleTabChange('fees')}
                                className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[2rem] shadow-xl hover:scale-[1.02] hover:border-indigo-500 transition-all text-left group"
                            >
                                <ClipboardList className="h-12 w-12 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">Fee History</h4>
                                <p className="text-sm text-slate-400 mt-2 font-medium">View payment records</p>
                            </button>

                            {/* Notifications Card */}
                            <button
                                onClick={() => setShowNotifications(true)}
                                className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[2rem] shadow-xl hover:scale-[1.02] hover:border-indigo-500 transition-all text-left group relative"
                            >
                                <Bell className="h-12 w-12 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-6 left-16 h-6 w-6 bg-red-500 text-white text-xs font-black flex items-center justify-center rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">Notifications</h4>
                                <p className="text-sm text-slate-400 mt-2 font-medium">View important updates</p>
                            </button>
                        </div>
                    </div>

                    {/* Recent Updates Section */}
                    <div className="bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden shadow-xl">
                        <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold uppercase tracking-tighter">Recent Updates</h3>
                            <ChevronRight className="text-slate-600" />
                        </div>
                        <div className="divide-y divide-slate-800">
                            {config.results_published ? marks.slice(0, 3).map((m, i) => (
                                <div key={i} className="p-6 flex items-center hover:bg-slate-800/30 transition-colors">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                        <ClipboardList size={24} />
                                    </div>
                                    <div className="ml-6">
                                        <p className="text-base font-bold text-white">Result Published: Semester {m.semester}</p>
                                        <p className="text-sm text-slate-500 font-medium">Internal: {m.internal_marks} | External: {m.external_marks}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-12 text-center">
                                    <Clock className="h-8 w-8 text-slate-600 mx-auto mb-4" />
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Awaiting Results Release</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="space-y-8">
                    {/* Advanced Filters */}
                    <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl">
                        <h3 className="text-xl font-black uppercase italic mb-6 flex items-center gap-3">
                            <Calendar className="text-indigo-500" size={24} />
                            Filter Attendance Records
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Semester</label>
                                <select
                                    value={attendanceFilters.semester}
                                    onChange={(e) => setAttendanceFilters({ ...attendanceFilters, semester: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-sm"
                                >
                                    <option value="all">All Semesters</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Subject</label>
                                <select
                                    value={attendanceFilters.subject}
                                    onChange={(e) => setAttendanceFilters({ ...attendanceFilters, subject: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-sm"
                                >
                                    <option value="all">All Subjects</option>
                                    {[...new Set(attendance.map(a => a.subject_id))].map(subId => (
                                        <option key={subId} value={subId}>Subject {subId}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Specific Date</label>
                                <input
                                    type="date"
                                    value={attendanceFilters.date}
                                    onChange={(e) => setAttendanceFilters({ ...attendanceFilters, date: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-sm"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => setAttendanceFilters({ semester: 'all', subject: 'all', date: '', startDate: '', endDate: '' })}
                                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-3 text-slate-400 hover:text-white font-bold text-sm transition-all"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>

                        {/* Date Range Filter */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">From Date</label>
                                <input
                                    type="date"
                                    value={attendanceFilters.startDate}
                                    onChange={(e) => setAttendanceFilters({ ...attendanceFilters, startDate: e.target.value, date: '' })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">To Date</label>
                                <input
                                    type="date"
                                    value={attendanceFilters.endDate}
                                    onChange={(e) => setAttendanceFilters({ ...attendanceFilters, endDate: e.target.value, date: '' })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-sm"
                                />
                            </div>
                        </div>
                    </div>

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
                                {attendance.length > 0 ? attendance
                                    .filter(a => {
                                        // Filter by semester
                                        if (attendanceFilters.semester !== 'all' && a.semester !== parseInt(attendanceFilters.semester)) return false;

                                        // Filter by subject
                                        if (attendanceFilters.subject !== 'all' && a.subject_id !== parseInt(attendanceFilters.subject)) return false;

                                        // Filter by specific date
                                        if (attendanceFilters.date && a.date !== attendanceFilters.date) return false;

                                        // Filter by date range
                                        if (attendanceFilters.startDate && a.date < attendanceFilters.startDate) return false;
                                        if (attendanceFilters.endDate && a.date > attendanceFilters.endDate) return false;

                                        return true;
                                    })
                                    .map((a, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${a.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {a.status === 'Present' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">Subject {a.subject_id} - Slot {a.hour_slot}</p>
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
                </div>
            )}

            {activeTab === 'academics' && (
                <div className="space-y-8">
                    <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black uppercase italic">Examination Results</h3>
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white font-bold text-sm"
                            >
                                <option value="all">All Semesters</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                    <option key={sem} value={sem}>Semester {sem}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden">
                        <h3 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-4">
                            <BookOpen className="text-indigo-500" /> Academic Results
                        </h3>
                        {config.results_published ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-800">
                                            <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest">Semester</th>
                                            <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest">Subject</th>
                                            <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest">Exam Type</th>
                                            <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest">Internal</th>
                                            <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest">External</th>
                                            <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest">Total</th>
                                            <th className="pb-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {marks
                                            .filter(m => selectedSemester === 'all' || m.semester === parseInt(selectedSemester))
                                            .map((m, i) => (
                                                <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                                                    <td className="py-6 font-black text-white">{m.semester}</td>
                                                    <td className="py-6 font-bold text-white uppercase">{m.subject_code}</td>
                                                    <td className="py-6 font-bold text-slate-400 text-sm">{m.exam_type}</td>
                                                    <td className="py-6 font-bold text-white">{m.internal_marks}</td>
                                                    <td className="py-6 font-bold text-white">{m.external_marks}</td>
                                                    <td className="py-6 font-black text-indigo-400">{m.internal_marks + m.external_marks}</td>
                                                    <td className="py-6">
                                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${(m.internal_marks + m.external_marks) >= 40 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            {(m.internal_marks + m.external_marks) >= 40 ? 'Pass' : 'Fail'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                                {marks.filter(m => selectedSemester === 'all' || m.semester === parseInt(selectedSemester)).length === 0 && (
                                    <p className="p-20 text-center text-slate-500 font-black uppercase">No results found for selected semester</p>
                                )}
                            </div>
                        ) : (
                            <div className="p-40 text-center">
                                <ShieldCheck className="h-20 w-20 text-indigo-500/20 mx-auto mb-8 animate-pulse" />
                                <h4 className="text-3xl font-black uppercase italic tracking-tighter text-white">Results are Sealed</h4>
                                <p className="text-slate-500 font-bold uppercase tracking-widest mt-2">The Exam Cell has not authorized result publication yet.</p>
                            </div>
                        )}
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
                <div className="space-y-8">
                    {/* Service Selector */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveService('grievance')}
                            className={`flex-1 p-6 rounded-[2rem] border-2 transition-all ${activeService === 'grievance'
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-indigo-500'}`}
                        >
                            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                            <p className="font-black uppercase text-sm">Grievance</p>
                        </button>
                        <button
                            onClick={() => setActiveService('feedback')}
                            className={`flex-1 p-6 rounded-[2rem] border-2 transition-all ${activeService === 'feedback'
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-indigo-500'}`}
                        >
                            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                            <p className="font-black uppercase text-sm">Feedback</p>
                        </button>
                    </div>

                    {/* Grievance Form */}
                    {activeService === 'grievance' && (
                        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl max-w-2xl mx-auto">
                            <h3 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-4">
                                <AlertTriangle className="text-indigo-500" /> Submit Grievance
                            </h3>
                            <form onSubmit={handleGrievanceSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-4">Category</label>
                                    <select
                                        value={grievance.category}
                                        onChange={(e) => setGrievance({ ...grievance, category: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold"
                                    >
                                        <option value="Academic">Academic</option>
                                        <option value="Administrative">Administrative</option>
                                        <option value="Infrastructure">Infrastructure</option>
                                        <option value="Harassment">Harassment</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-4">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={grievance.title}
                                        onChange={(e) => setGrievance({ ...grievance, title: e.target.value })}
                                        placeholder="Brief title of your concern"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-4">Description</label>
                                    <textarea
                                        required
                                        rows="6"
                                        value={grievance.description}
                                        onChange={(e) => setGrievance({ ...grievance, description: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white font-bold"
                                        placeholder="Describe your grievance in detail..."
                                    ></textarea>
                                </div>
                                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all uppercase tracking-widest">
                                    Submit Grievance
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Faculty Feedback Form */}
                    {activeService === 'feedback' && (
                        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl max-w-2xl mx-auto">
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
                                        rows="6"
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
                    )}
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

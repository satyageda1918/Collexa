import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Users,
    Clock,
    Calendar,
    QrCode,
    CheckCircle,
    XCircle,
    MoreVertical,
    User,
    MapPin,
    Phone,
    Mail,
    Settings,
    Save,
    BookOpen
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [selectedSlot, setSelectedSlot] = useState(1);
    const [selectedSubject, setSelectedSubject] = useState(101);
    const [qrCode, setQrCode] = useState("");
    const [showQR, setShowQR] = useState(false);

    // Profile Edit States
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        phone_number: '',
        address: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profileRes, statsRes, studentsRes] = await Promise.all([
                api.get('/teacher/profile'),
                api.get('/teacher/dashboard-stats'),
                api.get('/teacher/students') // Simplified for demo getting all students
            ]);

            setProfile(profileRes.data);
            setProfileForm({
                name: profileRes.data.name,
                email: profileRes.data.email,
                phone_number: profileRes.data.teacher_profile?.phone_number || '',
                address: profileRes.data.teacher_profile?.address || ''
            });
            setStats(statsRes.data);
            setStudents(studentsRes.data);
        } catch (err) {
            console.error("Error fetching data:", err);
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

        socket.onopen = () => console.log('Teacher WS Connected');
        socket.onmessage = (event) => {
            const msg = event.data;
            if (['ATTENDANCE_UPDATED', 'LEAVES_UPDATED'].includes(msg)) {
                console.log('Real-time update received:', msg);
                fetchData(); // Instantly refresh data on event
            }
        };
        socket.onclose = () => console.log('Teacher WS Disconnected');

        return () => socket.close();
    }, [user?.id]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put('/teacher/profile', profileForm);
            alert("Profile updated successfully!");
            setIsEditingProfile(false);
            fetchData();
        } catch (err) {
            alert("Error updating profile");
        }
    };

    const handleGenerateQR = async () => {
        try {
            const res = await api.post('/teacher/generate-qr', null, {
                params: { subject_id: selectedSubject, hour_slot: selectedSlot }
            });
            setQrCode(`ATTENDANCE|${selectedSubject}|${selectedSlot}|${user?.id || 3}`);
            setShowQR(true);
        } catch (err) {
            console.error("Error generating QR:", err);
            // Fallback for demo if endpoint fails
            setQrCode(`ATTENDANCE|${selectedSubject}|${selectedSlot}|${user?.id || 3}`);
            setShowQR(true);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Clock className="animate-spin h-8 w-8 text-indigo-500" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Faculty Portal</h1>
                    <p className="text-slate-400 font-medium">Welcome back, Prof. {profile?.name}</p>
                </div>
                <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
                    {['overview', 'classes', 'attendance', 'profile'].map((tab) => (
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
            </div>

            {/* Content Based on Tabs */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                                <Users className="absolute -top-4 -right-4 h-32 w-32 opacity-10 group-hover:scale-110 transition-transform" />
                                <h3 className="text-sm font-bold opacity-80 uppercase tracking-widest">Total Students</h3>
                                <p className="text-5xl font-black mt-4">{stats?.total_students || 120}</p>
                            </div>
                            <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden">
                                <BookOpen className="absolute -top-4 -right-4 h-32 w-32 text-indigo-500/10" />
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Classes</h3>
                                <p className="text-5xl font-black mt-4 text-white hover:text-indigo-400 transition-colors">{stats?.active_classes || 3}</p>
                            </div>
                            <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden">
                                <Calendar className="absolute -top-4 -right-4 h-32 w-32 text-amber-500/10" />
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pending Leaves</h3>
                                <p className="text-5xl font-black mt-4 text-white hover:text-amber-400 transition-colors">{stats?.pending_leaves || 2}</p>
                            </div>
                        </div>

                        {/* Recent Activity/Schedule */}
                        <div className="bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden shadow-xl">
                            <div className="p-8 border-b border-slate-800">
                                <h3 className="text-xl font-bold uppercase tracking-tighter">Today's Schedule</h3>
                            </div>
                            <div className="divide-y divide-slate-800">
                                {[
                                    { time: '09:00 AM', cls: 'CS101 - Intro to CS', room: 'Room 402' },
                                    { time: '11:00 AM', cls: 'CS202 - Data Structures', room: 'Lab 1' },
                                    { time: '02:00 PM', cls: 'CS301 - Operating Systems', room: 'Room 305' }
                                ].map((s, i) => (
                                    <div key={i} className="p-6 flex justify-between items-center hover:bg-slate-800/30 transition-colors">
                                        <div className="flex items-center gap-6">
                                            <div className="text-center w-24">
                                                <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">{s.time}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-lg">{s.cls}</p>
                                                <p className="text-slate-500 text-sm font-medium">{s.room}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setActiveTab('attendance'); setSelectedSubject(parseInt(s.cls.split('CS')[1].split(' -')[0])); }}
                                            className="px-4 py-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase transition-all"
                                        >
                                            Take Attendance
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Quick Start Attendance */}
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className="w-full bg-white text-slate-900 p-10 rounded-[2rem] font-black uppercase text-center shadow-2xl hover:scale-[1.02] transition-transform flex flex-col items-center gap-6"
                        >
                            <QrCode size={56} className="text-indigo-600" />
                            <div className="space-y-2">
                                <span className="tracking-tighter text-2xl block">QR Portal</span>
                                <span className="text-xs text-slate-500 block">Launch Scanner Display</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'classes' && (
                <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                        <h3 className="text-2xl font-black uppercase italic text-white">Student Enrollment</h3>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search student ID..."
                                className="bg-slate-800 border-2 border-slate-700 rounded-xl px-6 py-3 text-sm focus:outline-none focus:border-indigo-500 font-bold text-white placeholder:text-slate-500 w-64 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900">
                                <tr>
                                    <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Student Info</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Email</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Attendance %</th>
                                    <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {students.map((student) => {
                                    // Using real data from backend
                                    const studentAttendance = student.attendance_percentage || 0;
                                    const isLowAttendance = studentAttendance < 75;

                                    return (
                                        <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg">
                                                        {student.name[0]}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-white text-base block">{student.name}</span>
                                                        <span className="text-xs text-slate-500 font-bold uppercase">ID: STU-{student.id.toString().padStart(4, '0')}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-slate-400 text-sm font-medium">{student.email}</td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${isLowAttendance ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                            style={{ width: `${studentAttendance}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-black ${isLowAttendance ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {studentAttendance}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
                                                    <MoreVertical className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl space-y-8">
                        <h3 className="text-2xl font-black uppercase italic text-white">Generate Code</h3>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Subject ID</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-white font-bold focus:border-indigo-500 outline-none transition-all"
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(parseInt(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Hour Slot</label>
                                <select
                                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-white font-bold focus:border-indigo-500 outline-none transition-all appearance-none"
                                    value={selectedSlot}
                                    onChange={(e) => setSelectedSlot(parseInt(e.target.value))}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Period {s}</option>)}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateQR}
                            className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"
                        >
                            <QrCode size={20} /> Generate QR
                        </button>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl flex flex-col items-center justify-center text-center min-h-[400px]">
                        {showQR ? (
                            <div className="space-y-6 animate-in zoom-in duration-300">
                                <h3 className="text-xl font-bold uppercase tracking-widest text-slate-400">Scan to Mark Present</h3>
                                <div className="p-6 bg-white rounded-3xl shadow-2xl inline-block border-8 border-indigo-50/10">
                                    <QRCodeSVG value={qrCode} size={280} level="H" />
                                </div>
                                <div className="flex justify-center gap-4">
                                    <span className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase border border-slate-700">SUB: {selectedSubject}</span>
                                    <span className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase border border-slate-700">SLOT: {selectedSlot}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="opacity-50">
                                <QrCode size={80} className="mx-auto mb-6 text-slate-600" />
                                <p className="text-lg font-bold text-slate-400 uppercase tracking-widest">QR Display Inactive</p>
                                <p className="text-sm text-slate-500 mt-2">Configure settings and generate code to project.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-20"></div>
                            <div className="relative z-10">
                                <div className="h-32 w-32 rounded-full bg-slate-800 border-4 border-slate-900 mx-auto flex items-center justify-center mb-6 overflow-hidden">
                                    <User size={64} className="text-emerald-500" />
                                </div>
                                <h3 className="text-2xl font-black text-white">{profile?.name}</h3>
                                <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest mt-1">Faculty | {profile?.teacher_profile?.department}</p>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 space-y-6">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Settings</h4>
                            <button className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3">
                                <Settings size={18} /> Account Preferences
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 h-full">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black uppercase italic text-white">Contact Information</h3>
                                {!isEditingProfile ? (
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="px-6 py-2 bg-emerald-600/10 text-emerald-400 font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-sm uppercase tracking-widest"
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
                                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 pl-12 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed focus:border-emerald-500 outline-none transition-all"
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
                                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 pl-12 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed focus:border-emerald-500 outline-none transition-all"
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
                                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 pl-12 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Office Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-4 text-slate-500" size={18} />
                                        <textarea
                                            rows="4"
                                            disabled={!isEditingProfile}
                                            value={profileForm.address}
                                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                            placeholder="Enter your office node/address"
                                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 pl-12 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed focus:border-emerald-500 outline-none transition-all"
                                        ></textarea>
                                    </div>
                                </div>

                                {isEditingProfile && (
                                    <div className="md:col-span-2 pt-4">
                                        <button
                                            type="submit"
                                            className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-500 transition-all uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"
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

export default TeacherDashboard;


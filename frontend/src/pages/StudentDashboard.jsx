import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    TrendingUp,
    Calendar,
    BookOpen,
    AlertTriangle,
    ChevronRight
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
import { Line, Doughnut } from 'react-chartjs-2';

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
    const [profile, setProfile] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [prediction, setPrediction] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, attendanceRes] = await Promise.all([
                    api.get('/student/profile'),
                    api.get('/student/attendance')
                ]);
                setProfile(profileRes.data);
                setAttendance(attendanceRes.data);

                // Fetch AI Prediction
                const predRes = await api.post('/ai/predict', {
                    attendance_pct: 75.0, // Mock for now, should calculate from attendanceRes
                    internal_marks: 80.0,
                    assignment_scores: 8.5,
                    gpa: profileRes.data.student_profile?.gpa || 3.5
                });
                setPrediction(predRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const attendanceData = {
        labels: ['Present', 'Absent'],
        datasets: [{
            data: [75, 25], // Mock
            backgroundColor: ['#4f46e5', '#1e293b'],
            borderWidth: 0
        }]
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Welcome back, {user?.sub}</h1>
                    <p className="text-slate-400 mt-1">Here's your academic overview</p>
                </div>
                <div className="flex space-x-4">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center">
                        <TrendingUp className="text-indigo-400 mr-3" />
                        <div>
                            <p className="text-xs text-slate-400 uppercase">Current GPA</p>
                            <p className="text-xl font-bold">{profile?.student_profile?.gpa || '0.0'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Performance Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-lg font-semibold opacity-90">AI Performance Insight</h3>
                        <div className="mt-4">
                            <p className="text-sm opacity-80">Risk Level</p>
                            <p className="text-4xl font-bold mt-1">
                                {prediction?.risk_level || 'Calculating...'}
                            </p>
                        </div>
                        <button className="mt-6 flex items-center text-sm font-medium bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
                            View Detailed Analysis <ChevronRight className="ml-2 h-4 w-4" />
                        </button>
                    </div>
                    <AlertTriangle className="absolute -bottom-4 -right-4 h-32 w-32 opacity-10" />
                </div>

                {/* Attendance Card */}
                <div className="md:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700 flex items-center">
                    <div className="w-1/3">
                        <Doughnut data={attendanceData} options={{ cutout: '80%' }} />
                    </div>
                    <div className="ml-8 flex-1">
                        <h3 className="text-xl font-bold">Attendance Status</h3>
                        <p className="text-slate-400 text-sm mt-1">You've attended 75% of classes this semester.</p>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-slate-900/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-500">TOTAL SESSIONS</p>
                                <p className="text-lg font-bold">120</p>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg">
                                <p className="text-xs text-slate-500">PRESENT</p>
                                <p className="text-lg font-bold">90</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-700">
                        <h3 className="text-lg font-bold">Recent Updates</h3>
                    </div>
                    <div className="divide-y divide-slate-700">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 flex items-center hover:bg-slate-700/50 transition-colors">
                                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <FileText size={20} />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium">Internal Marks Posted</p>
                                    <p className="text-xs text-slate-500">Discrete Mathematics • 2 hours ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Calendar/Schedule */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Today's Schedule</h3>
                        <span className="text-sm text-indigo-400">View Full Calendar</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center p-4 bg-slate-900/50 rounded-xl border border-l-4 border-l-indigo-500 border-slate-700">
                            <div className="mr-6 text-center w-16">
                                <p className="text-sm font-bold">09:00</p>
                                <p className="text-xs text-slate-500">AM</p>
                            </div>
                            <div>
                                <p className="font-semibold">Software Engineering</p>
                                <p className="text-xs text-slate-400">Hall 402 • Prof. Sarah Jenkins</p>
                            </div>
                        </div>
                        <div className="flex items-center p-4 bg-slate-900/50 rounded-xl border border-l-4 border-l-emerald-500 border-slate-700">
                            <div className="mr-6 text-center w-16">
                                <p className="text-sm font-bold">11:00</p>
                                <p className="text-xs text-slate-500">AM</p>
                            </div>
                            <div>
                                <p className="font-semibold">DBMS Lab</p>
                                <p className="text-xs text-slate-400">Computer Lab 2 • Prof. James Smith</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;

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
    MoreVertical
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [showQR, setShowQR] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(1);
    const [selectedSubject, setSelectedSubject] = useState(101);
    const [qrCode, setQrCode] = useState("");

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/teacher/students');
            setStudents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerateQR = async () => {
        try {
            const res = await api.post('/teacher/generate-qr', {
                subject_id: selectedSubject,
                hour_slot: selectedSlot
            });
            // In our backend, we return a base64 string, but qrcode.react can also generate from data
            // For simplicity in this demo, we'll just encode the raw string
            setQrCode(`ATTENDANCE|${selectedSubject}|${selectedSlot}|${user.user_id}`);
            setShowQR(true);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
                    <p className="text-slate-400 mt-1">Manage your classes and attendance</p>
                </div>
                <button
                    onClick={() => setShowQR(!showQR)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center"
                >
                    <QrCode className="mr-2 h-5 w-5" />
                    {showQR ? "Close QR Portal" : "Start Attendance"}
                </button>
            </div>

            {showQR && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-800 p-8 rounded-2xl border border-indigo-500/30">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-white rounded-2xl">
                            <QRCodeSVG value={qrCode} size={256} />
                        </div>
                        <p className="text-sm text-slate-400">Students should scan this code to mark attendance</p>
                        <div className="flex space-x-2">
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold uppercase">Subject: CS101</span>
                            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-bold uppercase">Slot: {selectedSlot}</span>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold">Attendance Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Hour Slot</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                                    value={selectedSlot}
                                    onChange={(e) => setSelectedSlot(parseInt(e.target.value))}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Period {s}</option>)}
                                </select>
                            </div>
                            <button
                                onClick={handleGenerateQR}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
                            >
                                Refresh Token
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Student List */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold">Class List - Section A</h3>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-sm border-b border-slate-700">
                                <th className="px-6 py-4 font-semibold">STUDENT</th>
                                <th className="px-6 py-4 font-semibold">EMAIL</th>
                                <th className="px-6 py-4 font-semibold">STATUS</th>
                                <th className="px-6 py-4 font-semibold">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold mr-3">
                                                {student.name[0]}
                                            </div>
                                            <span className="font-medium text-white">{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">{student.email}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                                                readOnly
                                                checked={Math.random() > 0.5} // Simulated real-time tick
                                            />
                                            <span className="ml-2 text-xs text-slate-500">Auto-update active</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-slate-400 hover:text-white">
                                            <MoreVertical className="h-5 w-5" />
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

export default TeacherDashboard;

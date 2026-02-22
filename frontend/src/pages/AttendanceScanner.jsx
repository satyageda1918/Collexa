import React, { useState } from 'react';
import { Camera, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const AttendanceScanner = () => {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const simulateScan = async () => {
        setLoading(true);
        // Simulate a scan delay
        await new Promise(r => setTimeout(r, 1500));

        try {
            // Mock QR data: ATTENDANCE|subject_id|hour_slot|teacher_id
            const mockData = "ATTENDANCE|101|1|3";
            const res = await api.post('/student/mark-attendance', { qr_code_data: mockData });
            setResult({ success: true, message: res.data.message });
        } catch (err) {
            setResult({ success: false, message: err.response?.data?.detail || "Scan failed" });
        } finally {
            setLoading(false);
            setScanning(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 text-center">
            <div>
                <h1 className="text-3xl font-bold">Attendance Scanner</h1>
                <p className="text-slate-400 mt-2">Point your camera at the QR code displayed by your faculty</p>
            </div>

            <div className="aspect-square bg-slate-800 rounded-3xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center p-12 relative overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
                        <p className="text-white font-medium">Processing scan...</p>
                    </div>
                ) : result ? (
                    <div className="flex flex-col items-center">
                        {result.success ? (
                            <CheckCircle className="h-20 w-20 text-emerald-500 mb-4" />
                        ) : (
                            <AlertCircle className="h-20 w-20 text-red-500 mb-4" />
                        )}
                        <p className="text-xl font-bold text-white">{result.success ? "Success!" : "Failed"}</p>
                        <p className="text-slate-400 mt-2">{result.message}</p>
                        <button
                            onClick={() => setResult(null)}
                            className="mt-8 text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                            Scan Again
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="absolute inset-0 bg-indigo-500/5 animate-pulse"></div>
                        <Camera className="h-24 w-24 text-slate-600 mb-6 relative z-10" />
                        <button
                            onClick={simulateScan}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 relative z-10"
                        >
                            Open Camera
                        </button>
                        <p className="mt-4 text-xs text-slate-500 relative z-10 uppercase tracking-widest">Awaiting input</p>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-500 mb-1">CURRENT LOCATION</p>
                    <p className="text-sm font-medium">Main Block - Room 402</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-500 mb-1">TIME SLOT</p>
                    <p className="text-sm font-medium">09:00 AM - 10:00 AM</p>
                </div>
            </div>
        </div>
    );
};

export default AttendanceScanner;

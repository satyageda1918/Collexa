import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';

const AttendanceScanner = () => {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    const handleScan = async (decodedText) => {
        setLoading(true);

        // Stop the scanner
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }
        }

        try {
            const res = await api.post('/student/mark-attendance', { qr_code_data: decodedText });
            setResult({ success: true, message: res.data.message });
        } catch (err) {
            setResult({ success: false, message: err.response?.data?.detail || "Scan failed" });
        } finally {
            setLoading(false);
            setScanning(false);
        }
    };

    const startScanning = async () => {
        setScanning(true);
        setResult(null);

        try {
            // Request camera permission first
            await navigator.mediaDevices.getUserMedia({ video: true });

            const html5QrCode = new Html5Qrcode("qr-reader");
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                handleScan,
                () => {
                    // Ignore scan errors (happens when no QR is detected)
                }
            );
        } catch (err) {
            console.error("Error starting scanner:", err);
            let errorMsg = "Failed to access camera. ";

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMsg += "Please allow camera access in your browser settings.";
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMsg += "No camera found on this device.";
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMsg += "Camera is already in use by another application.";
            } else {
                errorMsg += "Please check permissions and try again.";
            }

            setResult({ success: false, message: errorMsg });
            setScanning(false);
        }
    };

    const stopScanning = async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current = null;
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }
        }
        setScanning(false);
    };

    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(console.error);
            }
        };
    }, []);

    return (
        <div className="max-w-xl mx-auto space-y-8 text-center">
            <div>
                <h1 className="text-3xl font-bold">Attendance Scanner</h1>
                <p className="text-slate-400 mt-2">Point your camera at the QR code displayed by your faculty</p>
            </div>

            <div className="aspect-square bg-slate-800 rounded-3xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center p-12 relative overflow-hidden">
                {scanning && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4">
                        <div id="qr-reader" className="w-full max-w-md"></div>
                        <button
                            onClick={stopScanning}
                            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"
                        >
                            <X className="h-4 w-4" />
                            Stop Scanning
                        </button>
                    </div>
                )}
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
                            onClick={startScanning}
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

            {!scanning && !result && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-left">
                    <p className="text-sm text-blue-300 font-medium mb-2">📷 Camera Permission Required</p>
                    <p className="text-xs text-slate-400">
                        Click "Open Camera" and allow camera access when prompted. If blocked, click the camera icon in your browser's address bar to enable permissions.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AttendanceScanner;

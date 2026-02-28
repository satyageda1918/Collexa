import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    ShieldCheck, ClipboardList, Search, Clock,
    X, CheckCircle2, User, Calendar,
    Bell, MoreHorizontal, Filter, Grid,
    FileText, Plus, Trash2, Download, Eye,
    CheckSquare, Square
} from 'lucide-react';

const ExamCellPortal = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('results');
    const [config, setConfig] = useState({ mark_entry_enabled: false, results_published: false });
    const [papers, setPapers] = useState([]);
    const [notice, setNotice] = useState({ title: '', message: '' });
    const [isGenerating, setIsGenerating] = useState(false);

    // Results Management State
    const [revFilters, setRevFilters] = useState({
        academic_year: '2025-26',
        semester: 1,
        exam_type: 'Internal',
        department: 'All Departments',
        section: 'All Sections'
    });
    const [marksForReview, setMarksForReview] = useState([]);
    const [selectedMarkIds, setSelectedMarkIds] = useState([]);

    const { user } = useAuth();

    const fetchConfig = async () => {
        try {
            const res = await api.get('/staff/exam/config');
            setConfig(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchPapers = async () => {
        try {
            const res = await api.get('/staff/exam/question-papers');
            setPapers(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchConfig();
        fetchPapers();
        if (user?.id) {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//localhost:8000/ws/${user.id}`;
            const socket = new WebSocket(wsUrl);
            socket.onmessage = (event) => {
                if (event.data === 'CONFIG_UPDATED') fetchConfig();
            };
            return () => socket.close();
        }
    }, [user?.id]);

    const handleToggleMarkEntry = async () => {
        const newVal = !config.mark_entry_enabled;
        try {
            await api.post('/staff/exam/toggle-mark-entry', null, { params: { enabled: newVal } });
            fetchConfig();
        } catch (err) { alert("Toggle failed"); }
    };


    const fetchMarksForReview = async () => {
        try {
            const res = await api.get('/staff/exam/marks-for-review', { params: revFilters });
            setMarksForReview(res.data);
            setSelectedMarkIds([]);
        } catch (err) { console.error(err); }
    };

    const handleApproveMarks = async () => {
        if (selectedMarkIds.length === 0) return;
        try {
            await api.post('/staff/exam/approve-marks', selectedMarkIds);
            alert("Marks Approved Successfully");
            fetchMarksForReview();
        } catch (err) { alert("Approval failed"); }
    };

    const handlePublishResults = async () => {
        try {
            const res = await api.post('/staff/exam/publish-results', null, { params: revFilters });
            alert(res.data.message);
            fetchMarksForReview();
        } catch (err) { alert("Publish failed. Ensure marks are approved first."); }
    };

    const toggleMarkSelection = (id) => {
        if (selectedMarkIds.includes(id)) {
            setSelectedMarkIds(selectedMarkIds.filter(mid => mid !== id));
        } else {
            setSelectedMarkIds([...selectedMarkIds, id]);
        }
    };

    const addQuestion = (category) => {
        setQpForm({
            ...qpForm,
            questions: [...qpForm.questions, { id: Date.now(), category, text: '' }]
        });
    };

    const removeQuestion = (id) => {
        setQpForm({
            ...qpForm,
            questions: qpForm.questions.filter(q => q.id !== id)
        });
    };

    const updateQuestion = (id, text) => {
        setQpForm({
            ...qpForm,
            questions: qpForm.questions.map(q => q.id === id ? { ...q, text } : q)
        });
    };

    const handleGeneratePaperSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                subject_code: qpForm.subject_code,
                subject_name: qpForm.subject_name,
                faculty_name: qpForm.faculty_name,
                semester: qpForm.semester,
                exam_type: qpForm.exam_type,
                questions_data: JSON.stringify(qpForm.questions)
            };
            await api.post('/staff/exam/generate-paper', payload);
            alert("Question Paper Generated and Saved!");
            setIsGenerating(false);
            setQpForm({
                subject_code: '', subject_name: '', faculty_name: '',
                semester: 1, exam_type: 'Regular', questions: []
            });
            fetchPapers();
            // Trigger Print/Download
            window.print();
        } catch (err) {
            alert("Generation failed");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-black text-brand-text flex items-center">
                        <ShieldCheck className="mr-3 h-8 w-8 text-brand-primary" />
                        Exam & Admin Cell
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">Academic controls, results publishing, and QP management</p>
                </div>
            </header>

            {!isGenerating ? (
                <>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto shadow-inner border border-slate-200 no-print">
                        {[
                            { id: 'results', label: 'Results Management', icon: CheckSquare },
                            { id: 'control', label: 'System Control', icon: ShieldCheck },
                            { id: 'papers', label: 'Question Papers', icon: FileText },
                            { id: 'notices', label: 'Issue Notice', icon: Bell }
                        ].map(t => (
                            <button
                                key={t.id} onClick={() => setActiveTab(t.id)}
                                className={`flex items-center px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === t.id
                                    ? 'bg-white text-brand-primary shadow-sm ring-1 ring-slate-200'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <t.icon className="h-4 w-4 mr-2" />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'results' && (
                        <div className="space-y-8 no-print">
                            {/* Granular Filters */}
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Academic Year</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                                        value={revFilters.academic_year} onChange={e => setRevFilters({ ...revFilters, academic_year: e.target.value })}>
                                        <option>2024-25</option><option>2025-26</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Semester</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                                        value={revFilters.semester} onChange={e => setRevFilters({ ...revFilters, semester: parseInt(e.target.value) })}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Exam Type</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                                        value={revFilters.exam_type} onChange={e => setRevFilters({ ...revFilters, exam_type: e.target.value })}>
                                        <option>Mid-1</option><option>Mid-2</option><option>Internal</option><option>External</option><option>End Semester</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Department</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                                        value={revFilters.department} onChange={e => setRevFilters({ ...revFilters, department: e.target.value })}>
                                        <option>All Departments</option>
                                        <option>B.Tech CS</option>
                                        <option>B.Tech ECE</option>
                                        <option>B.Tech IT</option>
                                        <option>B.Tech ME</option>
                                        <option>B.Tech CIVIL</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Section</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                                        value={revFilters.section} onChange={e => setRevFilters({ ...revFilters, section: e.target.value })}>
                                        <option>All Sections</option>
                                        <option>A</option><option>B</option><option>C</option><option>D</option>
                                    </select>
                                </div>
                                <button onClick={fetchMarksForReview} className="mt-5 py-3 bg-brand-primary text-white font-black rounded-xl uppercase text-[10px] tracking-widest shadow-lg hover:scale-105 transition-all">
                                    Fetch Marks
                                </button>
                            </div>

                            {/* Marks Review Table */}
                            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="text-xl font-black text-brand-text uppercase italic">Marks Metadata Repository</h3>
                                    <div className="flex gap-4">
                                        <button onClick={handleApproveMarks} disabled={selectedMarkIds.length === 0} className="px-6 py-2.5 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 shadow-md">Approve Selected</button>
                                        <button onClick={handlePublishResults} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">Publish Results</button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-900 text-white">
                                            <tr>
                                                <th className="px-8 py-4"><Square className="h-4 w-4" /></th>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Student ID</th>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Subject</th>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Marks (Int/Ext)</th>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {marksForReview.map(m => (
                                                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-8 py-4">
                                                        <button onClick={() => toggleMarkSelection(m.id)}>
                                                            {selectedMarkIds.includes(m.id) ? <CheckSquare className="h-5 w-5 text-brand-primary" /> : <Square className="h-5 w-5 text-slate-300" />}
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-4 font-bold text-slate-600">STU-{m.student_id}</td>
                                                    <td className="px-8 py-4">
                                                        <span className="font-black text-brand-text block">{m.subject_code}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase font-bold">{m.subject_name}</span>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <span className="font-bold text-slate-900">{m.internal_marks}</span>
                                                        <span className="mx-2 text-slate-300">/</span>
                                                        <span className="font-bold text-slate-900">{m.external_marks}</span>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${m.status === 'Published' ? 'bg-emerald-100 text-emerald-600' :
                                                            m.status === 'Approved' ? 'bg-indigo-100 text-indigo-600' :
                                                                'bg-amber-100 text-amber-600'
                                                            }`}>
                                                            {m.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {marksForReview.length === 0 && (
                                                <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-black uppercase tracking-widest">No Marks Found for Selection</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'control' && (
                        <div className="bg-brand-card rounded-[3rem] border border-slate-200 shadow-2xl p-12 text-center max-w-2xl mx-auto no-print">
                            <ShieldCheck className="h-20 w-20 text-brand-primary mx-auto mb-8" />
                            <h3 className="text-3xl font-black text-brand-text mb-4">Exam Entry Protocols</h3>
                            <p className="text-slate-500 mb-12">Control system-wide academic entry permissions for all faculty members and staff.</p>

                            <div className={`p-8 rounded-[2rem] border-2 transition-all flex items-center justify-between ${config.mark_entry_enabled ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="text-left">
                                    <p className="text-lg font-black text-brand-text">Faculty Portals: Mark Entry</p>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Status: {config.mark_entry_enabled ? 'Enabled' : 'Disabled'}</p>
                                </div>
                                <button
                                    onClick={handleToggleMarkEntry}
                                    className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${config.mark_entry_enabled ? 'bg-red-500 text-white shadow-lg' : 'bg-brand-primary text-white shadow-lg'}`}
                                >
                                    {config.mark_entry_enabled ? 'DISABLE ENTRY' : 'ENABLE ENTRY'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'papers' && (
                        <div className="space-y-8 no-print">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black text-brand-text uppercase italic tracking-tighter">Question Paper Repository</h3>
                                <button onClick={() => setIsGenerating(true)} className="bg-brand-primary text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">GENERATE NEW MASTER</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {papers.map(p => (
                                    <div key={p.id} className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group">
                                        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                            <FileText className="h-8 w-8 text-slate-400 group-hover:text-white" />
                                        </div>
                                        <h4 className="text-xl font-black text-brand-text mb-1">{p.subject_code}</h4>
                                        <p className="text-sm font-bold text-slate-600 mb-1">{p.subject_name}</p>
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-6">Sem {p.semester} | {p.faculty_name}</p>
                                        <div className="flex gap-4">
                                            <button className="text-[10px] font-black uppercase tracking-widest text-brand-primary italic flex items-center">
                                                <Download className="h-4 w-4 mr-2" /> Download
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'notices' && (
                        <div className="bg-brand-card rounded-[3rem] border border-slate-200 shadow-2xl p-12 max-w-4xl mx-auto no-print">
                            <div className="flex items-center gap-6 mb-12">
                                <div className="h-16 w-16 bg-amber-50 rounded-[2rem] flex items-center justify-center">
                                    <Bell className="h-8 w-8 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-brand-text">Issue Exam Notifications</h3>
                                    <p className="text-slate-400 font-medium">Broadcast supplementary notices and result alerts to all students.</p>
                                </div>
                            </div>
                            <form onSubmit={handleNoticeSubmit} className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Subject / Announcement Title</label>
                                    <input
                                        type="text" required
                                        className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all font-bold"
                                        value={notice.title} onChange={e => setNotice({ ...notice, title: e.target.value })}
                                        placeholder="SUPPLEMENTARY EXAM - MARCH 2026"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Detailed Message Body</label>
                                    <textarea
                                        required rows="6"
                                        className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium resize-none"
                                        value={notice.message} onChange={e => setNotice({ ...notice, message: e.target.value })}
                                        placeholder="Enter dates, eligibility, and fee details..."
                                    />
                                </div>
                                <button type="submit" className="w-full py-6 bg-brand-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-3xl shadow-2xl hover:scale-[1.01] active:scale-95 transition-all">
                                    BROADCAST NOTIFICATION TO ALL SYSTEMS
                                </button>
                            </form>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden print:shadow-none print:border-none">
                    <div className="p-8 bg-slate-900 text-white flex justify-between items-center no-print">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsGenerating(false)} className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"><X /></button>
                            <h3 className="font-black uppercase tracking-widest text-sm">Question Paper Generator</h3>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={handleGeneratePaperSubmit}
                                disabled={loading}
                                className="bg-brand-primary px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center"
                            >
                                <Download className="h-4 w-4 mr-2" /> {loading ? 'GENERATING...' : 'GENERATE & DOWNLOAD'}
                            </button>
                        </div>
                    </div>

                    <div className="p-12 print:p-0">
                        {/* Header Details */}
                        <div className="text-center border-b-2 border-slate-900 pb-8 mb-8">
                            <h2 className="text-4xl font-black text-slate-900 uppercase">Collexa Autonomous College</h2>
                            <p className="font-bold text-slate-600 mt-2">End-Semester Examination - {new Date().getFullYear()}</p>
                            <div className="grid grid-cols-2 gap-8 mt-12 text-left max-w-4xl mx-auto">
                                <div className="space-y-4">
                                    <div className="no-print">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Subject Code</label>
                                        <input
                                            type="text" required
                                            className="w-full border-b-2 border-slate-200 py-1 outline-none focus:border-brand-primary font-black"
                                            value={qpForm.subject_code} onChange={e => setQpForm({ ...qpForm, subject_code: e.target.value })}
                                        />
                                    </div>
                                    <div className="print-only">
                                        <p className="text-xs uppercase font-black text-slate-400">Subject Code</p>
                                        <p className="text-xl font-black">{qpForm.subject_code}</p>
                                    </div>

                                    <div className="no-print">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Subject Name</label>
                                        <input
                                            type="text" required
                                            className="w-full border-b-2 border-slate-200 py-1 outline-none focus:border-brand-primary font-black"
                                            value={qpForm.subject_name} onChange={e => setQpForm({ ...qpForm, subject_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="print-only">
                                        <p className="text-xs uppercase font-black text-slate-400">Subject Name</p>
                                        <p className="text-xl font-black">{qpForm.subject_name}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="no-print">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Course Faculty</label>
                                        <input
                                            type="text" required
                                            className="w-full border-b-2 border-slate-200 py-1 outline-none focus:border-brand-primary font-black"
                                            value={qpForm.faculty_name} onChange={e => setQpForm({ ...qpForm, faculty_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="print-only">
                                        <p className="text-xs uppercase font-black text-slate-400">Faculty</p>
                                        <p className="text-xl font-black">{qpForm.faculty_name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 no-print">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400">Semester</label>
                                            <input
                                                type="number"
                                                className="w-full border-b-2 border-slate-200 py-1 outline-none focus:border-brand-primary font-black"
                                                value={qpForm.semester} onChange={e => setQpForm({ ...qpForm, semester: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400">Exam Type</label>
                                            <select
                                                className="w-full border-b-2 border-slate-200 py-1 outline-none focus:border-brand-primary font-black bg-transparent"
                                                value={qpForm.exam_type} onChange={e => setQpForm({ ...qpForm, exam_type: e.target.value })}
                                            >
                                                <option>Regular</option>
                                                <option>Supplementary</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="print-only">
                                        <p className="text-xs uppercase font-black text-slate-400">Exam Details</p>
                                        <p className="text-xl font-black">SEM {qpForm.semester} | {qpForm.exam_type}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Questions Section */}
                        <div className="max-w-4xl mx-auto space-y-12 pb-24">
                            {['2-Mark Questions', '5-Mark Questions', '10-Mark Questions', '12-Mark Questions'].map(cat => (
                                <div key={cat} className="space-y-6">
                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl no-print">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-600">{cat}</h4>
                                        <button
                                            onClick={() => addQuestion(cat)}
                                            className="h-8 w-8 bg-brand-primary text-white rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <h4 className="text-lg font-black uppercase border-b border-slate-100 pb-2 print-only">{cat}</h4>

                                    <div className="space-y-4">
                                        {qpForm.questions.filter(q => q.category === cat).map((q, idx) => (
                                            <div key={q.id} className="group relative">
                                                <div className="flex gap-4">
                                                    <span className="font-black text-slate-900 mt-1">{idx + 1}.</span>
                                                    <div className="flex-1 no-print">
                                                        <textarea
                                                            rows="2"
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-brand-primary font-medium focus:bg-white transition-all"
                                                            placeholder="Enter question text here..."
                                                            value={q.text}
                                                            onChange={e => updateQuestion(q.id, e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex-1 print-only font-bold text-slate-800 leading-relaxed">
                                                        {q.text || "(Question Pending...)"}
                                                    </div>
                                                    <button
                                                        onClick={() => removeQuestion(q.id)}
                                                        className="h-8 w-8 text-slate-300 hover:text-red-500 transition-colors no-print"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {qpForm.questions.filter(q => q.category === cat).length === 0 && (
                                            <p className="text-slate-400 italic text-xs ml-8 no-print">(No questions added yet)</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white !important; padding: 0 !important; }
                    .animate-in { animation: none !important; transition: none !important; }
                }
                .print-only { display: none; }
            `}</style>
        </div>
    );
};

export default ExamCellPortal;

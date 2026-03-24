import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Trash2, Calendar, BookOpen, User, Filter, AlertCircle, CheckCircle2 } from 'lucide-react';

const TimetableAdmin = () => {
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Filter/Selection state
    const [selection, setSelection] = useState({
        department: 'B.Tech CS',
        year: 1,
        section: 'A',
        semester: 1
    });

    // Subject Form state
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [newSubject, setNewSubject] = useState({ code: '', name: '', department: 'B.Tech CS', semester: 1, credits: 3 });

    // Entry Assignment state
    const [showEntryModal, setShowEntryModal] = useState(false);
    const [activeSlot, setActiveSlot] = useState({ day: '', hour: 0 });
    const [newEntry, setNewEntry] = useState({ subject_id: '', teacher_id: '' });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const slots = [1, 2, 3, 4, 5, 6, 7, 8];

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subRes, teachRes, entRes] = await Promise.all([
                api.get('/timetable/subjects'),
                api.get('/admin/users'), // We'll filter this for teachers
                api.get('/timetable/entries', { params: selection })
            ]);
            setSubjects(subRes.data);
            setTeachers(teachRes.data.filter(u => u.role === 'TEACHER'));
            setEntries(entRes.data);
        } catch (err) {
            console.error("Error fetching timetable data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selection]);

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/timetable/subjects', newSubject);
            setShowSubjectModal(false);
            setNewSubject({ code: '', name: '', department: selection.department, semester: selection.semester, credits: 3 });
            fetchData();
        } catch (err) { alert(err.response?.data?.detail || "Error creating subject"); }
    };

    const handleAssignEntry = async (e) => {
        e.preventDefault();
        try {
            await api.post('/timetable/entries', {
                ...newEntry,
                ...selection,
                day_of_week: activeSlot.day,
                hour_slot: activeSlot.hour
            });
            setShowEntryModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || "Conflict detected or server error");
        }
    };

    const handleDeleteEntry = async (id) => {
        if (!window.confirm("Delete this entry?")) return;
        try {
            await api.delete(`/timetable/entries/${id}`);
            fetchData();
        } catch (err) { alert("Error deleting entry"); }
    };

    const getEntryForSlot = (day, hour) => {
        return entries.find(e => e.day_of_week === day && e.hour_slot === hour);
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Control Panel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-6 items-center justify-between">
                <div className="flex gap-4 items-center">
                    <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl">
                        <Filter size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase text-slate-400">Section View</h4>
                        <div className="flex gap-2 mt-1">
                            <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs font-bold" value={selection.department} onChange={e => setSelection({...selection, department: e.target.value})}>
                                <option>B.Tech CS</option><option>B.Tech IT</option><option>B.Tech ECE</option>
                            </select>
                            <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs font-bold" value={selection.year} onChange={e => setSelection({...selection, year: parseInt(e.target.value)})}>
                                {[1,2,3,4].map(y => <option key={y} value={y}>{y} Yr</option>)}
                            </select>
                            <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs font-bold" value={selection.section} onChange={e => setSelection({...selection, section: e.target.value})}>
                                <option>A</option><option>B</option><option>C</option>
                            </select>
                            <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs font-bold" value={selection.semester} onChange={e => setSelection({...selection, semester: parseInt(e.target.value)})}>
                                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setShowSubjectModal(true)} className="px-6 py-3 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 flex items-center gap-2 hover:scale-105 transition-all">
                        <BookOpen size={16} /> Manage Subjects
                    </button>
                </div>
            </div>

            {/* Timetable Grid */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-6 border-b border-r border-slate-100 bg-slate-100/50 text-xs font-black text-slate-400 uppercase tracking-widest text-left w-32">Day / Hour</th>
                                {slots.map(s => (
                                    <th key={s} className="p-6 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest min-w-[150px]">
                                        Slot {s}
                                        <span className="block text-[8px] mt-1 text-slate-300">Period</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {days.map(day => (
                                <tr key={day} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="p-6 border-r border-b border-slate-100 font-black text-brand-text text-sm bg-slate-50/20">{day}</td>
                                    {slots.map(hour => {
                                        const entry = getEntryForSlot(day, hour);
                                        return (
                                            <td key={hour} className="p-3 border-b border-slate-100 group relative min-h-[100px]">
                                                {entry ? (
                                                    <div className="bg-indigo-50/50 border-2 border-indigo-100 p-4 rounded-2xl animate-in zoom-in-95 duration-300 relative">
                                                        <button 
                                                            onClick={() => handleDeleteEntry(entry.id)}
                                                            className="absolute top-2 right-2 p-1 text-indigo-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                        <p className="text-xs font-black text-indigo-700 uppercase leading-tight">{entry.subject?.name}</p>
                                                        <p className="text-[10px] font-bold text-indigo-400 mt-2 flex items-center gap-1">
                                                            <User size={10} /> {entry.teacher?.name}
                                                        </p>
                                                        <div className="mt-2 text-[8px] font-black text-indigo-300 bg-indigo-100/50 px-2 py-0.5 rounded-full w-fit">
                                                            {entry.subject?.code}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => { setActiveSlot({day, hour}); setShowEntryModal(true); }}
                                                        className="w-full h-full min-h-[80px] border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:border-brand-primary/30 hover:bg-brand-primary/5 hover:text-brand-primary transition-all group/btn"
                                                    >
                                                        <Plus size={20} className="mb-1" />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter opacity-0 group-hover/btn:opacity-100 transition-opacity">Assign</span>
                                                    </button>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {showSubjectModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-brand-text uppercase italic">Add New Subject</h3>
                            <button onClick={() => setShowSubjectModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X /></button>
                        </div>
                        <form onSubmit={handleCreateSubject} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Sub Code</label>
                                    <input type="text" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold mt-1" placeholder="CS401" value={newSubject.code} onChange={e => setNewSubject({...newSubject, code: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Credits</label>
                                    <input type="number" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold mt-1" value={newSubject.credits} onChange={e => setNewSubject({...newSubject, credits: parseInt(e.target.value)})}/>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Subject Name</label>
                                <input type="text" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold mt-1" placeholder="Database Systems" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})}/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Department</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold mt-1" value={newSubject.department} onChange={e => setNewSubject({...newSubject, department: e.target.value})}>
                                        <option>B.Tech CS</option><option>B.Tech IT</option><option>B.Tech ECE</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Semester</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold mt-1" value={newSubject.semester} onChange={e => setNewSubject({...newSubject, semester: parseInt(e.target.value)})}>
                                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all">Add to Database</button>
                        </form>
                    </div>
                </div>
            )}

            {showEntryModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="mb-8">
                            <h3 className="text-xl font-black text-brand-text uppercase italic">Assign Class</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{activeSlot.day} • Slot {activeSlot.hour}</p>
                        </div>
                        <form onSubmit={handleAssignEntry} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Subject</label>
                                <select required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold mt-1" value={newEntry.subject_id} onChange={e => setNewEntry({...newEntry, subject_id: e.target.value})}>
                                    <option value="">Select Subject</option>
                                    {subjects.filter(s => s.department === selection.department && s.semester === selection.semester).map(s => (
                                        <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Professor</label>
                                <select required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold mt-1" value={newEntry.teacher_id} onChange={e => setNewEntry({...newEntry, teacher_id: e.target.value})}>
                                    <option value="">Select Faculty</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.teacher_profile?.department})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-amber-600">
                                <AlertCircle size={20} className="shrink-0" />
                                <p className="text-[10px] font-medium leading-relaxed uppercase">The system will automatically prevent overlapping sessions for the same professor across sections.</p>
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowEntryModal(false)} className="flex-1 py-4 border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20">Assign Slot</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const X = () => <Trash2 size={24} />; // Fallback close icon

export default TimetableAdmin;

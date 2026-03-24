import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Clock, BookOpen, User, Info } from 'lucide-react';
import { getWsUrl } from '../../utils/config';

const TimetableView = ({ role = 'STUDENT' }) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Filters for Teacher view
    const [filters, setFilters] = useState({
        department: 'B.Tech CS',
        year: 1,
        section: 'A',
        semester: 1
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const slots = [1, 2, 3, 4, 5, 6, 7, 8];

    const fetchData = async () => {
        setLoading(true);
        try {
            let res;
            if (role === 'STUDENT') {
                res = await api.get('/timetable/my-timetable');
            } else {
                // Teacher view can be filtered OR show their own
                res = await api.get('/timetable/entries', { params: filters });
            }
            setEntries(res.data);
        } catch (err) {
            console.error("Error fetching timetable:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        // WebSocket for real-time updates
        const wsUrl = getWsUrl('guest');
        const socket = new WebSocket(wsUrl);
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'TIMETABLE_UPDATED') {
                    fetchData();
                }
            } catch (e) {}
        };
        return () => socket.close();
    }, [filters, role]);

    const getEntryForSlot = (day, hour) => {
        return entries.find(e => e.day_of_week === day && e.hour_slot === hour);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-8">
            {role === 'TEACHER' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
                    <div className="flex gap-2">
                        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold" value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})}>
                            <option>B.Tech CS</option><option>B.Tech IT</option><option>B.Tech ECE</option>
                        </select>
                        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold" value={filters.year} onChange={e => setFilters({...filters, year: parseInt(e.target.value)})}>
                            {[1,2,3,4].map(y => <option key={y} value={y}>{y} Yr</option>)}
                        </select>
                        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold" value={filters.section} onChange={e => setFilters({...filters, section: e.target.value})}>
                            <option>A</option><option>B</option><option>C</option>
                        </select>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-6 border-b border-r border-slate-100 bg-slate-100/50 text-xs font-black text-slate-400 uppercase tracking-widest text-left w-32">Day / Slot</th>
                                {slots.map(s => (
                                    <th key={s} className="p-6 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest min-w-[150px]">
                                        Slot {s}
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
                                            <td key={hour} className="p-4 border-b border-slate-100 h-32">
                                                {entry ? (
                                                    <div className="bg-brand-primary/5 border-2 border-brand-primary/10 p-4 rounded-2xl h-full flex flex-col justify-between animate-in zoom-in-95 duration-300">
                                                        <div>
                                                            <p className="text-[10px] font-black text-brand-primary uppercase tracking-tighter leading-tight">{entry.subject?.name}</p>
                                                            <div className="mt-1 text-[8px] font-black text-brand-primary/40 bg-brand-primary/5 px-2 py-0.5 rounded-full w-fit">
                                                                {entry.subject?.code}
                                                            </div>
                                                        </div>
                                                        <div className="pt-2 border-t border-brand-primary/5 flex items-center justify-between">
                                                            <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                                                                <User size={8} /> {entry.teacher?.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex items-center justify-center text-[9px] font-black text-slate-200 uppercase tracking-widest italic">
                                                        Free
                                                    </div>
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

            <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <Info size={16} className="text-slate-400" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timetable updates are reflected in real-time as soon as the administrator makes changes.</p>
            </div>
        </div>
    );
};

export default TimetableView;

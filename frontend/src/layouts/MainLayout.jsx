import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    User,
    Calendar,
    FileText,
    LogOut,
    QrCode,
    CreditCard,
    Settings,
    ClipboardList,
    MessageSquare,
    GraduationCap,
    ShieldCheck,
    Wallet
} from 'lucide-react';

const MainLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = {
        STUDENT: [
            { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
            { name: 'Scan Attendance', path: '/student/scan', icon: QrCode },
        ],
        TEACHER: [
            { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
        ],
        ADMIN: [
            { name: 'Super Admin', path: '/admin', icon: ShieldCheck },
            { name: 'Admission Desk', path: '/admission', icon: GraduationCap },
            { name: 'Exam Cell', path: '/exam-cell', icon: ClipboardList },
            { name: 'Accounts', path: '/account-section', icon: Wallet },
        ],
        ADMISSION: [
            { name: 'Admission Portal', path: '/admission', icon: GraduationCap },
        ],
        EXAM: [
            { name: 'Exam Cell', path: '/exam-cell', icon: ClipboardList },
        ],
        ACCOUNT: [
            { name: 'Account Section', path: '/account-section', icon: Wallet },
        ],
    };

    const currentMenu = menuItems[user?.role] || [];

    return (
        <div className="flex h-screen bg-brand-bg text-brand-text overflow-hidden">
            {/* Sidebar */}
            <aside className="w-68 bg-[#0f172a] border-r border-slate-800 flex flex-col shadow-2xl">
                <div className="p-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="h-10 w-10 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                            <ShieldCheck className="text-white h-6 w-6" />
                        </div>
                        <h1 className="text-xl font-black text-white tracking-tighter italic">
                            COLLEXA<span className="text-brand-primary">.</span>
                        </h1>
                    </div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">ERP Ecosystem</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar pt-4">
                    {currentMenu.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center px-5 py-4 text-sm font-bold rounded-[1.2rem] transition-all duration-300 group ${location.pathname === item.path
                                ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-[1.02]'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                }`}
                        >
                            <item.icon className={`mr-4 h-5 w-5 transition-transform group-hover:scale-110 ${location.pathname === item.path ? 'text-white' : 'text-slate-500 group-hover:text-brand-primary'}`} />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-6 mt-auto">
                    <div className="bg-slate-800/40 rounded-3xl p-5 border border-slate-700/50">
                        <div className="flex items-center mb-5">
                            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-brand-primary to-indigo-600 flex items-center justify-center text-sm font-black text-white shadow-inner">
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="ml-4 overflow-hidden">
                                <p className="text-sm font-black text-white truncate leading-none mb-1">{user?.name}</p>
                                <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest">{user?.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center w-full py-3 bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-500/20"
                        >
                            <LogOut className="mr-2 h-3.5 w-3.5" />
                            Secure Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-10">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;

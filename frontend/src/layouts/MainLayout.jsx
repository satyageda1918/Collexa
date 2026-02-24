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
    MessageSquare
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
            { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        ],
        OFFICE: [
            { name: 'Dashboard', path: '/office', icon: LayoutDashboard },
        ],
    };

    const currentMenu = menuItems[user?.role] || [];

    return (
        <div className="flex h-screen bg-brand-bg text-brand-text overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-brand-sidebar border-r border-brand-sidebar flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-white">
                        College ERP
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {currentMenu.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${location.pathname === item.path
                                ? 'bg-brand-primary text-white'
                                : 'text-indigo-100 hover:bg-brand-hover hover:text-white'
                                }`}
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-blue-800">
                    <div className="flex items-center px-4 py-3 mb-4">
                        <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center text-sm font-bold text-white">
                            {user?.sub?.[0]?.toUpperCase()}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user?.sub}</p>
                            <p className="text-xs text-indigo-200 uppercase">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';


const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, login, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && user) {
            const role = user.role;
            if (role === 'ADMIN') navigate('/admin');
            else if (role === 'STUDENT') navigate('/student');
            else if (role === 'TEACHER') navigate('/teacher');
            else if (role === 'ADMISSION') navigate('/admission');
            else if (role === 'EXAM') navigate('/exam-cell');
            else if (role === 'ACCOUNT') navigate('/account-section');
        }
    }, [user, authLoading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await api.post('/token', formData);
            login(response.data.access_token);

            const decoded = jwtDecode(response.data.access_token);

            const role = decoded.role;

            if (role === 'ADMIN') navigate('/admin');
            else if (role === 'STUDENT') navigate('/student');
            else if (role === 'TEACHER') navigate('/teacher');
            else if (role === 'ADMISSION') navigate('/admission');
            else if (role === 'EXAM') navigate('/exam-cell');
            else if (role === 'ACCOUNT') navigate('/account-section');
            else navigate('/');

        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Could not connect to server. Check your internet or API URL.';
            setError(errorMsg === 'Incorrect email or password' ? 'Invalid email or password' : errorMsg);

        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-brand-bg"><Loader2 className="animate-spin h-8 w-8 text-brand-primary" /></div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4">
            <div className="max-w-md w-full space-y-8 p-10 bg-brand-card rounded-2xl shadow-xl border border-slate-200">
                <div>
                    <div className="flex justify-center mb-6">
                        <img src="/logo.webp" alt="College Logo" className="h-20 w-20 object-contain" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-text">
                        College ERP Portal
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-500">
                        Sign in to access your dashboard
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded text-sm">
                            {error}
                        </div>
                    )}
                    <div className="rounded-md shadow-sm space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="email"
                                required
                                className="block w-full pl-10 pr-3 py-2 border border-slate-300 bg-white text-brand-text rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="password"
                                required
                                className="block w-full pl-10 pr-3 py-2 border border-slate-300 bg-white text-brand-text rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-primary hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;

import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword } from '../firebase';
import { LogIn, ShieldCheck, Mail, Lock } from 'lucide-react';
import { logoBase64 } from '../assets/logoData';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      navigate('/');
    } catch (err: any) {
      console.error('Email login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8">
          <div className="size-20 rounded-2xl overflow-hidden border border-slate-100 shadow-sm mx-auto mb-6">
            <img src={logoBase64} alt="Yashodai Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">Yashodai Play School</h1>
          <p className="text-slate-500 text-center mb-8">Admission & Receipt Management System</p>

          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3 text-left">
              <ShieldCheck className="text-blue-600 shrink-0" size={20} />
              <div>
                <p className="text-sm font-bold text-blue-900">Secure Access</p>
                <p className="text-xs text-blue-700">Please sign in with your authorized school account to continue.</p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    required
                    type="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    required
                    type="password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <LogIn size={20} />
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-bold hover:underline">
                Register Now
              </Link>
            </p>
          </div>
        </div>
        
        <div className="bg-slate-50 p-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">
            Authorized Personnel Only. All access is logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { LogIn, School, ShieldCheck } from 'lucide-react';
import { logoBase64 } from '../assets/logoData';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="size-20 rounded-2xl overflow-hidden border border-slate-100 shadow-sm mx-auto mb-6">
            <img src={logoBase64} alt="Yashodai Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Yashodai Play School</h1>
          <p className="text-slate-500 mb-8">Admission & Receipt Management System</p>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3 text-left">
              <ShieldCheck className="text-blue-600 shrink-0" size={20} />
              <div>
                <p className="text-sm font-bold text-blue-900">Secure Access</p>
                <p className="text-xs text-blue-700">Please sign in with your authorized school Google account to continue.</p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="size-5" />
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>
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

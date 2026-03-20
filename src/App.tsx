import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { School, Mail, LayoutDashboard, UserPlus, Database, FileText, Plus, Bell, ChevronRight, Receipt, LogOut } from 'lucide-react';
import { logoBase64 } from './assets/logoData';
import { auth, signOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Pages
import Dashboard from './pages/Dashboard';
import Admissions from './pages/Admissions';
import Records from './pages/Records';
import StudentProfile from './pages/StudentProfile';
import ReceiptPreview from './pages/ReceiptPreview';
import Reports from './pages/Reports';
import EditStudent from './pages/EditStudent';
import Login from './pages/Login';
import Register from './pages/Register';

function Sidebar({ user }: { user: User | null }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Admissions', path: '/admissions', icon: UserPlus },
    { name: 'Records', path: '/records', icon: Database },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="size-12 rounded-xl overflow-hidden border border-slate-100 shadow-sm flex-shrink-0">
            <img src={logoBase64} alt="Yashodai Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-slate-900 text-base font-bold leading-tight">Yashodai Play School</h1>
            <p className="text-slate-500 text-xs font-normal">Admission & Receipt System</p>
          </div>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200 overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'A'}</span>
              )}
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-bold truncate max-w-[120px]">{user?.displayName || user?.email?.split('@')[0] || 'School Admin'}</p>
              <p className="text-xs text-slate-500">Authorized Access</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function Header() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-end">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admissions')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          New Admission
        </button>
        <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        {user && <Sidebar user={user} />}
        <main className="flex-1 flex flex-col">
          {user && <Header />}
          <div className="p-8">
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
              <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
              <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/admissions" element={user ? <Admissions /> : <Navigate to="/login" />} />
              <Route path="/records" element={user ? <Records /> : <Navigate to="/login" />} />
              <Route path="/student/:id" element={user ? <StudentProfile /> : <Navigate to="/login" />} />
              <Route path="/edit-student/:id" element={user ? <EditStudent /> : <Navigate to="/login" />} />
              <Route path="/receipt/:paymentId" element={user ? <ReceiptPreview /> : <Navigate to="/login" />} />
              <Route path="/reports" element={user ? <Reports /> : <Navigate to="/login" />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

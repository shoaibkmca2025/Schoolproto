import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserPlus, 
  Database, 
  FileText, 
  Search, 
  Plus, 
  Bell, 
  LogOut,
  School,
  ChevronRight,
  Receipt,
  Mail
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Pages
import Dashboard from './pages/Dashboard';
import Admissions from './pages/Admissions';
import Records from './pages/Records';
import StudentProfile from './pages/StudentProfile';
import ReceiptPreview from './pages/ReceiptPreview';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

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
          <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <School size={24} />
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
            <div className="size-10 rounded-full bg-slate-200 bg-cover bg-center" style={{ backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.email}')` }}></div>
            <div className="flex flex-col">
              <p className="text-sm font-bold truncate max-w-[120px]">{auth.currentUser?.displayName || 'Admin Staff'}</p>
              <p className="text-xs text-slate-500">School Admin</p>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
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
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6 flex-1 max-w-2xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-600/50 text-slate-900"
            placeholder="Find students by Name or Admission No."
            type="text"
          />
        </div>
      </div>
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

function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full text-center">
        <div className="size-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto mb-6">
          <School size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Yashodai Play School</h1>
        <p className="text-slate-500 mb-8">Management Portal - Please sign in to continue</p>
        <button
          onClick={handleLogin}
          className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <Header />
          <div className="p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/admissions" element={<Admissions />} />
              <Route path="/records" element={<Records />} />
              <Route path="/student/:id" element={<StudentProfile />} />
              <Route path="/receipt/:paymentId" element={<ReceiptPreview />} />
              <Route path="/reports" element={<div>Reports coming soon...</div>} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

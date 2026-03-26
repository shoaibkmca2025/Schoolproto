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

import { usePendingFees } from './utils/usePendingFees';

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
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 no-print">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="size-12 rounded-xl overflow-hidden border border-slate-100 shadow-sm flex-shrink-0">
            <img src={logoBase64} alt="Yashodai Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-slate-900 text-base font-bold leading-tight">Yashodai Play School & Nursery</h1>
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
  const { pendingStudents } = usePendingFees();
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);

  // Filter for overdue students (due day passed)
  const today = new Date().getDate();
  const overdueStudents = pendingStudents.filter(s => today > (s.dueDay || 5));

  useEffect(() => {
    if (overdueStudents.length < lastSeenCount) {
      setLastSeenCount(overdueStudents.length);
    }
  }, [overdueStudents.length, lastSeenCount]);

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-end no-print">
      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => {
              if (!showNotifications) {
                setLastSeenCount(overdueStudents.length);
              }
              setShowNotifications(!showNotifications);
            }}
            className={`p-2 rounded-xl transition-all relative ${showNotifications ? 'bg-slate-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Bell size={20} />
            {overdueStudents.length > lastSeenCount && (
              <span className="absolute top-1.5 right-1.5 size-4 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                {overdueStudents.length - lastSeenCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <h3 className="font-bold">Fee Reminders</h3>
                  <span className="text-[10px] bg-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {overdueStudents.length} Overdue
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {overdueStudents.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="size-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell size={24} />
                      </div>
                      <p className="text-sm text-slate-500">No overdue payments today.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {overdueStudents.map(student => (
                        <div key={student.id} className="group relative flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                          <button
                            onClick={() => {
                              navigate(`/student/${student.id}`);
                              setShowNotifications(false);
                            }}
                            className="flex-1 min-w-0 text-left flex items-center gap-3"
                          >
                            <div className="size-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                              {(student.firstName || student.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {student.firstName ? `${student.firstName} ${student.fatherName} ${student.lastName}` : (student.name || 'Unknown Student')}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span className="text-red-600 font-bold">₹{student.balance.toLocaleString()} Due</span>
                                <span>•</span>
                                <span>Day {student.dueDay || 5}</span>
                              </div>
                            </div>
                          </button>
                          
                          <a
                            href={`https://wa.me/${((student.alternateWhatsappNumber || student.contact).replace(/\D/g, '').startsWith('91') ? (student.alternateWhatsappNumber || student.contact).replace(/\D/g, '') : '91' + (student.alternateWhatsappNumber || student.contact).replace(/\D/g, ''))}?text=${encodeURIComponent(`Hello ${student.fatherName || 'Parent'}, this is a reminder regarding the pending school fees for ${student.firstName ? `${student.firstName} ${student.fatherName} ${student.lastName}` : (student.name || 'your child')}. \n\nPending Amount: ₹${student.balance.toLocaleString()}\nDue Date: ${student.dueDay || 5}th of this month.\n\nPlease clear the dues at the earliest. Thank you!`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0"
                            title="Send WhatsApp Reminder"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg viewBox="0 0 24 24" className="size-5 fill-current">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.628 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      navigate('/');
                      setShowNotifications(false);
                    }}
                    className="w-full py-2 text-xs font-bold text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    View All in Dashboard
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <button 
          onClick={() => navigate('/admissions')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          New Admission
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
          <div className="p-8 print:p-0">
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

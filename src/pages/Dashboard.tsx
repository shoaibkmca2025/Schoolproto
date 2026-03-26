import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X,
  Users, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Eye,
  Receipt,
  Mail,
  ChevronRight
} from 'lucide-react';
import { db, collection, getDocs, query, orderBy, limit, onSnapshot } from '../firebase';
import { Student, Admission, Payment } from '../types';
import { format } from 'date-fns';

import { usePendingFees } from '../utils/usePendingFees';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingFees: 0,
    todayCollections: 0
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const { pendingStudents } = usePendingFees();
  const [showReminderModal, setShowReminderModal] = useState(false);

  useEffect(() => {
    // Real-time listener for students count and collections
    const unsubscribeStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      setStats(prev => ({ ...prev, totalStudents: snapshot.size }));
      
      const unsubPayments = onSnapshot(collection(db, 'payments'), (paySnapshot) => {
        const pays = paySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment & { id: string }));
        
        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCollections = pays
          .filter(p => {
            const pDate = new Date(p.date);
            pDate.setHours(0, 0, 0, 0);
            return pDate.getTime() === today.getTime();
          })
          .reduce((sum, p) => sum + p.amount, 0);

        setStats(prev => ({
          ...prev,
          todayCollections
        }));
      });
      return () => unsubPayments();
    });

    // Recent students query
    const q = query(collection(db, 'students'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeRecent = onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentStudents(students);
    });

    return () => {
      unsubscribeStudents();
      unsubscribeRecent();
    };
  }, []);

  useEffect(() => {
    if (pendingStudents.length >= 0) {
      const totalPending = pendingStudents.reduce((sum, s) => sum + s.balance, 0);
      setStats(prev => ({ ...prev, pendingFees: totalPending }));
    }
  }, [pendingStudents]);

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium">Total Students</span>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold">{stats.totalStudents}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium">Pending Fees</span>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Wallet size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold">₹{stats.pendingFees.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium">Today's Collections</span>
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold">₹{stats.todayCollections.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Recent Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent Students</h2>
          <button 
            onClick={() => navigate('/records')}
            className="text-blue-600 text-sm font-bold hover:underline"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Class</th>
                <th className="px-6 py-4 font-semibold">Date Added</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No students found. Add your first admission!
                  </td>
                </tr>
              ) : (
                recentStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/student/${student.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {(student.firstName || student.name || '').substring(0, 1).toUpperCase()}
                          {(student.lastName || '').substring(0, 1).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold">
                          {student.firstName ? `${student.firstName} ${student.lastName}` : (student.name || 'Unknown')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.class}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {student.createdAt ? format(new Date(student.createdAt), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/student/${student.id}`);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center gap-4">
          <div className="size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <Receipt size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Generate Receipt</h4>
            <p className="text-sm text-slate-600">Print or email fee receipts for students.</p>
          </div>
          <button 
            onClick={() => navigate('/records')}
            className="ml-auto p-2 hover:bg-blue-100 rounded-xl text-blue-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex items-center gap-4">
          <div className="size-12 rounded-xl bg-slate-800 text-white flex items-center justify-center">
            <Mail size={24} />
          </div>
          <div>
            <h4 className="font-bold text-white">Send Reminders</h4>
            <p className="text-sm text-slate-400">Notify parents about pending fees via SMS/Email.</p>
          </div>
          <button 
            onClick={() => setShowReminderModal(true)}
            className="ml-auto p-2 hover:bg-slate-800 rounded-xl text-slate-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="text-xl font-bold">Pending Fee Reminders</h3>
                <p className="text-slate-400 text-sm">{pendingStudents.length} students with outstanding dues</p>
              </div>
              <button 
                onClick={() => setShowReminderModal(false)}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {pendingStudents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="size-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp size={32} />
                  </div>
                  <h4 className="font-bold text-slate-900">All caught up!</h4>
                  <p className="text-slate-500">No students currently have pending fees.</p>
                </div>
              ) : (
                pendingStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                        {(student.firstName || student.name || '').substring(0, 1).toUpperCase()}
                        {(student.lastName || '').substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">
                          {student.firstName ? `${student.firstName} ${student.lastName}` : (student.name || 'Unknown')}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{student.class}</span>
                          <span>•</span>
                          <span className="font-medium text-amber-600">₹{student.balance.toLocaleString()} Pending</span>
                          <span>•</span>
                          <span className={`${new Date().getDate() > (student.dueDay || 5) ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                            Due: {student.dueDay || 5}th
                          </span>
                          {new Date().getDate() > (student.dueDay || 5) && (
                            <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight">Overdue</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <a 
                      href={`https://wa.me/${((student.alternateWhatsappNumber || student.contact).replace(/\D/g, '').startsWith('91') ? (student.alternateWhatsappNumber || student.contact).replace(/\D/g, '') : '91' + (student.alternateWhatsappNumber || student.contact).replace(/\D/g, ''))}?text=${encodeURIComponent(`Hello ${student.fatherName || 'Parent'}, this is a reminder regarding the pending school fees for ${student.firstName ? `${student.firstName} ${student.lastName}` : (student.name || 'your child')}. \n\nPending Amount: ₹${student.balance.toLocaleString()}\nDue Date: ${student.dueDay || 5}th of this month.\n\nPlease clear the dues at the earliest. Thank you!`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-600/20"
                    >
                      <svg viewBox="0 0 24 24" className="size-4 fill-current">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.628 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </a>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowReminderModal(false)}
                className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

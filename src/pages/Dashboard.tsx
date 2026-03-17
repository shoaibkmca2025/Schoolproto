import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  MoreVertical,
  Receipt,
  Mail,
  ChevronRight
} from 'lucide-react';
import { db, collection, getDocs, query, orderBy, limit, onSnapshot } from '../firebase';
import { Student, Admission, Payment } from '../types';
import { format } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingFees: 0,
    todayCollections: 0
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);

  useEffect(() => {
    // Real-time listener for students count
    const unsubscribeStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      setStats(prev => ({ ...prev, totalStudents: snapshot.size }));
    });

    let admissions: Admission[] = [];
    let payments: Payment[] = [];

    const updateStats = () => {
      // Calculate Today's Collections
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCollections = payments
        .filter(p => {
          const pDate = new Date(p.date);
          pDate.setHours(0, 0, 0, 0);
          return pDate.getTime() === today.getTime();
        })
        .reduce((sum, p) => sum + p.amount, 0);

      // Calculate Pending Fees
      let totalPending = 0;
      admissions.forEach(admission => {
        const paidForAdmission = payments
          .filter(p => p.admissionId === admission.id)
          .reduce((sum, p) => sum + p.amount, 0);
        totalPending += (admission.totalFee - paidForAdmission);
      });

      setStats(prev => ({
        ...prev,
        pendingFees: totalPending,
        todayCollections: todayCollections
      }));
    };

    const unsubscribeAdmissions = onSnapshot(collection(db, 'admissions'), (snapshot) => {
      admissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admission));
      updateStats();
    });

    const unsubscribePayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
      payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      updateStats();
    });

    // Recent students query
    const q = query(collection(db, 'students'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeRecent = onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentStudents(students);
    });

    return () => {
      unsubscribeStudents();
      unsubscribeAdmissions();
      unsubscribePayments();
      unsubscribeRecent();
    };
  }, []);

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
                        <div className="size-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {student.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.class}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {student.createdAt ? format(new Date(student.createdAt), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-blue-600">
                        <MoreVertical size={18} />
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
            className="ml-auto p-2 hover:bg-blue-100 rounded-lg text-blue-600"
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
          <button className="ml-auto p-2 hover:bg-slate-800 rounded-lg text-slate-400">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingFees: 0,
    todayCollections: 0
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);

  useEffect(() => {
    // Real-time listener for students count
    const unsubscribeStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const allStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student & { id: string }));
      setStats(prev => ({ ...prev, totalStudents: snapshot.size }));
      
      // We need admissions and payments to calculate pending per student
      const unsubAdmissions = onSnapshot(collection(db, 'admissions'), (admSnapshot) => {
        const adms = admSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admission & { id: string }));
        
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

          let totalPending = 0;
          const pendingList: any[] = [];

          adms.forEach(admission => {
            const student = allStudents.find(s => s.id === admission.studentId);
            if (!student) return;

            const paidForAdmission = pays
              .filter(p => p.admissionId === admission.id)
              .reduce((sum, p) => sum + p.amount, 0);
            
            const balance = admission.totalFee - paidForAdmission;
            totalPending += balance;

            if (balance > 0) {
              pendingList.push({
                ...student,
                admissionId: admission.id,
                balance,
                admissionNo: admission.admissionNo,
                dueDay: admission.dueDay || 5
              });
            }
          });

          setStats({
            totalStudents: snapshot.size,
            pendingFees: totalPending,
            todayCollections
          });
          setPendingStudents(pendingList);
        });
        return () => unsubPayments();
      });
      return () => unsubAdmissions();
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

  const sendWhatsAppReminder = (student: any) => {
    const firstName = student.firstName || student.name?.split(' ')[0] || '';
    const lastName = student.lastName || student.name?.split(' ').slice(1).join(' ') || '';
    const currentMonth = format(new Date(), 'MMMM');
    const message = `Hello ${student.fatherName || 'Parent'}, this is a reminder regarding the pending school fees for ${firstName} ${lastName} (Adm No: ${student.admissionNo}). \n\nPending Amount: ₹${student.balance.toLocaleString()}\nDue Date: ${student.dueDay}th of ${currentMonth}\n\nPlease clear the dues at the earliest. Thank you!`;
    const phone = student.contact.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

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
                    <button 
                      onClick={() => sendWhatsAppReminder(student)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-600/20"
                    >
                      <Mail size={16} />
                      WhatsApp
                    </button>
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

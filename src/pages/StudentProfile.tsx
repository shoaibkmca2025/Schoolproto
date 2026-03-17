import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Share2, 
  History, 
  PlusCircle, 
  Banknote, 
  Calendar,
  CreditCard,
  Upload,
  CheckCircle2,
  UserPlus,
  Trash2
} from 'lucide-react';
import { 
  db, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  onSnapshot,
  deleteDoc,
  handleFirestoreError,
  OperationType
} from '../firebase';
import { Student, Admission, Payment } from '../types';
import { format } from 'date-fns';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    installmentNumber: 1,
    paymentMode: 'Cash' as Payment['paymentMode'],
    transactionId: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    if (!id || !admission) return;
    
    setSubmitting(true);
    try {
      // 1. Delete Payments
      const pq = query(collection(db, 'payments'), where('admissionId', '==', admission.id));
      const pSnap = await getDocs(pq);
      const deletePromises = pSnap.docs.map(d => deleteDoc(doc(db, 'payments', d.id)));
      await Promise.all(deletePromises);

      // 2. Delete Admission
      await deleteDoc(doc(db, 'admissions', admission.id!));

      // 3. Delete Student
      await deleteDoc(doc(db, 'students', id));

      navigate('/records');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'students');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const studentDoc = await getDoc(doc(db, 'students', id));
        if (studentDoc.exists()) {
          setStudent({ id: studentDoc.id, ...studentDoc.data() } as Student);
          
          // Fetch Admission
          const q = query(collection(db, 'admissions'), where('studentId', '==', id));
          const admissionSnap = await getDocs(q);
          if (!admissionSnap.empty) {
            const adm = { id: admissionSnap.docs[0].id, ...admissionSnap.docs[0].data() } as Admission;
            setAdmission(adm);
            
            // Real-time payments
            const pq = query(collection(db, 'payments'), where('admissionId', '==', adm.id), orderBy('date', 'desc'));
            const unsubscribe = onSnapshot(pq, (snapshot) => {
              setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Payment));
            });
            return unsubscribe;
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admission) return;
    setSubmitting(true);

    try {
      const receiptNo = `RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const paymentData: Payment = {
        admissionId: admission.id!,
        amount: Number(paymentForm.amount),
        date: new Date(paymentForm.date).toISOString(),
        installmentNumber: Number(paymentForm.installmentNumber),
        paymentMode: paymentForm.paymentMode,
        transactionId: paymentForm.transactionId,
        receiptNo,
        notes: paymentForm.notes
      };

      const docRef = await addDoc(collection(db, 'payments'), paymentData);
      navigate(`/receipt/${docRef.id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payments');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading profile...</div>;
  if (!student || !admission) return <div className="text-center py-20">Student not found.</div>;

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = admission.totalFee - totalPaid;

  return (
    <div className="space-y-8">
      {/* Breadcrumbs & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <button onClick={() => navigate('/')} className="hover:text-blue-600">Dashboard</button>
          <span>/</span>
          <button onClick={() => navigate('/records')} className="hover:text-blue-600">Students</button>
          <span>/</span>
          <span className="text-slate-900 font-medium">Student Profile</span>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white p-8 rounded-none border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-start">
        <div className="relative">
          <div className="size-32 rounded-none bg-slate-100 bg-cover bg-center" style={{ backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}')` }}></div>
          <button className="absolute -bottom-2 -right-2 size-8 rounded-full bg-blue-600 text-white flex items-center justify-center border-4 border-white">
            <PlusCircle size={14} />
          </button>
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{student.name}</h1>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">Active</span>
          </div>
          <p className="text-slate-500 font-medium">Admission No: <span className="text-slate-900">{admission.admissionNo}</span></p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-none border border-slate-100">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Fee</p>
              <p className="text-xl font-bold text-slate-900">₹{admission.totalFee.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-none border border-blue-100">
              <p className="text-xs text-blue-600 uppercase font-bold mb-1">Paid Amount</p>
              <p className="text-xl font-bold text-blue-700">₹{totalPaid.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-none border border-amber-100">
              <p className="text-xs text-amber-600 uppercase font-bold mb-1">Balance Due</p>
              <p className="text-xl font-bold text-amber-700">₹{balance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
          <button 
            onClick={() => navigate(`/edit-student/${id}`)}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
          >
            <UserPlus size={18} />
            Edit Profile
          </button>
          <button 
            onClick={() => {
              if (payments.length > 0) {
                navigate(`/receipt/${payments[0].id}`);
              } else {
                // Scroll to payment form if no payments yet
                document.getElementById('payment-form')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
          >
            <FileText size={18} />
            Fee Receipt
          </button>
          <button 
            onClick={() => {
              const text = `Student: ${student.name}\nAdmission No: ${admission.admissionNo}\nTotal Fee: ₹${admission.totalFee}\nPaid: ₹${totalPaid}\nBalance: ₹${balance}`;
              if (navigator.share) {
                navigator.share({ title: 'Student Details', text });
              } else {
                navigator.clipboard.writeText(text);
                alert('Details copied to clipboard!');
              }
            }}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Share2 size={18} />
            Share Details
          </button>
          <button 
            onClick={() => setShowDeleteModal(true)}
            disabled={submitting}
            className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all disabled:opacity-50"
          >
            <Trash2 size={18} />
            Delete Record
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-none max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="size-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Student Record?</h3>
            <p className="text-slate-500 text-center mb-8">
              This action cannot be undone. All admission details and payment history for <strong>{student?.name}</strong> will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  handleDelete();
                }}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment History */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <History size={20} className="text-blue-600" />
              Payment History
            </h2>
          </div>
          
          <div className="space-y-4">
            {payments.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-none border border-slate-200 text-slate-500">
                No payments recorded yet.
              </div>
            ) : (
              payments.map((p, idx) => (
                <div key={p.id} className="bg-white p-5 rounded-none border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900">Installment #{p.installmentNumber}</h4>
                      <p className="text-xs text-slate-500">{format(new Date(p.date), 'dd MMM, yyyy')}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${p.paymentMode === 'Cash' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {p.paymentMode}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-2">Receipt No: {p.receiptNo}</p>
                  <p className="text-lg font-bold text-slate-900">₹{p.amount.toLocaleString()}</p>
                  <button 
                    onClick={() => navigate(`/receipt/${p.id}`)}
                    className="mt-3 w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-blue-600 transition-all"
                  >
                    View Receipt
                  </button>
                </div>
              ))
            )}
            
            {/* Timeline element */}
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                <CheckCircle2 size={16} />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase">Admission Completed</p>
              <p className="text-[10px] text-slate-400">{format(new Date(admission.createdAt), 'dd MMM, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Enter New Payment */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <PlusCircle size={20} className="text-blue-600" />
            Enter New Payment
          </h2>
          
          <form id="payment-form" onSubmit={handlePaymentSubmit} className="bg-white p-8 rounded-none border border-slate-200 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Payment Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input
                    required
                    type="number"
                    className="w-full pl-8 rounded-none border-slate-200 focus:ring-blue-600/50"
                    placeholder="Enter amount"
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Payment Date</label>
                <input
                  required
                  type="date"
                  className="w-full rounded-none border-slate-200 focus:ring-blue-600/50"
                  value={paymentForm.date}
                  onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Installment No.</label>
                <select
                  className="w-full rounded-none border-slate-200 focus:ring-blue-600/50"
                  value={paymentForm.installmentNumber}
                  onChange={e => setPaymentForm({...paymentForm, installmentNumber: Number(e.target.value)})}
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>Installment #{i+1}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Payment Mode</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentForm({...paymentForm, paymentMode: 'Cash'})}
                    className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${paymentForm.paymentMode === 'Cash' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-200 text-slate-500'}`}
                  >
                    <Banknote size={18} />
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentForm({...paymentForm, paymentMode: 'Online'})}
                    className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${paymentForm.paymentMode === 'Online' ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-200 text-slate-500'}`}
                  >
                    <CreditCard size={18} />
                    Online
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Transaction ID / Reference</label>
              <input
                type="text"
                className="w-full rounded-none border-slate-200 focus:ring-blue-600/50"
                placeholder="e.g. TXN123456789"
                value={paymentForm.transactionId}
                onChange={e => setPaymentForm({...paymentForm, transactionId: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Upload Transaction Screenshot</label>
              <div className="border-2 border-dashed border-slate-200 rounded-none p-8 text-center hover:border-blue-400 transition-all cursor-pointer">
                <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                <p className="text-sm font-bold text-slate-600">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-400">PNG, JPG or PDF (MAX. 2MB)</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Remarks (Optional)</label>
              <textarea
                className="w-full rounded-none border-slate-200 focus:ring-blue-600/50"
                placeholder="Any additional notes..."
                rows={3}
                value={paymentForm.notes}
                onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})}
              ></textarea>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400 max-w-[300px]">Please verify all details before submitting. Receipt will be auto-generated.</p>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setPaymentForm({
                    amount: 0,
                    date: format(new Date(), 'yyyy-MM-dd'),
                    installmentNumber: 1,
                    paymentMode: 'Cash',
                    transactionId: '',
                    notes: ''
                  })}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

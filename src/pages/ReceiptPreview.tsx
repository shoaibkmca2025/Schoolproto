import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Share2, ArrowLeft, FileText, CreditCard, School, User } from 'lucide-react';
import { logoBase64 } from '../assets/logoData';
import { useReactToPrint } from 'react-to-print';
import { db, doc, getDoc, collection, query, where, getDocs } from '../firebase';
import { Student, Admission, Payment } from '../types';
import { format } from 'date-fns';
import { numberToWords } from '../utils/numberToWords';

export default function ReceiptPreview() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const componentRef = useRef<HTMLDivElement>(null);
  
  const [payment, setPayment] = useState<Payment | null>(null);
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [totalPaidToDate, setTotalPaidToDate] = useState(0);
  const [loading, setLoading] = useState(true);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  useEffect(() => {
    if (!paymentId) return;

    const fetchData = async () => {
      try {
        const pDoc = await getDoc(doc(db, 'payments', paymentId));
        if (pDoc.exists()) {
          const pData = { id: pDoc.id, ...pDoc.data() } as Payment;
          setPayment(pData);

          const aDoc = await getDoc(doc(db, 'admissions', pData.admissionId));
          if (aDoc.exists()) {
            const aData = { id: aDoc.id, ...aDoc.data() } as Admission;
            setAdmission(aData);

            const sDoc = await getDoc(doc(db, 'students', aData.studentId));
            if (sDoc.exists()) {
              setStudent({ id: sDoc.id, ...sDoc.data() } as Student);
            }

            // Calculate total paid to date
            const pq = query(collection(db, 'payments'), where('admissionId', '==', aData.id));
            const pSnap = await getDocs(pq);
            const total = pSnap.docs.reduce((sum, doc) => sum + (doc.data() as Payment).amount, 0);
            setTotalPaidToDate(total);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [paymentId]);

  if (loading) return <div className="text-center py-20">Loading receipt...</div>;
  if (!payment || !admission || !student) return <div className="text-center py-20">Receipt not found.</div>;

  const remainingBalance = admission.totalFee - totalPaidToDate;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            Fee Receipt Preview
          </h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handlePrint()}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700"
          >
            <Printer size={18} />
            Print Receipt
          </button>
          <button 
            onClick={() => {
              const text = `Fee Receipt #${payment.receiptNo}\nStudent: ${student.name}\nAmount: ₹${payment.amount}\nBalance: ₹${remainingBalance}`;
              if (navigator.share) {
                navigator.share({ title: 'Fee Receipt', text });
              } else {
                navigator.clipboard.writeText(text);
                alert('Receipt details copied to clipboard!');
              }
            }}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50"
          >
            <Share2 size={18} />
            Share
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="bg-white p-12 rounded-none shadow-lg border border-slate-200 min-h-[1000px]" ref={componentRef}>
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div className="flex gap-6">
            <div className="size-24 rounded-none overflow-hidden border border-slate-100 shadow-sm">
              <img src={logoBase64} alt="Yashodai Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Yashodai Play School</h2>
              <p className="text-blue-600 font-bold mb-2">Nashik Branch</p>
              <p className="text-sm text-slate-500 max-w-[300px]">
                Narayani Bangla, Jay Ambe Nagar, behind K.K. Wagh College, Panchavati, Nashik.<br />
                Contact: +91 7249462345
              </p>
            </div>
          </div>
          <div className="bg-slate-50 p-6 rounded-none border border-slate-100 text-right min-w-[200px]">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Receipt No</p>
            <p className="text-lg font-bold text-slate-900 mb-4">#{payment.receiptNo}</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Date</p>
            <p className="text-sm font-bold text-slate-900">{format(new Date(payment.date), 'MMMM dd, yyyy')}</p>
          </div>
        </div>

        <hr className="border-slate-100 mb-8" />

        {/* Student Details */}
        <div className="space-y-6 mb-12">
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
            <User size={14} />
            Student Details
          </h3>
          <div className="bg-slate-50 p-8 rounded-none grid grid-cols-2 gap-y-6 gap-x-12">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-sm text-slate-500">Student Name</span>
              <span className="text-sm font-bold text-slate-900">{student.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-sm text-slate-500">Admission No</span>
              <span className="text-sm font-bold text-slate-900">{admission.admissionNo}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-sm text-slate-500">Father's Name</span>
              <span className="text-sm font-bold text-slate-900">{student.fatherName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-sm text-slate-500">Class</span>
              <span className="text-sm font-bold text-slate-900">{student.class}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-sm text-slate-500">Mother's Name</span>
              <span className="text-sm font-bold text-slate-900">{student.motherName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-sm text-slate-500">Academic Year</span>
              <span className="text-sm font-bold text-slate-900">{admission.academicYear}</span>
            </div>
          </div>
        </div>

        {/* Payment Details Table */}
        <div className="space-y-6 mb-12">
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
            <CreditCard size={14} />
            Payment Details
          </h3>
          <div className="overflow-hidden rounded-none border border-slate-200">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Description / Installment</th>
                  <th className="px-6 py-4 font-bold">Payment Mode</th>
                  <th className="px-6 py-4 font-bold">Transaction ID</th>
                  <th className="px-6 py-4 font-bold text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-6 py-6">
                    <p className="font-bold text-slate-900">Installment #{payment.installmentNumber}</p>
                    <p className="text-xs text-slate-500">Period: {admission.installmentType}</p>
                  </td>
                  <td className="px-6 py-6 text-sm font-medium text-slate-700">{payment.paymentMode}</td>
                  <td className="px-6 py-6 text-sm font-medium text-slate-700">{payment.transactionId || '-'}</td>
                  <td className="px-6 py-6 text-right font-bold text-slate-900">₹ {payment.amount.toLocaleString()}.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="flex justify-between items-start gap-12 mb-12">
          <div className="flex-1 bg-blue-50 p-8 rounded-none border border-blue-100">
            <p className="text-[10px] text-blue-600 uppercase font-bold tracking-wider mb-2">Amount in Words</p>
            <p className="text-lg font-bold text-slate-900 italic">Rupees {numberToWords(payment.amount)}</p>
          </div>
          <div className="w-[300px] space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Annual Fee</span>
              <span className="font-bold text-slate-900">₹ {admission.totalFee.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Paid to Date (incl. this)</span>
              <span className="font-bold text-slate-900">₹ {totalPaidToDate.toLocaleString()}.00</span>
            </div>
            <div className="bg-blue-600 p-6 rounded-none text-white flex justify-between items-center">
              <span className="text-xs font-bold uppercase">Remaining Balance</span>
              <div className="text-right">
                <span className="text-2xl font-bold">₹ {remainingBalance.toLocaleString()}.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-12 border-t border-slate-100 flex justify-between items-end">
          <div className="max-w-[400px] space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Terms & Conditions:</p>
            <ul className="text-[10px] text-slate-400 space-y-1 list-disc pl-4">
              <li>Fees once paid are non-refundable and non-transferable.</li>
              <li>This is a computer-generated receipt and requires an authorized signature/stamp.</li>
              <li>Delayed payment may attract a late fee penalty as per school policy.</li>
            </ul>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-slate-900 mb-2"></div>
            <p className="text-xs font-bold text-slate-900 uppercase">Authorized Signatory</p>
            <p className="text-[10px] text-slate-500">School Office Seal</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-slate-400 mb-1">Thank you for choosing Yashodai Play School for your child's early education.</p>
          <p className="text-[10px] font-bold text-blue-600">www.yashodaischool.edu.in</p>
        </div>
      </div>
    </div>
  );
}

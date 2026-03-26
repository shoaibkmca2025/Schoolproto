import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Share2, ArrowLeft, FileText, CreditCard, School, User } from 'lucide-react';
import { logoBase64 } from '../assets/logoData';
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

  const handlePrint = () => {
    window.print();
  };

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
            const total = pSnap.docs.reduce((sum, doc) => sum + Number((doc.data() as Payment).amount), 0);
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

  const getStudentFullName = () => {
    if (student.firstName) {
      return `${student.firstName} ${student.fatherName} ${student.lastName}`;
    }
    if (student.name) {
      // For legacy data, try to insert father's name if not already present
      if (student.fatherName && !student.name.toLowerCase().includes(student.fatherName.toLowerCase())) {
        const parts = student.name.split(' ');
        const firstName = parts[0];
        const rest = parts.slice(1).join(' ');
        return `${firstName} ${student.fatherName} ${rest}`.trim();
      }
      return student.name;
    }
    return 'Unknown';
  };

  const studentFullName = getStudentFullName();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between no-print">
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
              const text = `Fee Receipt #${payment.receiptNo}\nStudent: ${studentFullName}\nAmount: ₹${payment.amount}\nBalance: ₹${remainingBalance}`;
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
      <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 w-[794px] min-h-[559px] mx-auto print-container" ref={componentRef}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-4">
            <div className="size-14 rounded-lg overflow-hidden border border-slate-100 shadow-sm bg-white">
              <img src={logoBase64} alt="Yashodai Logo" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Yashodai Play School & Nursery</h2>
              <p className="text-blue-600 font-bold text-[10px] mb-0.5">Nashik Branch</p>
              <p className="text-[9px] text-slate-500 max-w-[250px] leading-tight">
                Narayani Bangla, Jay Ambe Nagar, behind K.K. Wagh College, Panchavati, Nashik.<br />
                Contact: +91 7249462345
              </p>
            </div>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-right min-w-[120px]">
            <p className="text-[7px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Receipt No</p>
            <p className="text-xs font-bold text-slate-900 mb-1">#{payment.receiptNo}</p>
            <p className="text-[7px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Date</p>
            <p className="text-[10px] font-bold text-slate-900">{format(new Date(payment.date), 'dd MMM, yyyy')}</p>
          </div>
        </div>

        <hr className="border-slate-100 mb-3" />

        {/* Student Details */}
        <div className="space-y-2 mb-4">
          <h3 className="text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
            <User size={10} />
            Student Details
          </h3>
          <div className="bg-slate-50 p-3 rounded-lg grid grid-cols-2 gap-y-2 gap-x-8">
            <div className="flex justify-between border-b border-slate-200 pb-0.5">
              <span className="text-[10px] text-slate-500">Student Name</span>
              <span className="text-[10px] font-bold text-slate-900">
                {studentFullName}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-0.5">
              <span className="text-[10px] text-slate-500">Admission No</span>
              <span className="text-[10px] font-bold text-slate-900">{admission.admissionNo}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-0.5">
              <span className="text-[10px] text-slate-500">Class</span>
              <span className="text-[10px] font-bold text-slate-900">{student.class}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-0.5">
              <span className="text-[10px] text-slate-500">Academic Year</span>
              <span className="text-[10px] font-bold text-slate-900">{admission.academicYear}</span>
            </div>
          </div>
        </div>

        {/* Payment Details Table */}
        <div className="space-y-2 mb-4">
          <h3 className="text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
            <CreditCard size={10} />
            Payment Details
          </h3>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white text-[9px] uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-1.5 font-bold">Description</th>
                  <th className="px-3 py-1.5 font-bold">Mode</th>
                  <th className="px-3 py-1.5 font-bold">Transaction ID</th>
                  <th className="px-3 py-1.5 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-3 py-2">
                    <p className="text-[10px] font-bold text-slate-900">Installment #{payment.installmentNumber}</p>
                    <p className="text-[8px] text-slate-500">{admission.installmentType}</p>
                  </td>
                  <td className="px-3 py-2 text-[10px] font-medium text-slate-700">{payment.paymentMode}</td>
                  <td className="px-3 py-2 text-[10px] font-medium text-slate-700">{payment.transactionId || '-'}</td>
                  <td className="px-3 py-2 text-right text-[10px] font-bold text-slate-900">₹ {payment.amount.toLocaleString()}.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="flex justify-between items-start gap-6 mb-4">
          <div className="flex-1 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <p className="text-[7px] text-blue-600 uppercase font-bold tracking-wider mb-0.5">Amount in Words</p>
            <p className="text-[10px] font-bold text-slate-900 italic leading-tight">Rupees {numberToWords(payment.amount)}</p>
          </div>
          <div className="w-[180px] space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Total Fee</span>
              <span className="font-bold text-slate-900">₹ {admission.totalFee.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Paid to Date</span>
              <span className="font-bold text-slate-900">₹ {totalPaidToDate.toLocaleString()}.00</span>
            </div>
            <div className="bg-blue-600 p-2 rounded-lg text-white flex justify-between items-center">
              <span className="text-[8px] font-bold uppercase">Balance</span>
              <span className="text-sm font-bold">₹ {remainingBalance.toLocaleString()}.00</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-end">
          <div className="max-w-[250px] space-y-1">
            <p className="text-[7px] font-bold text-slate-400 uppercase">Terms & Conditions:</p>
            <ul className="text-[7px] text-slate-400 space-y-0.5 list-disc pl-3">
              <li>Fees once paid are non-refundable.</li>
              <li>Computer-generated receipt.</li>
              <li>Delayed payment may attract penalty.</li>
            </ul>
          </div>
          <div className="text-center">
            <div className="w-24 border-b border-slate-900 mb-1"></div>
            <p className="text-[8px] font-bold text-slate-900 uppercase">Authorized Signatory</p>
            <p className="text-[7px] text-slate-500">School Office Seal</p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[7px] text-slate-400 mb-0.5">Thank you for choosing Yashodai Play School.</p>
          <p className="text-[7px] font-bold text-blue-600">www.yashodaischool.edu.in</p>
        </div>
      </div>
    </div>
  );
}

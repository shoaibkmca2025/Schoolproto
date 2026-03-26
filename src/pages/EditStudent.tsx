import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Save, Trash2 } from 'lucide-react';
import { 
  db, 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  updateDoc, 
  deleteDoc, 
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { Student, Admission } from '../types';

export default function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const academicYears = [];
  for (let i = -2; i <= 3; i++) {
    const year = (currentMonth < 5 ? currentYear - 1 : currentYear) + i;
    academicYears.push(`${year}-${year + 1}`);
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [admissionId, setAdmissionId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fatherName: '',
    motherName: '',
    class: 'Nursery',
    contact: '',
    alternateWhatsappNumber: '',
    address: '',
    academicYear: '',
    totalFee: 0,
    installmentType: 'Monthly' as Admission['installmentType'],
    dueDay: 5,
    status: 'Active' as Admission['status']
  });

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const studentDoc = await getDoc(doc(db, 'students', id));
        if (studentDoc.exists()) {
          const sData = studentDoc.data() as Student;
          
          // Fetch Admission
          const q = query(collection(db, 'admissions'), where('studentId', '==', id));
          const admissionSnap = await getDocs(q);
          
          if (!admissionSnap.empty) {
            const aDoc = admissionSnap.docs[0];
            const aData = aDoc.data() as Admission;
            setAdmissionId(aDoc.id);
            
            setFormData({
              firstName: sData.firstName || sData.name?.split(' ')[0] || '',
              lastName: sData.lastName || sData.name?.split(' ').slice(1).join(' ') || '',
              fatherName: sData.fatherName,
              motherName: sData.motherName,
              class: sData.class,
              contact: sData.contact,
              alternateWhatsappNumber: sData.alternateWhatsappNumber || '',
              address: sData.address,
              academicYear: aData.academicYear,
              totalFee: aData.totalFee,
              installmentType: aData.installmentType,
              dueDay: aData.dueDay || 5,
              status: aData.status
            });
          }
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !admissionId) return;
    setSaving(true);

    try {
      // 1. Update Student
      const studentRef = doc(db, 'students', id);
      await updateDoc(studentRef, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        class: formData.class,
        contact: formData.contact,
        alternateWhatsappNumber: formData.alternateWhatsappNumber,
        address: formData.address,
      });

      // 2. Update Admission
      const admissionRef = doc(db, 'admissions', admissionId);
      const installmentAmount = formData.installmentType === 'Yearly' ? formData.totalFee :
                               formData.installmentType === 'Half-Yearly' ? formData.totalFee / 2 :
                               formData.installmentType === 'Quarterly' ? formData.totalFee / 4 :
                               formData.totalFee / 12;

      await updateDoc(admissionRef, {
        academicYear: formData.academicYear,
        totalFee: Number(formData.totalFee),
        installmentType: formData.installmentType,
        installmentAmount,
        dueDay: Number(formData.dueDay),
        status: formData.status
      });
      
      navigate(`/student/${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'students');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading student data...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Edit Student Record</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Student Details */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <UserPlus size={20} className="text-blue-600" />
              Student Information
            </h2>
            <div className="space-y-6">
              {/* Row 1: Name Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">First Name</label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Father's Name</label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                    value={formData.fatherName}
                    onChange={e => setFormData({...formData, fatherName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Last Name</label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>

              {/* Row 2: Contact & Family Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Mother's Name</label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                    value={formData.motherName}
                    onChange={e => setFormData({...formData, motherName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Contact Number</label>
                  <input
                    required
                    type="tel"
                    className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                    value={formData.contact}
                    onChange={e => setFormData({...formData, contact: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">WhatsApp Number</label>
                  <input
                    type="tel"
                    className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                    placeholder="Optional WhatsApp number"
                    value={formData.alternateWhatsappNumber}
                    onChange={e => setFormData({...formData, alternateWhatsappNumber: e.target.value})}
                  />
                </div>
              </div>

              {/* Row 4: Other Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Class</label>
                  <select
                    className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                    value={formData.class}
                    onChange={e => setFormData({...formData, class: e.target.value})}
                  >
                    <option>Play Group</option>
                    <option>Nursery</option>
                    <option>LKG</option>
                    <option>UKG</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Academic Year</label>
                  <select
                    className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50 font-bold"
                    value={formData.academicYear}
                    onChange={e => setFormData({...formData, academicYear: e.target.value})}
                  >
                    {academicYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Address</label>
                <textarea
                  className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                  rows={3}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                ></textarea>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Fee Details */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Fee Structure & Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Total Annual Fee (₹)</label>
                <input
                  required
                  type="text"
                  className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                  value={formData.totalFee}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({...formData, totalFee: Number(val)});
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Installment Plan</label>
                <select
                  className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                  value={formData.installmentType}
                  onChange={e => setFormData({...formData, installmentType: e.target.value as Admission['installmentType']})}
                >
                  <option value="Yearly">Yearly (1 Installment)</option>
                  <option value="Half-Yearly">Half-Yearly (2 Installments)</option>
                  <option value="Quarterly">Quarterly (4 Installments)</option>
                  <option value="Monthly">Monthly (12 Installments)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Monthly Due Day (1-31)</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="31"
                  className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                  value={formData.dueDay}
                  onChange={e => setFormData({...formData, dueDay: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Admission Status</label>
                <select
                  className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as Admission['status']})}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : (
              <>
                <Save size={18} />
                Update Record
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

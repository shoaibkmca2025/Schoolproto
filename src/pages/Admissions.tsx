import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Save } from 'lucide-react';
import { db, collection, addDoc, handleFirestoreError, OperationType } from '../firebase';
import { Student, Admission } from '../types';

export default function Admissions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    motherName: '',
    class: 'Nursery',
    contact: '',
    address: '',
    academicYear: '2023-2024',
    totalFee: 0,
    installmentType: 'Monthly' as Admission['installmentType'],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Student
      const studentData: Student = {
        name: formData.name,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        class: formData.class,
        contact: formData.contact,
        address: formData.address,
        createdAt: new Date().toISOString(),
      };
      
      const studentRef = await addDoc(collection(db, 'students'), studentData);

      // 2. Create Admission
      const installmentAmount = formData.installmentType === 'Yearly' ? formData.totalFee :
                               formData.installmentType === 'Half-Yearly' ? formData.totalFee / 2 :
                               formData.installmentType === 'Quarterly' ? formData.totalFee / 4 :
                               formData.totalFee / 12;

      const admissionNo = `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const admissionData: Admission = {
        admissionNo,
        studentId: studentRef.id,
        academicYear: formData.academicYear,
        totalFee: Number(formData.totalFee),
        installmentType: formData.installmentType,
        installmentAmount,
        status: 'Active',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'admissions'), admissionData);
      
      navigate(`/student/${studentRef.id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'admissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">New Admission Entry</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Student Details */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <UserPlus size={20} className="text-blue-600" />
              Student Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Student Name</label>
                <input
                  required
                  type="text"
                  className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
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
                <label className="text-sm font-medium text-slate-700">Father's Name</label>
                <input
                  required
                  type="text"
                  className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                  placeholder="Father's full name"
                  value={formData.fatherName}
                  onChange={e => setFormData({...formData, fatherName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Mother's Name</label>
                <input
                  required
                  type="text"
                  className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                  placeholder="Mother's full name"
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
                  placeholder="10-digit mobile number"
                  value={formData.contact}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Academic Year</label>
                <input
                  required
                  type="text"
                  className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                  value={formData.academicYear}
                  onChange={e => setFormData({...formData, academicYear: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <label className="text-sm font-medium text-slate-700">Address</label>
              <textarea
                className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                rows={3}
                placeholder="Full residential address"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              ></textarea>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Fee Details */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-6">Fee Structure</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Total Annual Fee (₹)</label>
                <input
                  required
                  type="number"
                  className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 outline-none transition-all py-2.5 px-4 bg-slate-50"
                  value={formData.totalFee}
                  onChange={e => setFormData({...formData, totalFee: Number(e.target.value)})}
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
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/20"
          >
            {loading ? 'Saving...' : (
              <>
                <Save size={18} />
                Save Admission
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

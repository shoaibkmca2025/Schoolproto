import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Bell, MessageSquare, ArrowLeft, Filter } from 'lucide-react';
import { usePendingFees } from '../utils/usePendingFees';

export default function PendingFees() {
  const navigate = useNavigate();
  const { pendingStudents, loading } = usePendingFees();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All Classes');

  const filteredStudents = pendingStudents.filter(s => {
    const fullName = s.firstName ? `${s.firstName} ${s.fatherName} ${s.lastName}` : (s.name || '');
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.contact.includes(searchTerm);
    const matchesClass = selectedClass === 'All Classes' || s.class === selectedClass;
    
    return matchesSearch && matchesClass;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors no-print"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Pending Fee Records</h1>
          </div>
          <p className="text-slate-500 ml-11">List of students with outstanding dues</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
              placeholder="Search by name or phone..."
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600/20 transition-all min-w-[140px]"
          >
            <option>All Classes</option>
            <option>Play Group</option>
            <option>Nursery</option>
            <option>LKG</option>
            <option>UKG</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Student Details</th>
                <th className="px-6 py-4 font-bold">Class</th>
                <th className="px-6 py-4 font-bold">Pending Amount</th>
                <th className="px-6 py-4 font-bold">Due Date</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="size-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell size={32} />
                    </div>
                    <h4 className="font-bold text-slate-900">No pending fees found</h4>
                    <p className="text-slate-500 text-sm">All students have cleared their dues or no records match your search.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/student/${student.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          {(student.firstName || student.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {student.firstName ? `${student.firstName} ${student.lastName}` : (student.name || 'Unknown')}
                          </p>
                          <p className="text-xs text-slate-500">Adm No: {student.admissionNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{student.class}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-amber-600">₹{student.balance.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${new Date().getDate() > (student.dueDay || 5) ? 'text-red-600' : 'text-slate-600'}`}>
                          {student.dueDay || 5}th of month
                        </span>
                        {new Date().getDate() > (student.dueDay || 5) && (
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight">Overdue</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href={`https://wa.me/${((student.alternateWhatsappNumber || student.contact).replace(/\D/g, '').startsWith('91') ? (student.alternateWhatsappNumber || student.contact).replace(/\D/g, '') : '91' + (student.alternateWhatsappNumber || student.contact).replace(/\D/g, ''))}?text=${encodeURIComponent(`Hello ${student.fatherName || 'Parent'}, this is a reminder regarding the pending school fees for ${student.firstName ? `${student.firstName} ${student.fatherName} ${student.lastName}` : (student.name || 'your child')}. \n\nPending Amount: ₹${student.balance.toLocaleString()}\nDue Date: ${student.dueDay || 5}th of this month.\n\nPlease clear the dues at the earliest. Thank you!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Send WhatsApp Reminder"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageSquare size={18} />
                        </a>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/student/${student.id}`);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                        >
                          <Eye size={14} />
                          View Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

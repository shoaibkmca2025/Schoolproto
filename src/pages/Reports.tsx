import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Wallet, 
  Calendar,
  Download,
  FileBarChart
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db, collection, getDocs } from '../firebase';
import { Student, Admission, Payment } from '../types';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isWithinInterval } from 'date-fns';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [paymentModeData, setPaymentModeData] = useState<any[]>([]);
  const [classData, setClassData] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('All Classes');
  const [classFinancials, setClassFinancials] = useState<any>({
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    studentCount: 0
  });
  const [allData, setAllData] = useState<{students: Student[], admissions: Admission[], payments: Payment[]}>({
    students: [],
    admissions: [],
    payments: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsSnap, admissionsSnap, paymentsSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'admissions')),
          getDocs(collection(db, 'payments'))
        ]);

        const students = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Student);
        const admissions = admissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Admission);
        const payments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Payment);

        setAllData({ students, admissions, payments });
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (allData.students.length === 0) return;

    let filteredStudents = allData.students;
    let filteredAdmissions = allData.admissions;
    let filteredPayments = allData.payments;

    if (selectedClass !== 'All Classes') {
      filteredStudents = allData.students.filter(s => s.class === selectedClass);
      const studentIds = filteredStudents.map(s => s.id);
      filteredAdmissions = allData.admissions.filter(a => studentIds.includes(a.studentId));
      const admissionIds = filteredAdmissions.map(a => a.id);
      filteredPayments = allData.payments.filter(p => admissionIds.includes(p.admissionId));
    }

    // Update KPIs
    const totalExpected = filteredAdmissions.reduce((sum, a) => sum + a.totalFee, 0);
    const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    
    setClassFinancials({
      totalExpected,
      totalCollected,
      totalPending: totalExpected - totalCollected,
      studentCount: filteredStudents.length
    });

    // Update Monthly Data
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    const monthlyStats = last6Months.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      
      const collected = filteredPayments.filter(p => {
        const date = new Date(p.date);
        return isWithinInterval(date, { start, end });
      }).reduce((sum, p) => sum + p.amount, 0);

      return {
        name: format(month, 'MMM'),
        amount: collected
      };
    });
    setMonthlyData(monthlyStats);

    // Update Payment Mode Data
    const modes = ['Cash', 'Online'];
    const modeStats = modes.map(mode => ({
      name: mode,
      value: filteredPayments.filter(p => p.paymentMode === mode).reduce((sum, p) => sum + p.amount, 0)
    }));
    setPaymentModeData(modeStats);

    // Update Class Data (Enrollment)
    // We keep showing all classes for comparison, but we could also filter it if needed.
    // However, the user specifically said "graphs are not updating", 
    // and usually enrollment distribution is a global view.
    // But if they filter by class, maybe they want to see the enrollment for that class only?
    // Let's keep it showing all classes but maybe the user expects the bar chart to also reflect the filter?
    // If I filter by "Nursery", the bar chart showing "Play Group", "Nursery", etc. is still useful for context.
    // But let's see if the user meant ALL graphs.
    const classes = ['Play Group', 'Nursery', 'LKG', 'UKG'];
    const classStats = classes.map(cls => ({
      name: cls,
      students: allData.students.filter(s => s.class === cls).length
    }));
    setClassData(classStats);

  }, [selectedClass, allData]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const dateStr = format(new Date(), 'dd-MMM-yyyy');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text('Yashodai Play School', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Financial Summary Report', 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${dateStr}`, 105, 38, { align: 'center' });

    // Summary Stats Table
    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: [
        ['Report Scope', selectedClass],
        ['Total Students', classFinancials.studentCount.toString()],
        ['Total Collected', `Rs. ${classFinancials.totalCollected.toLocaleString()}`],
        ['Total Pending', `Rs. ${classFinancials.totalPending.toLocaleString()}`],
        ['Expected Revenue', `Rs. ${classFinancials.totalExpected.toLocaleString()}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
    });

    // Class-wise Distribution Table
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('Class-wise Student Enrollment', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Class', 'Number of Students']],
      body: classData.map(item => [item.name, item.students.toString()]),
      theme: 'grid',
      headStyles: { fillColor: [100, 116, 139] },
    });

    // Payment Mode Distribution Table
    doc.setFontSize(14);
    doc.text('Payment Mode Distribution', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Payment Mode', 'Total Collected']],
      body: paymentModeData.map(item => [item.name, `Rs. ${item.value.toLocaleString()}`]),
      theme: 'grid',
      headStyles: { fillColor: [100, 116, 139] },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount} - Yashodai Play School Management System`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`Financial_Report_${dateStr}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
          <p className="text-slate-500">Overview of school admissions and fee collections</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
          >
            <option>All Classes</option>
            <option>Play Group</option>
            <option>Nursery</option>
            <option>LKG</option>
            <option>UKG</option>
          </select>
          <button 
            onClick={handleExportPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Students ({selectedClass})</p>
              <p className="text-2xl font-bold text-slate-900">{classFinancials.studentCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
            <TrendingUp size={14} />
            <span>Active Enrollment</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Collected</p>
              <p className="text-2xl font-bold text-slate-900">₹{classFinancials.totalCollected.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Revenue received for {selectedClass}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Pending</p>
              <p className="text-2xl font-bold text-slate-900">₹{classFinancials.totalPending.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Outstanding for {selectedClass}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Expected</p>
              <p className="text-2xl font-bold text-slate-900">₹{classFinancials.totalExpected.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Target for {selectedClass}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Collection Chart */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <FileBarChart size={20} className="text-blue-600" />
              Monthly Collection Trend
            </h3>
            <select className="text-xs border-slate-200 rounded-none">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}}
                  tickFormatter={(value) => `₹${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Collected']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Mode Distribution */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
            <CreditCard size={20} className="text-blue-600" />
            Payment Mode Distribution
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={paymentModeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {paymentModeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Total']}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class-wise Distribution */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            Class-wise Student Enrollment
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={classData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar 
                  dataKey="students" 
                  fill="#2563eb" 
                  radius={[6, 6, 0, 0]} 
                  barSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

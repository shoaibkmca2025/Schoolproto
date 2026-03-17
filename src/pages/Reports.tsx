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
  Filter,
  Download,
  FileBarChart
} from 'lucide-react';
import { db, collection, getDocs } from '../firebase';
import { Student, Admission, Payment } from '../types';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isWithinInterval } from 'date-fns';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [paymentModeData, setPaymentModeData] = useState<any[]>([]);
  const [classData, setClassData] = useState<any[]>([]);

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

        // Basic Stats
        const totalExpected = admissions.reduce((sum, a) => sum + a.totalFee, 0);
        const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
        
        setStats({
          totalStudents: students.length,
          totalExpected,
          totalCollected,
          totalPending: totalExpected - totalCollected
        });

        // Monthly Data (Last 6 months)
        const last6Months = eachMonthOfInterval({
          start: subMonths(new Date(), 5),
          end: new Date()
        });

        const monthlyStats = last6Months.map(month => {
          const start = startOfMonth(month);
          const end = endOfMonth(month);
          
          const collected = payments.filter(p => {
            const date = new Date(p.date);
            return isWithinInterval(date, { start, end });
          }).reduce((sum, p) => sum + p.amount, 0);

          return {
            name: format(month, 'MMM'),
            amount: collected
          };
        });
        setMonthlyData(monthlyStats);

        // Payment Mode Data
        const modes = ['Cash', 'Online'];
        const modeStats = modes.map(mode => ({
          name: mode,
          value: payments.filter(p => p.paymentMode === mode).reduce((sum, p) => sum + p.amount, 0)
        }));
        setPaymentModeData(modeStats);

        // Class Data
        const classes = ['Play Group', 'Nursery', 'LKG', 'UKG'];
        const classStats = classes.map(cls => ({
          name: cls,
          students: students.filter(s => s.class === cls).length
        }));
        setClassData(classStats);

      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-none text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50">
            <Filter size={18} />
            Filter
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-none text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-none bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Total Students</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalStudents}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
            <TrendingUp size={14} />
            <span>+12% from last year</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-none bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Total Collected</p>
              <p className="text-2xl font-bold text-slate-900">₹{stats.totalCollected.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Total revenue received to date</p>
        </div>

        <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-none bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Pending Fees</p>
              <p className="text-2xl font-bold text-slate-900">₹{stats.totalPending.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Outstanding balance from admissions</p>
        </div>

        <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-none bg-slate-100 text-slate-600 flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Expected Revenue</p>
              <p className="text-2xl font-bold text-slate-900">₹{stats.totalExpected.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Target for current academic year</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Collection Chart */}
        <div className="bg-white p-8 rounded-none border border-slate-200 shadow-sm">
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
            <ResponsiveContainer width="100%" height="100%">
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
                  contentStyle={{borderRadius: '0px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
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
        <div className="bg-white p-8 rounded-none border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
            <CreditCard size={20} className="text-blue-600" />
            Payment Mode Distribution
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
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
                  contentStyle={{borderRadius: '0px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Total']}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class-wise Distribution */}
        <div className="bg-white p-8 rounded-none border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            Class-wise Student Enrollment
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
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
                  contentStyle={{borderRadius: '0px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar 
                  dataKey="students" 
                  fill="#2563eb" 
                  radius={[0, 0, 0, 0]} 
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

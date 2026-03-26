export interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  name?: string; // For backward compatibility
  fatherName: string;
  motherName: string;
  class: string;
  contact: string;
  alternateWhatsappNumber?: string;
  address: string;
  createdAt: string;
}

export interface Admission {
  id?: string;
  admissionNo: string;
  studentId: string;
  academicYear: string;
  totalFee: number;
  installmentType: 'Yearly' | 'Half-Yearly' | 'Quarterly' | 'Monthly';
  installmentAmount: number;
  dueDay: number; // Day of the month (1-31)
  status: 'Active' | 'Inactive' | 'Completed';
  createdAt: string;
}

export interface Payment {
  id?: string;
  admissionId: string;
  installmentNumber: number;
  amount: number;
  paymentMode: 'Cash' | 'Online';
  transactionId?: string;
  receiptNo: string;
  date: string;
  notes?: string;
}

export interface DashboardStats {
  totalStudents: number;
  pendingFees: number;
  todayCollections: number;
}

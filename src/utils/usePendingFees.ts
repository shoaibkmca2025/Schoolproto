import { useState, useEffect } from 'react';
import { db, collection, onSnapshot } from '../firebase';
import { Student, Admission, Payment } from '../types';

export function usePendingFees() {
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const allStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student & { id: string }));
      
      const unsubAdmissions = onSnapshot(collection(db, 'admissions'), (admSnapshot) => {
        const adms = admSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admission & { id: string }));
        
        const unsubPayments = onSnapshot(collection(db, 'payments'), (paySnapshot) => {
          const pays = paySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment & { id: string }));
          
          const pendingList: any[] = [];

          adms.forEach(admission => {
            const student = allStudents.find(s => s.id === admission.studentId);
            if (!student) return;

            const paidForAdmission = pays
              .filter(p => p.admissionId === admission.id)
              .reduce((sum, p) => sum + p.amount, 0);
            
            const balance = admission.totalFee - paidForAdmission;

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

          setPendingStudents(pendingList);
          setLoading(false);
        });
        return () => unsubPayments();
      });
      return () => unsubAdmissions();
    });

    return () => unsubscribeStudents();
  }, []);

  return { pendingStudents, loading };
}

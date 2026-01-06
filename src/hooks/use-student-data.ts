import { useEffect, useState } from 'react';
import { doc, onSnapshot, collection, query, where, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface StudentData {
    clases_restantes: number;
    qr_token: string;
    fecha_expiracion?: any;
    current_plan_id?: string;
}

export interface UserData {
    name: string;
    email: string;
    plan?: string;
    photoURL?: string;
}

export interface AttendanceRecord {
    id: string;
    fecha: any;
    status: string;
    student_name?: string;
}

export function useStudentData() {
    const [student, setStudent] = useState<StudentData | null>(null);
    const [user, setUser] = useState<UserData | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
            if (!currentUser) {
                setStudent(null);
                setUser(null);
                setAttendance([]);
                setLoading(false);
                return;
            }

            const unsubStudent = onSnapshot(doc(db, "students", currentUser.uid), (docSnap) => {
                if (docSnap.exists()) {
                    setStudent(docSnap.data() as StudentData);
                } else {
                    setError("Perfil de alumna no encontrado");
                }
                setLoading(false);
            }, (err) => {
                console.error("Error fetching student data:", err);
                setError("Error de conexión");
                setLoading(false);
            });

            const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
                if (docSnap.exists()) {
                    setUser(docSnap.data() as UserData);
                }
            });

            const attendanceQuery = query(
                collection(db, "asistencias"),
                where("student_id", "==", currentUser.uid),
                limit(20)
            );

            const unsubAttendance = onSnapshot(attendanceQuery, (snapshot) => {
                const records = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as AttendanceRecord[];

                // Sort in memory to avoid needing a Firestore composite index for now
                records.sort((a, b) => {
                    const dateA = a.fecha?.toMillis ? a.fecha.toMillis() : 0;
                    const dateB = b.fecha?.toMillis ? b.fecha.toMillis() : 0;
                    return dateB - dateA;
                });

                setAttendance(records.slice(0, 10));
            }, (err) => {
                console.error("Error fetching attendance history:", err);
            });

            return () => {
                unsubStudent();
                unsubUser();
                unsubAttendance();
            };
        });

        return () => unsubscribeAuth();
    }, []);

    return { student, user, attendance, loading, error };
}

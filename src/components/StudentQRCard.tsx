import React, { useEffect, useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface StudentData {
    clases_restantes: number;
    qr_token: string;
    fecha_expiracion?: any;
}

interface UserData {
    name: string;
    plan?: string;
}

const StudentQRCard: React.FC = () => {
    const [student, setStudent] = useState<StudentData | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) {
            setError("Usuario no autenticado");
            setLoading(false);
            return;
        }

        // Listener para datos de la alumna (créditos y token)
        const unsubStudent = onSnapshot(doc(db, "students", currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                setStudent(docSnap.data() as StudentData);
                setError(null);
            } else {
                setError("Perfil de alumna no encontrado");
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching student data:", err);
            setError("Error al conectar con la base de datos");
            setLoading(false);
        });

        // Listener para datos generales (nombre, etc)
        const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
            if (docSnap.exists()) {
                setUserData(docSnap.data() as UserData);
            }
        });

        return () => {
            unsubStudent();
            unsubUser();
        };
    }, [currentUser]);

    // Generamos el valor del QR solo cuando cambia el token o el usuario presiona refresh
    const qrValue = useMemo(() => {
        if (!currentUser || !student?.qr_token) return "";
        return JSON.stringify({
            alumnaId: currentUser.uid,
            token: student.qr_token,
            ts: Date.now()
        });
    }, [currentUser, student?.qr_token, lastRefresh]);

    if (loading) {
        return (
            <Card className="w-full max-w-md border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-40" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                    <div className="flex justify-center py-4">
                        <Skeleton className="h-56 w-56 rounded-2xl" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center bg-red-50 rounded-2xl border border-red-100">
                <p className="text-red-500 font-medium">{error}</p>
                <Button
                    variant="outline"
                    className="mt-4 border-red-200 text-red-600 hover:bg-red-100"
                    onClick={() => window.location.reload()}
                >
                    Reintentar
                </Button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
        >
            <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] md:rounded-[3rem] bg-white overflow-hidden relative group">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8F5E9]/40 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#1E293B]/5 rounded-full -ml-12 -mb-12 blur-xl pointer-events-none" />

                <CardHeader className="pb-4 relative z-10">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <CardTitle className="text-3xl font-serif font-bold text-[#1E293B]">
                                {userData?.name || "Alumna"}
                            </CardTitle>
                            <CardDescription className="font-sans text-[#1E293B]/60 tracking-tight">
                                {userData?.plan || "Membresía Tera"}
                            </CardDescription>
                        </div>
                        <div className="h-12 w-12 bg-[#1E293B] rounded-2xl flex items-center justify-center shadow-lg shadow-[#1E293B]/20">
                            <UserIcon className="h-6 w-6 text-[#E8F5E9]" />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex flex-col items-center pt-2 pb-8 px-8 relative z-10">
                    {/* Status Indicator */}
                    <div className="flex items-center gap-2 mb-6 bg-[#E8F5E9]/50 px-4 py-1.5 rounded-full border border-[#E8F5E9]">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-green-700">Código Seguro y Activo</span>
                    </div>

                    {/* QR Container and Animation */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={qrValue}
                            initial={{ scale: 0.9, opacity: 0, rotateY: 90 }}
                            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                            exit={{ scale: 0.9, opacity: 0, rotateY: -90 }}
                            transition={{ type: "spring", damping: 15 }}
                            className="bg-white p-2 rounded-[2.2rem] shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] border-2 border-[#F9FAF7] mb-8 relative"
                        >
                            <QRCodeSVG
                                value={qrValue}
                                size={300}
                                level="H"
                                includeMargin={false}
                                className="w-full h-auto max-w-[300px]"
                                imageSettings={{
                                    src: "/favicon.ico",
                                    x: undefined,
                                    y: undefined,
                                    height: 50,
                                    width: 50,
                                    excavate: true,
                                }}
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* Metrics and Actions */}
                    <div className="w-full grid grid-cols-2 gap-4">
                        <div className="bg-[#F9FAF7] p-5 rounded-[2rem] border border-[#E8F5E9] flex flex-col items-center text-center">
                            <p className="text-[10px] uppercase font-bold text-[#1E293B]/40 mb-1 tracking-wider">Clases</p>
                            <p className="text-4xl font-bold text-[#1E293B] tabular-nums tracking-tighter">
                                {student?.clases_restantes ?? 0}
                            </p>
                        </div>

                        <button
                            onClick={() => setLastRefresh(Date.now())}
                            className="bg-[#1E293B] hover:bg-[#334155] p-5 rounded-[2rem] flex flex-col items-center justify-center text-white transition-all active:scale-95 group"
                        >
                            <RefreshCw className="h-6 w-6 mb-1 text-[#E8F5E9] group-hover:rotate-180 transition-transform duration-500" />
                            <p className="text-[10px] uppercase font-bold tracking-wider">Actualizar</p>
                        </button>
                    </div>

                    <div className="mt-8 flex items-center gap-2 text-[#1E293B]/40">
                        <ShieldCheck className="h-4 w-4" />
                        <p className="text-[11px] font-medium italic">Acceso encriptado TeraYoga &copy; 2025</p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default StudentQRCard;

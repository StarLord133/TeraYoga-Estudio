import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, CameraOff, AlertTriangle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Sound frequency constants for auditory feedback
const SUCCESS_FREQ = 880; // A5 - Clear beep
const ERROR_FREQ = 220;   // A3 - Lower buzz

interface CheckInResponse {
    success: boolean;
    name?: string;
    photo?: string;
    clasesRestantes?: number;
    message?: string;
}

const ScannerKiosk: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<CheckInResponse | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [pendingScan, setPendingScan] = useState<{ alumnaId: string, token: string } | null>(null);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const lastScansRef = useRef<{ [studentId: string]: number }>({});

    /**
     * Generates a beep/buzz sound using the Web Audio API to avoid external asset dependencies
     */
    const playSound = (type: 'success' | 'error') => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type === 'success' ? 'sine' : 'sawtooth';
            osc.frequency.setValueAtTime(type === 'success' ? SUCCESS_FREQ : ERROR_FREQ, ctx.currentTime);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            console.error("Audio playback failed:", e);
        }
    };

    const executeCheckIn = async (alumnaId: string, token: string) => {
        setIsProcessing(true);
        setPendingScan(null);

        try {
            const processCheckIn = httpsCallable<any, any>(functions, 'processCheckIn');
            const response = await processCheckIn({ alumnaId, token });

            const data = response.data;
            setResult({
                success: data.success,
                name: data.studentName,
                clasesRestantes: data.remainingClasses,
                photo: data.photo,
                message: data.message
            });

            if (data.success) {
                playSound('success');
                // Update cooldown timestamp
                lastScansRef.current[alumnaId] = Date.now();
            } else {
                playSound('error');
            }

            // Auto-reset after 3 seconds for the next student
            setTimeout(resetScanner, 3000);

        } catch (err: any) {
            console.error("Firebase Function Error:", err);
            setResult({
                success: false,
                message: err.message || "Error al conectar con el servidor"
            });
            playSound('error');
            setTimeout(resetScanner, 3000);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleScan = async (decodedText: string) => {
        // Prevent multiple concurrent scans
        if (isProcessing || result || pendingScan) return;

        // Immediately pause scanner
        if (scannerRef.current) {
            try { await scannerRef.current.pause(); } catch (e) { }
        }

        try {
            let alumnaId = "";
            let token = "";

            try {
                const parsed = JSON.parse(decodedText);
                alumnaId = parsed.alumnaId;
                token = parsed.token || parsed.qr_token;
            } catch {
                alumnaId = decodedText;
                token = "";
            }

            if (!alumnaId) {
                setIsProcessing(false);
                setResult({ success: false, message: "QR inválido" });
                playSound('error');
                setTimeout(resetScanner, 3000);
                return;
            }

            // --- COOLDOWN LOGIC (30 MINS) ---
            const COOLDOWN_MS = 30 * 60 * 1000;
            const lastScanTime = lastScansRef.current[alumnaId];

            if (lastScanTime && (Date.now() - lastScanTime < COOLDOWN_MS)) {
                // Show confirmation modal
                setPendingScan({ alumnaId, token });
            } else {
                // Direct processing
                await executeCheckIn(alumnaId, token);
            }

        } catch (err: any) {
            console.error("Scan processing error:", err);
            setIsProcessing(false);
            resetScanner();
        }
    };

    const resetScanner = async () => {
        setResult(null);
        setPendingScan(null);
        if (scannerRef.current && scannerRef.current.getState() === 3) { // 3 is PAUSED
            try {
                await scannerRef.current.resume();
            } catch (e) {
                console.error("Scanner resume failure:", e);
            }
        }
    };

    useEffect(() => {
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
        };

        const scanner = new Html5Qrcode("reader", {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false
        });
        scannerRef.current = scanner;

        // Auto-request permissions and start
        scanner.start(
            { facingMode: "environment" },
            config,
            handleScan,
            () => { } // Ignored for performance, logging every failure is noisy
        ).catch((err) => {
            console.error("Html5Qrcode Start Error:", err);
            setCameraError("Acceso denegado. Por favor habilita la cámara para usar el modo kiosco.");
        });

        // Cleanup: Absolute requirement to stop hardware usage
        return () => {
            if (scannerRef.current) {
                if (scannerRef.current.isScanning) {
                    scannerRef.current.stop().catch(e => console.error("Scanner stop failure:", e));
                }
            }
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(e => console.error("AudioContext close failure:", e));
            }
        };
    }, []);

    return (
        <div className="relative w-full h-screen bg-[#F9FAF7] flex items-center justify-center overflow-hidden p-4 md:p-8">
            {/* Container with premium glassmorphism shadow */}
            <div className="w-full max-w-2xl aspect-square relative rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[12px] border-white z-0 bg-black">

                {/* The scanner element */}
                <div id="reader" className="w-full h-full" />

                {/* Scanline Animation: Only visible when idle */}
                {!isProcessing && !result && !cameraError && (
                    <motion.div
                        initial={{ top: "10%" }}
                        animate={{ top: "90%" }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute left-[10%] right-[10%] h-[2px] bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.8)] z-10"
                    />
                )}

                {/* Processing Overlay */}
                <AnimatePresence>
                    {isProcessing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white/40 backdrop-blur-xl flex flex-col items-center justify-center z-20"
                        >
                            <div className="bg-white p-8 rounded-full shadow-lg mb-4">
                                <Loader2 className="w-12 h-12 text-[#1E293B] animate-spin" />
                            </div>
                            <p className="text-[#1E293B] font-semibold text-lg tracking-tight uppercase">Validando...</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Permissions/Hardware Error */}
                {cameraError && (
                    <div className="absolute inset-0 bg-[#F9FAF7] flex flex-col items-center justify-center p-12 text-center z-30">
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                            <CameraOff className="w-12 h-12 text-red-400" />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-gray-800 mb-3">Error de Cámara</h3>
                        <p className="text-gray-500 leading-relaxed font-medium">{cameraError}</p>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {pendingScan && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl text-center"
                        >
                            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-10 h-10 text-amber-500" />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-[#1E293B] mb-4">¿Asistencia Duplicada?</h3>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                Esta alumna ya registró una entrada hace menos de 30 minutos. ¿Deseas descontar otra clase de forma intencional?
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={resetScanner}
                                    className="py-4 rounded-2xl font-bold text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors uppercase tracking-widest text-[10px]"
                                >
                                    No, cancelar
                                </button>
                                <button
                                    onClick={() => executeCheckIn(pendingScan.alumnaId, pendingScan.token)}
                                    className="py-4 rounded-2xl font-bold text-white bg-[#1E293B] hover:bg-[#334155] transition-all shadow-lg shadow-[#1E293B]/20 uppercase tracking-widest text-[10px]"
                                >
                                    Sí, registrar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Result Layer (Full Screen Overlay) */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-black/40 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-xl"
                        >
                            {result.success ? (
                                <Card className="bg-green-500 border-none rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_30px_70px_rgba(34,197,94,0.4)] text-white">
                                    <CardContent className="pt-16 pb-12 px-10 flex flex-col items-center text-center">
                                        <motion.div
                                            initial={{ scale: 0, rotate: -45 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: "spring", damping: 10, stiffness: 100 }}
                                            className="mb-8"
                                        >
                                            <CheckCircle2 className="w-24 h-24 text-white" />
                                        </motion.div>

                                        <Avatar className="w-32 h-32 border-8 border-white/20 mb-6 shadow-xl">
                                            <AvatarImage src={result.photo} className="object-cover" />
                                            <AvatarFallback className="bg-white/10 text-4xl font-serif">
                                                {result.name?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <h2 className="text-5xl font-serif font-bold mb-3 tracking-tight">¡BIENVENIDA!</h2>
                                        <p className="text-2xl opacity-90 mb-10 font-medium tracking-wide border-b border-white/20 pb-4 w-full">
                                            {result.name}
                                        </p>

                                        <div className="bg-white/10 backdrop-blur-sm rounded-[2rem] px-8 py-6 w-full border border-white/10">
                                            <p className="text-xs uppercase tracking-[0.2em] opacity-80 mb-2 font-bold">Clases disponibles</p>
                                            <p className="text-7xl font-bold tabular-nums tracking-tighter">
                                                {result.clasesRestantes ?? 0}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="bg-red-500 border-none rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_30px_70px_rgba(239,68,68,0.4)] text-white">
                                    <CardContent className="pt-20 pb-16 px-10 flex flex-col items-center text-center">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1, rotate: [0, -10, 10, -10, 10, 0] }}
                                            transition={{ duration: 0.5 }}
                                            className="mb-10"
                                        >
                                            <XCircle className="w-28 h-28 text-white" />
                                        </motion.div>
                                        <h2 className="text-5xl font-serif font-bold mb-6 tracking-tight">¡LO SENTIMOS!</h2>
                                        <p className="text-3xl font-medium opacity-95 leading-snug max-w-[80%] mx-auto">
                                            {result.message || "Error al validar tu acceso"}
                                        </p>
                                        <div className="mt-12 pt-8 border-t border-white/20 w-full">
                                            <p className="text-sm uppercase tracking-widest opacity-80 font-semibold italic font-serif">
                                                Por favor contacta con el personal
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ScannerKiosk;

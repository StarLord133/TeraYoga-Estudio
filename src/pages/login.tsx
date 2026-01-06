import * as React from "react"
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom"
import { auth, db } from "@/lib/firebase"
import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import type { UserProfile } from "@/types/database"
import JapanTree from "@/assets/japan-tree.png"



export default function LoginPage() {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [isForgot, setIsForgot] = React.useState(false)
    const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

    const loginEmailRef = React.useRef<HTMLInputElement>(null)
    const loginPasswordRef = React.useRef<HTMLInputElement>(null)
    const resetEmailRef = React.useRef<HTMLInputElement>(null)

    const navigate = useNavigate()

    React.useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid))
                if (userDoc.exists()) {
                    const userData = userDoc.data() as UserProfile
                    if (userData.role === "student") navigate("/student")
                    else if (userData.role === "admin") navigate("/admin")
                }
            }
        })
        return () => unsubscribe()
    }, [navigate])

    async function handleLogin(event: React.FormEvent) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        const email = loginEmailRef.current?.value
        const password = loginPasswordRef.current?.value

        if (!email || !password) {
            setError("Por favor completa todos los campos.")
            setIsLoading(false)
            return
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            const user = userCredential.user
            const userDoc = await getDoc(doc(db, "users", user.uid))

            if (userDoc.exists()) {
                const userData = userDoc.data() as UserProfile
                if (userData.role === "student") {
                    navigate("/student")
                } else if (userData.role === "admin") {
                    navigate("/admin")
                }
            } else {
                setError("No se encontró perfil de usuario.")
                await auth.signOut()
            }
        } catch (err: any) {
            console.error("Login error:", err)
            setError("Credenciales inválidas o error de conexión.")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleResetPassword(event: React.FormEvent) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)

        const email = resetEmailRef.current?.value
        if (!email) {
            setError("Por favor ingresa tu correo electrónico.")
            setIsLoading(false)
            return
        }

        try {
            await sendPasswordResetEmail(auth, email)
            setSuccessMessage("Se ha enviado un enlace a tu correo para restablecer tu contraseña.")
            setIsForgot(false) // Volver al login tras éxito
        } catch (err: any) {
            console.error("Reset error:", err)
            if (err.code === "auth/user-not-found") {
                setError("No existe una cuenta asociada a este correo.")
            } else {
                setError("Error al enviar el correo. Inténtalo de nuevo.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#ffffff] selection:bg-[#e1f2f3] selection:text-[#1e293b]">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[#e1f2f3]/40 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[#8a7f96]/10 blur-[120px] pointer-events-none" />

            <div className="relative w-full max-w-[1000px] lg:h-[650px] min-h-[600px] h-auto my-8 mx-4 bg-white border border-[#e1f2f3] rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(138,127,150,0.15)] flex flex-col lg:flex-row overflow-hidden">
                {/* Back Button - Responsive Position */}
                <div className="absolute top-6 left-6 lg:top-8 lg:left-8 z-30">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/")}
                        className="text-white/70 hover:text-white lg:text-[#1e293b]/30 lg:hover:text-[#8a7f96] hover:bg-transparent flex items-center gap-2 font-bold uppercase tracking-[0.2em] text-[9px] transition-all group p-0"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Regresar al inicio
                    </Button>
                </div>

                {/* Left Panel: Form */}
                <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-8 lg:p-12 order-2 lg:order-1 relative">
                    <div className="w-full max-w-[340px] space-y-8">
                        <div className="text-center space-y-2">
                            <h1 className="text-4xl font-serif text-[#1e293b] tracking-tight">TeraYoga Estudio</h1>
                            <p className="text-[#8a7f96] text-sm font-medium">
                                {isForgot ? "Recuperar acceso" : "Inicia sesión en tu espacio personal"}
                            </p>
                        </div>

                        {(error || successMessage) && (
                            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-1 ${error ? "bg-red-50 border border-red-100 text-red-600" : "bg-green-50 border border-green-100 text-green-600"}`}>
                                {error ? <AlertCircle className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                                <p>{error || successMessage}</p>
                            </div>
                        )}

                        {!isForgot ? (
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[#1e293b]/60 text-[10px] ml-1 font-bold uppercase tracking-[0.15em]">Correo Electrónico</Label>
                                    <Input
                                        type="email"
                                        ref={loginEmailRef}
                                        placeholder="tu@ejemplo.com"
                                        required
                                        className="h-14 bg-[#f8fafc] border-[#e1f2f3] text-[#1e293b] placeholder:text-[#1e293b]/30 rounded-2xl focus-visible:ring-[#8a7f96]/20 transition-all border-2"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <Label className="text-[#1e293b]/60 text-[10px] font-bold uppercase tracking-[0.15em]">Contraseña</Label>
                                        <button
                                            type="button"
                                            onClick={() => setIsForgot(true)}
                                            className="text-[9px] text-[#8a7f96]/60 hover:text-[#8a7f96] transition-colors uppercase tracking-widest font-black"
                                        >
                                            ¿Olvidé mi contraseña?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            ref={loginPasswordRef}
                                            required
                                            className="h-14 bg-[#f8fafc] border-[#e1f2f3] text-[#1e293b] rounded-2xl focus-visible:ring-[#8a7f96]/20 pr-12 transition-all border-2"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1e293b]/30 hover:text-[#8a7f96] transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                <Button className="w-full h-14 bg-[#1e293b] hover:bg-[#8a7f96] text-white font-bold rounded-2xl transition-all shadow-xl shadow-slate-100 flex items-center justify-center text-lg" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : "Acceder"}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[#1e293b]/60 text-[10px] ml-1 font-bold uppercase tracking-[0.15em]">Correo para recuperación</Label>
                                    <Input
                                        type="email"
                                        ref={resetEmailRef}
                                        placeholder="tu@ejemplo.com"
                                        required
                                        className="h-14 bg-[#f8fafc] border-[#e1f2f3] text-[#1e293b] placeholder:text-[#1e293b]/30 rounded-2xl focus-visible:ring-[#8a7f96]/20 transition-all border-2"
                                    />
                                    <p className="text-[10px] text-[#8a7f96]/60 mt-3 px-1 leading-relaxed italic">
                                        Te enviaremos un enlace para que puedas generar una nueva contraseña de forma segura.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <Button className="w-full h-14 bg-[#1e293b] hover:bg-[#8a7f96] text-white font-bold rounded-2xl transition-all shadow-xl shadow-slate-100" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : "Enviar Enlace"}
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => setIsForgot(false)}
                                        className="w-full text-xs text-[#8a7f96] font-bold hover:underline transition-all"
                                    >
                                        Volver al inicio de sesión
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="text-center pt-4">
                            <p className="text-[9px] text-[#1e293b]/30 uppercase tracking-[0.2em] font-medium">
                                Si no tienes acceso, contacta a tu instructor
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Decorative (Fixed) */}
                <div className="w-full lg:w-1/2 h-[300px] lg:h-full relative overflow-hidden order-1 lg:order-2">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#8a7f96] via-[#6d6379] to-[#1e293b]" />

                    {/* Decorative Patterns */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[size:24px_24px]" />
                    </div>

                    {/* Background Image: Japan Tree */}
                    <div className="absolute inset-0 opacity-30 pointer-events-none flex items-center justify-center p-8 lg:p-8">
                        <img
                            src={JapanTree}
                            alt="Japan Tree Decor"
                            className="w-full h-full object-contain mix-blend-screen"
                        />
                    </div>

                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center p-12 text-white">
                        <div className="space-y-6">
                            <h2 className="text-5xl font-serif tracking-tight text-white italic">Namasté</h2>
                            <div className="h-0.5 w-16 bg-white/20 mx-auto" />
                            <p className="text-white/80 font-sans max-w-[280px] text-xs leading-relaxed mx-auto uppercase tracking-[0.3em] font-medium">
                                Encuentra tu centro, fortalece tu cuerpo.
                            </p>
                        </div>
                    </div>

                    {/* Subtle aesthetic touch */}
                    <div className="absolute bottom-[-10%] right-[-10%] h-[300px] w-[300px] rounded-full bg-white/5 blur-[60px]" />
                </div>
            </div>
        </div>
    )
}

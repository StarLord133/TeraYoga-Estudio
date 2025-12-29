import * as React from "react"
import { Eye, EyeOff, Loader2, AlertCircle, Chrome } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate, Link } from "react-router-dom"
import { auth, db } from "@/lib/firebase"
import {
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile
} from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"

export default function RegisterPage() {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const nameRef = React.useRef<HTMLInputElement>(null)
    const emailRef = React.useRef<HTMLInputElement>(null)
    const passwordRef = React.useRef<HTMLInputElement>(null)

    const navigate = useNavigate()

    async function handleRegister(event: React.FormEvent) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        const name = nameRef.current?.value
        const email = emailRef.current?.value
        const password = passwordRef.current?.value

        if (!name || !email || !password) {
            setError("Por favor completa todos los campos.")
            setIsLoading(false)
            return
        }

        try {
            // 1. Crear usuario en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // 2. Actualizar nombre en el perfil de Auth
            await updateProfile(user, { displayName: name })

            // 3. Crear documento en Firestore (Rol student por defecto)
            await setDoc(doc(db, "users", user.uid), {
                id: user.uid,
                name: name,
                email: email,
                role: "student",
                createdAt: serverTimestamp()
            })

            // 4. Inicializar datos del estudiante
            await setDoc(doc(db, "students", user.uid), {
                uid: user.uid,
                current_plan_id: "free_trial", // O un plan por defecto
                clases_restantes: 1,
                fecha_expiracion: null,
                qr_token: btoa(user.uid + Date.now()),
                last_checkin: null
            })

            navigate("/student")
        } catch (err: any) {
            console.error("Registration error:", err)
            if (err.code === "auth/email-already-in-use") {
                setError("Este correo ya está registrado.")
            } else if (err.code === "auth/weak-password") {
                setError("La contraseña es muy débil (mínimo 6 caracteres).")
            } else {
                setError("Error al crear la cuenta. Inténtalo de nuevo.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    async function handleGoogleSignIn() {
        setIsLoading(true)
        setError(null)
        const provider = new GoogleAuthProvider()

        try {
            const result = await signInWithPopup(auth, provider)
            const user = result.user

            // Verificar si el usuario ya existe en Firestore para no sobreescribir
            // Por simplicidad en el registro inicial, creamos/actualizamos el perfil
            await setDoc(doc(db, "users", user.uid), {
                id: user.uid,
                name: user.displayName || "Usuario de Google",
                email: user.email,
                role: "student",
                createdAt: serverTimestamp()
            }, { merge: true })

            navigate("/student")
        } catch (err: any) {
            console.error("Google Sign-In error:", err)
            setError("Error al iniciar con Google.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#1E293B]">
            {/* Background Decor */}
            <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#E8F5E9]/10 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#E8F5E9]/5 blur-[120px]" />

            <Card className="glass mx-4 w-full max-w-md border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-serif text-white tracking-tight">
                        Únete a Tera
                    </CardTitle>
                    <CardDescription className="text-[#E8F5E9]/60 font-sans">
                        Comienza tu viaje hacia el bienestar hoy
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 py-6"
                    >
                        <Chrome className="mr-2 h-5 w-5" />
                        Continuar con Google
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#1E293B]/50 px-2 text-[#E8F5E9]/40 backdrop-blur-sm">O regístrate con correo</span>
                        </div>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[#E8F5E9]/80 font-medium">Nombre Completo</Label>
                            <Input
                                id="name"
                                ref={nameRef}
                                placeholder="Tu nombre aquí"
                                required
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#E8F5E9]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[#E8F5E9]/80 font-medium">Correo Electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                ref={emailRef}
                                placeholder="tu@ejemplo.com"
                                required
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#E8F5E9]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-[#E8F5E9]/80 font-medium">Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    ref={passwordRef}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 pr-10 focus-visible:ring-[#E8F5E9]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E8F5E9]/50 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#E8F5E9] text-[#1E293B] hover:bg-white transition-all font-semibold py-6"
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear Cuenta"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pb-8 text-center text-sm">
                    <p className="text-[#E8F5E9]/60">
                        ¿Ya tienes una cuenta?{" "}
                        <Link to="/login" className="text-white hover:underline font-semibold shadow-sm">
                            Inicia Sesión
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

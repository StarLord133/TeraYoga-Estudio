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
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import type { UserProfile } from "@/types/database"

export default function LoginPage() {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const emailRef = React.useRef<HTMLInputElement>(null)
    const passwordRef = React.useRef<HTMLInputElement>(null)

    const navigate = useNavigate()

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        const email = emailRef.current?.value
        const password = passwordRef.current?.value

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
                if (userData.role === "admin") {
                    navigate("/admin")
                } else {
                    navigate("/student")
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

    async function handleGoogleSignIn() {
        setIsLoading(true)
        setError(null)
        const provider = new GoogleAuthProvider()

        try {
            const result = await signInWithPopup(auth, provider)
            const user = result.user

            const userDoc = await getDoc(doc(db, "users", user.uid))
            if (!userDoc.exists()) {
                await setDoc(doc(db, "users", user.uid), {
                    id: user.uid,
                    name: user.displayName || "Usuario de Google",
                    email: user.email,
                    role: "student",
                    createdAt: new Date()
                })
            }

            const role = userDoc.exists() ? (userDoc.data() as UserProfile).role : "student"
            navigate(role === "admin" ? "/admin" : "/student")
        } catch (err: any) {
            console.error("Google login error:", err)
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
                        Tera Yoga
                    </CardTitle>
                    <CardDescription className="text-[#E8F5E9]/60 font-sans">
                        Inicia sesión para gestionar tu bienestar
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm animate-in fade-in zoom-in duration-300">
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
                            <span className="bg-[#1E293B]/50 px-2 text-[#E8F5E9]/40 backdrop-blur-sm">O usa tu correo</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[#E8F5E9]/80 font-medium">
                                Correo Electrónico
                            </Label>
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
                            <Label htmlFor="password" className="text-[#E8F5E9]/80 font-medium">
                                Contraseña
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    ref={passwordRef}
                                    required
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 pr-10 focus-visible:ring-[#E8F5E9]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E8F5E9]/50 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#E8F5E9] text-[#1E293B] hover:bg-white transition-all font-semibold py-6 text-md"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Accediendo...
                                </>
                            ) : (
                                "Acceder"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pb-8 text-center text-sm">
                    <Link
                        to="/register"
                        className="text-[#E8F5E9]/60 hover:text-white transition-colors font-sans"
                    >
                        ¿No tienes cuenta? <span className="font-semibold underline underline-offset-4">Regístrate gratis</span>
                    </Link>
                    <a
                        href="#"
                        className="text-xs text-[#E8F5E9]/40 hover:text-[#E8F5E9] transition-colors font-sans underline underline-offset-4"
                    >
                        ¿Olvidaste tu contraseña?
                    </a>
                </CardFooter>
            </Card>
        </div>
    )
}

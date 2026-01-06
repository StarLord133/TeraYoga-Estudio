import * as React from "react"
import { Loader2, AlertCircle, Chrome } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { auth, db } from "@/lib/firebase"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import type { UserProfile } from "@/types/database"

export default function AdminLoginPage() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const navigate = useNavigate()

    React.useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid))
                if (userDoc.exists() && userDoc.data()?.role === "admin") {
                    navigate("/admin")
                }
            }
        })
        return () => unsubscribe()
    }, [navigate])

    async function handleAdminGoogleSignIn() {
        setIsLoading(true)
        setError(null)
        const provider = new GoogleAuthProvider()
        // Forzar selección de cuenta para asegurar que eligen la cuenta admin correcta
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            const result = await signInWithPopup(auth, provider)
            const user = result.user

            const userDoc = await getDoc(doc(db, "users", user.uid))

            if (userDoc.exists()) {
                const userData = userDoc.data() as UserProfile
                if (userData.role === "admin") {
                    navigate("/admin")
                    return
                }
            }

            // Si no tiene perfil o no es admin, cerramos sesión y error
            await auth.signOut()
            setError("Acceso denegado. Esta cuenta no tiene privilegios de administrador.")

        } catch (err: any) {
            console.error("Admin Google login error:", err)
            setError("Error al iniciar sesión con Google.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#F9FAF7] selection:bg-[#E8F5E9] selection:text-[#1E293B]">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[#E8F5E9] blur-[120px] pointer-events-none opacity-40" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[#4A5D4E]/10 blur-[120px] pointer-events-none opacity-40" />

            <div className="relative w-full max-w-[450px] bg-white border border-[#E8F5E9] rounded-[2rem] shadow-[0_32px_128px_-16px_rgba(74,93,78,0.15)] overflow-hidden transition-all duration-500">
                <div className="h-2 bg-gradient-to-r from-[#4A5D4E] to-[#1E293B]" />

                <div className="p-8 lg:p-12">
                    <div className="text-center space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-serif text-[#1E293B]">Administración</h1>
                            <p className="text-[#4A5D4E]/70 text-sm italic">Tera Yoga Estudio</p>
                        </div>

                        <div className="py-8">
                            <div className="w-20 h-20 bg-[#F9FAF7] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E8F5E9]">
                                <Chrome className="h-10 w-10 text-[#4A5D4E]" />
                            </div>
                            <p className="text-[#1E293B] font-medium">Panel de Control</p>
                            <p className="text-[#4A5D4E]/60 text-xs mt-1">Acceso exclusivo para personal autorizado</p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm text-left">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <Button
                            onClick={handleAdminGoogleSignIn}
                            disabled={isLoading}
                            className="w-full h-14 bg-[#1E293B] hover:bg-[#334155] text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    <Chrome className="h-5 w-5" />
                                    Acceder con Google
                                </>
                            )}
                        </Button>

                        <button
                            onClick={() => navigate("/login")}
                            className="text-xs text-[#4A5D4E]/50 hover:text-[#4A5D4E] transition-colors"
                        >
                            Volver al login de alumnas
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

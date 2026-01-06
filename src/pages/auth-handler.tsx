import * as React from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { verifyPasswordResetCode, confirmPasswordReset, signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"

export default function AuthActionHandler() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const mode = searchParams.get("mode")
    const oobCode = searchParams.get("oobCode")

    const [email, setEmail] = React.useState<string | null>(null)
    const [newPassword, setNewPassword] = React.useState("")
    const [showPassword, setShowPassword] = React.useState(false)
    const [status, setStatus] = React.useState<"verifying" | "ready" | "success" | "error">("verifying")
    const [error, setError] = React.useState<string | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)

    React.useEffect(() => {
        if (mode === "resetPassword" && oobCode) {
            handleVerifyCode(oobCode)
        } else {
            setStatus("error")
            setError("Acción no válida o código expirado.")
        }
    }, [mode, oobCode])

    async function handleVerifyCode(code: string) {
        try {
            const userEmail = await verifyPasswordResetCode(auth, code)
            setEmail(userEmail)
            setStatus("ready")
        } catch (err: any) {
            console.error("Error verifying code:", err)
            setStatus("error")
            setError("El enlace de recuperación es inválido o ha expirado.")
        }
    }

    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault()
        if (!oobCode || !newPassword) return

        setIsLoading(true)
        setError(null)

        try {
            // 1. Confirmar el reset de contraseña
            await confirmPasswordReset(auth, oobCode, newPassword)

            // 2. Intentar login automático
            if (email) {
                try {
                    await signInWithEmailAndPassword(auth, email, newPassword)
                    setStatus("success")
                    // Redirigir al dashboard después de 2 segundos
                    setTimeout(() => navigate("/student"), 2000)
                } catch (loginErr) {
                    // Si el login automático falla (ej. por reglas de seguridad), solo mostramos éxito y mandamos a login
                    setStatus("success")
                    setTimeout(() => navigate("/login"), 3000)
                }
            }
        } catch (err: any) {
            console.error("Error resetting password:", err)
            setError("No se pudo actualizar la contraseña. Inténtalo de nuevo.")
        } finally {
            setIsLoading(false)
        }
    }

    if (status === "verifying") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9FAF7]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-[#4A5D4E]" />
                    <p className="text-[#4A5D4E]/70 font-sans">Verificando enlace...</p>
                </div>
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9FAF7] p-4">
                <Card className="w-full max-w-md border-none shadow-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <CardTitle className="font-serif text-2xl">Error de Enlace</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button onClick={() => navigate("/login")} className="bg-[#1E293B]">
                            Volver al Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (status === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9FAF7] p-4">
                <Card className="w-full max-w-md border-none shadow-xl text-center">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <CardTitle className="font-serif text-3xl text-[#1E293B]">¡Todo listo!</CardTitle>
                        <CardDescription className="text-lg mt-2">
                            Tu contraseña ha sido actualizada.
                            <br />
                            Redirigiéndote a tu espacio zen...
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#4A5D4E] opacity-50" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAF7] p-4 selection:bg-[#E8F5E9]">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#E8F5E9] blur-[100px] opacity-40" />
                <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#4A5D4E]/10 blur-[100px] opacity-40" />
            </div>

            <Card className="relative w-full max-w-md border-none shadow-[0_32px_128px_-16px_rgba(74,93,78,0.12)] bg-white rounded-[2rem] overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-[#4A5D4E] to-[#1E293B]" />
                <CardHeader className="space-y-4 pt-10">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-serif text-[#1E293B]">Configura tu Cuenta</h1>
                        <p className="text-[#4A5D4E]/70 text-sm">Estás a un paso de comenzar tu práctica</p>
                    </div>
                </CardHeader>
                <CardContent className="pb-10 pt-4">
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="space-y-1.5">
                            <Label className="text-[#1E293B]/70 text-xs ml-1 font-semibold uppercase tracking-wider">Correo</Label>
                            <Input
                                value={email || ""}
                                disabled
                                className="h-12 bg-slate-50 border-[#E8F5E9] text-[#1E293B]/50 rounded-xl"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[#1E293B]/70 text-xs ml-1 font-semibold uppercase tracking-wider">Nueva Contraseña</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
                                    className="h-12 bg-[#F9FAF7] border-[#E8F5E9] text-[#1E293B] rounded-xl focus:ring-[#4A5D4E]/20 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5D4E]/50 hover:text-[#4A5D4E]"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 bg-[#1E293B] hover:bg-[#334155] text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-200"
                            disabled={isLoading || !newPassword}
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Confirmar y Entrar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

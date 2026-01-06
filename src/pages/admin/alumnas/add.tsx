import * as React from "react"
import {
    ArrowLeft,
    Loader2,
} from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useNavigate } from "react-router-dom"
import { httpsCallable } from "firebase/functions"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { functions, db } from "@/lib/firebase"

export default function AddAlumna() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = React.useState(false)
    const [fetchingPlans, setFetchingPlans] = React.useState(true)
    const [plans, setPlans] = React.useState<any[]>([])
    const [success, setSuccess] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [phoneValue, setPhoneValue] = React.useState("")
    const [countryCode, setCountryCode] = React.useState("+52")

    React.useEffect(() => {
        async function fetchPlans() {
            try {
                const q = query(collection(db, "plans"), orderBy("price", "asc"))
                const querySnapshot = await getDocs(q)
                const plansList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setPlans(plansList)
            } catch (err) {
                console.error("Error fetching plans:", err)
            } finally {
                setFetchingPlans(false)
            }
        }
        fetchPlans()
    }, [])

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Solo permitir números y -
        let value = e.target.value.replace(/[^\d-]/g, "");

        // Limitar longitud y formatear si es necesario
        // Ejemplo simple: 123-456-7890
        const digits = value.replace(/\D/g, "");
        if (digits.length <= 10) {
            if (digits.length > 6) {
                value = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
            } else if (digits.length > 3) {
                value = `${digits.slice(0, 3)}-${digits.slice(3)}`;
            } else {
                value = digits;
            }
        }
        setPhoneValue(value);
    }

    const handleCountryCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (!value.startsWith("+")) {
            value = "+" + value.replace(/\D/g, "");
        } else {
            value = "+" + value.slice(1).replace(/\D/g, "");
        }
        setCountryCode(value);
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const name = formData.get("name") as string
        const email = formData.get("email") as string
        // Combinar lada + numero y limpiar caracteres no numéricos
        const phone = (countryCode + phoneValue).trim().replace(/[^\d+]/g, "");
        const planId = formData.get("plan") as string

        try {
            const onboardingFn = httpsCallable(functions, "createStudentOnboarding");

            await onboardingFn({
                email,
                displayName: name,
                phone,
                planId
            });

            setSuccess(true)
            setTimeout(() => {
                navigate("/admin/alumnas")
            }, 1500)
        } catch (err: any) {
            console.error("Error adding alumna:", err)

            // Manejo de errores específicos de Firebase Functions
            if (err.code === "functions/already-exists" || err.message?.includes("already-exists")) {
                setError("Este correo electrónico ya está registrado.")
            } else if (err.code === "functions/permission-denied") {
                setError("No tienes permisos suficientes para realizar esta acción.")
            } else if (err.code === "functions/unauthenticated") {
                setError("Tu sesión ha expirado. Por favor inicia sesión de nuevo.")
            } else if (err.message) {
                // Mostrar el mensaje descriptivo que viene de la función
                setError(err.message.replace("internal: ", ""))
            } else {
                setError("Ocurrió un error inesperado al conectar con el servidor. Revisa tu conexión.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/admin/alumnas">Alumnas</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Nueva Alumna</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <main className="flex flex-1 flex-col items-center justify-start p-6 bg-[#F9FAF7]">
                    <div className="w-full max-w-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate("/admin/alumnas")}
                                className="rounded-full bg-white shadow-sm border border-[#E8F5E9]"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <h1 className="text-3xl font-serif font-bold text-[#1E293B]">Agregar Nueva Alumna</h1>
                        </div>

                        <Card className="border-none shadow-lg bg-white overflow-hidden">
                            <div className="h-2 bg-[#E8F5E9]" />
                            <CardHeader>
                                <CardTitle className="font-serif">Información Básica</CardTitle>
                                <CardDescription>
                                    Crea el perfil de una nueva socia y asígnale un plan inicial.
                                </CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSubmit}>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nombre Completo</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="Ej. Ana García"
                                                required
                                                className="bg-[#F9FAF7] border-[#E8F5E9] focus-visible:ring-[#1E293B]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Correo Electrónico</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="ana@ejemplo.com"
                                                required
                                                className="bg-[#F9FAF7] border-[#E8F5E9] focus-visible:ring-[#1E293B]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Número Telefónico</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="lada"
                                                    name="lada"
                                                    type="text"
                                                    value={countryCode}
                                                    onChange={handleCountryCodeChange}
                                                    className="w-16 bg-[#F9FAF7] border-[#E8F5E9] focus-visible:ring-[#1E293B] text-center px-1"
                                                />
                                                <Input
                                                    id="phone"
                                                    name="phone"
                                                    type="tel"
                                                    placeholder="000-000-0000"
                                                    value={phoneValue}
                                                    onChange={handlePhoneChange}
                                                    className="flex-1 bg-[#F9FAF7] border-[#E8F5E9] focus-visible:ring-[#1E293B]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="plan">Plan Seleccionado</Label>
                                        <select
                                            id="plan"
                                            name="plan"
                                            required
                                            disabled={fetchingPlans}
                                            className="flex h-10 w-full rounded-md border border-[#E8F5E9] bg-[#F9FAF7] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E293B] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">{fetchingPlans ? "Cargando planes..." : "Selecciona un plan..."}</option>
                                            {plans.map(plan => (
                                                <option key={plan.id} value={plan.id}>
                                                    {plan.name} - ${plan.price} ({plan.classes} clases)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {success && (
                                        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100 animate-in fade-in slide-in-from-top-1">
                                            Alumna registrada y correo de bienvenida enviado correctamente.
                                        </div>
                                    )}

                                    {error && (
                                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 animate-in fade-in slide-in-from-top-1">
                                            {error}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-[#F9FAF7]/50 border-t border-[#E8F5E9] p-6 flex justify-end gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/admin/alumnas")}
                                        disabled={isLoading}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-[#1E293B] text-white hover:bg-[#334155]"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            "Guardar Alumna"
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

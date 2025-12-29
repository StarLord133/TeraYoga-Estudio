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
        // Solo permitir números y el signo + al inicio
        let value = e.target.value.replace(/[^\d+]/g, "");

        // Formatear: +52 123-456-7890 o similar
        // Por ahora algo simple: XXX-XXX-XXXX
        const match = value.match(/^(\+?\d{1,3})(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            value = `${match[1]} ${match[2]}-${match[3]}-${match[4]}`;
        }
        setPhoneValue(value);
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const name = formData.get("name") as string
        const email = formData.get("email") as string
        const phone = phoneValue.trim().replace(/[^\d+]/g, "");
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
            if (err.message?.includes("already-exists") || err.code === "functions/already-exists") {
                setError("Este correo electrónico ya está registrado.")
            } else if (err.code === "functions/permission-denied") {
                setError("No tienes permisos suficientes para crear alumnas.")
            } else {
                setError("Ocurrió un error inesperado. Inténtalo de nuevo.")
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
                                            <Input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                placeholder="+52 000-000-0000"
                                                value={phoneValue}
                                                onChange={handlePhoneChange}
                                                className="bg-[#F9FAF7] border-[#E8F5E9] focus-visible:ring-[#1E293B]"
                                            />
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

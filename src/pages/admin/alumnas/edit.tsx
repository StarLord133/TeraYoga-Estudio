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
import { useNavigate, useParams } from "react-router-dom"
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"


export default function EditAlumna() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSaving, setIsSaving] = React.useState(false)
    const [success, setSuccess] = React.useState(false)
    const [phoneValue, setPhoneValue] = React.useState("")
    const [countryCode, setCountryCode] = React.useState("+52")
    const [plans, setPlans] = React.useState<any[]>([])
    const [fetchingPlans, setFetchingPlans] = React.useState(true)
    const [formData, setFormData] = React.useState({
        name: "",
        email: "",
        plan: ""
    })

    React.useEffect(() => {
        async function fetchData() {
            if (!id) return;
            try {
                // 1. Fetch Plans first
                const qPlans = query(collection(db, "plans"), orderBy("price", "asc"))
                const plansSnapshot = await getDocs(qPlans)
                const plansList = plansSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setPlans(plansList)
                setFetchingPlans(false)

                // 2. Fetch User Data
                const userDoc = await getDoc(doc(db, "users", id));
                if (userDoc.exists()) {
                    const data = userDoc.data();

                    // Encontrar el ID del plan basado en el nombre guardado usando la lista recién traída
                    const matchingPlan = plansList.find((p: any) => p.name === data.plan);

                    setFormData({
                        name: data.name || "",
                        email: data.email || "",
                        plan: matchingPlan?.id || ""
                    });

                    const fullPhone = data.phone || "";
                    if (fullPhone.startsWith("+52")) {
                        setCountryCode("+52");
                        setPhoneValue(fullPhone.slice(3).trim());
                    } else if (fullPhone.startsWith("+")) {
                        setCountryCode(fullPhone.slice(0, 3));
                        setPhoneValue(fullPhone.slice(3).trim());
                    } else {
                        setCountryCode("+52");
                        setPhoneValue(fullPhone);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/[^\d-]/g, "");
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
        if (!id) return;
        setIsSaving(true)

        const fData = new FormData(event.currentTarget)
        const name = fData.get("name") as string
        const email = fData.get("email") as string
        const planId = fData.get("plan") as string
        const normalizedPhone = (countryCode + phoneValue).trim().replace(/[^\d+]/g, "");

        const selectedPlan = plans.find(p => p.id === planId)

        try {
            await updateDoc(doc(db, "users", id), {
                name,
                email,
                phone: normalizedPhone,
                plan: selectedPlan?.name || "Sin plan"
            });

            // También actualizamos el plan en la colección students si cambió
            await updateDoc(doc(db, "students", id), {
                current_plan_id: planId,
                // Nota: Aquí podrías decidir si resetear clases o no. 
                // Por ahora solo actualizamos el ID del plan.
            });

            setSuccess(true)
            setTimeout(() => {
                navigate("/admin/alumnas")
            }, 1500)
        } catch (error) {
            console.error("Error updating alumna:", error)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Cargando datos...</div>
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
                                <BreadcrumbPage>Editar Alumna</BreadcrumbPage>
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
                            <h1 className="text-3xl font-serif font-bold text-[#1E293B]">Editar Alumna</h1>
                        </div>

                        <Card className="border-none shadow-lg bg-white overflow-hidden">
                            <div className="h-2 bg-[#E8F5E9]" />
                            <CardHeader>
                                <CardTitle className="font-serif">Actualizar Información</CardTitle>
                                <CardDescription>
                                    Modifica los datos de la socia seleccionada.
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
                                                defaultValue={formData.name}
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
                                                defaultValue={formData.email}
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
                                            defaultValue={formData.plan}
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
                                            Cambios guardados correctamente. Redirigiendo...
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-[#F9FAF7]/50 border-t border-[#E8F5E9] p-6 flex justify-end gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/admin/alumnas")}
                                        disabled={isSaving}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-[#1E293B] text-white hover:bg-[#334155]"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            "Guardar Cambios"
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

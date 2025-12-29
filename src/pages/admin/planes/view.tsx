import * as React from "react"
import {
    ArrowLeft,
    BookOpen,
    Clock,
    DollarSign,
    Infinity,
    Calendar,
    Users
} from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function PlanView() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = React.useState(true)
    const [plan, setPlan] = React.useState<any>(null)
    const [stats, setStats] = React.useState({ activeStudents: 0 })

    React.useEffect(() => {
        async function fetchData() {
            if (!id) return;
            try {
                // Fetch Plan Data
                const planDoc = await getDoc(doc(db, "plans", id));
                if (planDoc.exists()) {
                    const data = planDoc.data();
                    setPlan({ id: planDoc.id, ...data });

                    // Fetch Stats: How many students are using this plan
                    const q = query(collection(db, "users"), where("plan", "==", data.name), where("role", "==", "student"), where("status", "==", "Activo"));
                    const querySnapshot = await getDocs(q);
                    setStats({ activeStudents: querySnapshot.size });
                }
            } catch (error) {
                console.error("Error fetching plan details:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [id]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Cargando detalles del plan...</div>
    }

    if (!plan) {
        return <div className="p-8 text-center">No se encontró el plan solicitado.</div>
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
                                <BreadcrumbLink href="/admin/planes">Planes</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Detalle: {plan.name}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <main className="flex flex-1 flex-col gap-6 p-6 bg-[#F9FAF7]">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/admin/planes")}
                            className="rounded-full bg-white shadow-sm border border-[#E8F5E9]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-3xl font-serif font-bold text-[#1E293B]">Detalle del Plan</h1>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Main Info Card */}
                        <Card className="md:col-span-2 border-none shadow-sm bg-white overflow-hidden">
                            <div className="h-2 bg-[#1E293B]" />
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl font-serif mb-1">{plan.name}</CardTitle>
                                        <CardDescription>Configuración técnica y comercial del plan.</CardDescription>
                                    </div>
                                    <div className="p-3 bg-[#E8F5E9] rounded-xl text-[#1E293B]">
                                        <BookOpen className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-8 pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Precio Público</p>
                                        <p className="text-2xl font-bold text-[#1E293B] flex items-center">
                                            <DollarSign className="h-5 w-5 mr-0.5" />
                                            {plan.price}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Capacidad de Clases</p>
                                        <p className="text-2xl font-bold text-[#1E293B] flex items-center gap-2">
                                            <Infinity className="h-5 w-5" />
                                            {plan.classes} clases
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Vigencia del Plan</p>
                                        <p className="text-2xl font-bold text-[#1E293B] flex items-center gap-2">
                                            <Clock className="h-5 w-5" />
                                            {plan.days} días
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="font-serif font-bold text-lg">Resumen de Uso</h3>
                                    <div className="flex items-center gap-4 p-4 bg-[#F9FAF7] rounded-xl border border-[#E8F5E9]">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Users className="h-5 w-5 text-[#1E293B]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[#1E293B]">Alumnas Activas</p>
                                            <p className="text-xs text-muted-foreground">{stats.activeStudents} socias están usando este plan actualmente.</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <div className="p-6 bg-[#F9FAF7]/50 border-t border-[#E8F5E9] flex justify-end gap-3">
                                <Button variant="outline" onClick={() => navigate(`/admin/planes/editar/${plan.id}`)}>
                                    Editar Plan
                                </Button>
                            </div>
                        </Card>

                        {/* Sidebar Info Card */}
                        <Card className="md:col-span-1 border-none shadow-sm bg-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-serif">Metadatos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> Creado el:
                                    </span>
                                    <span className="font-medium">
                                        {plan.createdAt?.toDate ? plan.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="pt-4 mt-4 border-t border-[#E8F5E9]">
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Este plan define el comportamiento automático para las nuevas inscripciones y renovaciones. Cualquier cambio afectará únicamente a las inscripciones nuevas.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

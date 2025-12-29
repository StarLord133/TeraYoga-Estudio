import * as React from "react"
import {
    ArrowLeft,
    Calendar,
    Phone,
    Mail,
    BadgeCheck,
    Clock,
} from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AlumnaProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = React.useState(true)
    const [alumna, setAlumna] = React.useState<any>(null)
    const [studentData, setStudentData] = React.useState<any>(null)

    React.useEffect(() => {
        async function fetchData() {
            if (!id) return;
            try {
                const userDoc = await getDoc(doc(db, "users", id));
                if (userDoc.exists()) {
                    setAlumna({ id: userDoc.id, ...userDoc.data() });
                }

                const studentDoc = await getDoc(doc(db, "students", id));
                if (studentDoc.exists()) {
                    setStudentData(studentDoc.data());
                }
            } catch (error) {
                console.error("Error fetching alumna profile:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [id]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Cargando perfil...</div>
    }

    if (!alumna) {
        return <div className="p-8 text-center">No se encontró la alumna.</div>
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
                                <BreadcrumbPage>Perfil de {alumna.name}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <main className="flex flex-1 flex-col gap-6 p-6 bg-[#F9FAF7]">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/admin/alumnas")}
                            className="rounded-full bg-white shadow-sm border border-[#E8F5E9]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-3xl font-serif font-bold text-[#1E293B]">Detalle de Alumna</h1>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Profile Info Card */}
                        <Card className="md:col-span-1 border-none shadow-sm overflow-hidden bg-white">
                            <div className="h-24 bg-[#1E293B] relative">
                                <div className="absolute -bottom-12 left-6">
                                    <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                                        <AvatarImage src={alumna.avatar} />
                                        <AvatarFallback className="bg-[#E8F5E9] text-[#1E293B] text-2xl font-bold">
                                            {alumna.name?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                            <CardContent className="pt-16 pb-6">
                                <div className="space-y-1 mb-6">
                                    <h2 className="text-2xl font-bold text-[#1E293B]">{alumna.name}</h2>
                                    <Badge variant="secondary" className="bg-[#E8F5E9] text-[#1E293B]">
                                        {alumna.status || "Activo"}
                                    </Badge>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4 text-[#1E293B]" />
                                        <span>{alumna.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Phone className="h-4 w-4 text-[#1E293B]" />
                                        <span>{alumna.phone || "No registrado"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4 text-[#1E293B]" />
                                        <span>Miembro desde: {alumna.createdAt?.toDate ? alumna.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <Button
                                        className="w-full bg-[#1E293B] text-white"
                                        onClick={() => navigate(`/admin/alumnas/editar/${alumna.id}`)}
                                    >
                                        Editar Perfil
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats and Plan details */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Card className="border-none shadow-sm bg-white">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center uppercase tracking-wider text-[10px]">
                                            <BadgeCheck className="h-3 w-3 mr-1 text-[#1E293B]" /> Plan Actual
                                        </CardDescription>
                                        <CardTitle className="text-xl font-serif">{alumna.plan || "Sin plan"}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-end">
                                            <div className="text-3xl font-bold">{studentData?.clases_restantes || 0}</div>
                                            <div className="text-xs text-muted-foreground">clases restantes</div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-sm bg-white">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center uppercase tracking-wider text-[10px]">
                                            <Clock className="h-3 w-3 mr-1 text-[#1E293B]" /> Vencimiento
                                        </CardDescription>
                                        <CardTitle className="text-xl font-serif">
                                            {studentData?.fecha_expiracion?.toDate ?
                                                studentData.fecha_expiracion.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) :
                                                'Sin fecha'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-end">
                                            <div className="text-3xl font-bold">
                                                {studentData?.fecha_expiracion?.toDate ?
                                                    Math.ceil((studentData.fecha_expiracion.toDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0}
                                            </div>
                                            <div className="text-xs text-muted-foreground">días restantes</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Section for recent Check-ins (Dummy for now) */}
                            <Card className="border-none shadow-sm bg-white">
                                <CardHeader>
                                    <CardTitle className="font-serif">Asistencias Recientes</CardTitle>
                                    <CardDescription>Registro de las últimas clases tomadas.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 text-center py-8 text-muted-foreground italic border-2 border-dashed border-[#E8F5E9] rounded-xl">
                                        Próximamente: Historial de check-ins real.
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

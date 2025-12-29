import * as React from "react"
import {
    Plus,
    Users,
    DollarSign,
    TrendingUp,
    RotateCcw,
} from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = React.useState({
        total: 0,
        active: 0,
        expiring: 0,
        mrr: 4250
    })
    const [recentAlumnas, setRecentAlumnas] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        const q = query(collection(db, "users"), where("role", "==", "student"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const alumnas = snapshot.docs.map(doc => doc.data())
            setStats(prev => ({
                ...prev,
                total: alumnas.length,
                active: alumnas.filter((a: any) => a.status === "Activo").length,
                expiring: alumnas.filter((a: any) => a.status === "Próximo a Vencer").length,
            }))

            // Get recent ones (simulated by ordering by createdAt)
            const sorted = [...alumnas].sort((a: any, b: any) =>
                (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
            )
            setRecentAlumnas(sorted.slice(0, 5))
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

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
                                <BreadcrumbLink href="#">Admin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Resumen General</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <main className="flex flex-1 flex-col gap-6 p-6 bg-[#F9FAF7]">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-serif font-bold text-[#1E293B]">Dashboard Admin</h1>
                        <Button
                            onClick={() => navigate("/admin/alumnas/nueva")}
                            className="bg-[#1E293B] text-white hover:bg-[#334155]"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nueva Alumna
                        </Button>
                    </div>

                    {/* Metrics Section */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="MRR"
                            value={`$${stats.mrr}`}
                            description="+12% mensual"
                            icon={<DollarSign className="h-4 w-4 text-[#1E293B]" />}
                        />
                        <MetricCard
                            title="Alumnas Totales"
                            value={stats.total.toString()}
                            description={`${stats.active} activas`}
                            icon={<Users className="h-4 w-4 text-[#1E293B]" />}
                        />
                        <MetricCard
                            title="Churn Rate"
                            value="2.4%"
                            description="-0.5% vs mes anterior"
                            icon={<TrendingUp className="h-4 w-4 text-[#1E293B]" />}
                        />
                        <MetricCard
                            title="Próximos a Vencer"
                            value={stats.expiring.toString()}
                            description="Próximos 7 días"
                            icon={<RotateCcw className="h-4 w-4 text-[#1E293B]" />}
                        />
                    </div>

                    {/* Recent Alumnas Section */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-serif">Alumnas Recientes</CardTitle>
                                <CardDescription>
                                    Últimas socias incorporadas al estudio.
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate("/admin/alumnas")}
                                className="border-[#E8F5E9] text-[#1E293B]"
                            >
                                Ver todas
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-[#E8F5E9] overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-[#E8F5E9]/30">
                                        <TableRow>
                                            <TableHead className="font-semibold text-[#1E293B]">Nombre</TableHead>
                                            <TableHead className="font-semibold text-[#1E293B]">Email</TableHead>
                                            <TableHead className="font-semibold text-[#1E293B]">Plan</TableHead>
                                            <TableHead className="text-right font-semibold text-[#1E293B]">Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-4">Cargando...</TableCell>
                                            </TableRow>
                                        ) : recentAlumnas.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No hay registros recientes.</TableCell>
                                            </TableRow>
                                        ) : (
                                            recentAlumnas.map((alumna, idx) => (
                                                <TableRow key={idx} className="hover:bg-[#E8F5E9]/10">
                                                    <TableCell className="font-medium">{alumna.name}</TableCell>
                                                    <TableCell>{alumna.email}</TableCell>
                                                    <TableCell>{alumna.plan || "Sin plan"}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="secondary" className="bg-[#E8F5E9] text-[#1E293B]">
                                                            {alumna.status || "Activo"}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

function MetricCard({ title, value, description, icon }: {
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode
}) {
    return (
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-[#1E293B]">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    {description}
                </p>
            </CardContent>
        </Card>
    )
}


import * as React from "react"
import {
    Plus,
    Users,
    DollarSign,
    RotateCcw,
    CheckCircle2,
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

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip } from "recharts"

import { useNavigate } from "react-router-dom"
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

const PLAN_COLORS = ["#8a7f96", "#b7afbe", "#e1f2f3", "#1e293b", "#334155"]

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = React.useState({
        total: 0,
        active: 0,
        expiring: 0,
        todayAttendance: 0,
        mrr: 0
    })
    const [recentAlumnas, setRecentAlumnas] = React.useState<any[]>([])
    const [attendanceData, setAttendanceData] = React.useState<any[]>([])
    const [planData, setPlanData] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        // 1. Fetch Students Stats
        const qUsers = query(collection(db, "users"), where("role", "==", "student"))
        const unsubUsers = onSnapshot(qUsers, (snapshot) => {
            const alumnas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

            // MRR simulation (approximate based on plan, if we had prices here)
            // For now let's say $1200 per active student as a placeholder or real logic if available
            const activeCount = alumnas.filter(a => a.status === "Activo").length
            const pendingCount = alumnas.filter(a => a.status === "Pendiente registro").length

            setStats(prev => ({
                ...prev,
                total: alumnas.length,
                active: activeCount,
                expiring: alumnas.filter(a => a.status === "Próximo a Vencer").length,
                mrr: activeCount * 850,
                pending: pendingCount
            }))

            // Plan distribution for Pie Chart
            const planCounts: Record<string, number> = {}
            alumnas.forEach(a => {
                const planName = a.plan || "Sin Plan"
                planCounts[planName] = (planCounts[planName] || 0) + 1
            })
            setPlanData(Object.entries(planCounts).map(([name, value]) => ({ name, value })))

            const sorted = [...alumnas].sort((a, b) =>
                (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
            )
            setRecentAlumnas(sorted.slice(0, 5))
            setLoading(false)
        })

        // 2. Fetch Weekly Attendance for Bar Chart
        const lastWeek = new Date()
        lastWeek.setDate(lastWeek.getDate() - 7)
        const qAsistencias = query(
            collection(db, "asistencias"),
            where("fecha", ">=", Timestamp.fromDate(lastWeek)),
            orderBy("fecha", "asc")
        )

        const unsubAsistencias = onSnapshot(qAsistencias, (snapshot) => {
            const asistencias = snapshot.docs.map(doc => doc.data())

            // Count today's specifically
            const today = new Date().toLocaleDateString()
            const todayCount = asistencias.filter(a => a.fecha?.toDate().toLocaleDateString() === today).length
            setStats(prev => ({ ...prev, todayAttendance: todayCount }))

            // Aggregate by day for chart
            const days: Record<string, number> = {}
            asistencias.forEach(a => {
                const dayName = a.fecha?.toDate().toLocaleDateString('es-ES', { weekday: 'short' })
                days[dayName] = (days[dayName] || 0) + 1
            })

            setAttendanceData(Object.entries(days).map(([name, total]) => ({ name, total })))
        })

        return () => {
            unsubUsers()
            unsubAsistencias()
        }
    }, [])

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="overflow-hidden">
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

                <main className="flex flex-1 flex-col gap-6 p-6 bg-[#F9FAF7] overflow-x-hidden">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-[#1E293B]">Hola, Admin</h1>
                            <p className="text-muted-foreground">Aquí tienes un resumen de la actividad en TeraYoga.</p>
                        </div>
                        <Button
                            onClick={() => navigate("/admin/alumnas/nueva")}
                            className="bg-[#8a7f96] text-white hover:bg-[#6d6379] shadow-sm font-sans uppercase tracking-widest text-[10px] py-6 px-6 rounded-xl"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nueva Alumna
                        </Button>
                    </div>

                    {/* Metrics Section */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="Ingresos Est."
                            value={`$${stats.mrr.toLocaleString()}`}
                            description="Basado en planes activos"
                            icon={<DollarSign className="h-4 w-4 text-[#8a7f96]" />}
                        />
                        <MetricCard
                            title="Alumnas Activas"
                            value={stats.active.toString()}
                            description={`De ${stats.total} totales`}
                            icon={<Users className="h-4 w-4 text-[#8a7f96]" />}
                        />
                        <MetricCard
                            title="Asistencias Hoy"
                            value={stats.todayAttendance.toString()}
                            description="Check-ins realizados"
                            icon={<CheckCircle2 className="h-4 w-4 text-[#8a7f96]" />}
                        />
                        <MetricCard
                            title="Por Vencer"
                            value={stats.expiring.toString()}
                            description="Próximos 7 días"
                            icon={<RotateCcw className="h-4 w-4 text-[#8a7f96]" />}
                        />
                    </div>

                    {/* Charts Section */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 min-w-0">
                        <Card className="lg:col-span-4 border-none shadow-sm min-w-0">
                            <CardHeader>
                                <CardTitle className="text-lg font-serif">Asistencias Semanales</CardTitle>
                                <CardDescription>Frecuencia de visitas en los últimos 7 días</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{
                                    total: { label: "Asistencias", color: "#8a7f96" }
                                }} className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={attendanceData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1f2f3" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                            />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Bar
                                                dataKey="total"
                                                fill="var(--color-total)"
                                                radius={[4, 4, 0, 0]}
                                                barSize={40}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-3 border-none shadow-sm min-w-0">
                            <CardHeader>
                                <CardTitle className="text-lg font-serif">Distribución de Planes</CardTitle>
                                <CardDescription>Alumnas según su membresía</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center pt-0">
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={planData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {planData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip content={<CustomTooltip />} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 text-center">
                                    <p className="text-xs text-muted-foreground font-medium">Total: {stats.total} Alumnas</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Alumnas Section */}
                    <Card className="border-none shadow-sm min-w-0">
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
                                className="border-[#e1f2f3] text-[#8a7f96] hover:bg-[#e1f2f3] font-sans uppercase tracking-[0.2em] text-[9px] font-bold"
                            >
                                Ver todas
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-[#E8F5E9] overflow-hidden bg-white">
                                <Table>
                                    <TableHeader className="bg-[#e1f2f3]/30">
                                        <TableRow className="hover:bg-transparent border-[#e1f2f3]">
                                            <TableHead className="font-bold uppercase tracking-widest text-[13px] text-[#8a7f96]">Nombre</TableHead>
                                            <TableHead className="font-bold uppercase tracking-widest text-[13px] text-[#8a7f96]">Email</TableHead>
                                            <TableHead className="font-bold uppercase tracking-widest text-[13px] text-[#8a7f96]">Plan</TableHead>
                                            <TableHead className="text-right font-bold uppercase tracking-widest text-[13px] text-[#8a7f96]">Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8">Cargando datos...</TableCell>
                                            </TableRow>
                                        ) : recentAlumnas.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">No hay registros recientes.</TableCell>
                                            </TableRow>
                                        ) : (
                                            recentAlumnas.map((alumna) => (
                                                <TableRow key={alumna.id} className="hover:bg-[#E8F5E9]/10 border-[#F1F5F9]">
                                                    <TableCell className="font-medium text-[#1E293B] text-[15px]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-[#E8F5E9] flex items-center justify-center text-xs font-bold text-[#1E293B]">
                                                                {alumna.name?.charAt(0)}
                                                            </div>
                                                            {alumna.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-base">{alumna.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-bold text-[12px] uppercase tracking-wider border-[#e1f2f3] text-[#8a7f96] bg-[#e1f2f3]/20 px-2 py-0">
                                                            {alumna.plan || "Sin plan"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge
                                                            variant="secondary"
                                                            className={cn(
                                                                "text-[12px] font-bold uppercase tracking-wider px-2 py-0",
                                                                alumna.status === "Activo"
                                                                    ? "bg-[#e1f2f3] text-[#8a7f96]"
                                                                    : alumna.status === "Pendiente registro"
                                                                        ? "bg-amber-100 text-amber-700"
                                                                        : "bg-[#8a7f96]/10 text-[#8a7f96]"
                                                            )}
                                                        >
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
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">
                    {title}
                </CardTitle>
                <div className="p-2 bg-[#e1f2f3] rounded-lg">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-[#1E293B] font-serif">{value}</div>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                    {description}
                </p>
            </CardContent>
        </Card>
    )
}

// Helper para clases de tailwind
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ")
}

function CustomTooltip({ active, payload }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 shadow-xl rounded-xl border border-[#e1f2f3] text-xs">
                <p className="font-bold text-[#8a7f96] mb-1">{payload[0].name}</p>
                <p className="text-muted-foreground">{payload[0].value} alumnas</p>
            </div>
        );
    }
    return null;
}


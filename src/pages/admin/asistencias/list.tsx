import * as React from "react"
import {
    Search,
    Calendar,
    ArrowUpDown,
    CheckCircle2,
    SearchX,
    User,
    Clock,
    Loader2,
} from "lucide-react"

import {
    Card,
    CardContent,
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

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
import { collection, query, onSnapshot, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AsistenciasList() {
    const navigate = useNavigate()
    const [asistencias, setAsistencias] = React.useState<any[]>([])
    const [plans, setPlans] = React.useState<Record<string, string>>({})
    const [searchTerm, setSearchTerm] = React.useState("")
    const [filterPlan, setFilterPlan] = React.useState("all")
    const [filterPeriod, setFilterPeriod] = React.useState("today")
    const [loading, setLoading] = React.useState(true)

    // Stats
    const [stats, setStats] = React.useState({
        today: 0,
        week: 0,
        month: 0
    })

    React.useEffect(() => {
        // Fetch Plans to have names
        async function fetchPlans() {
            const snap = await getDocs(collection(db, "plans"))
            const planMap: Record<string, string> = {}
            snap.forEach(doc => {
                planMap[doc.id] = doc.data().name
            })
            setPlans(planMap)
        }
        fetchPlans()

        // Real-time attendance
        const q = query(collection(db, "asistencias"), orderBy("fecha", "desc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allAsistencias = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setAsistencias(allAsistencias)

            // Calculate Stats
            const now = new Date()
            const todayStr = now.toLocaleDateString()

            const oneWeekAgo = new Date()
            oneWeekAgo.setDate(now.getDate() - 7)

            const oneMonthAgo = new Date()
            oneMonthAgo.setMonth(now.getMonth() - 1)

            let t = 0, w = 0, m = 0

            allAsistencias.forEach((a: any) => {
                const date = a.fecha?.toDate()
                if (!date) return

                if (date.toLocaleDateString() === todayStr) t++
                if (date >= oneWeekAgo) w++
                if (date >= oneMonthAgo) m++
            })

            setStats({ today: t, week: w, month: m })
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const filteredAsistencias = asistencias.filter(a => {
        const matchesSearch = a.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesPlan = filterPlan === "all" || a.plan_id === filterPlan

        let matchesPeriod = true
        const date = a.fecha?.toDate()
        if (date) {
            const now = new Date()
            if (filterPeriod === "today") {
                matchesPeriod = date.toLocaleDateString() === now.toLocaleDateString()
            } else if (filterPeriod === "week") {
                const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7)
                matchesPeriod = date >= weekAgo
            }
        }

        return matchesSearch && matchesPlan && matchesPeriod
    })

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
                                <BreadcrumbLink href="/admin/inicio">Admin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Historial de Asistencias</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <main className="flex flex-1 flex-col gap-6 p-6 bg-[#F9FAF7]">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-serif font-bold text-[#1E293B]">Control de Asistencias</h1>
                        <p className="text-muted-foreground text-sm">Monitorea los accesos en tiempo real y analiza la concurrencia.</p>
                    </div>

                    {/* KPIs */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hoy</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-[#8a7f96]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-serif text-[#1E293B]">{stats.today}</div>
                                <p className="text-[10px] text-muted-foreground">Accesos registrados hoy</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Últimos 7 días</CardTitle>
                                <Calendar className="h-4 w-4 text-[#8a7f96]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-serif text-[#1E293B]">{stats.week}</div>
                                <p className="text-[10px] text-muted-foreground">Tendencia semanal</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mes Actual</CardTitle>
                                <ArrowUpDown className="h-4 w-4 text-[#8a7f96]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-serif text-[#1E293B]">{stats.month}</div>
                                <p className="text-[10px] text-muted-foreground">Acumulado mensual</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters & Search */}
                    <div className="grid gap-4 md:flex md:items-center md:justify-between">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar alumna..."
                                className="pl-9 bg-white border-[#e1f2f3] rounded-xl h-11 focus-visible:ring-[#8a7f96]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={filterPlan} onValueChange={setFilterPlan}>
                                <SelectTrigger className="w-[180px] bg-white border-[#e1f2f3] rounded-xl h-11 focus:ring-[#8a7f96]">
                                    <SelectValue placeholder="Plan" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-[#e1f2f3] rounded-xl">
                                    <SelectItem value="all">Todos los planes</SelectItem>
                                    {Object.entries(plans).map(([id, name]) => (
                                        <SelectItem key={id} value={id}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                                <SelectTrigger className="w-[150px] bg-white border-[#e1f2f3] rounded-xl h-11 focus:ring-[#8a7f96]">
                                    <SelectValue placeholder="Periodo" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-[#e1f2f3] rounded-xl">
                                    <SelectItem value="today">Hoy</SelectItem>
                                    <SelectItem value="week">Semana</SelectItem>
                                    <SelectItem value="all">Histórico</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-[#e1f2f3]/30 border-b border-[#e1f2f3]">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-[250px] font-bold text-[#1E293B]">Alumna</TableHead>
                                            <TableHead className="font-bold text-[#1E293B]">Fecha y Hora</TableHead>
                                            <TableHead className="font-bold text-[#1E293B]">Plan Validado</TableHead>
                                            <TableHead className="text-right font-bold text-[#1E293B]">Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="bg-white">
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-10">
                                                    <Loader2 className="h-6 w-6 text-[#8a7f96] animate-spin mx-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredAsistencias.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-20">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <SearchX className="h-10 w-10 text-muted-foreground/30" />
                                                        <p className="text-muted-foreground font-medium">No se encontraron asistencias.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredAsistencias.map((a) => {
                                                const date = a.fecha?.toDate ? a.fecha.toDate() : new Date();
                                                return (
                                                    <TableRow key={a.id} className="hover:bg-[#e1f2f3]/10 cursor-pointer border-b border-[#e1f2f3]/20" onClick={() => navigate(`/admin/alumnas/perfil/${a.student_id}`)}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-9 w-9 rounded-full bg-[#e1f2f3] flex items-center justify-center text-[#8a7f96] font-bold text-xs">
                                                                    <User className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-[#1E293B]">{a.student_name}</p>
                                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">ID: {a.student_id.substring(0, 8)}...</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-[#1E293B]">
                                                                    {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                                </span>
                                                                <span className="text-[10px] flex items-center gap-1 text-muted-foreground">
                                                                    <Clock className="h-3 w-3 text-[#8a7f96]" />
                                                                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="border-[#e1f2f3] text-[#1E293B] bg-[#F9FAF7] font-medium text-[10px]">
                                                                {plans[a.plan_id] || a.plan_name || "Plan Miembro"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge className="bg-[#e1f2f3] text-[#8a7f96] hover:bg-[#e1f2f3] border-none text-[9px] font-bold uppercase tracking-wider">
                                                                ÉXITO
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
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

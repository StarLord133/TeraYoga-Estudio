import * as React from "react"
import {
    Search,
    Plus,
    MoreHorizontal,
    Filter,
    LayoutGrid,
    List,
    Mail,
    Phone,
    CreditCard,
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AlumnasList() {
    const navigate = useNavigate()
    const [users, setUsers] = React.useState<any[]>([])
    const [studentsData, setStudentsData] = React.useState<Record<string, any>>({})
    const [loading, setLoading] = React.useState(true)
    const [viewMode, setViewMode] = React.useState<'list' | 'grid'>(
        typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'list'
    )
    const [searchTerm, setSearchTerm] = React.useState("")
    const [filterStatus, setFilterStatus] = React.useState<string>("all")

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.")) {
            return;
        }

        try {
            const { deleteDoc, doc } = await import("firebase/firestore");
            await deleteDoc(doc(db, "users", id));
            await deleteDoc(doc(db, "students", id));
            // La lista se actualizará automáticamente gracias a onSnapshot
        } catch (error) {
            console.error("Error deleting alumna:", error);
            alert("No se pudo eliminar el registro. Revisa los permisos.");
        }
    }

    React.useEffect(() => {
        const qUsers = query(collection(db, "users"), where("role", "==", "student"))

        const unsubUsers = onSnapshot(qUsers, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
            if (loading) setLoading(false)
        })

        const unsubStudents = onSnapshot(collection(db, "students"), (snapshot) => {
            const data = snapshot.docs.reduce((acc, doc) => {
                acc[doc.id] = doc.data()
                return acc
            }, {} as any)
            setStudentsData(data)
        })

        return () => {
            unsubUsers()
            unsubStudents()
        }
    }, [])

    const mergedAlumnas = React.useMemo(() => {
        return users.map(user => ({
            ...user,
            ...(studentsData[user.id] || {})
        }))
    }, [users, studentsData])

    const filteredAlumnas = mergedAlumnas.filter((alumna) => {
        const matchesSearch =
            alumna.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            alumna.email?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = filterStatus === "all" || (alumna.status || "Activo") === filterStatus

        return matchesSearch && matchesStatus
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
                                <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Listado de Alumnas</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <main className="flex flex-1 flex-col gap-6 p-6 bg-[#F9FAF7]">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-serif font-bold text-[#1E293B]">Alumnas</h1>
                        <Button
                            onClick={() => navigate("/admin/alumnas/nueva")}
                            className="bg-[#8a7f96] text-white hover:bg-[#6d6379] shadow-sm font-sans uppercase tracking-widest text-[10px] py-6 px-6 rounded-xl"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nueva Alumna
                        </Button>
                    </div>

                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="font-serif text-[#1E293B]">Gestión de Alumnas</CardTitle>
                            <CardDescription>
                                Listado completo de socias registradas en el sistema.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                                <div className="relative flex-1 w-full max-w-sm">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7f96]" />
                                    <Input
                                        placeholder="Buscar por nombre o email..."
                                        className="pl-10 bg-white border-[#e1f2f3] rounded-xl h-11 focus-visible:ring-[#8a7f96]"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="border-[#e1f2f3] rounded-xl h-11 hover:bg-[#e1f2f3]/20 text-[#1E293B]">
                                                <Filter className="mr-2 h-4 w-4" /> {filterStatus === "all" ? "Todos los Estados" : filterStatus}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="rounded-xl border-[#e1f2f3]">
                                            <DropdownMenuItem onClick={() => setFilterStatus("all")}>Todos</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setFilterStatus("Activo")}>Activo</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setFilterStatus("Pendiente registro")}>Pendiente registro</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setFilterStatus("Inactivo")}>Inactivo</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <div className="flex border border-[#e1f2f3] rounded-xl overflow-hidden ml-auto">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`rounded-none h-11 w-11 ${viewMode === 'list' ? 'bg-[#e1f2f3] text-[#8a7f96]' : 'text-[#8a7f96]'}`}
                                            onClick={() => setViewMode('list')}
                                        >
                                            <List className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`rounded-none h-11 w-11 ${viewMode === 'grid' ? 'bg-[#e1f2f3] text-[#8a7f96]' : 'text-[#8a7f96]'}`}
                                            onClick={() => setViewMode('grid')}
                                        >
                                            <LayoutGrid className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-[#e1f2f3]/10 rounded-xl border border-dashed border-[#e1f2f3]">
                                    <div className="h-8 w-8 border-4 border-[#8a7f96] border-t-transparent rounded-full animate-spin mb-4" />
                                    <p className="text-[#8a7f96] font-medium font-sans uppercase tracking-widest text-xs">Sincronizando socias...</p>
                                </div>
                            ) : filteredAlumnas.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-[#e1f2f3]">
                                    <Search className="h-10 w-10 text-[#e1f2f3] mb-4" />
                                    <p className="text-muted-foreground font-serif text-lg">No se encontraron alumnas</p>
                                    <p className="text-xs text-muted-foreground mt-2">Intenta ajustar tus criterios de búsqueda o filtros.</p>
                                </div>
                            ) : viewMode === 'list' ? (
                                <div className="rounded-xl border border-[#e1f2f3] overflow-hidden bg-white">
                                    <Table>
                                        <TableHeader className="bg-[#e1f2f3]/30">
                                            <TableRow className="hover:bg-transparent border-b border-[#e1f2f3]">
                                                <TableHead className="font-bold text-[#1E293B] py-4 text-sm">Nombre</TableHead>
                                                <TableHead className="font-bold text-[#1E293B] text-sm">Email</TableHead>
                                                <TableHead className="font-bold text-[#1E293B] text-sm">Teléfono</TableHead>
                                                <TableHead className="font-bold text-[#1E293B] text-sm">Plan</TableHead>
                                                <TableHead className="font-bold text-[#1E293B] text-sm">Estado</TableHead>
                                                <TableHead className="font-bold text-[#1E293B] text-sm">Pago</TableHead>
                                                <TableHead className="text-right font-bold text-[#1E293B] text-sm">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAlumnas.map((alumna) => (
                                                <TableRow key={alumna.id} className="hover:bg-[#e1f2f3]/10 border-b border-[#e1f2f3]/20 transition-colors">
                                                    <TableCell className="font-medium text-[#1E293B] py-4 text-base">{alumna.name}</TableCell>
                                                    <TableCell className="text-[#475569] text-base">{alumna.email}</TableCell>
                                                    <TableCell className="text-[#475569] text-base">{alumna.phone || "-"}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="border-[#e1f2f3] text-[#8a7f96] font-medium text-[12px]">
                                                            {alumna.plan || "Sin plan"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            className={`${(alumna.status || "Activo") === "Activo"
                                                                ? "bg-[#e1f2f3] text-[#8a7f96]"
                                                                : alumna.status === "Pendiente registro"
                                                                    ? "bg-amber-100 text-amber-700"
                                                                    : "bg-gray-100 text-gray-400"
                                                                } hover:bg-opacity-80 border-none text-[12px] font-bold uppercase tracking-wider`}
                                                        >
                                                            {alumna.status || "Activo"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={`border-none text-[12px] font-bold uppercase tracking-wider flex items-center gap-1 ${alumna.payment_status === "pagado"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-red-100 text-red-700"
                                                                }`}
                                                        >
                                                            {alumna.payment_status === "pendiente" && <CreditCard className="h-3 w-3" />}
                                                            {alumna.payment_status === "pagado" ? "Pagado" : "Pendiente"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0 text-[#8a7f96] hover:bg-[#e1f2f3]/30 rounded-lg">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="rounded-xl border-[#e1f2f3]">
                                                                <DropdownMenuLabel className="font-serif">Acciones</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => navigate(`/admin/alumnas/perfil/${alumna.id}`)} className="cursor-pointer">
                                                                    Ver Perfil
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => navigate(`/admin/alumnas/editar/${alumna.id}`)} className="cursor-pointer">
                                                                    Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator className="bg-[#e1f2f3]" />
                                                                <DropdownMenuItem
                                                                    className="text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer"
                                                                    onClick={() => handleDelete(alumna.id)}
                                                                >
                                                                    Eliminar
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredAlumnas.map((alumna) => (
                                        <Card key={alumna.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden rounded-2xl bg-white flex flex-col">
                                            <CardHeader className="flex flex-row items-center gap-4 pb-4">
                                                <div className="h-14 w-14 rounded-full bg-[#e1f2f3] flex items-center justify-center text-[#8a7f96] font-bold text-2xl uppercase">
                                                    {alumna.name?.charAt(0) || "U"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-lg font-serif truncate text-[#1E293B]">{alumna.name}</CardTitle>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge
                                                            className={`${(alumna.status || "Activo") === "Activo"
                                                                ? "bg-[#e1f2f3] text-[#8a7f96]"
                                                                : alumna.status === "Pendiente registro"
                                                                    ? "bg-amber-100 text-amber-700"
                                                                    : "bg-gray-100 text-gray-400"
                                                                } border-none text-[11px] font-bold uppercase tracking-wider h-6`}
                                                        >
                                                            {alumna.status || "Activo"}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className={`border-none text-[11px] font-bold uppercase tracking-wider h-6 flex items-center gap-1 ${alumna.payment_status === "pagado"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-red-100 text-red-700"
                                                                }`}
                                                        >
                                                            {alumna.payment_status === "pendiente" && <CreditCard className="h-3 w-3" />}
                                                            {alumna.payment_status === "pagado" ? "Pagado" : "Pendiente"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex-1 flex flex-col gap-5">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground truncate">
                                                        <Mail className="h-4 w-4 text-[#8a7f96]" />
                                                        {alumna.email}
                                                    </div>
                                                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                                        <Phone className="h-4 w-4 text-[#8a7f96]" />
                                                        {alumna.phone || "Sin teléfono"}
                                                    </div>
                                                </div>

                                                <div className="pt-3 mt-auto border-t border-[#e1f2f3]/50 flex items-center justify-between">
                                                    <span className="text-[12px] uppercase font-bold tracking-widest text-[#8a7f96]">Plan Actual</span>
                                                    <Badge variant="outline" className="border-[#e1f2f3] text-[#8a7f96] font-medium text-[11px] bg-[#F9FAF7] px-2.5 py-0.5">
                                                        {alumna.plan || "Sin plan"}
                                                    </Badge>
                                                </div>

                                                <Button
                                                    onClick={() => navigate(`/admin/alumnas/perfil/${alumna.id}`)}
                                                    className="w-full mt-2 bg-[#8a7f96] hover:bg-[#7a6f86] text-white border-none font-sans uppercase tracking-[0.2em] text-[11px] py-6 rounded-xl transition-all font-bold shadow-sm"
                                                >
                                                    Gestionar Alumna
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider >
    )
}

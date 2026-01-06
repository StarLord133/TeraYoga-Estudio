import * as React from "react"
import {
    Plus,
    MoreHorizontal,
    Search,
    BookOpen,
    Clock,
    DollarSign,
    Infinity,
    Edit,
    Trash2,
    Eye,
    LayoutGrid,
    List,
    Users,
    Check
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
import { Button } from "@/components/ui/button"
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
import { collection, onSnapshot, query, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function PlansList() {
    const navigate = useNavigate()
    const [plans, setPlans] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('grid')

    React.useEffect(() => {
        const q = query(collection(db, "plans"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const plansList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setPlans(plansList)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este plan?")) return;
        try {
            await deleteDoc(doc(db, "plans", id));
        } catch (error) {
            console.error("Error deleting plan:", error);
            alert("Error al eliminar el plan.");
        }
    }

    const filteredPlans = plans.filter(plan =>
        plan.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    {/* Fixed Separator import later if needed */}
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Planes y Membresías</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <main className="flex flex-1 flex-col gap-6 p-6 bg-[#F9FAF7]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-[#1E293B]">Membresías</h1>
                            <p className="text-muted-foreground">Gestiona los planes de yoga disponibles para tus alumnas.</p>
                        </div>
                        <Button
                            onClick={() => navigate("/admin/planes/nuevo")}
                            className="bg-[#8a7f96] text-white hover:bg-[#6d6379] shadow-sm font-sans uppercase tracking-widest text-[10px] py-6 px-6 rounded-xl"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Plan
                        </Button>
                    </div>

                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <CardTitle className="font-serif text-[#1E293B] text-xl">Planes Actuales</CardTitle>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7f96]" />
                                        <Input
                                            placeholder="Buscar plan..."
                                            className="pl-10 bg-white border-[#e1f2f3] rounded-xl h-11 focus-visible:ring-[#8a7f96]"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex border border-[#e1f2f3] rounded-xl overflow-hidden">
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
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-[#e1f2f3]/10 rounded-xl border border-dashed border-[#e1f2f3]">
                                    <div className="h-8 w-8 border-4 border-[#8a7f96] border-t-transparent rounded-full animate-spin mb-4" />
                                    <p className="text-[#8a7f96] font-medium font-sans uppercase tracking-widest text-xs">Cargando membresías...</p>
                                </div>
                            ) : filteredPlans.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-[#e1f2f3]">
                                    <Search className="h-10 w-10 text-[#e1f2f3] mb-4" />
                                    <p className="text-muted-foreground font-serif text-lg">No se encontraron planes</p>
                                </div>
                            ) : viewMode === 'list' ? (
                                <div className="rounded-xl border border-[#e1f2f3] overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-[#e1f2f3]/30">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="font-bold text-[#1E293B] py-4">Nombre del Plan</TableHead>
                                                <TableHead className="font-bold text-[#1E293B]">Precio</TableHead>
                                                <TableHead className="font-bold text-[#1E293B]">Clases / Acceso</TableHead>
                                                <TableHead className="font-bold text-[#1E293B]">Duración</TableHead>
                                                <TableHead className="text-right font-bold text-[#1E293B]">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredPlans.map((plan) => (
                                                <TableRow key={plan.id} className="hover:bg-[#e1f2f3]/10 transition-colors border-b border-[#e1f2f3]/20">
                                                    <TableCell className="font-medium text-[#1E293B] py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-[#e1f2f3] rounded-xl text-[#8a7f96]">
                                                                <BookOpen className="h-4 w-4" />
                                                            </div>
                                                            <span className="font-serif text-base">{plan.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center text-[#1E293B] font-bold">
                                                            <DollarSign className="h-3 w-3 mr-0.5 text-[#8a7f96]" />
                                                            {plan.price}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5 text-[#475569]">
                                                            {plan.classes === 'Unlimited' ? <Infinity className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                                                            {plan.classes} {plan.classes === 'Unlimited' ? 'Acceso Ilimitado' : 'clases'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5 text-[#475569]">
                                                            <Clock className="h-3.5 w-3.5 text-[#8a7f96]" />
                                                            {plan.days} días
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0 text-[#8a7f96] hover:bg-[#e1f2f3]/30 rounded-lg">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40 rounded-xl border-[#e1f2f3]">
                                                                <DropdownMenuLabel className="font-serif">Gestión</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => navigate(`/admin/planes/ver/${plan.id}`)} className="cursor-pointer">
                                                                    <Eye className="mr-2 h-4 w-4" /> Ver Detalle
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => navigate(`/admin/planes/editar/${plan.id}`)} className="cursor-pointer">
                                                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator className="bg-[#e1f2f3]" />
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                                                    onClick={() => handleDelete(plan.id)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredPlans.map((plan) => (
                                        <Card key={plan.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden rounded-3xl bg-white flex flex-col">
                                            <div className="h-2 bg-[#8a7f96]/20 group-hover:bg-[#8a7f96] transition-colors" />
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="p-2.5 bg-[#e1f2f3] rounded-2xl text-[#8a7f96]">
                                                        <BookOpen className="h-6 w-6" />
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#8a7f96]">Costo</p>
                                                        <div className="text-2xl font-bold text-[#1E293B] flex items-center justify-end">
                                                            <span className="text-sm mr-0.5">$</span>{plan.price}
                                                        </div>
                                                    </div>
                                                </div>
                                                <CardTitle className="text-xl font-serif text-[#1E293B]">{plan.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex-1 flex flex-col pt-4">
                                                <div className="space-y-3 mb-6">
                                                    <div className="flex items-center gap-3 text-sm text-[#475569]">
                                                        <div className="h-5 w-5 rounded-full bg-[#F9FAF7] border border-[#e1f2f3] flex items-center justify-center">
                                                            <Check className="h-3 w-3 text-[#8a7f96]" />
                                                        </div>
                                                        <span className="font-medium">
                                                            {plan.classes === 'Unlimited' ? 'Acceso Ilimitado' : `${plan.classes} clases disponibles`}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-[#475569]">
                                                        <div className="h-5 w-5 rounded-full bg-[#F9FAF7] border border-[#e1f2f3] flex items-center justify-center">
                                                            <Clock className="h-3 w-3 text-[#8a7f96]" />
                                                        </div>
                                                        <span>Vigencia de {plan.days} días</span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-4 flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        className="flex-1 border border-[#e1f2f3] text-[#8a7f96] hover:bg-[#e1f2f3]/30 rounded-xl font-sans uppercase tracking-widest text-[9px] py-6"
                                                        onClick={() => navigate(`/admin/planes/editar/${plan.id}`)}
                                                    >
                                                        <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                className="border border-[#e1f2f3] h-auto px-4 rounded-xl hover:bg-[#e1f2f3]/30"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4 text-[#8a7f96]" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-xl border-[#e1f2f3]">
                                                            <DropdownMenuItem onClick={() => navigate(`/admin/planes/ver/${plan.id}`)} className="cursor-pointer">
                                                                <Eye className="mr-2 h-4 w-4" /> Ver Detalle Ora
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-[#e1f2f3]" />
                                                            <DropdownMenuItem
                                                                className="text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer"
                                                                onClick={() => handleDelete(plan.id)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

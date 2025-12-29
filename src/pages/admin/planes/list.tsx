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
    Eye
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
                            className="bg-[#1E293B] text-white hover:bg-[#334155]"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Plan
                        </Button>
                    </div>

                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-serif">Planes Actuales</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar plan..."
                                        className="pl-8 bg-white border-[#E8F5E9]"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-[#E8F5E9] overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-[#E8F5E9]/30">
                                        <TableRow>
                                            <TableHead className="font-semibold text-[#1E293B]">Nombre del Plan</TableHead>
                                            <TableHead className="font-semibold text-[#1E293B]">Precio</TableHead>
                                            <TableHead className="font-semibold text-[#1E293B]">Clases</TableHead>
                                            <TableHead className="font-semibold text-[#1E293B]">Duración</TableHead>
                                            <TableHead className="text-right font-semibold text-[#1E293B]">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    Cargando planes...
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredPlans.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No se encontraron planes.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredPlans.map((plan) => (
                                                <TableRow key={plan.id} className="hover:bg-[#E8F5E9]/10 transition-colors">
                                                    <TableCell className="font-medium text-[#1E293B]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 bg-[#E8F5E9] rounded-lg text-[#1E293B]">
                                                                <BookOpen className="h-4 w-4" />
                                                            </div>
                                                            {plan.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center text-[#1E293B] font-semibold">
                                                            <DollarSign className="h-3 w-3 mr-0.5" />
                                                            {plan.price}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5">
                                                            <Infinity className="h-3.5 w-3.5 text-muted-foreground" />
                                                            {plan.classes} clases
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {plan.days} días
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40">
                                                                <DropdownMenuLabel>Gestión</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => navigate(`/admin/planes/ver/${plan.id}`)}>
                                                                    <Eye className="mr-2 h-4 w-4" /> Ver Detalle
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => navigate(`/admin/planes/editar/${plan.id}`)}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600"
                                                                    onClick={() => handleDelete(plan.id)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
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

import * as React from "react"
import {
    Search,
    Plus,
    MoreHorizontal,
    Filter,
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
    const [alumnas, setAlumnas] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)

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
        // Query for users with role 'student'
        const q = query(collection(db, "users"), where("role", "==", "student"))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const alumnasList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setAlumnas(alumnasList)
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
                            className="bg-[#1E293B] text-white hover:bg-[#334155]"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nueva Alumna
                        </Button>
                    </div>

                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="font-serif">Gestión de Alumnas</CardTitle>
                            <CardDescription>
                                Listado completo de socias registradas en el sistema.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-4 gap-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar alumna..."
                                        className="pl-8 bg-white border-[#E8F5E9]"
                                    />
                                </div>
                                <Button variant="outline" className="border-[#E8F5E9]">
                                    <Filter className="mr-2 h-4 w-4" /> Filtros
                                </Button>
                            </div>

                            <div className="rounded-md border border-[#E8F5E9] overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-[#E8F5E9]/30">
                                        <TableRow>
                                            <TableHead className="font-semibold text-[#1E293B]">Nombre</TableHead>
                                            <TableHead className="font-semibold text-[#1E293B]">Email</TableHead>
                                            <TableHead className="font-semibold text-[#1E293B]">Teléfono</TableHead>
                                            <TableHead className="font-semibold text-[#1E293B]">Plan</TableHead>
                                            <TableHead className="font-semibold text-[#1E293B]">Estado</TableHead>
                                            <TableHead className="text-right font-semibold text-[#1E293B]">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    Cargando alumnas...
                                                </TableCell>
                                            </TableRow>
                                        ) : alumnas.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    No hay alumnas registradas.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            alumnas.map((alumna) => (
                                                <TableRow key={alumna.id} className="hover:bg-[#E8F5E9]/10">
                                                    <TableCell className="font-medium">{alumna.name}</TableCell>
                                                    <TableCell>{alumna.email}</TableCell>
                                                    <TableCell className="text-muted-foreground">{alumna.phone || "-"}</TableCell>
                                                    <TableCell>
                                                        {alumna.plan || "Sin plan"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-[#E8F5E9] text-[#1E293B]"
                                                        >
                                                            {alumna.status || "Activo"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => navigate(`/admin/alumnas/perfil/${alumna.id}`)}>
                                                                    Ver Perfil
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => navigate(`/admin/alumnas/editar/${alumna.id}`)}>
                                                                    Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => handleDelete(alumna.id)}
                                                                >
                                                                    Eliminar
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

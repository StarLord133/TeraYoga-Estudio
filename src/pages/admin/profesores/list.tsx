import * as React from "react"
import { Plus, Pencil, Trash2, UserPlus, MoreVertical, Shield, ShieldOff, Upload, X, Loader2 } from "lucide-react"
import { db, storage } from "@/lib/firebase"
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { toast } from "sonner"

interface Profesor {
    id: string
    nombre: string
    especialidad: string
    foto_url: string
    bio: string
    activo: boolean
}

export default function ProfesoresList() {
    const [profesores, setProfesores] = React.useState<Profesor[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingProfesor, setEditingProfesor] = React.useState<Profesor | null>(null)
    const [isUploading, setIsUploading] = React.useState(false)
    const [imageFile, setImageFile] = React.useState<File | null>(null)

    const [formData, setFormData] = React.useState({
        nombre: "",
        especialidad: "",
        foto_url: "",
        bio: "",
        activo: true
    })

    React.useEffect(() => {
        const q = query(collection(db, "profesores"), orderBy("nombre", "asc"))
        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Profesor[]
            setProfesores(data)
            setLoading(false)
        })
        return () => unsub()
    }, [])

    const handleSave = async () => {
        if (!formData.nombre || !formData.especialidad) {
            toast.error("Por favor completa los campos obligatorios")
            return
        }

        setIsUploading(true)
        try {
            let finalFotoUrl = formData.foto_url

            // Si hay un archivo nuevo, subirlo
            if (imageFile) {
                const storageRef = ref(storage, `profesores/${Date.now()}_${imageFile.name}`)
                const snapshot = await uploadBytes(storageRef, imageFile)
                finalFotoUrl = await getDownloadURL(snapshot.ref)
            }

            const dataToSave = {
                ...formData,
                foto_url: finalFotoUrl
            }

            if (editingProfesor) {
                await updateDoc(doc(db, "profesores", editingProfesor.id), dataToSave)
                toast.success("Instructor actualizado correctamente")
            } else {
                await addDoc(collection(db, "profesores"), dataToSave)
                toast.success("Instructor agregado correctamente")
            }
            setIsDialogOpen(false)
            resetForm()
        } catch (error) {
            console.error(error)
            toast.error("Error al guardar")
        } finally {
            setIsUploading(false)
        }
    }

    const resetForm = () => {
        setFormData({ nombre: "", especialidad: "", foto_url: "", bio: "", activo: true })
        setEditingProfesor(null)
        setImageFile(null)
    }

    const handleEdit = (prof: Profesor) => {
        setEditingProfesor(prof)
        setFormData({
            nombre: prof.nombre,
            especialidad: prof.especialidad,
            foto_url: prof.foto_url,
            bio: prof.bio,
            activo: prof.activo
        })
        setImageFile(null)
        setIsDialogOpen(true)
    }

    const toggleStatus = async (prof: Profesor) => {
        try {
            await updateDoc(doc(db, "profesores", prof.id), { activo: !prof.activo })
            toast.success(`Instructor ${!prof.activo ? 'activado' : 'desactivado'}`)
        } catch (error) {
            toast.error("Error al cambiar estado")
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este instructor?")) {
            try {
                await deleteDoc(doc(db, "profesores", id))
                toast.success("Instructor eliminado")
            } catch (error) {
                toast.error("Error al eliminar")
            }
        }
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="overflow-x-hidden">
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
                                <BreadcrumbPage>Instructores</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <main className="flex flex-1 flex-col gap-6 p-6 bg-[#F9FAF7]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-[#1E293B]">Instructores</h1>
                            <p className="text-muted-foreground">Gestiona el equipo de TeraYoga.</p>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={(open) => {
                            setIsDialogOpen(open)
                            if (!open) resetForm()
                        }}>
                            <DialogTrigger asChild>
                                <Button className="bg-[#8a7f96] hover:bg-[#6d6379] text-white shadow-sm font-sans uppercase tracking-widest text-[10px] py-6 px-6 rounded-xl">
                                    <Plus className="mr-2 h-4 w-4" /> Nuevo Instructor
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-2xl overflow-x-hidden">
                                <DialogHeader>
                                    <DialogTitle className="font-serif text-xl">
                                        {editingProfesor ? "Editar Instructor" : "Nuevo Instructor"}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Completa la información del instructor. Haz clic en guardar al terminar.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-4">
                                    {/* Foto Upload Area */}
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative group">
                                            <Avatar className="h-24 w-24 border-2 border-[#e1f2f3]">
                                                <AvatarImage
                                                    src={imageFile ? URL.createObjectURL(imageFile) : (formData.foto_url || undefined)}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-[#e1f2f3] text-[#8a7f96] text-2xl font-bold">
                                                    {formData.nombre?.charAt(0) || <Upload className="h-8 w-8" />}
                                                </AvatarFallback>
                                            </Avatar>
                                            {(imageFile || formData.foto_url) && (
                                                <button
                                                    onClick={() => {
                                                        setImageFile(null)
                                                        setFormData({ ...formData, foto_url: "" })
                                                    }}
                                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="w-full">
                                            <Label htmlFor="foto-upload" className="cursor-pointer">
                                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#e1f2f3] rounded-xl p-4 hover:bg-[#e1f2f3]/20 transition-colors">
                                                    <Upload className="h-5 w-5 text-[#8a7f96] mb-2" />
                                                    <span className="text-xs font-bold uppercase tracking-wider text-[#8a7f96]">
                                                        {imageFile ? "Cambiar foto" : "Subir fotografía"}
                                                    </span>
                                                    <Input
                                                        id="foto-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) setImageFile(file)
                                                        }}
                                                    />
                                                </div>
                                            </Label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="nombre" className="text-[10px] font-bold uppercase tracking-widest text-[#8a7f96]">Nombre Completo *</Label>
                                            <Input
                                                id="nombre"
                                                className="bg-[#F9FAF7] border-[#e1f2f3] focus-visible:ring-[#8a7f96]"
                                                value={formData.nombre}
                                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="especialidad" className="text-[10px] font-bold uppercase tracking-widest text-[#8a7f96]">Especialidad *</Label>
                                            <Input
                                                id="especialidad"
                                                className="bg-[#F9FAF7] border-[#e1f2f3] focus-visible:ring-[#8a7f96]"
                                                value={formData.especialidad}
                                                onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                                                placeholder="Ej. Vinyasa Flow"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="bio" className="text-[10px] font-bold uppercase tracking-widest text-[#8a7f96]">Reseña / Bio</Label>
                                        <Textarea
                                            id="bio"
                                            className="bg-[#F9FAF7] border-[#e1f2f3] focus-visible:ring-[#8a7f96] min-h-[100px] resize-none"
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            placeholder="Cuéntanos sobre su trayectoria..."
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={handleSave}
                                        className="bg-[#8a7f96] text-white hover:bg-[#6d6379] min-w-[120px] rounded-xl"
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : "Guardar"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 text-[#8a7f96] animate-spin" />
                        </div>
                    ) : profesores.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border-2 border-dashed border-[#e1f2f3]">
                            <UserPlus className="h-12 w-12 text-[#e1f2f3] mb-4" />
                            <h3 className="text-lg font-serif font-bold text-[#1E293B]">No hay instructores</h3>
                            <p className="text-muted-foreground">Comienza agregando al primero de tu equipo.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {profesores.map((prof) => (
                                <Card key={prof.id} className={`overflow-hidden border-none shadow-sm transition-all hover:shadow-md bg-white rounded-2xl ${!prof.activo ? 'opacity-60 saturate-50' : ''}`}>
                                    <CardHeader className="flex flex-row items-center gap-4 pb-4">
                                        <Avatar className="h-14 w-14 border border-[#e1f2f3]">
                                            <AvatarImage src={prof.foto_url || undefined} alt={prof.nombre} className="object-cover" />
                                            <AvatarFallback className="bg-[#e1f2f3] text-[#8a7f96] font-bold">
                                                {prof.nombre.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg font-serif truncate text-[#1E293B]">{prof.nombre}</CardTitle>
                                            <CardDescription className="truncate text-[10px] font-bold text-[#8a7f96] uppercase tracking-wider">{prof.especialidad}</CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8a7f96] hover:bg-[#e1f2f3]/30">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl border-[#e1f2f3]">
                                                <DropdownMenuItem onClick={() => handleEdit(prof)} className="hover:bg-[#e1f2f3]/20">
                                                    <Pencil className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleStatus(prof)} className="hover:bg-[#e1f2f3]/20">
                                                    {prof.activo ? (
                                                        <><ShieldOff className="mr-2 h-4 w-4 text-orange-400" /> Desactivar</>
                                                    ) : (
                                                        <><Shield className="mr-2 h-4 w-4 text-emerald-500" /> Activar</>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-[#e1f2f3]" />
                                                <DropdownMenuItem onClick={() => handleDelete(prof.id)} className="text-red-500 focus:text-red-500 focus:bg-red-50">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-muted-foreground line-clamp-3 italic mb-4 min-h-[3em]">
                                            "{prof.bio || "Inspirando a través del movimiento y el equilibrio."}"
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <Badge
                                                variant="secondary"
                                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0 ${prof.activo ? "bg-[#e1f2f3] text-[#8a7f96]" : "bg-gray-100 text-gray-400"
                                                    }`}
                                            >
                                                {prof.activo ? "En activo" : "Inactivo"}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

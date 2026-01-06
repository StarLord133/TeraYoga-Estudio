import * as React from "react"
import { db, storage } from "@/lib/firebase"
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Plus, List, LayoutGrid, Edit2, Trash2, AlertCircle, Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
}

interface HorarioSlot {
    id: string
    dia_semana: string
    hora_inicio: string
    hora_fin: string
}

interface Clase {
    id: string
    nombre: string
    descripcion: string
    profesor_id: string
    profesor_nombre?: string
    dificultad: "Baja" | "Media" | "Alta"
    horarios: HorarioSlot[]
    capacidad_max: number
    color: string
    tipo: string
    imagenes: string[]
}

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
const DIFICULTADES = ["Baja", "Media", "Alta"]
const COLORS = [
    { name: "Principal Negro", value: "#000000" },
    { name: "Púrpura Zen", value: "#8a7f96" },
    { name: "Cielo", value: "#e1f2f3" },
    { name: "Salmón", value: "#f5b0a2" },
    { name: "Palo de Rosa", value: "#ffcdcb" },
]

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]

export default function HorariosPage() {
    const [clases, setClases] = React.useState<Clase[]>([])
    const [profesores, setProfesores] = React.useState<Profesor[]>([])
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingClase, setEditingClase] = React.useState<Clase | null>(null)

    const [formData, setFormData] = React.useState({
        nombre: "",
        descripcion: "",
        profesor_id: "",
        dificultad: "Media" as any,
        horarios: [{ id: Math.random().toString(36).substr(2, 9), dia_semana: "Lunes", hora_inicio: "08:00", hora_fin: "09:00" }] as HorarioSlot[],
        capacidad_max: 15,
        color: "#000000",
        tipo: "Yoga",
        imagenes: [] as string[]
    })
    const [imageFiles, setImageFiles] = React.useState<File[]>([])
    const [isUploading, setIsUploading] = React.useState(false)

    React.useEffect(() => {
        const unsubProf = onSnapshot(collection(db, "profesores"), (snapshot) => {
            setProfesores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Profesor[])
        })

        const q = collection(db, "clases")
        const unsubClases = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Clase[]
            setClases(data)
        })

        return () => {
            unsubProf()
            unsubClases()
        }
    }, [])

    const validateOverlap = (newClase: any) => {
        for (const newSlot of newClase.horarios) {
            const conflict = clases.some(c => {
                if (c.id === editingClase?.id) return false
                if (c.profesor_id === newClase.profesor_id && c.horarios) {
                    return c.horarios.some(existingSlot => {
                        if (existingSlot.dia_semana === newSlot.dia_semana) {
                            const start1 = timeToMinutes(existingSlot.hora_inicio)
                            const end1 = timeToMinutes(existingSlot.hora_fin)
                            const start2 = timeToMinutes(newSlot.hora_inicio)
                            const end2 = timeToMinutes(newSlot.hora_fin)
                            return (start2 < end1 && end2 > start1)
                        }
                        return false
                    })
                }
                return false
            })
            if (conflict) return true
        }
        return false
    }

    const timeToMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number)
        return h * 60 + m
    }

    const handleSave = async () => {
        if (!formData.nombre || !formData.profesor_id || formData.horarios.some(h => !h.hora_inicio || !h.hora_fin)) {
            toast.error("Por favor completa los campos obligatorios")
            return
        }

        const overlap = validateOverlap(formData)
        if (overlap) {
            toast.error(`Conflicto de horario: El profesor ya tiene otra clase asignada en uno de estos horarios.`)
            return
        }

        const selectedProf = profesores.find(p => p.id === formData.profesor_id)

        setIsUploading(true)
        try {
            let currentUrls = [...formData.imagenes]

            const uploadPromises = imageFiles.map(async (file) => {
                const storageRef = ref(storage, `clases/${Date.now()}_${file.name}`)
                const snapshot = await uploadBytes(storageRef, file)
                return getDownloadURL(snapshot.ref)
            })

            const newUrls = await Promise.all(uploadPromises)
            const allUrls = [...currentUrls, ...newUrls].slice(0, 3)

            const dataToSave = {
                ...formData,
                imagenes: allUrls,
                profesor_nombre: selectedProf?.nombre || "Sin profesor"
            }

            if (editingClase) {
                await updateDoc(doc(db, "clases", editingClase.id), dataToSave)
                toast.success("Clase actualizada")
            } else {
                await addDoc(collection(db, "clases"), dataToSave)
                toast.success("Clase creada")
            }
            setIsDialogOpen(false)
            resetForm()
        } catch (error) {
            console.error(error)
            toast.error("Error al guardar o subir imágenes")
        } finally {
            setIsUploading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            nombre: "",
            descripcion: "",
            profesor_id: "",
            dificultad: "Media",
            horarios: [{ id: Math.random().toString(36).substr(2, 9), dia_semana: "Lunes", hora_inicio: "08:00", hora_fin: "09:00" }],
            capacidad_max: 15,
            color: "#000000",
            tipo: "Yoga",
            imagenes: []
        })
        setImageFiles([])
        setEditingClase(null)
    }

    const handleEdit = (clase: Clase) => {
        setEditingClase(clase)
        setFormData({
            nombre: clase.nombre,
            descripcion: clase.descripcion,
            profesor_id: clase.profesor_id,
            dificultad: clase.dificultad,
            horarios: clase.horarios,
            capacidad_max: clase.capacidad_max,
            color: clase.color,
            tipo: clase.tipo || "Yoga",
            imagenes: clase.imagenes || []
        })
        setImageFiles([])
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm("¿Eliminar esta clase del horario?")) {
            await deleteDoc(doc(db, "clases", id))
            toast.success("Clase eliminada")
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
                                <BreadcrumbPage>Horarios</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <main className="flex flex-1 flex-col gap-6 p-6 bg-[#ffffff]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-display font-bold text-[#000000]">Horarios y Clases</h1>
                            <p className="text-muted-foreground">Configura el calendario semanal del estudio.</p>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={(open) => {
                            setIsDialogOpen(open)
                            if (!open) resetForm()
                        }}>
                            <DialogTrigger asChild>
                                <Button className="bg-[#000000] hover:bg-[#334155]">
                                    <Plus className="mr-2 h-4 w-4" /> Nueva Clase
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] w-[95vw] max-w-full p-4 md:p-6 overflow-x-hidden">
                                <DialogHeader>
                                    <DialogTitle>{editingClase ? "Editar Clase" : "Programar Nueva Clase"}</DialogTitle>
                                    <DialogDescription>
                                        Define los detalles para la clase del horario.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden px-1 custom-scrollbar">
                                    <div className="grid gap-4 py-4 overflow-x-hidden">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Nombre de la Clase</Label>
                                                <Input
                                                    value={formData.nombre}
                                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                                    placeholder="Ej. Yoga para principiantes"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Profesor</Label>
                                                <Select
                                                    value={formData.profesor_id}
                                                    onValueChange={(val) => setFormData({ ...formData, profesor_id: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {profesores.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Tipo de Clase</Label>
                                            <Input
                                                value={formData.tipo}
                                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                                placeholder="Ej. Hatha, Vinyasa..."
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Imágenes de la Clase (Máx. 3)</Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {formData.imagenes.map((url, i) => (
                                                    <div key={url} className="relative aspect-square rounded-xl overflow-hidden group">
                                                        <img src={url} className="w-full h-full object-cover" alt="Preview" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, imagenes: formData.imagenes.filter((_, idx) => idx !== i) })}
                                                            className="absolute top-1 right-1 bg-black/60 p-1.5 rounded-full text-white shadow-md z-10"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}

                                                {imageFiles.map((file, i) => (
                                                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-dashed border-[#8a7f96]/30">
                                                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-50" alt="New" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setImageFiles(imageFiles.filter((_, idx) => idx !== i))}
                                                            className="absolute top-1 right-1 bg-black/60 p-1.5 rounded-full text-white shadow-md z-10"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}

                                                {(formData.imagenes.length + imageFiles.length) < 3 && (
                                                    <label className="aspect-square rounded-xl border-2 border-dashed border-[#e1f2f3] hover:border-[#8a7f96] flex flex-col items-center justify-center cursor-pointer transition-colors text-muted-foreground hover:text-[#8a7f96]">
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const files = Array.from(e.target.files || [])
                                                                const total = formData.imagenes.length + imageFiles.length + files.length
                                                                if (total > 3) {
                                                                    toast.error("Máximo 3 imágenes")
                                                                    return
                                                                }
                                                                setImageFiles([...imageFiles, ...files])
                                                            }}
                                                        />
                                                        <Upload className="h-5 w-5 mb-1" />
                                                        <span className="text-[10px] font-bold">Subir</span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Descripción Breve</Label>
                                            <Textarea
                                                placeholder="Describre los beneficios y de qué trata la clase..."
                                                className="h-[120px] resize-none overflow-y-auto custom-scrollbar"
                                                value={formData.descripcion}
                                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Días y Horarios</Label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-[10px] border-[#e1f2f3]"
                                                    onClick={() => setFormData({
                                                        ...formData,
                                                        horarios: [...formData.horarios, { id: Math.random().toString(36).substr(2, 9), dia_semana: "Lunes", hora_inicio: "08:00", hora_fin: "09:00" }]
                                                    })}
                                                >
                                                    <Plus className="mr-1 h-3 w-3" /> Agregar día
                                                </Button>
                                            </div>
                                            <div className="pr-2 space-y-3">
                                                {formData.horarios.map((slot, index) => (
                                                    <div key={slot.id} className="flex flex-col gap-4 bg-[#ffffff] p-4 rounded-xl border border-[#e1f2f3] md:grid md:grid-cols-12 md:gap-3 md:items-end">
                                                        <div className="md:col-span-3 grid gap-1.5">
                                                            <Label className="text-[10px]">Día</Label>
                                                            <Select
                                                                value={slot.dia_semana}
                                                                onValueChange={(val) => {
                                                                    const newHorarios = [...formData.horarios]
                                                                    newHorarios[index].dia_semana = val
                                                                    setFormData({ ...formData, horarios: newHorarios })
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-10 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {DIAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="md:col-span-4 grid gap-1.5">
                                                            <Label className="text-[10px]">Inicio (24h)</Label>
                                                            <div className="flex gap-2">
                                                                <Select
                                                                    value={slot.hora_inicio.split(':')[0]}
                                                                    onValueChange={(val) => {
                                                                        const newHorarios = [...formData.horarios]
                                                                        const [, min] = slot.hora_inicio.split(':')
                                                                        newHorarios[index].hora_inicio = `${val}:${min || '00'}`
                                                                        setFormData({ ...formData, horarios: newHorarios })
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="h-10 flex-1 text-xs px-2">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent position="popper" className="min-w-[70px] max-h-[200px]">
                                                                        {HOURS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                                <Select
                                                                    value={slot.hora_inicio.split(':')[1]}
                                                                    onValueChange={(val) => {
                                                                        const newHorarios = [...formData.horarios]
                                                                        const [hour] = slot.hora_inicio.split(':')
                                                                        newHorarios[index].hora_inicio = `${hour || '08'}:${val}`
                                                                        setFormData({ ...formData, horarios: newHorarios })
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="h-10 flex-1 text-xs px-2">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent position="popper" className="min-w-[70px] max-h-[200px]">
                                                                        {MINUTES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <div className="md:col-span-4 grid gap-1.5">
                                                            <Label className="text-[10px]">Fin (24h)</Label>
                                                            <div className="flex gap-2">
                                                                <Select
                                                                    value={slot.hora_fin.split(':')[0]}
                                                                    onValueChange={(val) => {
                                                                        const newHorarios = [...formData.horarios]
                                                                        const [, min] = slot.hora_fin.split(':')
                                                                        newHorarios[index].hora_fin = `${val}:${min || '00'}`
                                                                        setFormData({ ...formData, horarios: newHorarios })
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="h-10 flex-1 text-xs px-2">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent position="popper" className="min-w-[70px] max-h-[200px]">
                                                                        {HOURS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                                <Select
                                                                    value={slot.hora_fin.split(':')[1]}
                                                                    onValueChange={(val) => {
                                                                        const newHorarios = [...formData.horarios]
                                                                        const [hour] = slot.hora_fin.split(':')
                                                                        newHorarios[index].hora_fin = `${hour || '09'}:${val}`
                                                                        setFormData({ ...formData, horarios: newHorarios })
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="h-10 flex-1 text-xs px-2">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent position="popper" className="min-w-[70px] max-h-[200px]">
                                                                        {MINUTES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <div className="md:col-span-1 flex justify-end md:pb-0.5">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-10 w-full md:w-10 text-red-500 hover:text-red-600 hover:bg-red-50 bg-red-50/50 md:bg-transparent"
                                                                disabled={formData.horarios.length === 1}
                                                                onClick={() => {
                                                                    const newHorarios = formData.horarios.filter((_, i) => i !== index)
                                                                    setFormData({ ...formData, horarios: newHorarios })
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Dificultad</Label>
                                                <Select
                                                    value={formData.dificultad}
                                                    onValueChange={(val) => setFormData({ ...formData, dificultad: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {DIFICULTADES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Cupo Máx.</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.capacidad_max}
                                                    onChange={(e) => setFormData({ ...formData, capacidad_max: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Color UI</Label>
                                                <Select
                                                    value={formData.color}
                                                    onValueChange={(val) => setFormData({ ...formData, color: val })}
                                                >
                                                    <SelectTrigger>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: formData.color }} />
                                                            <SelectValue />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {COLORS.map(c => (
                                                            <SelectItem key={c.value} value={c.value}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.value }} />
                                                                    {c.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleSave} className="bg-[#000000] min-w-[140px]" disabled={isUploading}>
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Subiendo...
                                            </>
                                        ) : "Guardar Clase"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Tabs defaultValue="list" className="w-full">
                        <div className="flex items-center justify-between mb-4">
                            <TabsList className="bg-white border border-[#e1f2f3]">
                                <TabsTrigger value="list" className="data-[state=active]:bg-[#000000] data-[state=active]:text-white">
                                    <List className="mr-2 h-4 w-4" /> Vista Lista
                                </TabsTrigger>
                                <TabsTrigger value="grid" className="data-[state=active]:bg-[#000000] data-[state=active]:text-white">
                                    <LayoutGrid className="mr-2 h-4 w-4" /> Cuadrícula Semanal
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="list" className="space-y-6">
                            {DIAS.map(dia => {
                                const slotsDia: { clase: Clase, slot: HorarioSlot }[] = []
                                clases.forEach(c => {
                                    c.horarios?.forEach(slot => {
                                        if (slot.dia_semana === dia) {
                                            slotsDia.push({ clase: c, slot })
                                        }
                                    })
                                })

                                slotsDia.sort((a, b) => timeToMinutes(a.slot.hora_inicio) - timeToMinutes(b.slot.hora_inicio))

                                return (
                                    <div key={dia} className="space-y-3">
                                        <h3 className="font-display font-bold text-lg text-[#000000] border-l-4 border-[#8a7f96] pl-3 py-1">
                                            {dia}
                                        </h3>
                                        {slotsDia.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic pl-7">No hay clases programadas.</p>
                                        ) : (
                                            <div className="grid gap-3 pl-4">
                                                {slotsDia.map(({ clase, slot }) => (
                                                    <div key={`${clase.id}-${slot.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-[#e1f2f3] gap-4">
                                                        <div className="flex items-center gap-4 sm:gap-6">
                                                            <div className="text-center min-w-[60px] sm:min-w-[70px]">
                                                                <p className="text-sm font-bold text-[#000000]">{slot.hora_inicio}</p>
                                                                <p className="text-[10px] text-muted-foreground">a {slot.hora_fin}</p>
                                                            </div>
                                                            <div className="h-10 w-[2px] shrink-0" style={{ backgroundColor: clase.color }} />
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-bold text-[#000000] flex flex-wrap items-center gap-2 mb-1">
                                                                    <span className="leading-tight">{clase.nombre}</span>
                                                                    <Badge variant="outline" className="text-[9px] h-4 py-0 font-medium border-[#e1f2f3] shrink-0">
                                                                        {clase.dificultad}
                                                                    </Badge>
                                                                </h4>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Instructor: <span className="text-[#8a7f96] font-medium">{clase.profesor_nombre}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 sm:gap-1 justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                                                            <Button onClick={() => handleEdit(clase)} variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button onClick={() => handleDelete(clase.id)} variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </TabsContent>

                        <TabsContent value="grid">
                            <Card className="border-none shadow-sm overflow-hidden bg-white">
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-8 border-b border-[#e1f2f3]">
                                        <div className="p-4 border-r border-[#e1f2f3] bg-[#ffffff] h-12" />
                                        {DIAS.map(d => (
                                            <div key={d} className="p-2 text-center border-r last:border-0 border-[#e1f2f3] bg-[#ffffff] font-bold text-[10px] text-[#000000] uppercase tracking-wider h-12 flex items-center justify-center">
                                                {d.slice(0, 3)}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="relative min-h-[600px]">
                                        {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map(h => (
                                            <div key={h} className="grid grid-cols-8 border-b border-[#F1F5F9] h-[60px]">
                                                <div className="p-2 border-r border-[#e1f2f3] text-[10px] text-muted-foreground font-medium text-right pr-4">
                                                    {h}:00
                                                </div>
                                                {[...Array(7)].map((_, i) => <div key={i} className="border-r last:border-0 border-[#F1F5F9]" />)}
                                            </div>
                                        ))}

                                        {(() => {
                                            const allSlots: any[] = []
                                            clases.forEach(clase => {
                                                (clase.horarios || []).forEach(slot => {
                                                    const dayIdx = DIAS.indexOf(slot.dia_semana)
                                                    if (dayIdx === -1) return
                                                    const startMin = timeToMinutes(slot.hora_inicio)
                                                    const endMin = timeToMinutes(slot.hora_fin)
                                                    if (startMin >= 21 * 60 || endMin <= 8 * 60) return
                                                    allSlots.push({ clase, slot, dayIdx, startMin, endMin })
                                                })
                                            })

                                            const positionedSlots: any[] = []
                                            for (let d = 0; d < 7; d++) {
                                                const daySlots = allSlots.filter(s => s.dayIdx === d)
                                                    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)

                                                if (daySlots.length === 0) continue

                                                const columns: any[][] = []
                                                daySlots.forEach(slot => {
                                                    let placed = false
                                                    for (let i = 0; i < columns.length; i++) {
                                                        const lastInCol = columns[i][columns[i].length - 1]
                                                        if (lastInCol.endMin <= slot.startMin) {
                                                            columns[i].push(slot)
                                                            slot.colIdx = i
                                                            placed = true
                                                            break
                                                        }
                                                    }
                                                    if (!placed) {
                                                        slot.colIdx = columns.length
                                                        columns.push([slot])
                                                    }
                                                })

                                                daySlots.forEach(slot => {
                                                    const startBase = 8 * 60
                                                    const top = ((slot.startMin - startBase) / 60) * 60
                                                    const height = ((slot.endMin - slot.startMin) / 60) * 60

                                                    const dayWidth = 100 / 8
                                                    const slotWidth = dayWidth / columns.length
                                                    const left = (dayWidth * (slot.dayIdx + 1)) + (slot.colIdx * slotWidth)

                                                    positionedSlots.push({
                                                        ...slot,
                                                        top,
                                                        height,
                                                        left,
                                                        width: slotWidth
                                                    })
                                                })
                                            }

                                            return positionedSlots.map(ps => (
                                                <div
                                                    key={`${ps.clase.id}-${ps.slot.id}`}
                                                    onClick={() => handleEdit(ps.clase)}
                                                    className="absolute p-0.5 transition-transform hover:scale-[1.02] cursor-pointer"
                                                    style={{
                                                        top: `${ps.top}px`,
                                                        left: `${ps.left}%`,
                                                        height: `${ps.height}px`,
                                                        width: `${ps.width}%`,
                                                    }}
                                                >
                                                    <div
                                                        className="h-full w-full rounded-lg text-white p-1.5 shadow-sm flex flex-col justify-between overflow-hidden"
                                                        style={{ backgroundColor: ps.clase.color || "#000000" }}
                                                    >
                                                        <div className="text-[8px] font-bold leading-tight uppercase truncate">{ps.clase.nombre}</div>
                                                        <div className="text-[7px] opacity-80 truncate">{ps.clase.profesor_nombre}</div>
                                                    </div>
                                                </div>
                                            ))
                                        })()}
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-white p-3 rounded-lg border border-[#e1f2f3] shadow-sm">
                                <AlertCircle className="h-3 w-3 text-[#8a7f96]" />
                                <span>Haz clic en un bloque para editar la clase. Solo se muestran clases entre 08:00 y 21:00.</span>
                            </div>
                        </TabsContent>
                    </Tabs>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

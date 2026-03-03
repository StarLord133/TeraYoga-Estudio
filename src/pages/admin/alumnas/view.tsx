import * as React from "react"
import {
    MoreHorizontal,
    ArrowLeft,
    Calendar,
    Phone,
    Mail,
    BadgeCheck,
    Clock,
    Minus,
    Plus,
    RefreshCw,
    CheckCircle2,
    CreditCard,
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
import { doc, updateDoc, collection, query, where, onSnapshot, orderBy, limit, Timestamp, getDocs, deleteDoc } from "firebase/firestore"
import { db, functions } from "@/lib/firebase"
import { httpsCallable } from "firebase/functions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

export default function AlumnaProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = React.useState(true)
    const [alumna, setAlumna] = React.useState<any>(null)
    const [studentData, setStudentData] = React.useState<any>(null)
    const [asistencias, setAsistencias] = React.useState<any[]>([])
    const [plans, setPlans] = React.useState<any[]>([])
    const [isUpdatingPlan, setIsUpdatingPlan] = React.useState(false)
    const [selectedPlanId, setSelectedPlanId] = React.useState("")
    const [isPaidOnRenewal, setIsPaidOnRenewal] = React.useState(true)
    const [isConfirmingPayment, setIsConfirmingPayment] = React.useState(false)
    const [isSendingEmail, setIsSendingEmail] = React.useState(false)

    const handleResendEmail = async () => {
        if (!alumna?.email || !alumna?.name) return;
        setIsSendingEmail(true);
        try {
            const resendFn = httpsCallable(functions, "resendWelcomeEmail");
            await resendFn({ email: alumna.email, displayName: alumna.name });
            toast.success(`Correo de registro reenviado a ${alumna.email}`);
        } catch (error: any) {
            console.error("Error al reenviar correo:", error);
            toast.error("Error al reenviar el correo: " + error.message);
        } finally {
            setIsSendingEmail(false);
        }
    };

    React.useEffect(() => {
        async function fetchData() {
            if (!id) return;
            try {
                // Fetch Plans for the update modal
                const plansSnap = await getDocs(collection(db, "plans"));
                setPlans(plansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching plans:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();

        // Real-time user data
        const unsubUser = onSnapshot(doc(db, "users", id!), (docSnap) => {
            if (docSnap.exists()) {
                setAlumna({ id: docSnap.id, ...docSnap.data() });
            }
        });

        // Real-time student data
        const unsubStudent = onSnapshot(doc(db, "students", id!), (docSnap) => {
            if (docSnap.exists()) {
                setStudentData(docSnap.data());
            }
        });

        // Real-time attendance
        const q = query(
            collection(db, "asistencias"),
            where("student_id", "==", id),
            orderBy("fecha", "desc"),
            limit(10)
        );
        const unsubAsistencias = onSnapshot(q, (snapshot) => {
            setAsistencias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubUser();
            unsubStudent();
            unsubAsistencias();
        };
    }, [id]);

    const handleUpdateClasses = async (amount: number) => {
        if (!id || !studentData) return;
        try {
            const newCount = (studentData.clases_restantes || 0) + amount;
            if (newCount < 0) return;
            await updateDoc(doc(db, "students", id), {
                clases_restantes: newCount
            });
            toast.success("Clases actualizadas correctamente");
        } catch (error) {
            console.error("Error updating classes:", error);
            toast.error("Error al actualizar clases");
        }
    };

    const handleUpdatePlan = async () => {
        if (!id || !selectedPlanId) return;
        try {
            const plan = plans.find(p => p.id === selectedPlanId);
            if (!plan) return;

            const days = plan.days || 30;
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + days);

            await updateDoc(doc(db, "students", id), {
                clases_restantes: plan.classes || 0,
                current_plan_id: selectedPlanId,
                fecha_expiracion: Timestamp.fromDate(expirationDate),
                payment_status: isPaidOnRenewal ? "pagado" : "pendiente"
            });

            await updateDoc(doc(db, "users", id), {
                plan: plan.name
            });

            setIsUpdatingPlan(false);
            toast.success(`Plan actualizado a ${plan.name}`);
        } catch (error) {
            console.error("Error updating plan:", error);
            toast.error("Error al actualizar el plan");
        }
    };

    const handleUpdateExpiration = async (days: number) => {
        if (!id || !studentData?.fecha_expiracion) return;
        try {
            const currentDate = studentData.fecha_expiracion.toDate();
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + days);

            await updateDoc(doc(db, "students", id), {
                fecha_expiracion: Timestamp.fromDate(newDate)
            });
            toast.success(`Fecha de vencimiento actualizada`);
        } catch (error) {
            console.error("Error updating expiration:", error);
            toast.error("Error al actualizar vencimiento");
        }
    };

    const handleConfirmPendingPayment = async () => {
        if (!id) return;
        try {
            await updateDoc(doc(db, "students", id), {
                payment_status: "pagado"
            });
            setIsConfirmingPayment(false);
            toast.success("Pago confirmado correctamente");
        } catch (error) {
            console.error("Error confirming payment:", error);
            toast.error("Error al confirmar el pago");
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        if (!confirm("¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.")) {
            return;
        }

        try {
            await deleteDoc(doc(db, "users", id));
            await deleteDoc(doc(db, "students", id));
            toast.success("Alumna eliminada correctamente");
            navigate("/admin/alumnas");
        } catch (error) {
            console.error("Error deleting alumna:", error);
            toast.error("No se pudo eliminar el registro");
        }
    };

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
                            className="rounded-full bg-white shadow-sm border border-[#e1f2f3] hover:bg-[#e1f2f3]/50"
                        >
                            <ArrowLeft className="h-4 w-4 text-[#8a7f96]" />
                        </Button>
                        <h1 className="text-3xl font-serif font-bold text-[#1E293B]">Detalle de Alumna</h1>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Profile Info Card */}
                        <Card className="md:col-span-1 border-none shadow-sm overflow-hidden bg-white rounded-2xl">
                            <div className="h-24 bg-[#8a7f96] relative">
                                <div className="absolute -bottom-12 left-6">
                                    <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                                        <AvatarImage src={alumna.avatar} className="object-cover" />
                                        <AvatarFallback className="bg-[#e1f2f3] text-[#8a7f96] text-2xl font-bold">
                                            {alumna.name?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                            <CardContent className="pt-16 pb-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-2xl font-bold text-[#1E293B] font-serif">{alumna.name}</h2>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="bg-[#e1f2f3] text-[#8a7f96] hover:bg-[#e1f2f3] border-none font-bold text-[10px] uppercase tracking-wider">
                                                {alumna.status || "Activo"}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className={`font-bold text-[10px] uppercase tracking-wider border-none ${studentData?.payment_status === 'pagado'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {studentData?.payment_status === 'pagado' ? 'Pagado' : 'Pendiente de Pago'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8a7f96] hover:bg-[#e1f2f3]/50 rounded-lg">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl border-[#e1f2f3]">
                                            <DropdownMenuItem
                                                className="text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer font-medium"
                                                onClick={handleDelete}
                                            >
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4 text-[#8a7f96]" />
                                        <span>{alumna.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Phone className="h-4 w-4 text-[#8a7f96]" />
                                        <span>{alumna.phone || "No registrado"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4 text-[#8a7f96]" />
                                        <span>Miembro desde: {alumna.createdAt?.toDate ? alumna.createdAt.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-3">
                                    <Button
                                        className="w-full bg-[#8a7f96] text-white hover:bg-[#6d6379] rounded-xl font-sans uppercase tracking-[0.2em] text-[10px] py-6"
                                        onClick={() => navigate(`/admin/alumnas/editar/${alumna.id}`)}
                                    >
                                        Editar Perfil
                                    </Button>
                                    <Button
                                        className="w-full bg-[#e1f2f3] text-[#8a7f96] hover:bg-[#8a7f96]/10 rounded-xl font-sans uppercase tracking-[0.2em] text-[10px] py-6 font-bold"
                                        onClick={() => {
                                            setSelectedPlanId(studentData?.current_plan_id || "");
                                            setIsPaidOnRenewal(true);
                                            setIsUpdatingPlan(true);
                                        }}
                                    >
                                        Renueva Plan
                                    </Button>
                                    {studentData?.payment_status !== 'pagado' && (
                                        <Button
                                            className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-sans uppercase tracking-[0.2em] text-[10px] py-6 font-bold"
                                            variant="ghost"
                                            onClick={() => setIsConfirmingPayment(true)}
                                        >
                                            <CreditCard className="h-3.5 w-3.5 mr-2" /> Realizar Pago Pendiente
                                        </Button>
                                    )}
                                    {alumna?.status === "Pendiente registro" && (
                                        <Button
                                            className="w-full bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-xl font-sans uppercase tracking-[0.2em] text-[10px] py-6 font-bold"
                                            onClick={handleResendEmail}
                                            disabled={isSendingEmail}
                                        >
                                            {isSendingEmail ? "Enviando..." : "Reenviar Correo de Registro"}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats and Plan details */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Card className="border-none shadow-sm bg-white rounded-2xl">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center uppercase tracking-wider text-[10px] font-bold text-muted-foreground">
                                            <BadgeCheck className="h-3.5 w-3.5 mr-1.5 text-[#8a7f96]" /> Plan Actual
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-serif text-[#1E293B]">{alumna.plan || "Sin plan"}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="space-y-3">
                                                <div className="text-5xl font-bold text-[#1E293B]">{studentData?.clases_restantes || 0}</div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-full border-[#e1f2f3] bg-white text-[#8a7f96] hover:bg-[#e1f2f3]/30"
                                                        onClick={() => handleUpdateClasses(-1)}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-full border-[#e1f2f3] bg-white text-[#8a7f96] hover:bg-[#e1f2f3]/30"
                                                        onClick={() => handleUpdateClasses(1)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-6 pt-4">
                                                <div className="text-xs text-muted-foreground font-medium">clases restantes</div>
                                                <Button
                                                    size="sm"
                                                    className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest bg-[#e1f2f3] text-[#8a7f96] hover:bg-[#8a7f96]/10 rounded-xl"
                                                    onClick={() => {
                                                        setSelectedPlanId(studentData?.current_plan_id || "");
                                                        setIsUpdatingPlan(true);
                                                    }}
                                                >
                                                    <RefreshCw className="h-3.5 w-3.5 mr-2" /> RENUEVA PLAN
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-sm bg-white rounded-2xl">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center uppercase tracking-wider text-[10px] font-bold text-muted-foreground">
                                            <Clock className="h-3.5 w-3.5 mr-1.5 text-[#8a7f96]" /> Vencimiento
                                        </CardDescription>
                                        <CardTitle className="text-2xl font-serif text-[#1E293B]">
                                            {studentData?.fecha_expiracion?.toDate ?
                                                studentData.fecha_expiracion.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) :
                                                'Sin fecha'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="space-y-3">
                                                <div className="text-5xl font-bold text-[#1E293B]">
                                                    {studentData?.fecha_expiracion?.toDate ?
                                                        Math.ceil((studentData.fecha_expiracion.toDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-full border-[#e1f2f3] bg-white text-[#8a7f96] hover:bg-[#e1f2f3]/30"
                                                        onClick={() => handleUpdateExpiration(-1)}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-full border-[#e1f2f3] bg-white text-[#8a7f96] hover:bg-[#e1f2f3]/30"
                                                        onClick={() => handleUpdateExpiration(1)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground font-medium pt-8">días restantes</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Section for recent Check-ins (Dummy for now) */}
                            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="font-serif text-[#1E293B]">Asistencias Recientes</CardTitle>
                                    <CardDescription>Registro de las últimas clases tomadas.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {asistencias.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground italic border-2 border-dashed border-[#e1f2f3] rounded-2xl bg-[#F9FAF7]">
                                                No hay asistencias registradas aún.
                                            </div>
                                        ) : (
                                            asistencias.map((asistencia) => {
                                                const date = asistencia.fecha?.toDate ? asistencia.fecha.toDate() : new Date();
                                                return (
                                                    <div key={asistencia.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#e1f2f3] hover:bg-[#e1f2f3]/10 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-[#e1f2f3] flex items-center justify-center">
                                                                <CheckCircle2 className="h-5 w-5 text-[#8a7f96]" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-bold text-[#1E293B]">Check-in Exitoso</p>
                                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                                                                    {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="border-[#e1f2f3] text-[#8a7f96] bg-[#e1f2f3]/20 text-[9px] uppercase font-bold px-3 py-1 rounded-lg">
                                                            Validado
                                                        </Badge>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>

                {/* Modal para actualizar Plan */}
                <Dialog open={isUpdatingPlan} onOpenChange={setIsUpdatingPlan}>
                    <DialogContent className="sm:max-w-md bg-white rounded-[2.5rem] border-none shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="font-serif text-3xl text-[#1E293B]">Actualizar Plan</DialogTitle>
                            <DialogDescription className="text-[#475569]">
                                Selecciona el nuevo plan para {alumna.name}. Esto reseteará sus clases y fecha de vencimiento según el plan elegido.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-6">
                            <div className="flex justify-between items-center p-4 bg-[#e1f2f3]/20 rounded-2xl border border-[#e1f2f3]">
                                <span className="text-xs font-bold text-[#8a7f96] uppercase tracking-widest">Plan Actual</span>
                                <span className="text-base font-serif font-bold text-[#1E293B]">{alumna.plan || "Ninguno"}</span>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-[#8a7f96] uppercase tracking-[0.2em] ml-1">Nuevo Plan / Renovación</label>
                                <Select onValueChange={setSelectedPlanId} defaultValue={studentData?.current_plan_id}>
                                    <SelectTrigger className="w-full bg-white border-[#e1f2f3] h-14 rounded-2xl text-[#1E293B] focus:ring-[#8a7f96]">
                                        <SelectValue placeholder="Selecciona un plan" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-[#e1f2f3] rounded-2xl">
                                        {plans.map((plan) => (
                                            <SelectItem key={plan.id} value={plan.id} className="cursor-pointer focus:bg-[#e1f2f3]/50">
                                                {plan.name} ({plan.classes} clases)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-3 p-4 bg-[#F9FAF7] rounded-2xl border border-[#e1f2f3]">
                                <Checkbox
                                    id="paid"
                                    checked={isPaidOnRenewal}
                                    onCheckedChange={(checked) => setIsPaidOnRenewal(!!checked)}
                                    className="border-[#8a7f96] data-[state=checked]:bg-[#8a7f96] data-[state=checked]:text-white h-6 w-6 rounded-lg"
                                />
                                <label htmlFor="paid" className="text-sm font-bold text-[#1E293B] cursor-pointer">
                                    Marcar como Pagado
                                </label>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-3">
                            <Button variant="ghost" onClick={() => setIsUpdatingPlan(false)} className="rounded-2xl h-11 px-6 font-bold uppercase tracking-widest text-[10px] text-[#475569]">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleUpdatePlan}
                                className="bg-[#8a7f96] text-white hover:bg-[#6d6379] rounded-2xl h-11 px-8 font-bold uppercase tracking-widest text-[10px] shadow-sm"
                                disabled={!selectedPlanId}
                            >
                                Confirmar Actualización
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal para confirmar pago pendiente */}
                <Dialog open={isConfirmingPayment} onOpenChange={setIsConfirmingPayment}>
                    <DialogContent className="sm:max-w-[400px] bg-white rounded-[2.5rem] border-none shadow-2xl p-8">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CreditCard className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="space-y-2">
                                <DialogTitle className="font-serif text-2xl text-[#1E293B]">¿Realizar Pago Pendiente?</DialogTitle>
                                <DialogDescription className="text-[#475569]">
                                    Se marcará el plan actual de {alumna.name} como pagado.
                                </DialogDescription>
                            </div>
                            <div className="flex gap-4 w-full pt-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsConfirmingPayment(false)}
                                    className="flex-1 rounded-2xl h-12 font-bold uppercase tracking-widest text-[10px] text-[#475569] bg-[#F9FAF7]"
                                >
                                    No
                                </Button>
                                <Button
                                    onClick={handleConfirmPendingPayment}
                                    className="flex-1 bg-green-600 text-white hover:bg-green-700 rounded-2xl h-12 font-bold uppercase tracking-widest text-[10px] shadow-md transition-all active:scale-95"
                                >
                                    Sí, Confirmar
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </SidebarProvider>
    )
}

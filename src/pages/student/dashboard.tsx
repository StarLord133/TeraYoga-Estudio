import * as React from "react"
import {
    Calendar,
    Clock,
    User,
    LogOut
} from "lucide-react"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useStudentData } from "@/hooks/use-student-data"
import { Loader2, CheckCircle2 } from "lucide-react"
import { auth } from "@/lib/firebase"
import { useNavigate } from "react-router-dom"
import StudentQRCard from "@/components/StudentQRCard"

export default function StudentDashboard() {
    const navigate = useNavigate()
    const { student, user, attendance, loading } = useStudentData()
    const [activeTab, setActiveTab] = React.useState<'home' | 'schedule' | 'history'>('home')

    async function handleLogout() {
        try {
            await auth.signOut()
            navigate("/login")
        } catch (error) {
            console.error("Error signing out:", error)
        }
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#ffffff]">
                <Loader2 className="h-10 w-10 text-[#8a7f96] animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#ffffff] pb-24 pt-6 px-4 md:px-0 flex flex-col items-center">
            {/* Header Alumna */}
            <header className="w-full max-w-md flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-[#e1f2f3] shadow-sm">
                        <AvatarImage src={user?.photoURL} />
                        <AvatarFallback className="bg-[#8a7f96] text-white font-bold">
                            {user?.name?.charAt(0) || "Y"}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-[#1e293b] leading-tight">
                            Hola, {user?.name?.split(' ')[0] || "Namasté"}
                        </h2>
                        <p className="text-[10px] text-[#8a7f96] font-bold uppercase tracking-[0.2em]">{user?.plan || "Membresía Tera"}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleLogout}
                        className="p-3 rounded-2xl bg-white shadow-sm border border-[#e1f2f3] text-[#1e293b]/40 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </header>

            <div className="w-full max-w-md space-y-8">
                {activeTab === 'home' && (
                    <>
                        <div className="w-full">
                            <StudentQRCard />
                        </div>

                        {/* Plan Expiration Section */}
                        <Card className="border-none shadow-[0_20px_50px_rgba(138,127,150,0.1)] bg-white overflow-hidden rounded-[2.5rem]">
                            <div className="h-1.5 w-full bg-[#8a7f96]" />
                            <CardContent className="p-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-bold text-[#8a7f96] uppercase tracking-widest">Estado del Plan</h3>
                                    <Badge variant="secondary" className="bg-[#e1f2f3] text-[#8a7f96] font-bold border-none px-3 py-1 rounded-full text-[10px]">
                                        {student?.clases_restantes ?? 0} clases restantes
                                    </Badge>
                                </div>
                                <Progress value={((student?.clases_restantes ?? 0) / 12) * 100} className="h-2.5 bg-[#e1f2f3]" />
                                <div className="mt-5 flex items-center justify-between">
                                    <p className="text-[11px] text-[#1e293b]/50 font-medium flex items-center">
                                        <Calendar className="h-3.5 w-3.5 mr-2 text-[#8a7f96]" />
                                        {student?.fecha_expiracion
                                            ? `Expira el ${new Date(student.fecha_expiracion.seconds * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                                            : "Sin fecha de expiración"}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-serif font-bold text-[#1e293b]">Tus Asistencias</h3>
                            <Badge className="bg-[#e1f2f3] text-[#8a7f96] border-none font-bold uppercase tracking-wider text-[9px] px-3 py-1">
                                Total: {attendance.length}
                            </Badge>
                        </div>
                        <div className="space-y-4">
                            {attendance.length === 0 ? (
                                <div className="p-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-[#e1f2f3]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a7f96]">No hay registros aún</p>
                                </div>
                            ) : (
                                attendance.map((record) => (
                                    <AttendanceItem key={record.id} record={record} />
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Nav Bar */}
            <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-lg border-t border-[#e1f2f3] flex items-center justify-around px-8 z-50 pb-4">
                <NavIcon
                    icon={<User className="h-6 w-6" />}
                    active={activeTab === 'home'}
                    onClick={() => setActiveTab('home')}
                />
                <NavIcon
                    icon={<Clock className="h-6 w-6" />}
                    active={activeTab === 'history'}
                    onClick={() => setActiveTab('history')}
                />
            </nav>
        </div>
    )
}


function NavIcon({ icon, active = false, onClick }: { icon: React.ReactNode, active?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`p-3 rounded-xl transition-all duration-300 ${active ? 'bg-[#8a7f96] text-white shadow-lg shadow-[#8a7f96]/20' : 'text-[#8a7f96]/40 hover:text-[#8a7f96]'}`}
        >
            {icon}
        </button>
    )
}

function AttendanceItem({ record }: { record: any }) {
    const date = record.fecha?.toDate ? record.fecha.toDate() : new Date();

    return (
        <div className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-[#e1f2f3] hover:shadow-lg transition-all transform hover:-translate-y-0.5 group">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#e1f2f3] flex items-center justify-center group-hover:bg-[#8a7f96] transition-colors">
                    <CheckCircle2 className="h-6 w-6 text-[#8a7f96] group-hover:text-white" />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold text-[#1e293b]">Check-in Exitoso</p>
                    <p className="text-[10px] text-[#8a7f96] font-bold uppercase tracking-widest mt-1">
                        {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
            <Badge variant="outline" className="border-[#e1f2f3] text-[#8a7f96] bg-[#e1f2f3]/30 text-[9px] uppercase font-black px-3 py-1 rounded-full">
                Validado
            </Badge>
        </div>
    );
}

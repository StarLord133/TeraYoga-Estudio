import * as React from "react"
import {
    QrCode,
    Calendar,
    Clock,
    User,
    TrendingUp,
    ChevronRight,
    Bell,
    LogOut
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { auth } from "@/lib/firebase"
import { useNavigate } from "react-router-dom"

export default function StudentDashboard() {
    const navigate = useNavigate()

    async function handleLogout() {
        try {
            await auth.signOut()
            navigate("/login")
        } catch (error) {
            console.error("Error signing out:", error)
        }
    }

    return (
        <div className="min-h-screen bg-[#F9FAF7] pb-20 pt-6 px-4 md:px-0 flex flex-col items-center">
            {/* Header Alumna */}
            <header className="w-full max-w-md flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-[#E8F5E9]">
                        <AvatarImage src="/avatars/student.jpg" />
                        <AvatarFallback className="bg-[#1E293B] text-white">AG</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-xl font-serif font-bold text-[#1E293B]">Hola, Ana</h2>
                        <p className="text-xs text-muted-foreground font-sans">Namasté 🙏</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="relative p-2 rounded-full bg-white shadow-sm border border-[#E8F5E9]">
                        <Bell className="h-5 w-5 text-[#1E293B]" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full bg-white shadow-sm border border-[#E8F5E9] hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {/* Wallet Style membership Card */}
            <div className="w-full max-w-md perspective-1000">
                <Card className="bg-[#1E293B] text-white border-none shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8F5E9]/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#E8F5E9]/5 rounded-full -ml-12 -mb-12 blur-xl" />

                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl font-serif">Membresía Tera</CardTitle>
                                <CardDescription className="text-[#E8F5E9]/60 font-sans">Plan Trimestral Premium</CardDescription>
                            </div>
                            <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md">
                                <TrendingUp className="h-6 w-6 text-[#E8F5E9]" />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex flex-col items-center py-6">
                        <div className="bg-white p-4 rounded-2xl shadow-inner mb-6 transition-transform group-hover:scale-105 duration-500">
                            {/* Placeholder para QR */}
                            <div className="h-40 w-40 bg-[#F9FAF7] rounded-xl flex items-center justify-center border-2 border-dashed border-[#1E293B]/10">
                                <QrCode className="h-32 w-32 text-[#1E293B]" />
                            </div>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-widest text-[#E8F5E9]/40">Clases Restantes</p>
                                    <p className="text-3xl font-bold font-serif">08 <span className="text-sm font-sans font-normal text-[#E8F5E9]/60">/ 12</span></p>
                                </div>
                                <Badge variant="outline" className="border-[#E8F5E9]/30 text-[#E8F5E9] font-sans">
                                    Socia Gold
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Plan Expiration Section */}
            <div className="w-full max-w-md mt-6 space-y-4">
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-semibold text-[#1E293B] font-sans">Días para expirar</h3>
                            <span className="text-sm font-bold text-[#1E293B]">12 días</span>
                        </div>
                        <Progress value={70} className="h-2 bg-[#E8F5E9]" />
                        <p className="text-[11px] text-muted-foreground mt-3 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" /> Expira el 15 de Abril, 2024
                        </p>
                    </CardContent>
                </Card>

                {/* Today's Classes */}
                <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-serif font-bold text-[#1E293B]">Clases de Hoy</h3>
                        <button className="text-xs text-[#1E293B]/60 font-sans hover:underline flex items-center">
                            Ver todas <ChevronRight className="h-3 w-3 ml-1" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <ClassItem
                            time="08:00 AM"
                            title="Vinyasa Flow"
                            instructor="Elena R."
                            level="Intermedio"
                        />
                        <ClassItem
                            time="18:30 PM"
                            title="Hatha Yoga"
                            instructor="Marcos P."
                            level="Todos los niveles"
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Nav Bar */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E8F5E9] flex items-center justify-around px-6 z-50">
                <NavIcon icon={<User className="h-6 w-6" />} active />
                <NavIcon icon={<Calendar className="h-6 w-6" />} />
                <NavIcon icon={<Clock className="h-6 w-6" />} />
            </nav>
        </div>
    )
}

function ClassItem({ time, title, instructor, level }: {
    time: string;
    title: string;
    instructor: string;
    level: string
}) {
    return (
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-[#E8F5E9] hover:border-[#1E293B]/20 transition-all cursor-pointer group">
            <div className="text-center min-w-[60px]">
                <p className="text-xs font-bold text-[#1E293B]">{time.split(' ')[0]}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{time.split(' ')[1]}</p>
            </div>
            <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold text-[#1E293B] group-hover:text-[#1E293B] transition-colors">{title}</h4>
                <p className="text-xs text-muted-foreground">👤 {instructor} • {level}</p>
            </div>
            <Badge variant="secondary" className="bg-[#E8F5E9] text-[#1E293B] text-[10px] font-sans">
                Reservar
            </Badge>
        </div>
    )
}

function NavIcon({ icon, active = false }: { icon: React.ReactNode, active?: boolean }) {
    return (
        <button className={`p-2 rounded-xl transition-all ${active ? 'bg-[#1E293B] text-white shadow-lg shadow-[#1E293B]/20' : 'text-[#1E293B]/40 hover:text-[#1E293B]'}`}>
            {icon}
        </button>
    )
}

import * as React from "react"
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion"
import {
    Instagram,
    Facebook,
    Mail,
    ArrowRight,
    Star,
    Check,
    MapPin,
    Phone,
    Clock,
    ChevronLeft,
    ChevronRight,
    X,
    User,
    MessageCircle
} from "lucide-react"
import logo from "@/assets/imagotipo-purpura.png"
import logoHorizontalNegro from "@/assets/LOGOTIPO-HOR-NEGRO.png"
import imgEstudio1 from "@/assets/imagen1-estudio.jpg"
import imgEstudio2 from "@/assets/imagen2-estudio.jpeg"
import { Link, useNavigate } from "react-router-dom"
import { db } from "@/lib/firebase"
import { collection, onSnapshot } from "firebase/firestore"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Hero3D } from "@/components/Hero3D"

// --- Components ---

const SectionTitle = ({ title, subtitle, centered = true }: { title: string, subtitle?: string, centered?: boolean }) => (
    <div className={`mb-12 ${centered ? 'text-center' : ''}`}>
        <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display text-[#000000] mb-4"
        >
            {title}
        </motion.h2>
        {subtitle && (
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
                {subtitle}
            </motion.p>
        )}
        <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: 80 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className={`h-1 bg-[#8a7f96] mt-4 ${centered ? 'mx-auto' : ''}`}
        />
        <div className={`mt-1 h-0.5 w-12 bg-black/10 ${centered ? 'mx-auto' : ''}`} />
    </div>
)

const Nav = () => {
    const [isScrolled, setIsScrolled] = React.useState(false)
    const navigate = useNavigate()

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"
                }`}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                    <img src={logo} alt="TeraYoga" className="h-10 w-auto" />
                    <span className="text-2xl font-display text-black tracking-tight">TeraYoga Estudio</span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    {["Inicio", "Estudio", "Clases", "Planes", "Ubicación", "Contacto"].map((item) => (
                        <a
                            key={item}
                            href={`#${item === "Ubicación" ? "ubicacion" : item.toLowerCase()}`}
                            className="text-sm font-medium text-black/60 hover:text-[#8a7f96] transition-colors"
                        >
                            {item}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        size="sm"
                        className="bg-black text-white hover:bg-[#8a7f96] rounded-full px-6 transition-colors shadow-sm"
                        onClick={() => navigate("/login")}
                    >
                        Soy estudiante
                    </Button>
                </div>
            </div>
        </motion.nav>
    )
}

// --- Main Page ---

export default function LandingPage() {
    const { scrollYProgress } = useScroll()
    const springScrollProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

    const yAbout = useTransform(scrollYProgress, [0, 1], [0, 100])

    const WHATSAPP_NUMBER = "+524499992298" // Formato: código de país + número sin espacios ni signos
    const WHATSAPP_MESSAGE = "Hola TeraYoga, me gustaría pedir informes sobre las clases y membresías."

    interface Plan {
        id: string;
        name: string;
        price: number;
        classes: number;
        days: number;
    }

    const [classesData, setClassesData] = React.useState<any[]>([])
    const [plansData, setPlansData] = React.useState<Plan[]>([])

    React.useEffect(() => {
        const q = collection(db, "clases")
        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const clase = doc.data()
                // Formatear los horarios para la UI (Día HH:MM)
                const formattedSchedule = (clase.horarios || []).map((slot: any) =>
                    `${slot.dia_semana} ${slot.hora_inicio}`
                )

                return {
                    id: doc.id,
                    title: clase.nombre,
                    type: clase.tipo || "Yoga",
                    description: (clase.descripcion || "").slice(0, 100) + (clase.descripcion?.length > 100 ? "..." : ""),
                    fullDescription: clase.descripcion,
                    images: (clase.imagenes && clase.imagenes.length > 0)
                        ? clase.imagenes
                        : [clase.imagen_url || "https://images.unsplash.com/photo-1599447421416-3414500d18a5?q=80&w=600&auto=format&fit=crop"],
                    instructor: clase.profesor_nombre || "TeraYoga Staff",
                    schedule: formattedSchedule,
                    rawHorarios: clase.horarios || [],
                    color: clase.color || "#000000",
                    difficulty: clase.dificultad || "Media"
                }
            })
            setClassesData(data)
        })
        return () => unsub()
    }, [])

    React.useEffect(() => {
        const q = collection(db, "plans")
        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Plan[]
            // Sort by price.
            setPlansData([...data].sort((a, b) => (a.price || 0) - (b.price || 0)))
        })
        return () => unsub()
    }, [])

    const [selectedClass, setSelectedClass] = React.useState<any>(null)
    const scrollRef = React.useRef<HTMLDivElement>(null)

    // Bloquear scroll del body cuando el modal está abierto
    React.useEffect(() => {
        if (selectedClass) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [selectedClass])

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current
            const scrollTo = direction === 'left'
                ? scrollLeft - clientWidth / 1.5
                : scrollLeft + clientWidth / 1.5
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
        }
    }

    return (
        <div className="relative min-h-screen bg-[#ffffff] overflow-x-hidden selection:bg-[#e1f2f3] selection:text-[#000000]">
            {/* Scroll Progress Indicator */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-[#8a7f96] z-[100] origin-left"
                style={{ scaleX: springScrollProgress }}
            />

            <Nav />

            {/* --- Hero 3D Section con Contenido para Fondo Claro --- */}
            <Hero3D>
                <div className="text-left w-full h-full flex flex-col justify-center relative z-50">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.1 }
                            }
                        }}
                    >
                        <motion.h1
                            variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
                            className="text-6xl md:text-8xl font-display font-bold !text-black mb-6 leading-tight"
                        >
                            Namasté en <br />
                            <span className="font-script font-normal !text-[#8a7f96]">TeraYoga</span>
                        </motion.h1>

                        <motion.p
                            variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
                            className="text-xl md:text-2xl !text-black/60 mb-10 max-w-xl font-arabic font-light leading-relaxed"
                        >
                            Un espacio sagrado para reconectar con tu esencia a través del movimiento y el silencio. Descubre la paz que ya habita en ti.
                        </motion.p>

                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            className="flex flex-col sm:flex-row items-start gap-4"
                        >
                            <Button
                                size="lg"
                                className="group bg-[#8a7f96] hover:bg-[#000000] text-white rounded-full px-10 py-7 text-lg shadow-xl"
                                onClick={() => document.getElementById('horarios')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Ver horario <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform ml-2" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => document.getElementById('estudio')?.scrollIntoView({ behavior: 'smooth' })}
                                className="bg-transparent border-[#000000]/20 !text-[#000000] hover:bg-[#8a7f96]/10 rounded-full px-10 py-7 text-lg"
                            >
                                Conocer el Estudio
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </Hero3D>

            {/* --- About Section --- */}
            <section id="estudio" className="py-24 md:py-32">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="order-2 md:order-1"
                        >
                            <SectionTitle
                                centered={false}
                                title="Más que un estudio, una comunidad."
                                subtitle="En TeraYoga creemos que el bienestar no es un destino, sino el camino diario de regreso a nosotros mismos."
                            />
                            <div className="space-y-6 text-[#1e293b]/70 leading-relaxed">
                                <p>
                                    Nuestras instalaciones están diseñadas con materiales orgánicos y luz natural para crear una atmósfera de paz inmediata. Cada rincón ha sido pensado para el silencio y la introspección.
                                </p>
                                <div className="grid grid-cols-2 gap-8 py-4">
                                    <div>
                                        <h4 className="text-3xl font-display font-bold text-[#8a7f96]">+200</h4>
                                        <p className="text-sm font-medium">Alumnas Felices</p>
                                    </div>
                                    <div>
                                        <h4 className="text-3xl font-display font-bold text-[#8a7f96]">12</h4>
                                        <p className="text-sm font-medium">Instructores Certificados</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div className="relative order-1 md:order-2 h-[500px] md:h-[600px]">
                            <motion.div
                                style={{ y: yAbout }}
                                className="absolute top-0 right-0 w-4/5 h-4/5 rounded-3xl overflow-hidden shadow-2xl z-10"
                            >
                                <img
                                    src={imgEstudio1}
                                    alt="Estudio"
                                    className="w-full h-full object-cover"
                                />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                                className="absolute bottom-0 left-0 w-3/5 h-3/5 rounded-3xl overflow-hidden shadow-xl z-20 border-8 border-[#ffffff]"
                            >
                                <img
                                    src={imgEstudio2}
                                    alt="Yoga practice"
                                    className="w-full h-full object-cover"
                                />
                            </motion.div>
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#e1f2f3] rounded-full blur-3xl opacity-50 z-0" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- Classes Section --- */}
            <section id="clases" className="py-24 bg-[#e1f2f3]/30 relative overflow-hidden">
                <div className="container mx-auto px-6">
                    <SectionTitle
                        title="Nuestras Clases"
                        subtitle="Disciplinas adaptadas a tu nivel y ritmo de vida."
                    />

                    <div className="relative w-full">
                        <div
                            ref={scrollRef}
                            style={{
                                maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
                                WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 96%, transparent)'
                            }}
                            className="flex gap-4 overflow-x-auto md:overflow-hidden pb-8 pt-4 scroll-smooth scrollbar-hide snap-x snap-mandatory px-8 -mx-8"
                        >
                            <AnimatePresence mode="popLayout">
                                {classesData.map((cls) => (
                                    <motion.div
                                        layout
                                        key={cls.title}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4 }}
                                        className="min-w-[300px] md:min-w-[400px] snap-center"
                                    >
                                        <Card className="group overflow-hidden border-none shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white border border-[#e1f2f3]/50">
                                            <div
                                                onClick={() => setSelectedClass(cls)}
                                                className="relative h-52 overflow-hidden cursor-pointer"
                                            >
                                                <motion.img
                                                    whileHover={{ scale: 1.1, filter: "brightness(0.9)" }}
                                                    src={cls.images[0]}
                                                    alt={cls.title}
                                                    className="w-full h-full object-cover transition-all duration-700"
                                                />
                                                <div className="absolute top-5 left-5">
                                                    <Badge className="bg-white/90 backdrop-blur-md text-[#000000] border-none font-bold uppercase tracking-wider text-[10px] px-3 py-1 shadow-sm">
                                                        {cls.type}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardHeader className="text-left p-7 pb-4">
                                                <CardTitle className="font-display text-2xl mb-1 text-[#000000]">{cls.title}</CardTitle>
                                                <CardDescription className="line-clamp-2 text-[#1e293b]/60 font-sans text-sm leading-relaxed">
                                                    {cls.description}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="text-left px-7 py-0 mb-4">
                                                <div className="flex items-center gap-2 text-xs font-medium text-[#8a7f96]">
                                                    <div className="h-7 w-7 rounded-full bg-[#ffffff] flex items-center justify-center border border-[#e1f2f3]">
                                                        <Star className="h-3 w-3 fill-[#8a7f96]" />
                                                    </div>
                                                    <span>Instructor: <span className="text-[#8a7f96]">{cls.instructor}</span></span>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="px-7 pb-7">
                                                <Button
                                                    onClick={() => setSelectedClass(cls)}
                                                    variant="outline"
                                                    className="w-full py-5 rounded-xl border-[#e1f2f3] hover:bg-[#8a7f96] hover:text-white transition-all flex justify-between group/btn font-bold shadow-sm text-sm"
                                                >
                                                    Ver detalles <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Navigation Arrows - Moved to Bottom Right */}
                        <div className="hidden md:flex justify-end gap-3 mt-4 px-4 pb-8">
                            <button
                                onClick={() => scroll('left')}
                                className="h-14 w-14 rounded-full border-2 border-[#e1f2f3] flex items-center justify-center text-[#000000] bg-white hover:bg-[#000000] hover:text-white hover:border-[#000000] transition-all shadow-md group"
                            >
                                <ChevronLeft className="h-7 w-7 group-active:scale-90 transition-transform" />
                            </button>
                            <button
                                onClick={() => scroll('right')}
                                className="h-14 w-14 rounded-full border-2 border-[#e1f2f3] flex items-center justify-center text-[#000000] bg-white hover:bg-[#000000] hover:text-white hover:border-[#000000] transition-all shadow-md group"
                            >
                                <ChevronRight className="h-7 w-7 group-active:scale-90 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Class Detail Modal/Overlay --- */}
                <AnimatePresence>
                    {selectedClass && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedClass(null)}
                                className="absolute inset-0 bg-[#000000]/60 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white w-full max-w-4xl rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl relative z-10 max-h-[90vh] md:max-h-[850px] flex flex-col"
                            >
                                <button
                                    onClick={() => setSelectedClass(null)}
                                    className="absolute top-4 right-4 md:top-6 md:right-6 h-10 w-10 md:h-12 md:w-12 bg-white/90 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center text-[#000000] hover:scale-110 transition-transform z-30 border border-[#e1f2f3]"
                                >
                                    <X className="h-5 w-5 md:h-6 md:w-6" />
                                </button>

                                <div className="flex flex-col md:flex-row md:h-[600px] items-stretch overflow-y-auto md:overflow-hidden custom-scrollbar-purple">
                                    {/* --- Image Carousel --- */}
                                    <div className="md:w-1/2 h-72 md:h-full relative overflow-hidden group">
                                        <ImageCarousel images={selectedClass.images} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/40 to-transparent pointer-events-none" />
                                    </div>

                                    {/* --- Content --- */}
                                    <div className="md:w-1/2 p-8 md:p-10 flex flex-col bg-white overflow-y-auto custom-scrollbar-purple">
                                        <Badge className="bg-[#e1f2f3] text-[#8a7f96] border-none font-bold uppercase tracking-[0.2em] text-[10px] mb-4 w-fit px-4 py-1.5 shadow-sm">
                                            {selectedClass.type}
                                        </Badge>
                                        <h3 className="text-3xl md:text-4xl font-display font-bold text-[#000000] mb-4 leading-tight">{selectedClass.title}</h3>
                                        <div className="w-12 h-1 bg-[#8a7f96] mb-6" />

                                        <p className="text-[#000000]/70 text-base md:text-lg leading-relaxed mb-6 font-sans italic">
                                            "{selectedClass.fullDescription}"
                                        </p>

                                        <div className="space-y-4 mt-auto">
                                            <div className="flex items-center gap-3">
                                                <div className="h-px flex-1 bg-[#e1f2f3]" />
                                                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8a7f96]">Horarios Semanales</h4>
                                                <div className="h-px flex-1 bg-[#e1f2f3]" />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedClass.schedule.map((slot: string) => (
                                                    <div key={slot} className="bg-[#ffffff] border border-[#e1f2f3] px-4 py-2 rounded-xl text-xs md:text-sm font-bold text-[#000000] shadow-sm hover:border-[#8a7f96] transition-colors">
                                                        {slot}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </section>

            {/* --- Schedule Section (Mockup) --- */}
            <section id="horarios" className="py-24 bg-[#ffffff]">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                        <div className="md:w-1/3">
                            <SectionTitle
                                centered={false}
                                title="Tu Ritmo, Tu Espacio."
                                subtitle="Diseñamos horarios que se adaptan a tu vida, desde el primer aliento de la mañana hasta el silencio del atardecer."
                            />
                            <div className="space-y-4 mt-8">
                                <div className="flex items-center gap-3 text-[#000000]/70">
                                    <div className="h-2 w-2 rounded-full bg-[#8a7f96]" />
                                    <span className="text-sm font-medium">Clases desde las 6:30 AM</span>
                                </div>
                                <div className="flex items-center gap-3 text-[#000000]/70">
                                    <div className="h-2 w-2 rounded-full bg-[#8a7f96]" />
                                    <span className="text-sm font-medium">Sesiones 100% presenciales</span>
                                </div>
                                <div className="flex items-center gap-3 text-[#000000]/70">
                                    <div className="h-2 w-2 rounded-full bg-[#8a7f96]" />
                                    <span className="text-sm font-medium">Grupos reducidos para atención personalizada</span>
                                </div>
                            </div>
                        </div>

                        <div className="md:w-2/3 w-full">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="bg-[#ffffff] rounded-[2.5rem] p-4 md:p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] border border-[#e1f2f3] relative overflow-hidden group/container"
                            >
                                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#e1f2f3] rounded-full blur-[100px] opacity-30 group-hover/container:opacity-50 transition-opacity" />
                                <Tabs defaultValue="L" className="w-full relative z-10">
                                    <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 scrollbar-hide">
                                        <TabsList className="bg-slate-50/50 p-1.5 rounded-[1.2rem] border border-[#e1f2f3] h-auto flex gap-1">
                                            {['L', 'M', 'X', 'J', 'V', 'S'].map((day) => (
                                                <TabsTrigger
                                                    key={day}
                                                    value={day}
                                                    className="rounded-[1rem] w-10 h-10 md:w-12 md:h-12 p-0 flex items-center justify-center data-[state=active]:bg-[#8a7f96] data-[state=active]:text-white font-black text-xs md:text-sm transition-all hover:bg-white hover:text-[#8a7f96] data-[state=active]:shadow-[0_8px_20px_-6px_rgba(138,127,150,0.6)] active:scale-95 border border-transparent data-[state=active]:border-[#8a7f96]/20"
                                                >
                                                    {day}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                        <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#8a7f96]">
                                            <div className="relative">
                                                <div className="h-2 w-2 rounded-full bg-green-400" />
                                                <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-400 animate-ping opacity-75" />
                                            </div>
                                            Horario en Vivo
                                        </div>
                                    </div>

                                    {['L', 'M', 'X', 'J', 'V', 'S'].map((day) => {
                                        const dayName = {
                                            'L': 'Lunes',
                                            'M': 'Martes',
                                            'X': 'Miércoles',
                                            'J': 'Jueves',
                                            'V': 'Viernes',
                                            'S': 'Sábado'
                                        }[day];

                                        const dayClasses = classesData.flatMap(clase =>
                                            (clase.rawHorarios || [])
                                                .filter((slot: any) => slot.dia_semana === dayName)
                                                .map((slot: any) => ({
                                                    time: slot.hora_inicio,
                                                    endTime: slot.hora_fin,
                                                    title: clase.title,
                                                    instructor: clase.instructor,
                                                    color: clase.color,
                                                    difficulty: clase.difficulty
                                                }))
                                        ).sort((a, b) => a.time.localeCompare(b.time));

                                        return (
                                            <TabsContent key={day} value={day} className="mt-0">
                                                <div className="space-y-3">
                                                    {dayClasses.length > 0 ? (
                                                        dayClasses.map((item, idx) => (
                                                            <ScheduleItem
                                                                key={`${item.title}-${idx}`}
                                                                index={idx}
                                                                time={item.time}
                                                                endTime={item.endTime}
                                                                title={item.title}
                                                                instructor={item.instructor}
                                                                color={item.color}
                                                                difficulty={item.difficulty}
                                                            />
                                                        ))
                                                    ) : (
                                                        <div className="py-12 text-center">
                                                            <p className="text-muted-foreground text-sm italic">
                                                                No hay clases programadas.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </TabsContent>
                                        );
                                    })}
                                </Tabs>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Pricing Section --- */}
            <section id="planes" className="py-24 bg-[#8a7f96] text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-black/10" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-display font-bold mb-4 text-white"
                        >
                            Encuentra tu Plan
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-white/80 text-lg font-arabic"
                        >
                            Invierte en lo más valioso que tienes: tu paz interior.
                        </motion.p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {plansData.length > 0 ? (
                            plansData.map((plan, index) => (
                                <PricingCard
                                    key={plan.id}
                                    name={plan.name}
                                    price={plan.price.toLocaleString()}
                                    classes={plan.classes}
                                    days={plan.days}
                                    popular={index === 1} // Mark the middle one as popular if there are 3, or just the second one
                                    features={[
                                        `${plan.classes} Clases incluidas`,
                                        `Vigencia de ${plan.days} días`,
                                        "Acceso a App de Alumnas"]}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <p className="text-white/60 italic">Cargando planes...</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* --- Location Section --- */}
            <section id="ubicacion" className="py-24 bg-[#f8fafc]">
                <div className="container mx-auto px-6">
                    <SectionTitle
                        title="Encuéntranos"
                        subtitle="Un refugio de paz cerca de ti. Ven a conocernos y respira profundo."
                    />

                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-[3rem] p-4 shadow-2xl overflow-hidden border border-[#e1f2f3] grid md:grid-cols-2 gap-8"
                        >
                            {/* Map Side */}
                            <div className="h-[400px] md:h-auto min-h-[450px] rounded-[2.5rem] overflow-hidden relative group">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3701.3787723226303!2d-102.3407567!3d21.8831487!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8429ef977ba2ad5f%3A0xbab1e3add6f67de7!2zVGVyYSBZb2dhIEVzdHVkaW86IFRlcmFww6l1dGljbywgUmVzdGF1cmF0aXZvIHkgTWVkaXRhY2nDs24!5e0!3m2!1ses-419!2smx!4v1704573100000!5m2!1ses-419!2smx"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="filter grayscale-[0.2] contrast-[1.1] hover:grayscale-0 transition-all duration-700"
                                />

                            </div>

                            {/* Info Side */}
                            <div className="flex flex-col justify-center p-8 md:p-12">
                                <h3 className="text-3xl font-display font-bold text-black mb-6">Tu camino comienza aquí</h3>
                                <p className="text-black/60 mb-8 leading-relaxed">
                                    Estamos ubicados en una de las zonas más tranquilas de la ciudad, facilitando tu desconexión desde que llegas.
                                </p>

                                <div className="space-y-6 mb-10">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-[#e1f2f3] flex items-center justify-center text-[#8a7f96] shrink-0">
                                            <MapPin className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-[#8a7f96] mb-1">Dirección</p>
                                            <p className="text-black font-medium leading-tight">
                                                Av. Camino de Santiago 126,<br />
                                                La Rioja, 20326 Aguascalientes, Ags.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-[#e1f2f3] flex items-center justify-center text-[#8a7f96] shrink-0">
                                            <Clock className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-[#8a7f96] mb-1">Horarios de Atención</p>
                                            <p className="text-black font-medium">Lunes a Viernes: 6:00 AM - 8:00 PM</p>
                                            <p className="text-black/60 text-sm">Sábados: 8:00 AM - 12:00 PM</p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=TeraYoga+Estudio+Aguascalientes+Av.+Camino+de+Santiago+126`, '_blank')}
                                    className="w-full bg-black text-white hover:bg-[#8a7f96] rounded-2xl py-8 text-lg shadow-xl transition-all group"
                                >
                                    Abrir en Google Maps <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- Contact Section --- */}
            <section id="contacto" className="py-24">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto bg-white rounded-[3rem] shadow-xl overflow-hidden flex flex-col md:flex-row">
                        <div className="md:w-1/2 p-12 md:p-16 bg-[#ffffff]">
                            <SectionTitle centered={false} title="Hablemos." subtitle="¿Tienes dudas? Estamos aquí para acompañarte." />
                            <div className="space-y-8 mt-8">
                                <ContactItem icon={<Mail />} title="Correo Electrónico" value="terayogaestudio@gmail.com" />
                                <ContactItem icon={<Phone />} title="WhatsApp" value="+52 449 999 2298" />
                                <ContactItem icon={<MapPin />} title="Ubicación" value="Av. Camino de Santiago 126, La Rioja, 20326 Aguascalientes, Ags." />
                                <ContactItem icon={<Clock />} title="Horarios" value="Lun - Vie: 06:00 - 20:00" />
                            </div>
                        </div>
                        <div className="md:w-1/2 p-12 md:p-16 flex flex-col justify-center items-center text-center bg-[#f8fafc]/50">
                            <div className="max-w-sm space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-display font-bold text-black">¿Lista para comenzar?</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Haz clic en el botón de abajo para platicar directamente con nosotros. Resolveremos todas tus dudas sobre horarios, niveles y cómo iniciar tu camino en TeraYoga.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`, '_blank')}
                                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl py-8 text-xl shadow-lg transition-all flex items-center justify-center gap-3 group"
                                >
                                    <MessageCircle className="h-6 w-6 fill-white" />
                                    Contactar por WhatsApp
                                </Button>
                                <p className="text-[10px] uppercase tracking-widest text-[#8a7f96] font-bold">
                                    Respuesta inmediata en horario de oficina
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="bg-[#8a7f96] text-white pt-20 pb-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-white/10" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
                        <div className="max-w-xs space-y-6">
                            <div className="flex items-center gap-3">
                                <img src={logoHorizontalNegro} alt="TeraYoga" className="h-15 w-auto" />
                            </div>
                            <p className="text-white/80 text-sm leading-relaxed font-sans italic">
                                Un faro de luz y equilibrio en el corazón de la ciudad. Únete a nuestra vibración y transforma tu presente.
                            </p>
                            <div className="flex gap-4">
                                <SocialIcon icon={<Instagram />} href="https://www.instagram.com/terayoga_estudio?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" />
                                <SocialIcon icon={<Facebook />} href="https://www.facebook.com/terayogaestudio" />
                                <SocialIcon icon={<Mail />} href="mailto:terayogaestudio@gmail.com" />
                            </div>
                        </div>
                        <div className="text-left md:text-right">
                            <h4 className="font-bold mb-6 text-white uppercase tracking-widest text-xs">Navegación</h4>
                            <ul className="flex flex-col md:flex-row gap-6 md:gap-8 text-white/70 text-sm font-sans">
                                <li><a href="#estudio" className="hover:text-white transition-colors">El Estudio</a></li>
                                <li><a href="#clases" className="hover:text-white transition-colors">Nuestras Clases</a></li>
                                <li><a href="#planes" className="hover:text-white transition-colors">Planes</a></li>
                                <li><a href="#ubicacion" className="hover:text-white transition-colors">Ubicación</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-white/20 pt-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-white/60 text-[10px] uppercase tracking-widest">© {new Date().getFullYear()} TeraYoga Estudio. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

// --- Helper Components ---

const PricingCard = ({ name, price, classes, days, popular, features }: { name: string, price: string, classes: string | number, days: number, popular?: boolean, features: string[] }) => (
    <motion.div
        whileHover={{ y: -10 }}
        className={`relative p-8 rounded-[2.5rem] flex flex-col h-full bg-[#334155]/30 border-2 ${popular ? 'border-[#e1f2f3]' : 'border-white/10'} backdrop-blur-sm`}
    >
        {popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#e1f2f3] text-[#000000] text-[10px] font-bold uppercase tracking-widest rounded-full">
                Más Popular
            </div>
        )}
        <div className="text-center mb-8">
            <h3 className={`text-xl font-bold mb-4 ${popular ? 'text-[#e1f2f3]' : 'text-white'}`}>{name}</h3>
            <div className="flex items-baseline justify-center gap-1">
                <span className="text-sm text-white/50">$</span>
                <span className="text-5xl font-bold">{price}</span>
            </div>
            <p className="text-white/50 text-xs mt-2">{classes} clases • {days} días de vigencia</p>
        </div>
        <div className="space-y-4 flex-1 mb-10">
            {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className={`h-4 w-4 ${popular ? 'text-[#e1f2f3]' : 'text-white/30'}`} /> {f}
                </div>
            ))}
        </div>
        <Button
            className={`w-full py-6 rounded-2xl font-bold transition-all ${popular ? 'bg-black text-white hover:bg-white hover:text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
            Elegir Plan
        </Button>
    </motion.div>
)

const ContactItem = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) => (
    <div className="flex items-start gap-4">
        <div className="p-3 bg-white shadow-sm rounded-xl text-[#8a7f96]">
            {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
        </div>
        <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-[#8a7f96] mb-1">{title}</h5>
            <p className="text-[#000000] font-medium">{value}</p>
        </div>
    </div>
)

const SocialIcon = ({ icon, href }: { icon: React.ReactNode, href: string }) => (
    <a href={href} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-[#8a7f96] transition-all text-white" target="_blank" rel="noopener noreferrer">
        {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
    </a>
)

const ScheduleItem = ({ time, endTime, title, instructor, color, difficulty, index = 0 }: {
    time: string,
    endTime: string,
    title: string,
    instructor: string,
    color: string,
    difficulty: string,
    last?: boolean,
    index?: number
}) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.05 }}
        className="flex items-center justify-between p-5 bg-white rounded-[2rem] shadow-sm border border-[#e1f2f3] group/card transition-all hover:shadow-xl hover:-translate-y-1 hover:border-[#8a7f96]/30"
    >
        <div className="flex items-center gap-6">
            <div className="text-center min-w-[75px] bg-[#f8fafc] px-3 py-2 rounded-2xl group-hover/card:bg-[#e1f2f3] transition-colors">
                <p className="text-sm font-black text-[#000000] tracking-tight">{time}</p>
                <div className="h-px w-4 bg-[#8a7f96]/30 mx-auto my-1" />
                <p className="text-[10px] font-bold text-[#8a7f96]">a {endTime}</p>
            </div>
            <div
                className="h-10 w-[3px] rounded-full"
                style={{
                    backgroundColor: color || "#000000",
                    boxShadow: `0 0 15px ${color}33`
                }}
            />
            <div>
                <h4 className="font-display font-bold text-lg md:text-xl text-[#000000] flex items-center gap-3">
                    {title}
                    <Badge variant="outline" className="text-[8px] h-4 py-0 font-black uppercase tracking-widest border-[#e1f2f3] bg-white group-hover/card:border-[#8a7f96]/30">
                        {difficulty}
                    </Badge>
                </h4>
                <div className="flex items-center gap-2 mt-1">
                    <div className="h-4 w-4 rounded-full bg-[#8a7f96]/10 flex items-center justify-center">
                        <User className="h-2 w-2 text-[#8a7f96]" />
                    </div>
                    <p className="text-[11px] font-medium text-muted-foreground">
                        Instructor: <span className="text-[#8a7f96] font-bold">{instructor}</span>
                    </p>
                </div>
            </div>
        </div>
        <div className="h-8 w-8 rounded-full border border-[#e1f2f3] flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all scale-75 group-hover/card:scale-100">
            <ChevronRight className="h-4 w-4 text-[#8a7f96]" />
        </div>
    </motion.div>
)

const ImageCarousel = ({ images }: { images: string[] }) => {
    const [index, setIndex] = React.useState(0)

    React.useEffect(() => {
        if (images.length <= 1) return
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length)
        }, 4000)
        return () => clearInterval(timer)
    }, [images.length])

    return (
        <div className="relative w-full h-full">
            <AnimatePresence mode="wait">
                <motion.img
                    key={index}
                    src={images[index]}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </AnimatePresence>
            {/* Indicadores de carrusel */}
            {images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {images.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

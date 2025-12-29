import * as React from "react"
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion"
import {
    Sprout,
    Wind,
    Instagram,
    Facebook,
    Twitter,
    Mail,
    ArrowRight,
    ChevronDown,
    Star,
    Check,
    MapPin,
    Phone,
    Clock
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// --- Components ---

const SectionTitle = ({ title, subtitle, centered = true }: { title: string, subtitle?: string, centered?: boolean }) => (
    <div className={`mb-12 ${centered ? 'text-center' : ''}`}>
        <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-serif font-bold text-[#1E293B] mb-4"
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
            className={`h-1 bg-[#4A5D4E] mt-4 ${centered ? 'mx-auto' : ''}`}
        />
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
                <Link to="/" className="flex items-center gap-2">
                    <div className="bg-[#1E293B] p-1.5 rounded-lg">
                        <Sprout className="text-white h-5 w-5" />
                    </div>
                    <span className="text-2xl font-serif font-bold text-[#1E293B] tracking-tight">TeraYoga</span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    {["Inicio", "Estudio", "Clases", "Planes", "Contacto"].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="text-sm font-medium text-[#1E293B]/70 hover:text-[#1E293B] transition-colors"
                        >
                            {item}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#1E293B]"
                        onClick={() => navigate("/login")}
                    >
                        Ingresar
                    </Button>
                    <Button
                        size="sm"
                        className="bg-[#1E293B] text-white hover:bg-[#334155] rounded-full px-6"
                        onClick={() => navigate("/register")}
                    >
                        Empezar Ahora
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

    // Parallax logic for various sections
    const yHero = useTransform(scrollYProgress, [0, 1], [0, -200])
    const yAbout = useTransform(scrollYProgress, [0, 1], [0, 100])

    const classesData = [
        {
            title: "Hatha Yoga",
            type: "Hatha",
            description: "Posturas clásicas para equilibrar cuerpo y mente, ideal para principiantes.",
            image: "https://images.unsplash.com/photo-1599447421416-3414500d18a5?q=80&w=600&auto=format&fit=crop",
            instructor: "Elena Ríos"
        },
        {
            title: "Vinyasa Flow",
            type: "Vinyasa",
            description: "Movimientos fluidos sincronizados con la respiración para generar calor vital.",
            image: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?q=80&w=600&auto=format&fit=crop",
            instructor: "Marco Santos"
        },
        {
            title: "Meditación Zen",
            type: "Meditación",
            description: "Silencio y atención plena para cultivar paz interior y claridad mental.",
            image: "https://images.unsplash.com/photo-1528319725582-ddc0b62bb6f1?q=80&w=600&auto=format&fit=crop",
            instructor: "Dra. Sofía Mora"
        }
    ]

    return (
        <div className="relative min-h-screen bg-[#F9FAF7] overflow-x-hidden selection:bg-[#E8F5E9] selection:text-[#1E293B]">
            {/* Scroll Progress Indicator */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-[#4A5D4E] z-[100] origin-left"
                style={{ scaleX: springScrollProgress }}
            />

            <Nav />

            {/* --- Hero Section --- */}
            <section id="inicio" className="relative h-screen flex items-center justify-center overflow-hidden">
                <motion.div
                    style={{ y: yHero }}
                    className="absolute inset-0 z-0"
                >
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1E293B]/40 via-transparent to-[#F9FAF7]" />
                </motion.div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.2 }
                            }
                        }}
                    >
                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            className="inline-block mb-4"
                        >
                            <Badge variant="outline" className="border-white/30 text-white backdrop-blur-sm bg-white/10 px-4 py-1 text-xs tracking-[0.2em] uppercase">
                                Encuentra tu Centro
                            </Badge>
                        </motion.div>

                        <motion.h1
                            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                            className="text-6xl md:text-8xl font-serif font-bold text-white mb-6 drop-shadow-sm"
                        >
                            Namasté en <br />
                            <span className="italic text-[#E8F5E9]">TeraYoga</span>
                        </motion.h1>

                        <motion.p
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto font-light"
                        >
                            Un espacio sagrado para reconectar con tu esencia a través del movimiento y el silencio.
                        </motion.p>

                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <Button
                                size="lg"
                                className="group relative bg-[#1E293B] hover:bg-[#1E293B] text-white rounded-full px-10 py-7 text-lg shadow-xl overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Reservar Clase <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <motion.div
                                    className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                    initial={false}
                                    whileHover={{ scale: 1.5 }}
                                />
                                {/* Glow effect */}
                                <div className="absolute -inset-1 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 rounded-full px-10 py-7 text-lg"
                            >
                                Conocer el Estudio
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>

                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
                >
                    <span className="text-white/50 text-[10px] uppercase tracking-widest">Scroll</span>
                    <ChevronDown className="text-white/50 h-5 w-5" />
                </motion.div>
            </section>

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
                            <div className="space-y-6 text-[#1E293B]/70 leading-relaxed">
                                <p>
                                    Nuestras instalaciones están diseñadas con materiales orgánicos y luz natural para crear una atmósfera de paz inmediata. Cada rincón ha sido pensado para el silencio y la introspección.
                                </p>
                                <div className="grid grid-cols-2 gap-8 py-4">
                                    <div>
                                        <h4 className="text-3xl font-serif font-bold text-[#4A5D4E]">+500</h4>
                                        <p className="text-sm font-medium">Alumnas Felices</p>
                                    </div>
                                    <div>
                                        <h4 className="text-3xl font-serif font-bold text-[#4A5D4E]">12</h4>
                                        <p className="text-sm font-medium">Instructores Certificados</p>
                                    </div>
                                </div>
                                <Button variant="link" className="text-[#4A5D4E] p-0 h-auto font-bold group">
                                    Nuestra Historia <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div className="relative order-1 md:order-2 h-[500px] md:h-[600px]">
                            {/* Parallax Image Background */}
                            <motion.div
                                style={{ y: yAbout }}
                                className="absolute top-0 right-0 w-4/5 h-4/5 rounded-3xl overflow-hidden shadow-2xl z-10"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop"
                                    alt="Estudio"
                                    className="w-full h-full object-cover"
                                />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                                className="absolute bottom-0 left-0 w-3/5 h-3/5 rounded-3xl overflow-hidden shadow-xl z-20 border-8 border-[#F9FAF7]"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1552196564-972b2049e3fa?dpr=1&auto=format&fit=crop&w=1500&h=900&q=80&cs=tinysrgb&crop="
                                    alt="Yoga practice"
                                    className="w-full h-full object-cover"
                                />
                            </motion.div>
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#E8F5E9] rounded-full blur-3xl opacity-50 z-0" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- Classes Section --- */}
            <section id="clases" className="py-24 bg-white">
                <div className="container mx-auto px-6 text-center">
                    <SectionTitle
                        title="Nuestras Clases"
                        subtitle="Disciplinas adaptadas a tu nivel y ritmo de vida."
                    />

                    <Tabs defaultValue="todos" className="w-full">
                        <TabsList className="bg-[#F9FAF7] mb-12 p-1 rounded-full border border-[#E8F5E9]">
                            {["todos", "Hatha", "Vinyasa", "Meditación"].map((tab) => (
                                <TabsTrigger
                                    key={tab}
                                    value={tab}
                                    className="rounded-full px-6 capitalize data-[state=active]:bg-[#1E293B] data-[state=active]:text-white transition-all"
                                >
                                    {tab}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {["todos", "Hatha", "Vinyasa", "Meditación"].map((tab) => (
                            <TabsContent key={tab} value={tab}>
                                <div className="grid md:grid-cols-3 gap-8">
                                    <AnimatePresence mode="wait">
                                        {classesData
                                            .filter(cls => tab === "todos" || cls.type === tab)
                                            .map((cls) => (
                                                <motion.div
                                                    key={cls.title}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <Card className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-3xl bg-[#F9FAF7]">
                                                        <div className="relative h-64 overflow-hidden">
                                                            <motion.img
                                                                whileHover={{ scale: 1.1, filter: "brightness(0.9)" }}
                                                                src={cls.image}
                                                                alt={cls.title}
                                                                className="w-full h-full object-cover transition-all duration-700"
                                                            />
                                                            <div className="absolute top-4 left-4">
                                                                <Badge className="bg-white/80 backdrop-blur-md text-[#1E293B] border-none">
                                                                    {cls.type}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <CardHeader className="text-left">
                                                            <CardTitle className="font-serif text-2xl">{cls.title}</CardTitle>
                                                            <CardDescription className="line-clamp-2">
                                                                {cls.description}
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="text-left pb-4">
                                                            <div className="flex items-center gap-2 text-sm font-medium text-[#4A5D4E]">
                                                                <Star className="h-4 w-4 fill-[#4A5D4E]" />
                                                                Instructor: {cls.instructor}
                                                            </div>
                                                        </CardContent>
                                                        <CardFooter>
                                                            <Button variant="ghost" className="w-full justify-between group/btn">
                                                                Ver horarios <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                                            </Button>
                                                        </CardFooter>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                    </AnimatePresence>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </section>

            {/* --- Pricing Section --- */}
            <section id="planes" className="py-24 bg-[#1E293B] text-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-serif font-bold mb-4"
                        >
                            Encuentra tu Plan
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-white/60 text-lg"
                        >
                            Sin contratos ocultos. Paga por lo que practicas.
                        </motion.p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <PricingCard
                            name="Mensual"
                            price="1,500"
                            classes="4"
                            features={["Acceso a Clases Hatha", "App de Reservas", "Material incluido"]}
                        />
                        <PricingCard
                            name="Trimestral"
                            price="4,000"
                            classes="12"
                            popular
                            features={["Toda la Clase Mensual", "Acceso a Vinyasa Flow", "1 sesión de Meditación"]}
                        />
                        <PricingCard
                            name="Anual"
                            price="12,000"
                            classes="Ilimitadas"
                            features={["Todas las Clases", "Talleres especiales", "10% dto en Merch", "Plan para invitados"]}
                        />
                    </div>
                </div>
            </section>

            {/* --- Contact Section --- */}
            <section id="contacto" className="py-24">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto bg-white rounded-[3rem] shadow-xl overflow-hidden flex flex-col md:flex-row">
                        <div className="md:w-1/2 p-12 md:p-16 bg-[#F9FAF7]">
                            <SectionTitle centered={false} title="Hablemos." subtitle="¿Tienes dudas? Estamos aquí para acompañarte." />
                            <div className="space-y-8 mt-8">
                                <ContactItem icon={<Mail />} title="Correo Electrónico" value="hola@terayoga.com" />
                                <ContactItem icon={<Phone />} title="WhatsApp" value="+52 123 456 7890" />
                                <ContactItem icon={<MapPin />} title="Ubicación" value="Blvd. del Centro 45, CDMX" />
                                <ContactItem icon={<Clock />} title="Horarios" value="Lun - Vie: 06:00 - 20:00" />
                            </div>
                        </div>
                        <div className="md:w-1/2 p-12 md:p-16">
                            <form className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fname">Nombre</Label>
                                        <Input id="fname" className="rounded-xl border-[#E8F5E9] bg-[#F9FAF7]" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" className="rounded-xl border-[#E8F5E9] bg-[#F9FAF7]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="servicio">Interés</Label>
                                    <select className="w-full flex h-10 rounded-xl border border-[#E8F5E9] bg-[#F9FAF7] px-3 text-sm focus:ring-1 focus:ring-[#1E293B] outline-none">
                                        <option>Yoga Hatha</option>
                                        <option>Yoga Vinyasa</option>
                                        <option>Meditación</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="msg">Mensaje</Label>
                                    <textarea id="msg" rows={4} className="w-full rounded-xl border border-[#E8F5E9] bg-[#F9FAF7] p-3 text-sm focus:ring-1 focus:ring-[#1E293B] outline-none" />
                                </div>
                                <Button className="w-full bg-[#1E293B] text-white rounded-xl py-6 text-lg hover:shadow-lg transition-shadow">
                                    Enviar Mensaje
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="bg-[#1E293B] text-white pt-20 pb-10">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="md:col-span-1 space-y-6">
                            <div className="flex items-center gap-2">
                                <Sprout className="text-[#E8F5E9] h-6 w-6" />
                                <span className="text-2xl font-serif font-bold">TeraYoga</span>
                            </div>
                            <p className="text-white/50 text-sm leading-relaxed">
                                Un faro de luz y equilibrio en el corazón de la ciudad. Únete a nuestra vibración.
                            </p>
                            <div className="flex gap-4">
                                <SocialIcon icon={<Instagram />} />
                                <SocialIcon icon={<Facebook />} />
                                <SocialIcon icon={<Twitter />} />
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6">Navegación</h4>
                            <ul className="space-y-4 text-white/50 text-sm">
                                <li><a href="#estudio" className="hover:text-[#E8F5E9]">El Estudio</a></li>
                                <li><a href="#clases" className="hover:text-[#E8F5E9]">Nuestras Clases</a></li>
                                <li><a href="#planes" className="hover:text-[#E8F5E9]">Planes y Precios</a></li>
                                <li><a href="/login" className="hover:text-[#E8F5E9]">Acceso Alumnas</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6">Soporte</h4>
                            <ul className="space-y-4 text-white/50 text-sm">
                                <li><a href="#" className="hover:text-[#E8F5E9]">Preguntas Frecuentes</a></li>
                                <li><a href="#" className="hover:text-[#E8F5E9]">Términos de Servicio</a></li>
                                <li><a href="#" className="hover:text-[#E8F5E9]">Privacidad</a></li>
                                <li><a href="#" className="hover:text-[#E8F5E9]">Cancelaciones</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6">Newsletter</h4>
                            <p className="text-white/50 text-xs mb-4">Recibe consejos de bienestar y ofertas mensuales.</p>
                            <div className="flex gap-2">
                                <Input className="bg-white/10 border-white/20 text-white rounded-xl" placeholder="Email" />
                                <Button size="icon" className="bg-[#E8F5E9] text-[#1E293B] hover:bg-white rounded-xl shrink-0">
                                    <Wind className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-white/10 text-center text-white/30 text-xs">
                        &copy; {new Date().getFullYear()} TeraYoga Estudio. Todos los derechos reservados. Diseñado para el alma.
                    </div>
                </div>
            </footer>
        </div>
    )
}

// --- Helper Components ---

const PricingCard = ({ name, price, classes, popular, features }: { name: string, price: string, classes: string, popular?: boolean, features: string[] }) => (
    <motion.div
        whileHover={{ y: -10 }}
        className={`relative p-8 rounded-[2.5rem] flex flex-col h-full bg-[#334155]/30 border-2 ${popular ? 'border-[#E8F5E9]' : 'border-white/10'} backdrop-blur-sm`}
    >
        {popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#E8F5E9] text-[#1E293B] text-[10px] font-bold uppercase tracking-widest rounded-full">
                Más Popular
            </div>
        )}
        <div className="text-center mb-8">
            <h3 className={`text-xl font-bold mb-4 ${popular ? 'text-[#E8F5E9]' : 'text-white'}`}>{name}</h3>
            <div className="flex items-baseline justify-center gap-1">
                <span className="text-sm text-white/50">$</span>
                <span className="text-5xl font-bold">{price}</span>
            </div>
            <p className="text-white/50 text-xs mt-2">{classes} clases al mes</p>
        </div>
        <div className="space-y-4 flex-1 mb-10">
            {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className={`h-4 w-4 ${popular ? 'text-[#E8F5E9]' : 'text-white/30'}`} /> {f}
                </div>
            ))}
        </div>
        <Button
            className={`w-full py-6 rounded-2xl font-bold ${popular ? 'bg-[#E8F5E9] text-[#1E293B] hover:bg-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
            Elegir Plan
        </Button>
    </motion.div>
)

const ContactItem = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) => (
    <div className="flex items-start gap-4">
        <div className="p-3 bg-white shadow-sm rounded-xl text-[#4A5D4E]">
            {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
        </div>
        <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-[#4A5D4E] mb-1">{title}</h5>
            <p className="text-[#1E293B] font-medium">{value}</p>
        </div>
    </div>
)

const SocialIcon = ({ icon }: { icon: React.ReactNode }) => (
    <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#E8F5E9] hover:text-[#1E293B] transition-all">
        {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
    </a>
)

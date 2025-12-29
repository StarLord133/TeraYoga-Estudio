import * as React from "react"
import {
    ArrowLeft,
    Loader2,
} from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AddPlan() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = React.useState(false)
    const [success, setSuccess] = React.useState(false)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)

        const formData = new FormData(event.currentTarget)
        const name = formData.get("name") as string
        const price = Number(formData.get("price"))
        const classes = Number(formData.get("classes"))
        const days = Number(formData.get("days"))

        try {
            await addDoc(collection(db, "plans"), {
                name,
                price,
                classes,
                days,
                createdAt: serverTimestamp()
            })

            setSuccess(true)
            setTimeout(() => {
                navigate("/admin/planes")
            }, 1500)
        } catch (error) {
            console.error("Error adding plan:", error)
            alert("Error al crear el plan.")
        } finally {
            setIsLoading(false)
        }
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
                                <BreadcrumbLink href="/admin/planes">Planes</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Nuevo Plan</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <main className="flex flex-1 flex-col items-center justify-start p-6 bg-[#F9FAF7]">
                    <div className="w-full max-w-2xl">
                        <div className="flex items-center gap-4 mb-8">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate("/admin/planes")}
                                className="rounded-full bg-white shadow-sm border border-[#E8F5E9]"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <h1 className="text-3xl font-serif font-bold text-[#1E293B]">Crear Nuevo Plan</h1>
                        </div>

                        <Card className="border-none shadow-lg bg-white overflow-hidden">
                            <div className="h-2 bg-[#E8F5E9]" />
                            <CardHeader>
                                <CardTitle className="font-serif">Detalles de la Membresía</CardTitle>
                                <CardDescription>
                                    Configura los parámetros del nuevo plan de servicios.
                                </CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSubmit}>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nombre del Plan</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            placeholder="Ej. Plan Mensual Premium"
                                            required
                                            className="bg-[#F9FAF7] border-[#E8F5E9] focus-visible:ring-[#1E293B]"
                                        />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="price">Precio ($)</Label>
                                            <Input
                                                id="price"
                                                name="price"
                                                type="number"
                                                placeholder="1500"
                                                required
                                                min="0"
                                                className="bg-[#F9FAF7] border-[#E8F5E9] focus-visible:ring-[#1E293B]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="classes">Total de Clases</Label>
                                            <Input
                                                id="classes"
                                                name="classes"
                                                type="number"
                                                placeholder="4"
                                                required
                                                min="1"
                                                className="bg-[#F9FAF7] border-[#E8F5E9] focus-visible:ring-[#1E293B]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="days">Duración (días)</Label>
                                            <Input
                                                id="days"
                                                name="days"
                                                type="number"
                                                placeholder="30"
                                                required
                                                min="1"
                                                className="bg-[#F9FAF7] border-[#E8F5E9] focus-visible:ring-[#1E293B]"
                                            />
                                        </div>
                                    </div>

                                    {success && (
                                        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100 animate-in fade-in slide-in-from-top-1">
                                            Plan creado con éxito. Redirigiendo...
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-[#F9FAF7]/50 border-t border-[#E8F5E9] p-6 flex justify-end gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/admin/planes")}
                                        disabled={isLoading}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-[#1E293B] text-white hover:bg-[#334155]"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creando...
                                            </>
                                        ) : (
                                            "Crear Plan"
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

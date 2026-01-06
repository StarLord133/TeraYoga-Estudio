"use client"

import * as React from "react"
import {
  BookOpen,
  PieChart,
  Settings2,
  SquareTerminal,
  Users,
  Map,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import logo from "@/assets/imagotipo-purpura.png"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Admin Tera",
    email: "admin@terayoga.com",
    avatar: "/avatars/admin.jpg",
  },
  teams: [
    {
      name: "TeraYoga",
      logo: logo,
      plan: "ESTUDIO",
    },
  ],
  navMain: [
    {
      title: "Inicio",
      url: "/admin/inicio",
      icon: SquareTerminal,
    },
    {
      title: "Alumnas",
      url: "#",
      icon: Users,
      items: [
        {
          title: "Listado",
          url: "/admin/alumnas",
        },
        {
          title: "Asistencias",
          url: "/admin/asistencias",
        },
      ],
    },
    {
      title: "Planes",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Membresías",
          url: "/admin/planes",
        },
        {
          title: "Promociones",
          url: "#",
        },
      ],
    },
    {
      title: "Horarios",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Clases",
          url: "/admin/horarios",
        },
        {
          title: "Instructores",
          url: "/admin/profesores",
        },
      ],
    },
    {
      title: "Finanzas",
      url: "#",
      icon: PieChart,
      items: [
        {
          title: "Ingresos",
          url: "#",
        },
        {
          title: "Gastos",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Modo Kiosco",
      url: "/admin/kiosco",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

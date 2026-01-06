"use client"

import * as React from "react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: React.ComponentType<{ className?: string }> | string
    plan: string
  }[]
}) {
  const activeTeam = teams[0]

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-default hover:bg-transparent active:bg-transparent"
        >
          <div className="bg-white flex aspect-square size-12 items-center justify-center rounded-lg overflow-hidden border border-[#e1f2f3]">
            {typeof activeTeam.logo === 'string' ? (
              <img src={activeTeam.logo} alt={activeTeam.name} className="size-full object-contain p-1" />
            ) : (
              <activeTeam.logo className="size-4" />
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight ml-2">
            <span className="truncate font-serif font-bold text-[#1E293B]">{activeTeam.name}</span>
            <span className="truncate text-[10px] uppercase tracking-wider text-[#8a7f96] font-medium">{activeTeam.plan}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

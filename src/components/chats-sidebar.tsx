"use client";

import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useState } from "react";
import { Chat, UIMessage } from "@ai-sdk/react";

const chats = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
]

function FetchChats() {
  const [chats, setChats] = useState<Chat<UIMessage>[]>([]);
}


export function ChatsSidebar() {
  return (
    <Sidebar>
        {/*
        <SidebarHeader>
            <SidebarContent>
                <div className="flex flex-row gap-2 items-center justify-center">
                    <button>
                        <Plus />
                    </button>
                    <button>
                        <Plus />
                    </button>
                </div>
            </SidebarContent>
        </SidebarHeader>
        */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.title}>
                  <SidebarMenuButton asChild>
                    <a href={chat.url}>
                      <chat.icon />
                      <span>{chat.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
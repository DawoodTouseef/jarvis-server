"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Cpu,
  Database,
  ImageIcon,
  Mic,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  User,
  Cloud,
  MapPin,
  ToyBrick,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api"

interface DashboardLayoutProps {
  children: React.ReactNode
}
interface User{
    id: string,
    email: string,
    name: string,
    role: string,
    profile_image_url: string,
    token:string,
    token_type: string,
    expires_at: string,
    permissions: {
        workspace: {
            models: boolean,
            knowledge: boolean,
            prompts: boolean,
            tools: boolean
        },
        sharing: {
            public_models: boolean,
            public_knowledge: boolean,
            public_prompts: boolean,
            public_tools: boolean,
            public_notes: boolean
        },
        chat: {
            controls: boolean,
            valves: boolean,
            system_prompt: boolean,
            params: boolean,
            file_upload: boolean,
            delete: boolean,
            delete_message: boolean,
            continue_response: boolean,
            regenerate_response: boolean,
            rate_response: boolean,
            edit: boolean,
            share: true,
            export: true,
            stt: boolean,
            tts: boolean,
            call: boolean,
            multiple_models: boolean,
            temporary: boolean,
            temporary_enforced: boolean
        },
        features: {
            direct_tool_servers: boolean,
            web_search: boolean,
            image_generation: boolean,
            code_interpreter: boolean,
            notes: boolean
        }
    },
    bio: string,
    gender: string,
    date_of_birth: string
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [users,setusers]=useState<User>({})
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.getSessionUser();
        if (response.data) {
          setusers(response.data);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }
    fetchUsers()
  },[])
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name:"Map" , href :"/dashboard/map",icon: MapPin},
    { name: "Connections", href: "/dashboard/connections", icon: Cloud },
    { name: "Models", href: "/dashboard/models", icon: Cpu },
    { name: "Knowledge", href: "/dashboard/knowledge", icon: Database },
    { name: "Integrations", href: "/integrations", icon: ToyBrick  },
    { name: "Images", href: "/dashboard/images", icon: ImageIcon },
    { name: "Audio", href: "/dashboard/audio", icon: Mic },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  const handleLogout = () => {
    apiClient.logout()
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 glass-strong border-r border-primary/20 fixed h-screen">
        <div className="flex-1 flex flex-col p-6 space-y-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="p-2 glass rounded-lg border border-primary/30 group-hover:border-primary/50 transition-all">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold neon-text">JARVIS</span>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 hover:bg-primary/10 hover:text-primary transition-all",
                      isActive && "bg-primary/20 text-primary neon-glow",
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="space-y-2 pt-4 border-t border-border/50">
            <div className="flex items-center gap-3 p-3 glass rounded-lg border border-primary/20">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{users.name}</p>
                <p className="text-xs text-muted-foreground truncate">{users.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full glass border-destructive/30 text-destructive hover:bg-destructive/10 bg-transparent"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 glass-strong border-r border-primary/20 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="p-2 glass rounded-lg border border-primary/30">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xl font-bold neon-text">JARVIS</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href} onClick={() => setIsSidebarOpen(false)}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 hover:bg-primary/10 hover:text-primary transition-all",
                        isActive && "bg-primary/20 text-primary neon-glow",
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </nav>

            <div className="absolute bottom-6 left-6 right-6">
              <Button
                variant="outline"
                className="w-full glass border-destructive/30 text-destructive hover:bg-destructive/10 bg-transparent"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 glass-strong border-b border-primary/20 p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-bold neon-text">JARVIS</span>
            </Link>
            <div className="w-10" />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

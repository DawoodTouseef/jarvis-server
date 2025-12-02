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
  User as UserIcon,
  Cloud,
  MapPin,
  ToyBrick,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient, type User } from "@/lib/api"

interface DashboardLayoutProps {
  children: React.ReactNode
}


export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [users, setUsers] = useState<User | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.getSessionUser();
        if (response.success && response.data) {
          setUsers(response.data);
        } else {
          console.error("Failed to fetch user data:", response.error);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }
    
    fetchUsers()
  }, [])
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
              <div className="w-6 h-6">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#00c8ff" />
                      <stop offset="50%" stop-color="#0088ff" />
                      <stop offset="100%" stop-color="#8040ff" />
                    </linearGradient>
                    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
                      <feFlood flood-color="#00c8ff" flood-opacity="0.8" result="color"/>
                      <feComposite in="color" in2="blur" operator="in" result="glow"/>
                      <feMerge>
                        <feMergeNode in="glow"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <polygon points="50,25 70,37.5 70,62.5 50,75 30,62.5 30,37.5" fill="none" stroke="url(#neonGradient)" stroke-width="2" filter="url(#neonGlow)" />
                  <circle cx="50" cy="50" r="15" fill="none" stroke="url(#neonGradient)" stroke-width="1" />
                </svg>
              </div>
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
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{users?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{users?.email || 'user@example.com'}</p>
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
                  <div className="w-6 h-6">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#00c8ff" />
                          <stop offset="50%" stop-color="#0088ff" />
                          <stop offset="100%" stop-color="#8040ff" />
                        </linearGradient>
                        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
                          <feFlood flood-color="#00c8ff" flood-opacity="0.8" result="color"/>
                          <feComposite in="color" in2="blur" operator="in" result="glow"/>
                          <feMerge>
                            <feMergeNode in="glow"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <polygon points="50,25 70,37.5 70,62.5 50,75 30,62.5 30,37.5" fill="none" stroke="url(#neonGradient)" stroke-width="2" filter="url(#neonGlow)" />
                      <circle cx="50" cy="50" r="15" fill="none" stroke="url(#neonGradient)" stroke-width="1" />
                    </svg>
                  </div>
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
              <div className="w-5 h-5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#00c8ff" />
                      <stop offset="50%" stop-color="#0088ff" />
                      <stop offset="100%" stop-color="#8040ff" />
                    </linearGradient>
                    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
                      <feFlood flood-color="#00c8ff" flood-opacity="0.8" result="color"/>
                      <feComposite in="color" in2="blur" operator="in" result="glow"/>
                      <feMerge>
                        <feMergeNode in="glow"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <polygon points="50,25 70,37.5 70,62.5 50,75 30,62.5 30,37.5" fill="none" stroke="url(#neonGradient)" stroke-width="2" filter="url(#neonGlow)" />
                  <circle cx="50" cy="50" r="15" fill="none" stroke="url(#neonGradient)" stroke-width="1" />
                </svg>
              </div>
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

"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Cpu, Database, Zap } from "lucide-react"
import { apiClient } from "@/lib/api"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      // Check for auth token in localStorage first (for "Remember me" users)
      let token = localStorage.getItem("authToken")
      
      // If not found in localStorage, check sessionStorage
      if (!token) {
        token = sessionStorage.getItem("authToken")
      }
      
      // If we have a token, verify it's still valid
      if (token) {
        try {
          apiClient.setToken(token)
          const response = await apiClient.getSessionUser()
          if (response.success && response.data) {
            router.push("/dashboard")
          } else {
            // Token is invalid, clean up
            localStorage.removeItem("authToken")
            localStorage.removeItem("isAuthenticated")
            localStorage.removeItem("userEmail")
            sessionStorage.removeItem("authToken")
            sessionStorage.removeItem("isAuthenticated")
            sessionStorage.removeItem("userEmail")
            apiClient.setToken(null)
          }
        } catch (error) {
          // Error occurred, clean up
          localStorage.removeItem("authToken")
          localStorage.removeItem("isAuthenticated")
          localStorage.removeItem("userEmail")
          sessionStorage.removeItem("authToken")
          sessionStorage.removeItem("isAuthenticated")
          sessionStorage.removeItem("userEmail")
          apiClient.setToken(null)
        }
      }
    }
    
    checkAuth()
  }, [router])
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
        {/* Logo/Title */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 glass rounded-full border border-primary/30 mb-6">
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
            <span className="text-sm font-mono text-primary">Virtual Assistant AI</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
            <span className="neon-text text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
              JARVIS
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your intelligent AI control center. Manage models, conversations, knowledge bases, and automated pipelines.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <div className="glass p-6 rounded-xl border border-primary/20 hover:border-primary/40 transition-all hover:neon-glow group">
            <Cpu className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-lg mb-2">AI Models</h3>
            <p className="text-sm text-muted-foreground">Manage and configure multiple AI models</p>
          </div>

          <div className="glass p-6 rounded-xl border border-secondary/20 hover:border-secondary/40 transition-all hover:neon-glow group">
            <Database className="w-8 h-8 text-secondary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-lg mb-2">Knowledge Base</h3>
            <p className="text-sm text-muted-foreground">Store and retrieve information efficiently</p>
          </div>

          <div className="glass p-6 rounded-xl border border-accent/20 hover:border-accent/40 transition-all hover:neon-glow group">
            <Zap className="w-8 h-8 text-accent mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-lg mb-2">Automation</h3>
            <p className="text-sm text-muted-foreground">Create powerful task pipelines</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
          <Link href="/auth/login">
            <Button size="lg" className="neon-glow-strong group">
              Access Dashboard
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Link href="/auth/register">
            <Button size="lg" variant="outline" className="glass border-primary/30 bg-transparent">
              Create Account
            </Button>
          </Link>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-8">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono">System Online</span>
        </div>
      </div>
    </div>
  )
}

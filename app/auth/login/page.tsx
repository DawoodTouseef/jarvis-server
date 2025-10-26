"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Lock, Mail, Sparkles, Eye, EyeOff } from "lucide-react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await apiClient.login({ email, password })
      if (response.success && response.data) {
        // Store auth state
        if (rememberMe) {
          localStorage.setItem("isAuthenticated", "true")
          localStorage.setItem("userEmail", email)
          localStorage.setItem("authToken", response.data.token)
        } else {
          sessionStorage.setItem("isAuthenticated", "true")
          sessionStorage.setItem("userEmail", email)
          sessionStorage.setItem("authToken", response.data.token)
        }
        
        // Set the token in the API client
        apiClient.setToken(response.data.token)
        
        // Show success message
        toast.success("Welcome back! You have been successfully logged in.")
        
        router.push("/dashboard")
      } else {
        setError(response.error || "Login failed. Please check your credentials.")
        toast.error(response.error || "Login failed")
      }
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred. Please try again."
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-10" />

      <div className="w-full max-w-md relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <Card className="glass-strong border-primary/20 p-8 shadow-2xl">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full border border-primary/30 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-primary">Authentication</span>
              </div>
              <h1 className="text-3xl font-bold neon-text">Access System</h1>
              <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 glass border-primary/20 focus:border-primary/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 glass border-primary/20 focus:border-primary/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded border-primary/30" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <Link href="/auth/forgot-password" className="text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full neon-glow" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : "Sign In"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Register link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/auth/register" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Create one
              </Link>
            </div>
          </div>
        </Card>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-6">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-mono">Secure Connection</span>
        </div>
      </div>
    </div>
  )
}

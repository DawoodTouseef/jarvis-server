"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Mail, Sparkles } from "lucide-react"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate the request
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simulate success
      setIsSubmitted(true)
      toast.success("Password reset instructions sent to your email")
    } catch (error: any) {
      const errorMessage = error.message || "Failed to send password reset instructions. Please try again."
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-10" />

      <div className="w-full max-w-md relative z-10">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <Card className="glass-strong border-primary/20 p-8 shadow-2xl">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full border border-primary/30 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-primary">Password Recovery</span>
              </div>
              <h1 className="text-3xl font-bold neon-text">Reset Password</h1>
              {isSubmitted ? (
                <p className="text-sm text-muted-foreground">
                  We've sent password reset instructions to your email. Please check your inbox.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Form or Success Message */}
            {isSubmitted ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Check your spam folder or
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsSubmitted(false)}
                  disabled={isLoading}
                >
                  Resend Instructions
                </Button>
              </div>
            ) : (
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
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full neon-glow" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : "Send Reset Instructions"}
                </Button>
              </form>
            )}

            {/* Login link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Remember your password? </span>
              <Link href="/auth/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Sign in
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
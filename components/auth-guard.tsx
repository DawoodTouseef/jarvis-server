"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken")
      if (!token) {
        router.push("/auth/login")
        setIsLoading(false)
        return
      }
      
      // Set token in API client
      apiClient.setToken(token)
      
      // Verify token is still valid by making a simple API call
      try {
        const response = await apiClient.getSessionUser()
        if (response.success && response.data) {
          setIsAuthenticated(true)
        } else {
          // Token is invalid, redirect to login
          localStorage.removeItem("authToken")
          apiClient.setToken(null)
          router.push("/auth/login")
        }
      } catch (error) {
        // Error occurred, redirect to login
        localStorage.removeItem("authToken")
        apiClient.setToken(null)
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-mono">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
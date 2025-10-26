import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Background3D } from "@/components/3d-background"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { LocationTracker } from "@/components/location-tracker"
import "./globals.css"

export const metadata: Metadata = {
  title: "Virtual Assistant AI",
  description: "Futuristic AI Dashboard & Control Center",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={null}>
          <Background3D />
          <LocationTracker />
          {children}
          <Toaster />
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
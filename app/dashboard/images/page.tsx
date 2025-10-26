"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { ImageIcon } from "lucide-react"

export default function ImagesPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold neon-text mb-2">Image Generation</h1>
            <p className="text-muted-foreground">AI-powered image creation and editing</p>
          </div>
          <Card className="glass border-primary/20 p-12 text-center">
            <ImageIcon className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Image Tools Coming Soon</h3>
            <p className="text-muted-foreground">AI image generation and editing features will be available here</p>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

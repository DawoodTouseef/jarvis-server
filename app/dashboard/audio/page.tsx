"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Mic } from "lucide-react"

export default function AudioPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold neon-text mb-2">Audio Processing</h1>
            <p className="text-muted-foreground">Speech recognition and audio generation</p>
          </div>
          <Card className="glass border-primary/20 p-12 text-center">
            <Mic className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Audio Tools Coming Soon</h3>
            <p className="text-muted-foreground">Speech-to-text and audio processing features will be available here</p>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

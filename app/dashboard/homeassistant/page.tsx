"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { HomeAssistantEntityManager } from "@/components/homeassistant/entity-manager"

export default function HomeAssistantPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <HomeAssistantEntityManager />
      </DashboardLayout>
    </AuthGuard>
  )
}

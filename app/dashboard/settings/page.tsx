"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SettingsPanel } from "@/components/settings-panel"

export default function SettingsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <SettingsPanel />
      </DashboardLayout>
    </AuthGuard>
  )
}

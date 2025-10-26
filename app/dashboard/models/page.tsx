"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ModelManagement } from "@/components/model-management"

export default function ModelsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <ModelManagement />
      </DashboardLayout>
    </AuthGuard>
  )
}

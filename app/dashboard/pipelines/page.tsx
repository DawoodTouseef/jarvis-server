"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PipelineSystem } from "@/components/pipeline-system"

export default function PipelinesPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <PipelineSystem />
      </DashboardLayout>
    </AuthGuard>
  )
}

"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { KnowledgeBase } from "@/components/knowledge-base"
import { KnowledgeManagement } from "@/components/knowledge-management"
export default function KnowledgePage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <KnowledgeBase />
      </DashboardLayout>
    </AuthGuard>
  )
}

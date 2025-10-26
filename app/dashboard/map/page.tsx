"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import MapManagement from "@/components/map-management"

export default function MapPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <MapManagement />
      </DashboardLayout>
    </AuthGuard>
  )
}
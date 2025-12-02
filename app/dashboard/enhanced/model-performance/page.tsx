"use client";

import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ModelPerformanceDashboard } from "@/components/model-performance-dashboard";

export default function ModelPerformancePage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <ModelPerformanceDashboard />
      </DashboardLayout>
    </AuthGuard>
  );
}
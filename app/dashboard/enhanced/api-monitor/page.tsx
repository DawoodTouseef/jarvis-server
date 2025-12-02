"use client";

import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ApiEndpointMonitor } from "@/components/api-endpoint-monitor";

export default function ApiMonitorPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <ApiEndpointMonitor />
      </DashboardLayout>
    </AuthGuard>
  );
}
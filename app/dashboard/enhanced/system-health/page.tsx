"use client";

import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SystemHealthMonitor } from "@/components/system-health-monitor";

export default function SystemHealthPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <SystemHealthMonitor />
      </DashboardLayout>
    </AuthGuard>
  );
}
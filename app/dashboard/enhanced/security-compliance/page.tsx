"use client";

import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/dashboard-layout";
import { SecurityComplianceDashboard } from "@/components/security-compliance-dashboard";

export default function SecurityCompliancePage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <SecurityComplianceDashboard />
      </DashboardLayout>
    </AuthGuard>
  );
}
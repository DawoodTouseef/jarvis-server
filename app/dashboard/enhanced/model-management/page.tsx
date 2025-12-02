"use client";

import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AdvancedModelManagement } from "@/components/advanced-model-management";

export default function ModelManagementPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <AdvancedModelManagement />
      </DashboardLayout>
    </AuthGuard>
  );
}
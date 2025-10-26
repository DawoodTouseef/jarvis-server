"use client";

import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ConnectionManagement } from "@/components/connection-management";

export default function ConnectionsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <ConnectionManagement />
      </DashboardLayout>
    </AuthGuard>
  );
}
"use client";

import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ResourceUsageOptimizer } from "@/components/resource-usage-optimizer";

export default function ResourceOptimizerPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <ResourceUsageOptimizer />
      </DashboardLayout>
    </AuthGuard>
  );
}
"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import FileBrowser from "@/components/file-browser";

export default function FilesPage() {
  return (
    <DashboardLayout>
        <FileBrowser />
    </DashboardLayout>
  );
}

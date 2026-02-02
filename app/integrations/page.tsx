'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/dashboard-layout';
export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('integrations');

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Home Assistant Integrations</h1>
        <p className="text-muted-foreground">Manage your smart home integrations and devices</p>
      </div>
      
      
    </div> 
    </DashboardLayout>
  );
}
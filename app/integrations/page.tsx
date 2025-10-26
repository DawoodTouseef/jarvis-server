'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IntegrationManager from '@/components/homeassistant/integration-manager';
import DeviceDashboard from '@/components/homeassistant/device-dashboard';
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="devices">Devices & Entities</TabsTrigger>
        </TabsList>
        <TabsContent value="integrations" className="mt-6">
          <IntegrationManager />
        </TabsContent>
        <TabsContent value="devices" className="mt-6">
          <DeviceDashboard />
        </TabsContent>
      </Tabs>
    </div> 
    </DashboardLayout>
  );
}
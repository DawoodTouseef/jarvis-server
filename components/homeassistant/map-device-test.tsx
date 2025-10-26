'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';

export default function MapDeviceTest() {
  const handleTestEntities = async () => {
    try {
      // Test fetching entities
      const entitiesResponse = await apiClient.getHomeAssistantEntities();
      console.log('Entities:', entitiesResponse);
      
      // Test calling a service
      if (entitiesResponse.success && entitiesResponse.data && entitiesResponse.data.length > 0) {
        const firstEntity = entitiesResponse.data[0];
        const domain = firstEntity.entity_id.split('.')[0];
        const service = firstEntity.state === 'on' ? 'turn_off' : 'turn_on';
        
        const serviceResponse = await apiClient.callHomeAssistantService(
          domain, 
          service, 
          { entity_id: firstEntity.entity_id }
        );
        console.log('Service response:', serviceResponse);
      }
    } catch (error) {
      console.error('Error testing map and device control:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Map & Device Control Test</CardTitle>
          <CardDescription>Test the map visualization and device control functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleTestEntities}>Test Entities & Services</Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>This test will:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Fetch all Home Assistant entities</li>
              <li>Call a service on the first entity (toggle on/off)</li>
              <li>Check browser console for results</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
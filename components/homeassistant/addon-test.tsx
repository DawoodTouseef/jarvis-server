'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';

export default function AddonTest() {
  const [addonId, setAddonId] = useState('test-addon');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleCreateAddon = async () => {
    try {
      setStatus('Creating addon...');
      setError('');
      
      const response = await apiClient.createHomeAssistantAddon({
        addon_id: addonId,
        name: `Test Addon: ${addonId}`,
        description: 'A test addon for demonstration purposes',
        version: '1.0.0',
        enabled: true,
        repository_url: 'https://github.com/example/test-addon',
        installed_from: 'store'
      });
      
      if (response.success) {
        setStatus(`Addon ${addonId} created successfully!`);
      } else {
        setError(response.error || 'Failed to create addon');
      }
    } catch (err) {
      setError('Failed to create addon: ' + (err as Error).message);
      console.error('Error creating addon:', err);
    }
  };

  const handleEnableAddon = async () => {
    try {
      setStatus(`Enabling addon ${addonId}...`);
      setError('');
      
      const response = await apiClient.enableHomeAssistantAddon(addonId);
      
      if (response.success) {
        setStatus(`Addon ${addonId} enabled successfully!`);
      } else {
        setError(response.error || 'Failed to enable addon');
      }
    } catch (err) {
      setError('Failed to enable addon: ' + (err as Error).message);
      console.error('Error enabling addon:', err);
    }
  };

  const handleDisableAddon = async () => {
    try {
      setStatus(`Disabling addon ${addonId}...`);
      setError('');
      
      const response = await apiClient.disableHomeAssistantAddon(addonId);
      
      if (response.success) {
        setStatus(`Addon ${addonId} disabled successfully!`);
      } else {
        setError(response.error || 'Failed to disable addon');
      }
    } catch (err) {
      setError('Failed to disable addon: ' + (err as Error).message);
      console.error('Error disabling addon:', err);
    }
  };

  const handleInstallAddon = async () => {
    try {
      setStatus(`Installing addon ${addonId}...`);
      setError('');
      
      const response = await apiClient.installHomeAssistantAddon(addonId);
      
      if (response.success) {
        setStatus(`Addon ${addonId} installed successfully!`);
      } else {
        setError(response.error || 'Failed to install addon');
      }
    } catch (err) {
      setError('Failed to install addon: ' + (err as Error).message);
      console.error('Error installing addon:', err);
    }
  };

  const handleUninstallAddon = async () => {
    try {
      setStatus(`Uninstalling addon ${addonId}...`);
      setError('');
      
      const response = await apiClient.uninstallHomeAssistantAddon(addonId);
      
      if (response.success) {
        setStatus(`Addon ${addonId} uninstalled successfully!`);
      } else {
        setError(response.error || 'Failed to uninstall addon');
      }
    } catch (err) {
      setError('Failed to uninstall addon: ' + (err as Error).message);
      console.error('Error uninstalling addon:', err);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Home Assistant Add-ons Test</CardTitle>
          <CardDescription>Test the add-ons management functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="addonId">Add-on ID</Label>
            <Input
              id="addonId"
              value={addonId}
              onChange={(e) => setAddonId(e.target.value)}
              placeholder="Enter addon ID"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCreateAddon}>Create Addon</Button>
            <Button onClick={handleEnableAddon} variant="secondary">Enable</Button>
            <Button onClick={handleDisableAddon} variant="secondary">Disable</Button>
            <Button onClick={handleInstallAddon} variant="secondary">Install</Button>
            <Button onClick={handleUninstallAddon} variant="secondary">Uninstall</Button>
          </div>
          
          {status && <div className="text-green-600">{status}</div>}
          {error && <div className="text-red-600">{error}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
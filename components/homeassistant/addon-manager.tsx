'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api';

interface Addon {
  id: number;
  addon_id: string;
  name: string;
  description: string | null;
  version: string;
  enabled: boolean;
  config: any | null;
  manifest: any | null;
  installed_at: string;
  updated_at: string;
  repository_url: string | null;
  installed_from: string | null;
}

export default function AddonManager() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAddon, setNewAddon] = useState({
    addon_id: '',
    name: '',
    description: '',
    version: '1.0.0',
    enabled: true,
    repository_url: '',
    installed_from: 'store'
  });

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getHomeAssistantAddons();
      if (response.success && response.data) {
        setAddons(response.data);
      } else {
        setError(response.error || 'Failed to fetch addons');
      }
    } catch (err) {
      setError('Failed to fetch addons');
      console.error('Error fetching addons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddon = async () => {
    try {
      const response = await apiClient.createHomeAssistantAddon({
        addon_id: newAddon.addon_id,
        name: newAddon.name,
        description: newAddon.description,
        version: newAddon.version,
        enabled: newAddon.enabled,
        repository_url: newAddon.repository_url,
        installed_from: newAddon.installed_from
      });
      
      if (response.success) {
        setIsCreateDialogOpen(false);
        setNewAddon({
          addon_id: '',
          name: '',
          description: '',
          version: '1.0.0',
          enabled: true,
          repository_url: '',
          installed_from: 'store'
        });
        
        fetchAddons();
      } else {
        setError(response.error || 'Failed to create addon');
      }
    } catch (err) {
      setError('Failed to create addon');
      console.error('Error creating addon:', err);
    }
  };

  const handleEnableAddon = async (addonId: string) => {
    try {
      const response = await apiClient.enableHomeAssistantAddon(addonId);
      if (response.success) {
        fetchAddons();
      } else {
        setError(response.error || 'Failed to enable addon');
      }
    } catch (err) {
      setError('Failed to enable addon');
      console.error('Error enabling addon:', err);
    }
  };

  const handleDisableAddon = async (addonId: string) => {
    try {
      const response = await apiClient.disableHomeAssistantAddon(addonId);
      if (response.success) {
        fetchAddons();
      } else {
        setError(response.error || 'Failed to disable addon');
      }
    } catch (err) {
      setError('Failed to disable addon');
      console.error('Error disabling addon:', err);
    }
  };

  const handleInstallAddon = async (addonId: string) => {
    try {
      const response = await apiClient.installHomeAssistantAddon(addonId);
      if (response.success) {
        fetchAddons();
      } else {
        setError(response.error || 'Failed to install addon');
      }
    } catch (err) {
      setError('Failed to install addon');
      console.error('Error installing addon:', err);
    }
  };

  const handleUninstallAddon = async (addonId: string) => {
    try {
      const response = await apiClient.uninstallHomeAssistantAddon(addonId);
      if (response.success) {
        fetchAddons();
      } else {
        setError(response.error || 'Failed to uninstall addon');
      }
    } catch (err) {
      setError('Failed to uninstall addon');
      console.error('Error uninstalling addon:', err);
    }
  };

  if (loading) {
    return <div className="p-4">Loading addons...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Home Assistant Add-ons</CardTitle>
              <CardDescription>Manage your Home Assistant add-ons</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create Add-on</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Add-on</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="addon_id">Add-on ID</Label>
                    <Input
                      id="addon_id"
                      value={newAddon.addon_id}
                      onChange={(e) => setNewAddon({...newAddon, addon_id: e.target.value})}
                      placeholder="my-addon"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newAddon.name}
                      onChange={(e) => setNewAddon({...newAddon, name: e.target.value})}
                      placeholder="My Add-on"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newAddon.description}
                      onChange={(e) => setNewAddon({...newAddon, description: e.target.value})}
                      placeholder="Add-on description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={newAddon.version}
                      onChange={(e) => setNewAddon({...newAddon, version: e.target.value})}
                      placeholder="1.0.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="repository_url">Repository URL</Label>
                    <Input
                      id="repository_url"
                      value={newAddon.repository_url}
                      onChange={(e) => setNewAddon({...newAddon, repository_url: e.target.value})}
                      placeholder="https://github.com/user/addon"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enabled"
                      checked={newAddon.enabled}
                      onCheckedChange={(checked) => setNewAddon({...newAddon, enabled: checked})}
                    />
                    <Label htmlFor="enabled">Enabled</Label>
                  </div>
                  <Button onClick={handleCreateAddon}>Create Add-on</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Installed From</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addons.map((addon) => (
                <TableRow key={addon.id}>
                  <TableCell className="font-medium">{addon.name}</TableCell>
                  <TableCell>{addon.addon_id}</TableCell>
                  <TableCell>{addon.version}</TableCell>
                  <TableCell>
                    <Badge variant={addon.enabled ? "default" : "secondary"}>
                      {addon.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>{addon.installed_from || "Unknown"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {addon.enabled ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDisableAddon(addon.addon_id)}
                        >
                          Disable
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEnableAddon(addon.addon_id)}
                        >
                          Enable
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleInstallAddon(addon.addon_id)}
                      >
                        Install
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleUninstallAddon(addon.addon_id)}
                      >
                        Uninstall
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
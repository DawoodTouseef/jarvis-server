/**
 * Integrations Management Component
 * 
 * This component provides a comprehensive interface for managing integrations.
 * It allows users to:
 * - Browse available integrations
 * - Install/uninstall integrations
 * - Enable/disable integrations
 * - Configure integration settings
 * - View integration details and documentation
 */

"use client"

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  Download,
  Trash2,
  Settings,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Grid,
  List,
  Filter,
  ListMinus,
  Plus
} from 'lucide-react'
import { apiClient,IntegrationListResponse,IntegrationResponse } from '@/lib/api'




type ViewMode = 'grid' | 'list'

export function IntegrationsManager() {
  const { toast } = useToast()
  const [integrations, setIntegrations] = useState<[]>([])
  const [filteredIntegrations, setFilteredIntegrations] = useState<IntegrationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationResponse | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [operatingIntegration, setOperatingIntegration] = useState<string | null>(null)

  // Fetch integrations
  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getIntegrations({limit: 100})
      const data = response
      console.log('Fetched integrations:', data)
      if (data.success && data) {
        setIntegrations(data)
      

      // Extract unique categories
      const uniqueCategories = ['all', ...new Set(data.integrations.map(i => i.category))]
      setCategories(uniqueCategories)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch integrations'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter integrations based on search and category
  useEffect(() => {
    let filtered = integrations

    if (searchTerm) {
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.author.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((i) => i.category === selectedCategory)
    }

    setFilteredIntegrations(filtered)
  }, [integrations, searchTerm, selectedCategory])

  // Install integration
  const handleInstall = async (integrationId: string) => {
    try {
      setOperatingIntegration(integrationId)
      const response = await fetch(`/api/integrations/${integrationId}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to install integration')
      }

      toast({
        title: 'Success',
        description: `Integration '${integrationId}' installed successfully`,
      })

      fetchIntegrations()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Installation failed'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setOperatingIntegration(null)
    }
  }

  // Uninstall integration
  const handleUninstall = async (integrationId: string) => {
    try {
      setOperatingIntegration(integrationId)
      const response = await fetch(`/api/integrations/${integrationId}/uninstall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to uninstall integration')
      }

      toast({
        title: 'Success',
        description: `Integration '${integrationId}' uninstalled successfully`,
      })

      fetchIntegrations()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Uninstallation failed'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setOperatingIntegration(null)
    }
  }

  // Enable integration
  const handleEnable = async (integrationId: string) => {
    try {
      setOperatingIntegration(integrationId)
      const response = await fetch(`/api/integrations/${integrationId}/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to enable integration')
      }

      toast({
        title: 'Success',
        description: `Integration '${integrationId}' enabled`,
      })

      fetchIntegrations()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Enable failed'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setOperatingIntegration(null)
    }
  }

  // Disable integration
  const handleDisable = async (integrationId: string) => {
    try {
      setOperatingIntegration(integrationId)
      const response = await fetch(`/api/integrations/${integrationId}/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to disable integration')
      }

      toast({
        title: 'Success',
        description: `Integration '${integrationId}' disabled`,
      })

      fetchIntegrations()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disable failed'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setOperatingIntegration(null)
    }
  }

  // Load integrations on mount
  useEffect(() => {
    fetchIntegrations()
  }, [])

  // Get status badge info
  const getStatusInfo = (integration: Integration) => {
    if (!integration.installed) {
      return { icon: Clock, label: 'Not Installed', color: 'text-gray-500' }
    }
    if (integration.last_error) {
      return { icon: AlertCircle, label: 'Error', color: 'text-red-500' }
    }
    if (integration.enabled) {
      return { icon: CheckCircle, label: 'Enabled', color: 'text-green-500' }
    }
    return { icon: Clock, label: 'Disabled', color: 'text-yellow-500' }
  }

  // Grid view card
  const IntegrationGridCard = ({ integration }: { integration: Integration }) => {
    const statusInfo = getStatusInfo(integration)
    const StatusIcon = statusInfo.icon

    return (
      <Card className="glass border-primary/20 hover:border-primary/40 transition-all cursor-pointer" onClick={() => {
        setSelectedIntegration(integration)
        setShowDetailsDialog(true)
      }}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <CardDescription className="text-sm mt-1">
                by {integration.author}
              </CardDescription>
            </div>
            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {integration.description}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-primary/10 rounded">
              {integration.category}
            </span>
            <span>v{integration.version}</span>
          </div>
          <div className="flex gap-2">
            {!integration.installed ? (
              <Button
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation()
                  handleInstall(integration.id)
                }}
                disabled={operatingIntegration === integration.id}
              >
                <Download className="w-4 h-4 mr-1" />
                Install
              </Button>
            ) : (
              <>
                {integration.enabled ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDisable(integration.id)
                    }}
                    disabled={operatingIntegration === integration.id}
                  >
                    Disable
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEnable(integration.id)
                    }}
                    disabled={operatingIntegration === integration.id}
                  >
                    Enable
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUninstall(integration.id)
                  }}
                  disabled={operatingIntegration === integration.id}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedIntegration(integration)
                    setShowConfigDialog(true)
                  }}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // List view row
  const IntegrationListRow = ({ integration }: { integration: Integration }) => {
    const statusInfo = getStatusInfo(integration)
    const StatusIcon = statusInfo.icon

    return (
      <div className="glass border-primary/20 rounded-lg p-4 flex items-center justify-between hover:border-primary/40 transition-all">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {integration.icon && (
              <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                {integration.icon}
              </div>
            )}
            <div>
              <h3 className="font-semibold">{integration.name}</h3>
              <p className="text-sm text-muted-foreground">
                {integration.description}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            <span className="px-2 py-1 bg-primary/10 rounded text-xs">
              {integration.category}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm min-w-[100px]">
            <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
            <span className={statusInfo.color}>{statusInfo.label}</span>
          </div>
          <span className="text-sm text-muted-foreground min-w-[50px]">
            v{integration.version}
          </span>
          <div className="flex gap-2">
            {!integration.installed ? (
              <Button
                size="sm"
                onClick={() => handleInstall(integration.id)}
                disabled={operatingIntegration === integration.id}
              >
                Install
              </Button>
            ) : (
              <>
                {integration.enabled ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDisable(integration.id)}
                    disabled={operatingIntegration === integration.id}
                  >
                    Disable
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleEnable(integration.id)}
                    disabled={operatingIntegration === integration.id}
                  >
                    Enable
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUninstall(integration.id)}
                  disabled={operatingIntegration === integration.id}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="glass border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Clock className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Loading integrations...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className='flex gap-8'>
        <div>
        <h2 className="text-2xl font-bold mb-2">Integrations</h2>
        <p className="text-muted-foreground">
          Manage and configure integrations to extend Jarvis functionality
        </p>
      </div>
      <div>
        <Button
          variant="outline"
          size="sm"
          ><Plus/></Button>
      </div>
      </div>
      {error && (
        <Card className="glass border-red-500/50 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card className="glass border-primary/20 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass border-primary/20 pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px] glass border-primary/20">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {filteredIntegrations.length} integration
              {filteredIntegrations.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Integrations Display */}
      {filteredIntegrations.length === 0 ? (
        <Card className="glass border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Filter className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No integrations found</h3>
              <p className="text-muted-foreground text-sm">
                Try adjusting your search or filter criteria
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIntegrations.map((integration) => (
            <IntegrationGridCard key={integration.id} integration={integration} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIntegrations.map((integration) => (
            <IntegrationListRow key={integration.id} integration={integration} />
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="glass border-primary/20 max-w-2xl">
          {selectedIntegration && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedIntegration.name}</DialogTitle>
                <DialogDescription>
                  {selectedIntegration.author} • v{selectedIntegration.version}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedIntegration.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Category</span>
                    <p className="font-medium">{selectedIntegration.category}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Status</span>
                    <p className="font-medium capitalize">
                      {selectedIntegration.status}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!selectedIntegration.installed ? (
                    <Button
                      onClick={() => {
                        handleInstall(selectedIntegration.id)
                        setShowDetailsDialog(false)
                      }}
                      disabled={operatingIntegration === selectedIntegration.id}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Install
                    </Button>
                  ) : (
                    <>
                      {selectedIntegration.enabled ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleDisable(selectedIntegration.id)
                            setShowDetailsDialog(false)
                          }}
                          disabled={operatingIntegration === selectedIntegration.id}
                        >
                          Disable
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            handleEnable(selectedIntegration.id)
                            setShowDetailsDialog(false)
                          }}
                          disabled={operatingIntegration === selectedIntegration.id}
                        >
                          Enable
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleUninstall(selectedIntegration.id)
                          setShowDetailsDialog(false)
                        }}
                        disabled={operatingIntegration === selectedIntegration.id}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Uninstall
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Config Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="glass border-primary/20 max-w-2xl">
          {selectedIntegration && (
            <>
              <DialogHeader>
                <DialogTitle>Configure {selectedIntegration.name}</DialogTitle>
                <DialogDescription>
                  Update integration settings and configuration
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded p-4">
                  <p className="text-sm text-muted-foreground">
                    Configuration panel for this integration would appear here.
                    Extend this component to add integration-specific settings.
                  </p>
                </div>
                <Button className="w-full">Save Configuration</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default IntegrationsManager

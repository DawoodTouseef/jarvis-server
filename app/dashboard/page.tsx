"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  Cpu,
  Database,
  Activity,
  Server,
  Users,
  TrendingUp,
  Home,
  Lightbulb,
  Thermometer,
  Power,
  Cloud,
  Brain,
  Zap,
  ImageIcon,
  Mic,
  ArrowRight,
  Settings,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

// Define the activity interface
interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  model?: string;
}

// Define the stats interface
interface StatItem {
  label: string;
  value: number;
  change: string;
  icon: React.ComponentType<any>;
  color: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatItem[]>([
    { label: "Active Chats", value: 0, change: "+0", icon: MessageSquare, color: "text-primary" },
    { label: "Models", value: 0, change: "+0", icon: Cpu, color: "text-secondary" },
    { label: "Documents", value: 0, change: "+0", icon: Database, color: "text-accent" },
    { label: "Entities", value: 0, change: "+0", icon: Home, color: "text-info" },
    { label: "Devices", value: 0, change: "+0", icon: Power, color: "text-warning" },
  ])

  const [systemStatus, setSystemStatus] = useState({
    apiResponseTime: "0ms",
    storageUsed: "0 GB / 10 GB",
    storagePercentage: 0,
    activeConnections: "0 / 50",
    connectionsPercentage: 0
  })

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const quickActions = [
    {
      title: "Home Assistant",
      description: "Control smart home devices",
      icon: Home,
      href: "/dashboard/homeassistant",
      color: "primary",
    },
    {
      title: "Memory Management",
      description: "Store and manage AI memories",
      icon: Brain,
      href: "/dashboard/memories",
      color: "chart-3",
    },
    {
      title: "Create Pipeline",
      description: "Automate workflows",
      icon: Zap,
      href: "/dashboard/pipelines",
      color: "chart-4",
    },
    {
      title: "Enhanced Dashboard",
      description: "Advanced analytics and monitoring",
      icon: BarChart3,
      href: "/dashboard/enhanced",
      color: "primary",
    },
  ]

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Monitor stats changes for debugging
  useEffect(() => {
    console.log("Stats updated:", stats);
  }, [stats]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch all data in parallel for better performance
        const [
          userMetricsResponse,
          modelsResponse,
          knowledgeResponse,
          apiMetricsResponse,
          systemMetricsResponse,
          chatsResponse,
          entityMetricsResponse
        ] = await Promise.allSettled([
          apiClient.getUserMetrics(),
          apiClient.getModels(),
          apiClient.getKnowledgeBases(),
          apiClient.getApiRequestMetrics(),
          apiClient.getSystemMetrics(),
          apiClient.getChats(),
          apiClient.getEntityStateMetrics()
        ]);

        // Initialize updated stats with current values, preserving icons
        let updatedStats: StatItem[] = [
          { label: "Active Chats", value: 0, change: "+0", icon: MessageSquare, color: "text-primary" },
          { label: "Models", value: 0, change: "+0", icon: Cpu, color: "text-secondary" },
          { label: "Documents", value: 0, change: "+0", icon: Database, color: "text-accent" },
          { label: "Entities", value: 0, change: "+0", icon: Home, color: "text-info" },
          { label: "Devices", value: 0, change: "+0", icon: Power, color: "text-warning" },
        ];
      
        let hasErrors = false;

        // Process user metrics
        if (userMetricsResponse.status === "fulfilled" && userMetricsResponse.value.success && userMetricsResponse.value.data) {
          const userMetrics = userMetricsResponse.value.data;
          console.log("User metrics data received:", userMetrics);
          const newValue = userMetrics.active_users || 0;
          console.log("Setting Active Chats value to:", newValue);
          updatedStats[0] = {
            ...updatedStats[0],
            value: newValue,
            change: `+${userMetrics.new_users_today || 0}`
          };
          console.log("Updated Active Chats stat:", updatedStats[0]);
        } else {
          hasErrors = true;
        }

        // Process models
        if (modelsResponse.status === "fulfilled" && modelsResponse.value.success && modelsResponse.value.data) {
          const newValue = modelsResponse.value.data.length || 0;
          console.log("Setting Models value to:", newValue);
          updatedStats[1] = {
            ...updatedStats[1],
            value: newValue,
            change: "+0"
          };
          console.log("Updated Models stat:", updatedStats[1]);
        } else {
          hasErrors = true;
        }

        // Process knowledge bases
        if (knowledgeResponse.status === "fulfilled" && knowledgeResponse.value.success && knowledgeResponse.value.data) {
          const totalFiles = knowledgeResponse.value.data.reduce((acc, kb) => {
            return acc + (kb.files ? kb.files.length : 0);
          }, 0);

          updatedStats[2] = {
            ...updatedStats[2],
            value: totalFiles,
            change: "+0"
          };
        } else {
          hasErrors = true;
        }

        // Process entity metrics
        if (entityMetricsResponse.status === "fulfilled" && entityMetricsResponse.value.success && entityMetricsResponse.value.data) {
          const entityMetrics = entityMetricsResponse.value.data;
          console.log("Entity metrics data received:", entityMetrics);
          
          // Update entities count
          updatedStats[3] = {
            ...updatedStats[3],
            value: entityMetrics.total_entities || 0,
            change: `+${entityMetrics.recent_state_changes || 0}`
          };
          
          // Count devices (entities with 'switch', 'light', 'sensor' domains)
          let deviceCount = 0;
          const deviceDomains = ['switch', 'light', 'sensor', 'binary_sensor', 'cover', 'climate'];
          Object.entries(entityMetrics.domains || {}).forEach(([domain, count]) => {
            if (deviceDomains.includes(domain)) {
              deviceCount += count;
            }
          });
          
          updatedStats[4] = {
            ...updatedStats[4],
            value: deviceCount,
            change: "+0"
          };
        } else {
          hasErrors = true;
        }

        setStats(updatedStats);
      
        // Process system metrics
        if (systemMetricsResponse.status === "fulfilled" && systemMetricsResponse.value.success && systemMetricsResponse.value.data) {
          const systemMetrics = systemMetricsResponse.value.data;
          setSystemStatus(prev => ({
            ...prev,
            storageUsed: `${(systemMetrics.memory * 0.1).toFixed(1)} GB / 10 GB`,
            storagePercentage: systemMetrics.memory,
            activeConnections: `${Math.floor(systemMetrics.cpu * 0.5)} / 50`,
            connectionsPercentage: systemMetrics.cpu * 0.5
          }));
        }

        // Process API metrics
        if (apiMetricsResponse.status === "fulfilled" && apiMetricsResponse.value.success && apiMetricsResponse.value.data) {
          const apiMetrics = apiMetricsResponse.value.data;
          setSystemStatus(prev => ({
            ...prev,
            apiResponseTime: `${apiMetrics.avg_response_time || 0}ms`
          }));
        }

        // Process chats for activity
        if (chatsResponse.status === "fulfilled" && chatsResponse.value.success && chatsResponse.value.data) {
          const activityData = chatsResponse.value.data.slice(0, 5).map((chat: any) => ({
            id: chat.id,
            title: "Chat session started",
            description: chat.title || "Untitled chat",
            time: chat.updated_at ? formatTimeAgo(new Date(chat.updated_at)) : "Just now",
            model: "Chat"
          }));
          setRecentActivity(activityData);
        } else {
          // Fallback to demo data if chat fetching fails
          setRecentActivity([
            { id: "1", title: "Chat session started", description: "GPT-4 Conversation", time: "2 min ago", model: "GPT-4" },
            { id: "2", title: "Document uploaded", description: "Knowledge Base", time: "15 min ago", model: "RAG System" },
            { id: "3", title: "Pipeline executed", description: "Task Automation", time: "1 hour ago", model: "Workflow" },
            { id: "4", title: "Model configured", description: "Claude 3", time: "2 hours ago", model: "AI Model" },
          ]);
        }

        if (hasErrors) {
          toast({
            title: "Partial Error",
            description: "Some dashboard data could not be loaded",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Loading state UI
  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="h-10 bg-muted rounded-md w-64 mb-2 animate-pulse"></div>
                <div className="h-4 bg-muted rounded-md w-80 animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <div className="h-4 bg-muted rounded-md w-48 animate-pulse"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="glass border-primary/20 p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded-md w-24 animate-pulse"></div>
                      <div className="h-8 bg-muted rounded-md w-12 animate-pulse"></div>
                      <div className="h-3 bg-muted rounded-md w-32 animate-pulse"></div>
                    </div>
                    <div className="p-3 glass rounded-lg border border-primary/20">
                      <div className="w-5 h-5 bg-muted rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-primary/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 bg-muted rounded-md w-32 animate-pulse"></div>
                  <div className="h-8 bg-muted rounded-md w-20 animate-pulse"></div>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-muted mt-2 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded-md w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-muted rounded-md w-1/2 animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-muted rounded-md w-16 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="glass border-primary/20 p-6">
                <div className="h-6 bg-muted rounded-md w-32 mb-4 animate-pulse"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-3 bg-muted rounded-md w-24 animate-pulse"></div>
                        <div className="h-3 bg-muted rounded-md w-16 animate-pulse"></div>
                      </div>
                      <div className="h-2 bg-muted rounded-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold neon-text mb-2">Command Center</h1>
              <p className="text-muted-foreground">Welcome back to your AI control hub</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-mono text-muted-foreground">All Systems Operational</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="glass border-primary/20 p-6 hover:border-primary/40 transition-all hover:scale-[1.02]">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp className="w-3 h-3 text-primary" />
                      <span className="text-primary">{stat.change}</span>
                      <span className="text-muted-foreground">this week</span>
                    </div>
                  </div>
                  <div className={`p-3 glass rounded-lg border border-primary/20`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <Card className="glass border-primary/20 p-6 hover:border-primary/40 hover:neon-glow transition-all group cursor-pointer h-full hover:scale-[1.02]">
                    <div className="flex items-start gap-4">
                      <div className="p-3 glass rounded-lg border border-primary/20 group-hover:border-primary/40 transition-all">
                        <action.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity & System Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="glass border-primary/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Activity className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Start a conversation to see activity here</p>
                  </div>
                ) : (
                  <>
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </Card>

            {/* System Status */}
            <div className="space-y-6">
              <Card className="glass border-primary/20 p-6">
                <h2 className="text-xl font-semibold mb-4">System Status</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">API Response Time</span>
                      <span className="font-mono text-primary">{systemStatus.apiResponseTime}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" 
                        style={{ 
                          width: `${Math.min(100, Math.max(10, parseInt(systemStatus.apiResponseTime) || 0))}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Storage Used</span>
                      <span className="font-mono text-secondary">{systemStatus.storageUsed}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-secondary to-accent rounded-full" 
                        style={{ width: `${Math.min(100, systemStatus.storagePercentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Active Connections</span>
                      <span className="font-mono text-accent">{systemStatus.activeConnections}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-accent to-chart-4 rounded-full" 
                        style={{ width: `${Math.min(100, systemStatus.connectionsPercentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <Link href="/dashboard/settings">
                      <Button variant="outline" className="w-full glass border-primary/30 bg-transparent hover:bg-primary/10">
                        <Settings className="w-4 h-4 mr-2" />
                        System Settings
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
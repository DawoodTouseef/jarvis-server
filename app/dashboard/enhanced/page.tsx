"use client";

import { AuthGuard } from "@/components/auth-guard";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  BarChart3,
  Shield,
  Key,
  Wrench,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export default function EnhancedDashboardPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [userMetrics, setUserMetrics] = useState<any>(null);
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [apiMetrics, setApiMetrics] = useState<any>(null);
  const [containerStats, setContainerStats] = useState<any>(null);
  const [customMetrics, setCustomMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        systemMetricsResponse,
        userMetricsResponse,
        modelsResponse,
        apiRequestMetricsResponse,
        customMetricsResponse,
        containerStatsResponse
      ] = await Promise.allSettled([
        apiClient.getSystemMetrics(),
        apiClient.getUserMetrics(),
        apiClient.getModels(),
        apiClient.getApiRequestMetrics(),
        apiClient.getCustomMetrics(),
        apiClient.getContainers()
      ]);

      // Process system metrics
      if (systemMetricsResponse.status === "fulfilled" && systemMetricsResponse.value.success) {
        setSystemMetrics(systemMetricsResponse.value.data);
      }

      // Process user metrics
      if (userMetricsResponse.status === "fulfilled" && userMetricsResponse.value.success) {
        setUserMetrics(userMetricsResponse.value.data);
      }

      // Process model metrics
      if (modelsResponse.status === "fulfilled" && modelsResponse.value.success) {
        setModelMetrics(modelsResponse.value.data);
      }

      // Process API request metrics
      if (apiRequestMetricsResponse.status === "fulfilled" && apiRequestMetricsResponse.value.success) {
        setApiMetrics(apiRequestMetricsResponse.value.data);
      }

      // Process container stats
      if (containerStatsResponse.status === "fulfilled" && containerStatsResponse.value.success) {
        setContainerStats(containerStatsResponse.value.data);
      }

      // Process custom metrics
      if (customMetricsResponse.status === "fulfilled" && customMetricsResponse.value.success) {
        setCustomMetrics(customMetricsResponse.value.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchData();
    toast({
      title: "Success",
      description: "Dashboard data refreshed",
    });
  };

  const sections = [
    { id: "overview", name: "Overview", icon: BarChart3 },
    { id: "analytics", name: "Analytics", icon: TrendingUp },
    { id: "monitoring", name: "Monitoring", icon: Activity },
    { id: "models", name: "Models", icon: Cpu },
    { id: "security", name: "Security", icon: Shield },
    { id: "resources", name: "Resources", icon: Server },
  ];

  // Loading state
  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold neon-text mb-2">Enhanced Command Center</h1>
              <p className="text-muted-foreground">Advanced analytics and monitoring dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-mono text-muted-foreground">All Systems Operational</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "default" : "outline"}
                onClick={() => setActiveSection(section.id)}
                className="flex items-center gap-2"
              >
                <section.icon className="w-4 h-4" />
                {section.name}
              </Button>
            ))}
          </div>

          {/* Overview Section */}
          {activeSection === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-primary/20 p-6">
                <h2 className="text-2xl font-semibold mb-4">System Overview</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Cpu className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Model Performance</h3>
                        <p className="text-sm text-muted-foreground">AI model metrics and insights</p>
                      </div>
                    </div>
                    <Link href="/dashboard/enhanced/model-performance">
                      <Button variant="outline" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Activity className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">System Health</h3>
                        <p className="text-sm text-muted-foreground">Real-time system monitoring</p>
                      </div>
                    </div>
                    <Link href="/dashboard/enhanced/system-health">
                      <Button variant="outline" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Security Dashboard</h3>
                        <p className="text-sm text-muted-foreground">Compliance and security monitoring</p>
                      </div>
                    </div>
                    <Link href="/dashboard/enhanced/security">
                      <Button variant="outline" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
              
              <Card className="glass border-primary/20 p-6">
                <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-4">
                  <Link href="/dashboard/models">
                    <Card className="glass border-primary/20 p-4 hover:border-primary/40 hover:neon-glow transition-all group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Wrench className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">Model Management</h3>
                          <p className="text-sm text-muted-foreground">Configure and deploy AI models</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </Card>
                  </Link>
                  
                  <Link href="/dashboard/pipelines">
                    <Card className="glass border-primary/20 p-4 hover:border-primary/40 hover:neon-glow transition-all group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">Pipeline Scheduler</h3>
                          <p className="text-sm text-muted-foreground">Automate workflows and tasks</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </Card>
                  </Link>
                  
                  <Link href="/dashboard/knowledge">
                    <Card className="glass border-primary/20 p-4 hover:border-primary/40 hover:neon-glow transition-all group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Database className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">Knowledge Base</h3>
                          <p className="text-sm text-muted-foreground">Manage documents and search</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </Card>
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {/* Analytics Section */}
          {activeSection === "analytics" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-primary/20 p-6">
                <h2 className="text-2xl font-semibold mb-4">User Analytics</h2>
                <div className="space-y-4">
                  <div className="p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Active Users</h3>
                        <p className="text-sm text-muted-foreground">Currently online</p>
                      </div>
                      <span className="text-2xl font-bold text-primary">
                        {userMetrics ? userMetrics.active_users : "0"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Total Sessions</h3>
                        <p className="text-sm text-muted-foreground">Today</p>
                      </div>
                      <span className="text-2xl font-bold text-primary">
                        {userMetrics ? userMetrics.sessions : "0"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">New Users</h3>
                        <p className="text-sm text-muted-foreground">Registered today</p>
                      </div>
                      <span className="text-2xl font-bold text-primary">
                        {userMetrics ? userMetrics.new_users_today : "0"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Link href="/dashboard/enhanced/user-analytics">
                    <Button variant="outline" className="w-full">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      View Detailed User Analytics
                    </Button>
                  </Link>
                </div>
              </Card>
              
              <Card className="glass border-primary/20 p-6">
                <h2 className="text-2xl font-semibold mb-4">Performance Analytics</h2>
                <div className="space-y-4">
                  <div className="p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">API Requests</h3>
                        <p className="text-sm text-muted-foreground">Per second</p>
                      </div>
                      <span className="text-2xl font-bold text-primary">
                        {apiMetrics ? apiMetrics.requests_per_second.toFixed(2) : "0.00"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Error Rate</h3>
                        <p className="text-sm text-muted-foreground">Current</p>
                      </div>
                      <span className={`text-2xl font-bold ${apiMetrics && apiMetrics.error_rate > 5 ? "text-red-500" : apiMetrics && apiMetrics.error_rate > 2 ? "text-yellow-500" : "text-green-500"}`}>
                        {apiMetrics ? `${apiMetrics.error_rate.toFixed(2)}%` : "0.00%"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Avg Response Time</h3>
                        <p className="text-sm text-muted-foreground">Milliseconds</p>
                      </div>
                      <span className="text-2xl font-bold text-primary">
                        {apiMetrics ? `${apiMetrics.avg_response_time.toFixed(0)}ms` : "0ms"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <Link href="/dashboard/enhanced/api-monitor">
                    <Button variant="outline" className="w-full">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      View API Performance
                    </Button>
                  </Link>
                  <Link href="/dashboard/enhanced/chat-analytics">
                    <Button variant="outline" className="w-full">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      View Chat Analytics
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {/* Monitoring Section */}
          {activeSection === "monitoring" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="glass border-primary/20 p-6">
                <h2 className="text-2xl font-semibold mb-4">System Monitoring</h2>
                <div className="space-y-4">
                  <div className="p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">API Endpoints</h3>
                      <span className="text-sm text-green-600">
                        {apiMetrics ? "Operational" : "Unknown"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {modelMetrics ? `${modelMetrics.length} endpoints monitored` : "Loading..."}
                    </p>
                  </div>
                  
                  <div className="p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">System Health</h3>
                      <span className="text-sm text-green-600">
                        {systemMetrics ? "Healthy" : "Unknown"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {containerStats ? `${containerStats.filter((c: any) => c.status === "running").length} services running` : "Loading..."}
                    </p>
                  </div>
                  
                  <div className="p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Resource Usage</h3>
                      <span className={`text-sm ${systemMetrics && systemMetrics.cpu > 80 ? "text-red-600" : systemMetrics && systemMetrics.cpu > 60 ? "text-yellow-600" : "text-green-600"}`}>
                        {systemMetrics ? (systemMetrics.cpu > 80 ? "Critical" : systemMetrics.cpu > 60 ? "Warning" : "Normal") : "Unknown"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {systemMetrics ? `CPU usage at ${systemMetrics.cpu || 0}%` : "Loading..."}
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="glass border-primary/20 p-6 lg:col-span-2">
                <h2 className="text-2xl font-semibold mb-4">Recent Alerts</h2>
                <div className="space-y-4">
                  {apiMetrics && apiMetrics.error_rate > 5 ? (
                    <div className="flex items-start gap-3 p-4 border border-border/50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                      <div className="flex-1">
                        <h3 className="font-medium">High Error Rate Detected</h3>
                        <p className="text-sm text-muted-foreground">
                          API error rate is at {apiMetrics.error_rate.toFixed(2)}%
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>Just now</span>
                          <span>•</span>
                          <span>Active</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  {systemMetrics && systemMetrics.cpu > 80 ? (
                    <div className="flex items-start gap-3 p-4 border border-border/50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                      <div className="flex-1">
                        <h3 className="font-medium">High CPU Usage Detected</h3>
                        <p className="text-sm text-muted-foreground">
                          CPU usage exceeded 80% ({systemMetrics.cpu || 0}%)
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>Just now</span>
                          <span>•</span>
                          <span>Active</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  {containerStats && containerStats.some((c: any) => c.status !== "running") ? (
                    <div className="flex items-start gap-3 p-4 border border-border/50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                      <div className="flex-1">
                        <h3 className="font-medium">Container Issues Detected</h3>
                        <p className="text-sm text-muted-foreground">
                          {containerStats.filter((c: any) => c.status !== "running").length} containers not running
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>Just now</span>
                          <span>•</span>
                          <span>Active</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  {customMetrics && customMetrics.length > 0 ? (
                    <div className="flex items-start gap-3 p-4 border border-border/50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div className="flex-1">
                        <h3 className="font-medium">System Metrics Updated</h3>
                        <p className="text-sm text-muted-foreground">
                          {customMetrics.length} custom metrics collected
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>Just now</span>
                          <span>•</span>
                          <span>Completed</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  {(apiMetrics && apiMetrics.error_rate <= 5) && 
                   (systemMetrics && systemMetrics.cpu <= 80) && 
                   (!containerStats || containerStats.every((c: any) => c.status === "running")) && 
                   (!customMetrics || customMetrics.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mb-4"></div>
                      <h3 className="text-lg font-medium">No Active Alerts</h3>
                      <p className="text-muted-foreground">All systems are operating normally</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Models Section */}
          {activeSection === "models" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-primary/20 p-6">
                <h2 className="text-2xl font-semibold mb-4">Model Management</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Cpu className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Advanced Model Management</h3>
                        <p className="text-sm text-muted-foreground">Configure and deploy AI models</p>
                      </div>
                    </div>
                    <Link href="/dashboard/enhanced/model-management">
                      <Button variant="outline" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Model Performance</h3>
                        <p className="text-sm text-muted-foreground">Monitor model metrics and insights</p>
                      </div>
                    </div>
                    <Link href="/dashboard/enhanced/model-performance">
                      <Button variant="outline" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
              
              <Card className="glass border-primary/20 p-6">
                <h2 className="text-2xl font-semibold mb-4">Model Status</h2>
                <div className="space-y-4">
                  {modelMetrics && modelMetrics.length > 0 ? (
                    modelMetrics.slice(0, 3).map((model: any) => (
                      <div key={model.id} className="p-4 border border-border/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{model.name}</h3>
                          <span className="text-sm text-green-600">Active</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, (model.requests || 0) / 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{(model.requests || 0).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Latency: {model.latency || 'N/A'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="p-4 border border-border/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">GPT-4 Turbo</h3>
                          <span className="text-sm text-green-600">Active</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: "95%" }}></div>
                          </div>
                          <span className="text-sm">95%</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Latency: 420ms</p>
                      </div>
                      
                      <div className="p-4 border border-border/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Claude 2.1</h3>
                          <span className="text-sm text-green-600">Active</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: "88%" }}></div>
                          </div>
                          <span className="text-sm">88%</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Latency: 680ms</p>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Security Section */}
          {activeSection === "security" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-primary/20 p-6">
                <h2 className="text-2xl font-semibold mb-4">Security Dashboard</h2>
                <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Compliance Dashboard</h3>
                      <p className="text-sm text-muted-foreground">Monitor security and compliance</p>
                    </div>
                  </div>
                  <Link href="/dashboard/enhanced/security-compliance">
                    <Button variant="outline" size="sm">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg mt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Key className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Data Protection</h3>
                      <p className="text-sm text-muted-foreground">Encryption and access controls</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
              
              <Card className="glass border-primary/20 p-6">
                <h2 className="text-2xl font-semibold mb-4">Security Metrics</h2>
                <div className="space-y-4">
                  <div className="p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Encryption Coverage</h3>
                      <span className="text-sm text-green-600">
                        {containerStats ? "100%" : "Loading..."}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${containerStats ? 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Access Control</h3>
                      <span className="text-sm text-green-600">
                        {userMetrics ? `${Math.min(100, 95 + (userMetrics.active_users || 0) / 100)}%` : "Loading..."}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${userMetrics ? Math.min(100, 95 + (userMetrics.active_users || 0) / 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Vulnerability Scans</h3>
                      <span className={`text-sm ${apiMetrics && apiMetrics.error_rate > 5 ? "text-red-600" : apiMetrics && apiMetrics.error_rate > 2 ? "text-yellow-600" : "text-green-600"}`}>
                        {apiMetrics ? `${100 - Math.min(100, Math.floor(apiMetrics.error_rate * 10))}%` : "Loading..."}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`${apiMetrics && apiMetrics.error_rate > 5 ? "bg-red-500" : apiMetrics && apiMetrics.error_rate > 2 ? "bg-yellow-500" : "bg-green-500"} h-2 rounded-full`} 
                          style={{ width: `${apiMetrics ? 100 - Math.min(100, Math.floor(apiMetrics.error_rate * 10)) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Resources Section */}
          {activeSection === "resources" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-primary/20 p-6">
                <h2 className="text-2xl font-semibold mb-4">Resource Optimization</h2>
                <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Server className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Resource Usage Optimizer</h3>
                      <p className="text-sm text-muted-foreground">Monitor and optimize system resources</p>
                    </div>
                  </div>
                  <Link href="/dashboard/enhanced/resource-optimizer">
                    <Button variant="outline" size="sm">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
              
              <Card className="glass border-primary/20 p-6">
                <h2 className="text-2xl font-semibold mb-4">Resource Status</h2>
                <div className="space-y-4">
                  {systemMetrics ? (
                    <>
                      <div className="p-4 border border-border/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">CPU Usage</h3>
                          <span className="text-sm text-green-600">{systemMetrics.cpu || 0}%</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, systemMetrics.cpu || 0)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-border/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Memory Usage</h3>
                          <span className="text-sm text-green-600">{systemMetrics.memory || 0}%</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, systemMetrics.memory || 0)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-border/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Disk Usage</h3>
                          <span className="text-sm text-green-600">{systemMetrics.disk || 0}%</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, systemMetrics.disk || 0)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 border border-border/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">CPU Usage</h3>
                          <span className="text-sm text-green-600">Loading...</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: "0%" }}></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-border/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Memory Usage</h3>
                          <span className="text-sm text-green-600">Loading...</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: "0%" }}></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border border-border/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Disk Usage</h3>
                          <span className="text-sm text-green-600">Loading...</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: "0%" }}></div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
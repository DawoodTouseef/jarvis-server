"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  TrendingUp, 
  Zap,
  Clock,
  Recycle,
  Settings,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface SystemResource {
  name: string;
  current: number;
  max: number;
  unit: string;
  usagePercentage: number;
  trend: "increasing" | "decreasing" | "stable";
  recommendation?: string;
}

interface Process {
  id: string;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  priority: "low" | "normal" | "high";
  status: "running" | "sleeping" | "stopped";
  startTime: string;
}

interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  lastTriggered?: string;
  savings?: number;
}

interface ResourceUsageDataPoint {
  time: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export function ResourceUsageOptimizer() {
  const [systemResources, setSystemResources] = useState<SystemResource[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [optimizationRules, setOptimizationRules] = useState<OptimizationRule[]>([]);
  const [resourceUsageData, setResourceUsageData] = useState<ResourceUsageDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h" | "7d">("24h");

  useEffect(() => {
    fetchResourceData();
  }, [timeRange]);

  const fetchResourceData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from API
      const [
        systemMetricsResponse,
        modelsResponse,
        containerStatsResponse
      ] = await Promise.allSettled([
        apiClient.getSystemMetrics(),
        apiClient.getModels(),
        apiClient.getContainers()
      ]);

      // Process system metrics
      let processedSystemResources: SystemResource[] = [];
      if (systemMetricsResponse.status === "fulfilled" && systemMetricsResponse.value.success && systemMetricsResponse.value.data) {
        const metrics = systemMetricsResponse.value.data;
        processedSystemResources = [
          {
            name: "CPU Usage",
            current: metrics.cpu || 0,
            max: 100,
            unit: "%",
            usagePercentage: metrics.cpu || 0,
            trend: "stable",
            recommendation: metrics.cpu && metrics.cpu > 80 ? "Consider scaling up during peak hours" : 
                          metrics.cpu && metrics.cpu < 20 ? "Consider scaling down to save resources" : 
                          "Current CPU usage is optimal"
          },
          {
            name: "Memory Usage",
            current: metrics.memory || 0,
            max: 100,
            unit: "%",
            usagePercentage: metrics.memory || 0,
            trend: metrics.memory && metrics.memory > 50 ? "increasing" : "stable",
            recommendation: metrics.memory && metrics.memory > 80 ? "Monitor for memory leaks" : 
                          metrics.memory && metrics.memory < 30 ? "Memory usage is efficient" : 
                          "Current memory usage is normal"
          },
          {
            name: "Disk Usage",
            current: metrics.disk || 0,
            max: 100,
            unit: "%",
            usagePercentage: metrics.disk || 0,
            trend: "stable"
          },
          {
            name: "Network I/O",
            current: metrics.network || 0,
            max: 100,
            unit: "%",
            usagePercentage: metrics.network || 0,
            trend: metrics.network && metrics.network > 50 ? "increasing" : 
                   metrics.network && metrics.network < 20 ? "decreasing" : 
                   "stable"
          }
        ];
      } else if (containerStatsResponse.status === "fulfilled" && containerStatsResponse.value.success && containerStatsResponse.value.data) {
        // Fallback to container stats data if system metrics are not available
        const containers = containerStatsResponse.value.data;
        const totalCpu = containers.reduce((sum, container) => sum + (container.cpu || 0), 0);
        const totalMemory = containers.reduce((sum, container) => sum + (container.memory || 0), 0);
        
        processedSystemResources = [
          {
            name: "CPU Usage",
            current: totalCpu,
            max: 100,
            unit: "%",
            usagePercentage: totalCpu,
            trend: "stable",
            recommendation: totalCpu > 80 ? "Consider scaling up during peak hours" : 
                          totalCpu < 20 ? "Consider scaling down to save resources" : 
                          "Current CPU usage is optimal"
          },
          {
            name: "Memory Usage",
            current: totalMemory,
            max: 100,
            unit: "%",
            usagePercentage: totalMemory,
            trend: totalMemory > 50 ? "increasing" : "stable",
            recommendation: totalMemory > 80 ? "Monitor for memory leaks" : 
                          totalMemory < 30 ? "Memory usage is efficient" : 
                          "Current memory usage is normal"
          },
          {
            name: "Containers",
            current: containers.length,
            max: 20,
            unit: "containers",
            usagePercentage: (containers.length / 20) * 100,
            trend: "stable"
          },
          {
            name: "Active Containers",
            current: containers.filter(c => c.status === "running").length,
            max: containers.length,
            unit: "running",
            usagePercentage: containers.length > 0 ? (containers.filter(c => c.status === "running").length / containers.length) * 100 : 0,
            trend: "stable"
          }
        ];
      } else {
        // Fallback to mock data if API call fails
        processedSystemResources = [
          {
            name: "CPU Usage",
            current: 42,
            max: 100,
            unit: "%",
            usagePercentage: 42,
            trend: "stable",
            recommendation: "Consider scaling up during peak hours"
          },
          {
            name: "Memory Usage",
            current: 12.4,
            max: 32,
            unit: "GB",
            usagePercentage: 39,
            trend: "increasing",
            recommendation: "Monitor for memory leaks"
          },
          {
            name: "Disk Usage",
            current: 245,
            max: 500,
            unit: "GB",
            usagePercentage: 49,
            trend: "stable"
          },
          {
            name: "Network I/O",
            current: 1.2,
            max: 10,
            unit: "Gbps",
            usagePercentage: 12,
            trend: "decreasing"
          }
        ];
      }

      // Process models and containers as processes
      let processedProcesses: Process[] = [];
      if (modelsResponse.status === "fulfilled" && modelsResponse.value.success && modelsResponse.value.data) {
        processedProcesses = modelsResponse.value.data.slice(0, 5).map((model: any, index: number) => {
          const priority: "low" | "normal" | "high" = "high";
          const status: "running" | "sleeping" | "stopped" = model.active !== undefined ? (model.active ? "running" : "stopped") : "running";
          return {
            id: model.id || `model-${index}`,
            name: model.name || `Model ${index + 1}`,
            cpuUsage: model.cpu_usage || Math.floor(Math.random() * 30),
            memoryUsage: model.memory_usage || Math.floor(Math.random() * 10),
            priority: priority,
            status: status,
            startTime: model.created_at || new Date(Date.now() - (index + 1) * 3600000).toISOString()
          };
        });
      }
      
      if (containerStatsResponse.status === "fulfilled" && containerStatsResponse.value.success && containerStatsResponse.value.data) {
        const containerData = containerStatsResponse.value.data.slice(0, 3);
        const containerProcesses: Process[] = containerData.map((container: any, index: number) => {
          const priority: "low" | "normal" | "high" = index === 0 ? "high" : "normal";
          let status: "running" | "sleeping" | "stopped" = "sleeping";
          
          if (container.status === "running") {
            status = "running";
          } else if (container.status === "stopped") {
            status = "stopped";
          }
          
          return {
            id: container.id || `container-${index}`,
            name: container.name || `Container ${index + 1}`,
            cpuUsage: container.cpu || Math.floor(Math.random() * 20),
            memoryUsage: container.memory || Math.floor(Math.random() * 5),
            priority: priority,
            status: status,
            startTime: container.created || new Date(Date.now() - (index + 3) * 3600000).toISOString()
          };
        });
        processedProcesses = [...processedProcesses, ...containerProcesses];
      }
      
      // If we still don't have processes, use mock data
      if (processedProcesses.length === 0) {
        processedProcesses = [
          {
            id: "proc-1",
            name: "jarvis-core",
            cpuUsage: 28,
            memoryUsage: 4.2,
            priority: "high",
            status: "running",
            startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "proc-2",
            name: "model-inference",
            cpuUsage: 15,
            memoryUsage: 6.8,
            priority: "high",
            status: "running",
            startTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "proc-3",
            name: "database",
            cpuUsage: 8,
            memoryUsage: 3.1,
            priority: "high",
            status: "running",
            startTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "proc-4",
            name: "web-server",
            cpuUsage: 5,
            memoryUsage: 1.5,
            priority: "normal",
            status: "running",
            startTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "proc-5",
            name: "background-tasks",
            cpuUsage: 3,
            memoryUsage: 0.8,
            priority: "low",
            status: "sleeping",
            startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          }
        ];
      }

      // Optimization rules (static for now)
      const processedOptimizationRules: OptimizationRule[] = [
        {
          id: "rule-1",
          name: "CPU Throttling",
          description: "Reduce CPU usage during low activity periods",
          enabled: true,
          lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          savings: 15
        },
        {
          id: "rule-2",
          name: "Memory Cleanup",
          description: "Automatically clear unused memory caches",
          enabled: true,
          lastTriggered: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          savings: 8
        },
        {
          id: "rule-3",
          name: "Process Prioritization",
          description: "Adjust process priorities based on system load",
          enabled: false,
          savings: 12
        },
        {
          id: "rule-4",
          name: "Idle Process Suspension",
          description: "Suspend non-critical processes during high load",
          enabled: true,
          lastTriggered: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          savings: 22
        }
      ];

      // Generate resource usage data based on real metrics or mock data
      const processedResourceUsageData: ResourceUsageDataPoint[] = [];
      const points = timeRange === "1h" ? 60 : timeRange === "6h" ? 72 : timeRange === "24h" ? 48 : 168;
      
      for (let i = points; i >= 0; i--) {
        const timestamp = new Date();
        if (timeRange === "1h") {
          timestamp.setMinutes(timestamp.getMinutes() - i);
        } else if (timeRange === "6h") {
          timestamp.setMinutes(timestamp.getMinutes() - i * 5);
        } else if (timeRange === "24h") {
          timestamp.setHours(timestamp.getHours() - i * 0.5);
        } else {
          timestamp.setDate(timestamp.getDate() - i * 0.25);
        }
        
        // Use real metrics if available, otherwise use mock data
        let cpuValue = 30 + Math.random() * 30;
        let memoryValue = 8 + Math.random() * 10;
        let diskValue = 20 + Math.random() * 30;
        let networkValue = 0.5 + Math.random() * 2;
        
        if (systemMetricsResponse.status === "fulfilled" && systemMetricsResponse.value.success && systemMetricsResponse.value.data) {
          const metrics = systemMetricsResponse.value.data;
          // Adjust values based on current metrics
          cpuValue = (metrics.cpu || 0) * (0.8 + Math.random() * 0.4);
          memoryValue = (metrics.memory || 0) * (0.7 + Math.random() * 0.6);
          diskValue = (metrics.disk || 0) * (0.9 + Math.random() * 0.2);
          networkValue = (metrics.network || 0) * (0.5 + Math.random() * 1.0);
        }
        
        processedResourceUsageData.push({
          time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cpu: cpuValue,
          memory: memoryValue,
          disk: diskValue,
          network: networkValue
        });
      }
      
      setSystemResources(processedSystemResources);
      setProcesses(processedProcesses);
      setOptimizationRules(processedOptimizationRules);
      setResourceUsageData(processedResourceUsageData);
    } catch (error) {
      console.error("Error fetching resource data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch resource usage data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = (id: string) => {
    setOptimizationRules(rules => 
      rules.map(rule => 
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    
    toast({
      title: "Success",
      description: "Optimization rule updated"
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing": return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "decreasing": return <TrendingUp className="w-4 h-4 text-green-500 rotate-180" />;
      default: return <Zap className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-green-500";
      case "sleeping": return "bg-yellow-500";
      case "stopped": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-700 border-red-500/30";
      case "normal": return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case "low": return "bg-green-500/20 text-green-700 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-700 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Resource Usage Optimizer</h1>
          <p className="text-muted-foreground">Monitor and optimize system resource consumption</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={timeRange === "1h" ? "default" : "outline"} 
            onClick={() => setTimeRange("1h")}
            size="sm"
          >
            1H
          </Button>
          <Button 
            variant={timeRange === "6h" ? "default" : "outline"} 
            onClick={() => setTimeRange("6h")}
            size="sm"
          >
            6H
          </Button>
          <Button 
            variant={timeRange === "24h" ? "default" : "outline"} 
            onClick={() => setTimeRange("24h")}
            size="sm"
          >
            24H
          </Button>
          <Button 
            variant={timeRange === "7d" ? "default" : "outline"} 
            onClick={() => setTimeRange("7d")}
            size="sm"
          >
            7D
          </Button>
        </div>
      </div>

      {/* Resource Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemResources.map((resource, index) => (
          <Card key={index} className="glass border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{resource.name}</CardTitle>
              {index === 0 && <Cpu className="h-4 w-4 text-muted-foreground" />}
              {index === 1 && <MemoryStick className="h-4 w-4 text-muted-foreground" />}
              {index === 2 && <HardDrive className="h-4 w-4 text-muted-foreground" />}
              {index === 3 && <Zap className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resource.current.toFixed(1)}{resource.unit}
                <span className="text-sm font-normal text-muted-foreground"> / {resource.max}{resource.unit}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(resource.trend)}
                <span className="text-xs text-muted-foreground">
                  {resource.trend === "increasing" ? "Increasing" : 
                   resource.trend === "decreasing" ? "Decreasing" : "Stable"}
                </span>
              </div>
              <Progress 
                value={resource.usagePercentage} 
                className="mt-2" 
              />
              {resource.recommendation && (
                <p className="text-xs text-muted-foreground mt-2">
                  {resource.recommendation}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resource Usage Chart */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resource Usage Over Time
          </CardTitle>
          <CardDescription>
            CPU, memory, disk, and network usage trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resourceUsageData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 6 }}
                  name="CPU %"
                />
                <Line 
                  type="monotone" 
                  dataKey="memory" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 6 }}
                  name="Memory %"
                />
                <Line 
                  type="monotone" 
                  dataKey="disk" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 6 }}
                  name="Disk %"
                />
                <Line 
                  type="monotone" 
                  dataKey="network" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 6 }}
                  name="Network %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Running Processes and Optimization Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Running Processes */}
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Running Processes
            </CardTitle>
            <CardDescription>
              Active system processes and resource consumption
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Process</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">CPU</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Memory</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((process) => (
                    <tr key={process.id} className="border-b border-border/30 last:border-0 hover:bg-primary/5 transition-colors">
                      <td className="py-3 px-2">
                        <div className="font-medium">{process.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Started {new Date(process.startTime).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Progress value={process.cpuUsage} className="w-20" />
                          <span className="text-sm">{process.cpuUsage.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Progress value={process.memoryUsage} className="w-20" />
                          <span className="text-sm">{process.memoryUsage.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(process.status)}`}></div>
                          <Badge 
                            variant="secondary" 
                            className={getPriorityColor(process.priority)}
                          >
                            {process.priority}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Optimization Rules */}
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Recycle className="h-5 w-5" />
              Optimization Rules
            </CardTitle>
            <CardDescription>
              Automated resource optimization policies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimizationRules.map((rule) => (
                <div 
                  key={rule.id} 
                  className="flex items-start gap-3 p-4 border border-border/50 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{rule.name}</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleRule(rule.id)}
                      >
                        {rule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                    {rule.lastTriggered && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Last triggered: {new Date(rule.lastTriggered).toLocaleString()}</span>
                      </div>
                    )}
                    {rule.savings && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>Estimated savings: {rule.savings}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Optimization Recommendations */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Optimization Recommendations
          </CardTitle>
          <CardDescription>
            Suggestions to improve resource efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-border/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-5 h-5 text-blue-500" />
                <h3 className="font-medium">CPU Optimization</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Consider implementing CPU throttling during low-activity periods to reduce energy consumption.
              </p>
              <Button size="sm" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>
            
            <div className="border border-border/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MemoryStick className="w-5 h-5 text-green-500" />
                <h3 className="font-medium">Memory Management</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Enable automatic memory cleanup to prevent leaks and optimize allocation.
              </p>
              <Button size="sm" variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Apply
              </Button>
            </div>
            
            <div className="border border-border/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-5 h-5 text-purple-500" />
                <h3 className="font-medium">Storage Efficiency</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Implement data compression and archiving for older records to reduce disk usage.
              </p>
              <Button size="sm" variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                Optimize
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
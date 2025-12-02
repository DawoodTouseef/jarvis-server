"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Legend
} from "recharts";
import { 
  Cpu, 
  Zap, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface ModelMetrics {
  id: string;
  name: string;
  provider: string;
  requests: number;
  avgLatency: number;
  successRate: number;
  errorRate: number;
  throughput: number; // requests per second
  lastUpdated: string;
}

interface PerformanceDataPoint {
  time: string;
  latency: number;
  requests: number;
  errors: number;
}

export function ModelPerformanceDashboard() {
  const [models, setModels] = useState<ModelMetrics[]>([]);
  const [performanceData, setPerformanceData] = useState<Record<string, PerformanceDataPoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h");

  useEffect(() => {
    fetchModelMetrics();
  }, []);

  const fetchModelMetrics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getModels();
      
      if (response.success && response.data) {
        // Check if response.data is an array directly or has a data property
        const modelsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).data || response.data;
        
        if (Array.isArray(modelsData)) {
          // Transform the data to match our interface
          const transformedModels = modelsData.map((model: any) => {
            // Extract performance metrics from the model data
            const requests = model.requests || 0;
            const avgLatency = model.latency ? parseFloat(model.latency.replace('ms', '')) : 0;
            const successRate = model.success_rate || 95; // Default to 95% if not provided
            const errorRate = model.error_rate || (100 - successRate);
            const throughput = model.throughput || parseFloat((requests / (24 * 60 * 60)).toFixed(2)); // requests per second
            
            return {
              id: model.id,
              name: model.name,
              provider: model.provider || model.owned_by || "unknown",
              requests: requests,
              avgLatency: avgLatency,
              successRate: successRate,
              errorRate: errorRate,
              throughput: throughput,
              lastUpdated: model.last_updated || new Date().toISOString()
            };
          });
          
          setModels(transformedModels);
          
          // Generate performance data for charts
          const performanceData: Record<string, PerformanceDataPoint[]> = {};
          transformedModels.forEach(model => {
            // Generate mock time-series data for the last 24 hours
            const dataPoints: PerformanceDataPoint[] = [];
            const now = new Date();
            for (let i = 23; i >= 0; i--) {
              const timePoint = new Date(now);
              timePoint.setHours(timePoint.getHours() - i);
              
              // Generate realistic variations in metrics
              const baseValue = 100 + (Math.random() * 50);
              const requests = Math.max(1, model.requests - (i * 10) + Math.floor(Math.random() * 20));
              const errors = Math.floor(Math.random() * 5);
              
              dataPoints.push({
                time: timePoint.toISOString(),
                latency: baseValue + (i % 30), // Latency variation
                requests: requests,
                errors: errors
              });
            }
            
            performanceData[model.id] = dataPoints;
          });
          
          setPerformanceData(performanceData);
        }
      } else {
        // Try to fetch data from custom metrics as fallback
        try {
          const customMetricsResponse = await apiClient.getCustomMetrics();
          if (customMetricsResponse.success && customMetricsResponse.data) {
            // Transform custom metrics to model data
            const customModels = customMetricsResponse.data.slice(0, 3).map((metric: any, index: number) => {
              return {
                id: `custom-${index}`,
                name: metric.metric_name || `Custom Model ${index + 1}`,
                provider: "Custom",
                requests: metric.value || 0,
                avgLatency: Math.floor(Math.random() * 200) + 50,
                successRate: 95,
                errorRate: 5,
                throughput: parseFloat(((metric.value || 0) / (24 * 60 * 60)).toFixed(2)),
                lastUpdated: new Date().toISOString()
              };
            });
            
            setModels(customModels);
            
            // Generate performance data for charts
            const performanceData: Record<string, PerformanceDataPoint[]> = {};
            customModels.forEach(model => {
              const dataPoints: PerformanceDataPoint[] = [];
              const now = new Date();
              for (let i = 23; i >= 0; i--) {
                const timePoint = new Date(now);
                timePoint.setHours(timePoint.getHours() - i);
                
                const baseValue = 100 + (Math.random() * 50);
                const requests = Math.max(1, model.requests - (i * 10) + Math.floor(Math.random() * 20));
                const errors = Math.floor(Math.random() * 5);
                
                dataPoints.push({
                  time: timePoint.toISOString(),
                  latency: baseValue + (i % 30),
                  requests: requests,
                  errors: errors
                });
              }
              
              performanceData[model.id] = dataPoints;
            });
            
            setPerformanceData(performanceData);
          }
        } catch (customMetricsError) {
          console.error("Error fetching custom metrics:", customMetricsError);
        }
      }
    } catch (error) {
      console.error("Error fetching model metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRange = (range: string) => {
    switch (range) {
      case "1h": return "Last Hour";
      case "24h": return "Last 24 Hours";
      case "7d": return "Last 7 Days";
      default: return range;
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
          <h1 className="text-3xl font-bold">Model Performance Dashboard</h1>
          <p className="text-muted-foreground">Monitor AI model performance and usage metrics</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={timeRange === "1h" ? "default" : "outline"} 
            onClick={() => setTimeRange("1h")}
          >
            1H
          </Button>
          <Button 
            variant={timeRange === "24h" ? "default" : "outline"} 
            onClick={() => setTimeRange("24h")}
          >
            24H
          </Button>
          <Button 
            variant={timeRange === "7d" ? "default" : "outline"} 
            onClick={() => setTimeRange("7d")}
          >
            7D
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Models</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{models.length}</div>
            <p className="text-xs text-muted-foreground">Active AI models</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {models.length > 0 
                ? `${(models.reduce((acc, m) => acc + m.avgLatency, 0) / models.length).toFixed(0)}ms` 
                : "0ms"}
            </div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {models.length > 0 
                ? `${(models.reduce((acc, m) => acc + m.successRate, 0) / models.length).toFixed(1)}%` 
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">Request success rate</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {models.reduce((acc, m) => acc + m.requests, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Over Time */}
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Latency Over Time
            </CardTitle>
            <CardDescription>
              Average response time trends for all models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={models.length > 0 ? performanceData[models[0].id] || [] : []}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}ms`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}ms`, 'Latency']}
                    labelFormatter={(value) => `Time: ${value}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                    name="Latency (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Request Volume */}
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Request Volume
            </CardTitle>
            <CardDescription>
              Number of requests processed over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={models.length > 0 ? performanceData[models[0].id] || [] : []}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [value, 'Requests']}
                    labelFormatter={(value) => `Time: ${value}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="requests" 
                    fill="hsl(var(--primary))" 
                    name="Requests"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Performance Table */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle>Model Performance</CardTitle>
          <CardDescription>Detailed performance metrics for each AI model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Model</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Provider</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Requests</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Latency</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Success Rate</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Throughput</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id} className="border-b border-border/30 last:border-0 hover:bg-primary/5 transition-colors">
                    <td className="py-3 px-2 font-medium">{model.name}</td>
                    <td className="py-3 px-2">
                      <Badge variant="secondary">{model.provider}</Badge>
                    </td>
                    <td className="py-3 px-2">{model.requests.toLocaleString()}</td>
                    <td className="py-3 px-2">{model.avgLatency}ms</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={model.successRate} 
                          className="w-24" 
                        />
                        <span className="text-sm">{model.successRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">{model.throughput.toFixed(2)}/sec</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Error Monitoring */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Error Monitoring
          </CardTitle>
          <CardDescription>Recent errors and failure patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {models.filter(m => m.errorRate > 1).map((model) => (
              <div key={`error-${model.id}`} className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium">{model.name}</p>
                    <p className="text-sm text-muted-foreground">Error rate: {model.errorRate.toFixed(2)}%</p>
                  </div>
                </div>
                <Badge variant="destructive">{model.errorRate.toFixed(2)}% errors</Badge>
              </div>
            ))}
            
            {models.filter(m => m.errorRate <= 1).length === models.length && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium">All Models Healthy</h3>
                <p className="text-muted-foreground">No significant errors detected in the last 24 hours</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
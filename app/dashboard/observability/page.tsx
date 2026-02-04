"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    BarChart3,
    Activity,
    Search,
    Filter,
    RefreshCcw,
    AlertCircle,
    CheckCircle2,
    Clock,
    ExternalLink,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { RecentActivityCard } from "@/components/observability/RecentActivityCard"
import { SystemStatusCard } from "@/components/observability/SystemStatusCard"
import { apiClient, LogEntry } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export default function ObservabilityPage() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [filters, setFilters] = useState({
        limit: 20,
        skip: 0,
        method: "",
        status: "",
        endpoint: "",
    })

    const fetchLogs = async (showToast = false) => {
        try {
            setRefreshing(true)
            const logsRes = await apiClient.getLogs({
                ...filters,
                status: filters.status ? parseInt(filters.status) : undefined,
            })

            if (logsRes.success && logsRes.data) {
                setLogs(logsRes.data)
            }

            if (showToast) {
                toast({
                    title: "Dashboard Refreshed",
                    description: "Latest API logs updated",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch logs",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchLogs()
        // Local table refresh every 30 seconds
        const interval = setInterval(() => fetchLogs(), 30000)
        return () => clearInterval(interval)
    }, [filters])

    const getStatusColor = (status: number) => {
        if (status < 300) return "text-green-500 bg-green-500/10 border-green-500/20"
        if (status < 400) return "text-blue-500 bg-blue-500/10 border-blue-500/20"
        if (status < 500) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
        return "text-red-500 bg-red-500/10 border-red-500/20"
    }

    const getMethodColor = (method: string) => {
        switch (method.toUpperCase()) {
            case "GET": return "text-blue-400"
            case "POST": return "text-green-400"
            case "PUT": return "text-yellow-400"
            case "DELETE": return "text-red-400"
            default: return "text-gray-400"
        }
    }

    if (loading && logs.length === 0) {
        return (
            <AuthGuard>
                <DashboardLayout>
                    <div className="flex items-center justify-center h-[50vh]">
                        <RefreshCcw className="w-8 h-8 animate-spin text-primary" />
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
                            <h1 className="text-4xl font-bold neon-text mb-2 flex items-center gap-3">
                                <Activity className="w-10 h-10 text-primary" />
                                API Observability
                            </h1>
                            <p className="text-muted-foreground">Monitor real-time API traffic and system performance</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="glass border-primary/20"
                                onClick={() => fetchLogs(true)}
                                disabled={refreshing}
                            >
                                <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                                Refresh All
                            </Button>
                        </div>
                    </div>


                    {/* Filters */}
                    <Card className="glass border-primary/20 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Filter by endpoint..."
                                    className="pl-9 glass border-primary/10 bg-transparent"
                                    value={filters.endpoint}
                                    onChange={(e) => setFilters({ ...filters, endpoint: e.target.value, skip: 0 })}
                                />
                            </div>
                            <select
                                className="w-full h-10 px-3 rounded-md glass border-primary/10 bg-transparent text-sm"
                                value={filters.method}
                                onChange={(e) => setFilters({ ...filters, method: e.target.value, skip: 0 })}
                            >
                                <option value="">All Methods</option>
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                            </select>
                            <select
                                className="w-full h-10 px-3 rounded-md glass border-primary/10 bg-transparent text-sm"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value, skip: 0 })}
                            >
                                <option value="">All Statuses</option>
                                <option value="200">200 OK</option>
                                <option value="400">400 Bad Request</option>
                                <option value="401">401 Unauthorized</option>
                                <option value="403">403 Forbidden</option>
                                <option value="404">404 Not Found</option>
                                <option value="500">500 Server Error</option>
                            </select>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setFilters({ ...filters, skip: Math.max(0, filters.skip - filters.limit) })}
                                    disabled={filters.skip === 0}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="text-xs font-mono">Page {Math.floor(filters.skip / filters.limit) + 1}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setFilters({ ...filters, skip: filters.skip + filters.limit })}
                                    disabled={logs.length < filters.limit}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Logs Table */}
                    <Card className="glass border-primary/20 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-primary/10 bg-primary/5">
                                        <th className="p-4 text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">Method</th>
                                        <th className="p-4 text-xs font-semibold uppercase text-muted-foreground">Endpoint</th>
                                        <th className="p-4 text-xs font-semibold uppercase text-muted-foreground">Status</th>
                                        <th className="p-4 text-xs font-semibold uppercase text-muted-foreground">Latency</th>
                                        <th className="p-4 text-xs font-semibold uppercase text-muted-foreground">Source</th>
                                        <th className="p-4 text-xs font-semibold uppercase text-muted-foreground">Time</th>
                                        <th className="p-4 text-xs font-semibold uppercase text-muted-foreground text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-primary/5">
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                No request logs found for current filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-primary/5 transition-colors group">
                                                <td className="p-4">
                                                    <span className={`font-bold font-mono text-xs ${getMethodColor(log.method)}`}>
                                                        {log.method}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <code className="text-xs text-primary/80 block max-w-[300px] truncate" title={log.endpoint}>
                                                        {log.endpoint}
                                                    </code>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className={`font-mono text-[10px] ${getStatusColor(log.response_status)}`}>
                                                        {log.response_status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-xs font-mono ${log.latency_ms > 500 ? "text-orange-400" : "text-muted-foreground"}`}>
                                                        {log.latency_ms}ms
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="secondary" className="text-[10px] uppercase">{log.source}</Badge>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Button variant="ghost" size="icon" className="group-hover:text-primary">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </DashboardLayout>
        </AuthGuard>
    )
}

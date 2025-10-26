"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Plus, Play, Pause, Trash2, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Pipeline {
  id: string
  name: string
  description: string
  status: "running" | "paused" | "completed" | "failed"
  steps: number
  lastRun: Date
  executions: number
  successRate: number
}

export function PipelineSystem() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([
    {
      id: "1",
      name: "Daily Report Generation",
      description: "Generates and emails daily analytics reports",
      status: "running",
      steps: 5,
      lastRun: new Date(),
      executions: 234,
      successRate: 98.5,
    },
    {
      id: "2",
      name: "Content Moderation",
      description: "Automatically moderates user-generated content",
      status: "running",
      steps: 3,
      lastRun: new Date(Date.now() - 3600000),
      executions: 1456,
      successRate: 99.2,
    },
    {
      id: "3",
      name: "Data Backup",
      description: "Backs up database to cloud storage",
      status: "completed",
      steps: 4,
      lastRun: new Date(Date.now() - 7200000),
      executions: 89,
      successRate: 100,
    },
    {
      id: "4",
      name: "Image Processing",
      description: "Processes and optimizes uploaded images",
      status: "paused",
      steps: 6,
      lastRun: new Date(Date.now() - 86400000),
      executions: 567,
      successRate: 97.8,
    },
  ])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const togglePipelineStatus = (id: string) => {
    setPipelines((prev) =>
      prev.map((pipeline) =>
        pipeline.id === id
          ? {
              ...pipeline,
              status: pipeline.status === "running" ? "paused" : "running",
            }
          : pipeline,
      ),
    )
  }

  const deletePipeline = (id: string) => {
    setPipelines((prev) => prev.filter((pipeline) => pipeline.id !== id))
  }

  const getStatusIcon = (status: Pipeline["status"]) => {
    switch (status) {
      case "running":
        return <Play className="w-4 h-4" />
      case "paused":
        return <Pause className="w-4 h-4" />
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />
      case "failed":
        return <XCircle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: Pipeline["status"]) => {
    switch (status) {
      case "running":
        return "bg-primary/20 text-primary border-primary/30"
      case "paused":
        return "bg-secondary/20 text-secondary border-secondary/30"
      case "completed":
        return "bg-accent/20 text-accent border-accent/30"
      case "failed":
        return "bg-destructive/20 text-destructive border-destructive/30"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold neon-text mb-2">Task Pipelines</h1>
          <p className="text-muted-foreground">Automate workflows and manage task execution</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="neon-glow">
              <Plus className="w-4 h-4 mr-2" />
              Create Pipeline
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong border-primary/20">
            <DialogHeader>
              <DialogTitle className="neon-text">Create New Pipeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Pipeline Name</Label>
                <Input placeholder="My Automation Pipeline" className="glass border-primary/20" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what this pipeline does..."
                  className="glass border-primary/20"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Input placeholder="Schedule or event trigger" className="glass border-primary/20" />
              </div>
              <Button className="w-full neon-glow" onClick={() => setIsCreateDialogOpen(false)}>
                Create Pipeline
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pipelines</p>
              <p className="text-3xl font-bold mt-1">{pipelines.length}</p>
            </div>
            <Zap className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Running</p>
              <p className="text-3xl font-bold mt-1">{pipelines.filter((p) => p.status === "running").length}</p>
            </div>
            <Play className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Executions</p>
              <p className="text-3xl font-bold mt-1">{pipelines.reduce((acc, p) => acc + p.executions, 0)}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-accent" />
          </div>
        </Card>
        <Card className="glass border-primary/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Success Rate</p>
              <p className="text-3xl font-bold mt-1">
                {(pipelines.reduce((acc, p) => acc + p.successRate, 0) / pipelines.length).toFixed(1)}%
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-secondary" />
          </div>
        </Card>
      </div>

      {/* Pipelines Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pipelines.map((pipeline) => (
          <Card key={pipeline.id} className="glass border-primary/20 p-6 hover:border-primary/40 transition-all group">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-3 glass rounded-lg border border-primary/30 group-hover:border-primary/50 transition-all">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1">{pipeline.name}</h3>
                    <p className="text-sm text-muted-foreground">{pipeline.description}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(pipeline.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(pipeline.status)}
                    {pipeline.status}
                  </span>
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 py-4 border-y border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground">Steps</p>
                  <p className="text-sm font-medium mt-1">{pipeline.steps}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Executions</p>
                  <p className="text-sm font-medium mt-1">{pipeline.executions}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="text-sm font-medium mt-1">{pipeline.successRate}%</p>
                </div>
              </div>

              {/* Last Run */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  Last run:{" "}
                  {pipeline.lastRun.toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 glass border-primary/30 bg-transparent"
                  onClick={() => togglePipelineStatus(pipeline.id)}
                >
                  {pipeline.status === "running" ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="glass border-destructive/30 text-destructive hover:bg-destructive/10 bg-transparent"
                  onClick={() => deletePipeline(pipeline.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Executions */}
      <Card className="glass border-primary/20 p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Executions</h2>
        <div className="space-y-3">
          {[
            { pipeline: "Daily Report Generation", status: "completed", time: "2 min ago", duration: "1.2s" },
            { pipeline: "Content Moderation", status: "completed", time: "5 min ago", duration: "0.8s" },
            { pipeline: "Image Processing", status: "failed", time: "15 min ago", duration: "3.4s" },
            { pipeline: "Data Backup", status: "completed", time: "2 hours ago", duration: "45.2s" },
          ].map((execution, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 glass rounded-lg border border-primary/10"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${execution.status === "completed" ? "bg-accent" : "bg-destructive"}`}
                />
                <div>
                  <p className="text-sm font-medium">{execution.pipeline}</p>
                  <p className="text-xs text-muted-foreground">{execution.time}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant={execution.status === "completed" ? "default" : "destructive"}
                  className={execution.status === "completed" ? "bg-accent/20 text-accent border-accent/30" : ""}
                >
                  {execution.status}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{execution.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

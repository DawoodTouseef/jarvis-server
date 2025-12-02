"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface ChatMetrics {
  totalChats: number;
  activeChats: number;
  avgMessagesPerChat: number;
  avgResponseTime: number;
  satisfactionRate: number;
  resolutionRate: number;
}

interface ChatVolumeDataPoint {
  time: string;
  chatCount: number;
  messageCount: number;
  botMessages: number;
  userMessages: number;
}

interface ModelPerformance {
  model: string;
  usage: number;
  avgResponseTime: number;
  satisfaction: number;
}

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
}

interface ChatTopic {
  topic: string;
  count: number;
  sentiment: number;
}

export function EnhancedChatAnalytics() {
  const [chatMetrics, setChatMetrics] = useState<ChatMetrics>({
    totalChats: 0,
    activeChats: 0,
    avgMessagesPerChat: 0,
    avgResponseTime: 0,
    satisfactionRate: 0,
    resolutionRate: 0
  });
  
  const [chatVolumeData, setChatVolumeData] = useState<ChatVolumeDataPoint[]>([]);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData>({ positive: 0, neutral: 0, negative: 0 });
  const [chatTopics, setChatTopics] = useState<ChatTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");

  useEffect(() => {
    fetchChatAnalytics();
  }, [timeRange]);

  const fetchChatAnalytics = async () => {
    try {
      setLoading(true);
      
      // Simulate API call with mock data
      const mockChatMetrics: ChatMetrics = {
        totalChats: 1240,
        activeChats: 86,
        avgMessagesPerChat: 18.4,
        avgResponseTime: 1.2,
        satisfactionRate: 87,
        resolutionRate: 92
      };
      
      const mockChatVolumeData: ChatVolumeDataPoint[] = [];
      let timePoints: string[] = [];
      
      if (timeRange === "24h") {
        // Hourly data for 24 hours
        for (let i = 23; i >= 0; i--) {
          const date = new Date();
          date.setHours(date.getHours() - i);
          timePoints.push(date.toLocaleTimeString([], { hour: '2-digit' }));
        }
      } else if (timeRange === "7d") {
        // Daily data for 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          timePoints.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        }
      } else {
        // Daily data for 30 days
        for (let i = 29; i >= 0; i -= 2) { // Show every 2nd day to fit chart
          const date = new Date();
          date.setDate(date.getDate() - i);
          timePoints.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
      }
      
      timePoints.forEach(time => {
        mockChatVolumeData.push({
          time,
          chatCount: Math.floor(Math.random() * 50) + 20,
          messageCount: Math.floor(Math.random() * 300) + 100,
          botMessages: Math.floor(Math.random() * 200) + 50,
          userMessages: Math.floor(Math.random() * 150) + 80
        });
      });
      
      const mockModelPerformance: ModelPerformance[] = [
        { model: "GPT-4", usage: 45, avgResponseTime: 1.1, satisfaction: 92 },
        { model: "Claude 2", usage: 30, avgResponseTime: 1.4, satisfaction: 88 },
        { model: "LLaMA 2", usage: 15, avgResponseTime: 2.2, satisfaction: 82 },
        { model: "PaLM 2", usage: 10, avgResponseTime: 1.8, satisfaction: 85 }
      ];
      
      const mockSentimentData: SentimentData = {
        positive: 72,
        neutral: 18,
        negative: 10
      };
      
      const mockChatTopics: ChatTopic[] = [
        { topic: "Technical Support", count: 320, sentiment: 78 },
        { topic: "Product Information", count: 280, sentiment: 85 },
        { topic: "Billing Questions", count: 190, sentiment: 65 },
        { topic: "Feature Requests", count: 150, sentiment: 90 },
        { topic: "Account Management", count: 130, sentiment: 72 },
        { topic: "Other", count: 170, sentiment: 80 }
      ];
      
      setChatMetrics(mockChatMetrics);
      setChatVolumeData(mockChatVolumeData);
      setModelPerformance(mockModelPerformance);
      setSentimentData(mockSentimentData);
      setChatTopics(mockChatTopics);
    } catch (error) {
      console.error("Error fetching chat analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const SENTIMENT_COLORS = ["#10b981", "#94a3b8", "#ef4444"];
  const TOPIC_COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe", "#eff6ff"];

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
          <h1 className="text-3xl font-bold">Enhanced Chat Analytics</h1>
          <p className="text-muted-foreground">Deep insights into chat interactions and performance</p>
        </div>
        <div className="flex gap-2">
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
          <Button 
            variant={timeRange === "30d" ? "default" : "outline"} 
            onClick={() => setTimeRange("30d")}
          >
            30D
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatMetrics.totalChats.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% from last period</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatMetrics.avgMessagesPerChat}</div>
            <p className="text-xs text-muted-foreground">Per conversation</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatMetrics.satisfactionRate}%</div>
            <p className="text-xs text-muted-foreground">User satisfaction rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Chat Volume and Response Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Volume */}
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Chat Volume
            </CardTitle>
            <CardDescription>
              Conversations and messages over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chatVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="chatCount" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                    name="Chats"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="messageCount" 
                    stackId="2" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                    name="Messages"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Message Distribution */}
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message Distribution
            </CardTitle>
            <CardDescription>
              Bot vs user message breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chatVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar 
                    dataKey="botMessages" 
                    fill="#3b82f6" 
                    name="Bot Messages"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="userMessages" 
                    fill="#10b981" 
                    name="User Messages"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Performance and Sentiment Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Performance */}
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Model Performance
            </CardTitle>
            <CardDescription>
              Comparison of AI model effectiveness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="model" 
                    type="category" 
                    scale="band" 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar 
                    dataKey="usage" 
                    fill="#3b82f6" 
                    name="Usage %"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar 
                    dataKey="satisfaction" 
                    fill="#10b981" 
                    name="Satisfaction %"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Analysis */}
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5" />
              Sentiment Analysis
            </CardTitle>
            <CardDescription>
              Overall user sentiment distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Positive", value: sentimentData.positive },
                        { name: "Neutral", value: sentimentData.neutral },
                        { name: "Negative", value: sentimentData.negative }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {SENTIMENT_COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{sentimentData.positive}%</div>
                  <div className="text-sm text-muted-foreground">Positive</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-500">{sentimentData.neutral}%</div>
                  <div className="text-sm text-muted-foreground">Neutral</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{sentimentData.negative}%</div>
                  <div className="text-sm text-muted-foreground">Negative</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Topics and Resolution Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Chat Topics */}
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle>Popular Chat Topics</CardTitle>
            <CardDescription>
              Most frequently discussed subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chatTopics.map((topic, index) => (
                <div key={topic.topic} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: TOPIC_COLORS[index % TOPIC_COLORS.length] }}
                      ></div>
                      <span className="font-medium">{topic.topic}</span>
                    </div>
                    <span className="text-sm">{topic.count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-primary" 
                        style={{ width: `${(topic.count / Math.max(...chatTopics.map(t => t.count))) * 100}%` }}
                      ></div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {topic.sentiment}% positive
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resolution Metrics */}
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle>Resolution Metrics</CardTitle>
            <CardDescription>
              First contact resolution and escalation rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">First Contact Resolution</span>
                  <span className="font-bold text-green-600">{chatMetrics.resolutionRate}%</span>
                </div>
                <div className="bg-muted rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-green-500" 
                    style={{ width: `${chatMetrics.resolutionRate}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Issues resolved without escalation
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Avg. Response Time</span>
                  <span className="font-bold">{chatMetrics.avgResponseTime}s</span>
                </div>
                <div className="bg-muted rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-blue-500" 
                    style={{ width: `${Math.min(100, chatMetrics.avgResponseTime * 20)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Time taken to respond to user messages
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Escalation Rate</span>
                  <span className="font-bold text-red-600">{100 - chatMetrics.resolutionRate}%</span>
                </div>
                <div className="bg-muted rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-red-500" 
                    style={{ width: `${100 - chatMetrics.resolutionRate}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Conversations requiring human intervention
                </p>
              </div>
              
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">High Resolution Rate</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-500/30">
                    +5% improvement
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
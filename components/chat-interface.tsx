"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Plus, MoreVertical, Trash2, Edit, Bot, User, Sparkles, Copy, Check, RefreshCw } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

export function ChatInterface() {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      title: "New Conversation",
      messages: [
        {
          id: "1",
          role: "assistant",
          content: "Hello! I'm your AI assistant. How can I help you today?",
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
    },
  ])
  const [activeChat, setActiveChat] = useState<string>("1")
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const currentChat = chats.find((chat) => chat.id === activeChat)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [currentChat?.messages])

  const handleSend = async () => {
    if (!input.trim() || !currentChat) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setChats((prev) =>
      prev.map((chat) => (chat.id === activeChat ? { ...chat, messages: [...chat.messages, userMessage] } : chat)),
    )

    setInput("")
    setIsLoading(true)

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `I received your message: "${input}". This is a demo response. In a real implementation, this would connect to your AI backend API.`,
      timestamp: new Date(),
    }

    setChats((prev) =>
      prev.map((chat) => (chat.id === activeChat ? { ...chat, messages: [...chat.messages, assistantMessage] } : chat)),
    )

    setIsLoading(false)
  }

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Hello! I'm your AI assistant. How can I help you today?",
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
    }
    setChats((prev) => [newChat, ...prev])
    setActiveChat(newChat.id)
  }

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId))
    if (activeChat === chatId && chats.length > 1) {
      setActiveChat(chats.find((chat) => chat.id !== chatId)?.id || "")
    }
  }

  const handleCopy = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(messageId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Chat List Sidebar */}
      <Card className="w-80 glass border-primary/20 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button size="icon" variant="ghost" onClick={handleNewChat} className="hover:bg-primary/10">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 rounded-lg cursor-pointer transition-all group ${
                  activeChat === chat.id
                    ? "glass-strong border border-primary/40 neon-glow"
                    : "glass border border-primary/10 hover:border-primary/30"
                }`}
                onClick={() => setActiveChat(chat.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {chat.messages[chat.messages.length - 1]?.content}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-strong border-primary/20">
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteChat(chat.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 glass border-primary/20 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 glass rounded-lg border border-primary/30">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">{currentChat?.title}</h2>
              <p className="text-xs text-muted-foreground">AI Assistant Active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground">Online</span>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6 max-w-4xl mx-auto">
            {currentChat?.messages.map((message) => (
              <div key={message.id} className={`flex gap-4 ${message.role === "user" ? "justify-end" : ""}`}>
                {message.role === "assistant" && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div
                  className={`flex-1 max-w-2xl space-y-2 ${message.role === "user" ? "flex flex-col items-end" : ""}`}
                >
                  <div
                    className={`p-4 rounded-xl ${
                      message.role === "user"
                        ? "glass-strong border border-primary/40 ml-auto"
                        : "glass border border-primary/20"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 hover:bg-primary/10"
                          onClick={() => handleCopy(message.content, message.id)}
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3 h-3 text-primary" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-primary/10">
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-chart-4 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="glass border border-primary/20 p-4 rounded-xl">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-primary/20">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type your message..."
              className="glass border-primary/20 focus:border-primary/50"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()} className="neon-glow">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

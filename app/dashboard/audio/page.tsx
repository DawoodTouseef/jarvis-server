"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Mic, AudioLines, Play, Square, Upload, Download, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

export default function AudioPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [textToSpeech, setTextToSpeech] = useState("")
  const [audioConfig, setAudioConfig] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load audio configuration on component mount
  useEffect(() => {
    const fetchAudioConfig = async () => {
      try {
        const response = await apiClient.getAudioConfig()
        if (response.success) {
          setAudioConfig(response.data)
        }
      } catch (error) {
        console.error("Error fetching audio config:", error)
        toast({
          title: "Error",
          description: "Failed to load audio configuration",
          variant: "destructive"
        })
      }
    }
    
    fetchAudioConfig()
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Try different MIME types for better browser compatibility
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav'
      ]
      
      let options = {}
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          options = { mimeType }
          break
        }
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, options)
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event.error)
        toast({
          title: "Error",
          description: "Error recording audio. Please try again.",
          variant: "destructive"
        })
      }
      
      mediaRecorderRef.current.onstop = async () => {
        // Wait a bit to ensure all data is collected
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (audioChunksRef.current.length === 0) {
          toast({
            title: "Error",
            description: "No audio data recorded. Please try again.",
            variant: "destructive"
          })
          stream.getTracks().forEach(track => track.stop())
          setIsRecording(false)
          setIsProcessing(false)
          return
        }
        
        setIsProcessing(true)
        
        // Use the correct MIME type for the blob
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        
        // Check if the blob is empty
        if (audioBlob.size === 0) {
          toast({
            title: "Error",
            description: "Recorded audio is empty. Please try again.",
            variant: "destructive"
          })
          stream.getTracks().forEach(track => track.stop())
          setIsRecording(false)
          setIsProcessing(false)
          return
        }
        
        // Create a FormData object to send the file
        const fileExtension = mimeType.includes('webm') ? 'webm' : 
                             mimeType.includes('ogg') ? 'ogg' : 
                             mimeType.includes('mp4') ? 'mp4' : 'wav'
        const file = new File([audioBlob], `recording.${fileExtension}`, { type: mimeType })
        
        try {
          const response = await apiClient.transcribeAudio(file)
          console.log("Transcription response:", response)
          if (response.success && response.data) {
            setTranscript(response.data.text || "Transcription completed successfully")
            toast({
              title: "Success",
              description: "Audio transcribed successfully"
            })
          } else {
            throw new Error(response.error || "Transcription failed")
          }
        } catch (error) {
          console.error("Error transcribing audio:", error)
          toast({
            title: "Error",
            description: "Failed to transcribe audio",
            variant: "destructive"
          })
          setTranscript("Error transcribing audio. Please try again.")
        } finally {
          setIsProcessing(false)
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      // Start recording with 1 second time slices
      mediaRecorderRef.current.start(1000)
      setIsRecording(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast({
        title: "Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive"
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const playTextToSpeech = async () => {
    if (!textToSpeech.trim()) {
      toast({
        title: "Warning",
        description: "Please enter some text to convert to speech",
        variant: "destructive"
      })
      return
    }
    
    try {
      setIsProcessing(true)
      const response = await apiClient.textToSpeech(textToSpeech)
      console.log("Text-to-speech response:", response.data)
      if (response.success && response.data) {
        console.log(response.data.message)
        console.log(typeof response.data.message)
        const audioUrl = URL.createObjectURL(response.data)
        
        // Play the audio
        const audio = new Audio(audioUrl)
        audio.onended = () => {
          setIsPlaying(false)
          URL.revokeObjectURL(audioUrl)
        }
        audio.play()
        setIsPlaying(true)
        
        toast({
          title: "Playing",
          description: "Text converted to speech successfully"
        })
      } else {
        throw new Error(response.error || "Failed to generate speech")
      }
    } catch (error) {
      console.error("Error playing text-to-speech:", error)
      toast({
        title: "Error",
        description: "Failed to convert text to speech",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check if file is empty
      if (file.size === 0) {
        toast({
          title: "Error",
          description: "Selected file is empty. Please choose a valid audio file.",
          variant: "destructive"
        })
        return
      }
      if (file.size > audioConfig?.maxFileSize) {
        toast({
          title: "Error",
          description: `File size exceeds the limit of ${audioConfig?.maxFileSize} bytes.`,
          variant: "destructive"
        })
        return
      }
      try {
        setIsProcessing(true)
        const response = await apiClient.transcribeAudio(file)
        if (response.success && response.data) {
          setTranscript(response.data.text || "Transcription completed successfully")
          toast({
            title: "Success",
            description: `Processed ${file.name} successfully`
          })
        } else {
          throw new Error(response.error || "Transcription failed")
        }
      } catch (error) {
        console.error("Error processing audio file:", error)
        toast({
          title: "Error",
          description: `Failed to process ${file.name}`,
          variant: "destructive"
        })
        setTranscript("Error processing audio file. Please try again.")
      } finally {
        setIsProcessing(false)
      }
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold neon-text mb-2">Audio Processing</h1>
            <p className="text-muted-foreground">Speech recognition and audio generation</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Speech to Text Section */}
            <Card className="glass border-primary/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mic className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Speech to Text</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <Button 
                    size="lg" 
                    className={`rounded-full w-24 h-24 ${isRecording ? 'animate-pulse bg-red-500 hover:bg-red-600' : ''}`}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                  >
                    {isRecording ? (
                      <Square className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {isRecording ? "Recording... Click to stop" : "Click to start recording"}
                  </p>
                  {isProcessing && (
                    <p className="text-sm text-muted-foreground">Processing audio...</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Transcript</Label>
                  <Textarea 
                    value={transcript} 
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Your speech will appear here..."
                    className="min-h-[120px]"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <Label>Upload Audio File</Label>
                  <Input 
                    type="file" 
                    accept="audio/*" 
                    onChange={handleFileUpload}
                    className="hidden" 
                    id="audio-upload"
                    disabled={isProcessing}
                  />
                  <Label htmlFor="audio-upload">
                    <Button variant="outline" className="cursor-pointer" disabled={isProcessing}>
                      Choose File
                    </Button>
                  </Label>
                </div>
              </div>
            </Card>
            
            {/* Text to Speech Section */}
            <Card className="glass border-primary/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AudioLines className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Text to Speech</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Text to Convert</Label>
                  <Textarea 
                    value={textToSpeech} 
                    onChange={(e) => setTextToSpeech(e.target.value)}
                    placeholder="Enter text to convert to speech..."
                    className="min-h-[120px]"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={playTextToSpeech}
                    disabled={isPlaying || isProcessing}
                    className="flex-1"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isPlaying ? "Playing..." : "Play"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={stopPlayback}
                    disabled={!isPlaying}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <Button variant="outline" size="sm">
                    Download Audio
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Audio Configuration */}
          {audioConfig && (
            <Card className="glass border-primary/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AudioLines className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Audio Configuration</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Speech-to-Text Engine</h3>
                  <p className="text-sm text-muted-foreground">
                    {audioConfig.stt?.ENGINE || "Not configured"}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Text-to-Speech Engine</h3>
                  <p className="text-sm text-muted-foreground">
                    {audioConfig.tts?.ENGINE || "Not configured"}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">STT Model</h3>
                  <p className="text-sm text-muted-foreground">
                    {audioConfig.stt?.MODEL || "Default"}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">TTS Voice</h3>
                  <p className="text-sm text-muted-foreground">
                    {audioConfig.tts?.VOICE || "Default"}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <Button variant="outline" onClick={() => {
                  // Redirect to settings page audio tab
                  window.location.href = '/dashboard/settings?tab=audio'
                }}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Audio Settings
                </Button>
              </div>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
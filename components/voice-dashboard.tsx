"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Terminal, Activity, CheckCircle2, Play, Layout, ChevronRight, AlertCircle } from "lucide-react"
import { fetchTasks, completeTask, startProject } from "@/lib/sap-service"
import { parseVoiceIntent } from "@/lib/gemini-service"
import type { Task, LogEntry, ParsedIntent } from "@/lib/types"
import { cn } from "@/lib/utils"

export function VoiceDashboard() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [debugMode, setDebugMode] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Web Speech API ref
  const recognitionRef = useRef<any>(null)

  const addLog = (source: LogEntry["source"], message: string, details?: any) => {
    setLogs((prevLogs: LogEntry[]) => [
      {
        timestamp: new Date().toLocaleTimeString(),
        source,
        message,
        details,
      },
      ...prevLogs,
    ])
  }

  useEffect(() => {
    // Initialize Mock Data
    handleFetchTasks()

    // Initialize Speech Recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false

        recognitionRef.current.onstart = () => {
          setIsListening(true)
          setTranscript("")
          setError(null)
          addLog("System", "Listening started...")
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
          addLog("System", "Listening stopped")
        }

        recognitionRef.current.onresult = (event: any) => {
          const last = event.results.length - 1
          const text = event.results[last][0].transcript
          setTranscript(text)
          addLog("User", `Recognized: "${text}"`)
          processCommand(text)
        }

        recognitionRef.current.onerror = (event: any) => {
          setError("Microphone error: " + event.error)
          setIsListening(false)
        }
      } else {
        setError("Speech Recognition not supported in this browser.")
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  const processCommand = async (text: string) => {
    setIsProcessing(true)
    try {
      // 1. Parse Intent (Gemini)
      addLog("System", "Sending to Gemini...")
      const parsed = await parseVoiceIntent(text)
      addLog("Gemini", `Intent: ${parsed.intent}`, parsed)

      // 2. Execute SAP Action
      switch (parsed.intent) {
        case "LIST_TASKS":
          await handleFetchTasks()
          break
        case "APPROVE_TASK":
          await handleApproveTask(parsed)
          break
        case "START_PROJECT":
          await handleStartProject(parsed)
          break
        default:
          addLog("System", "Could not understand command")
      }
    } catch (err) {
      addLog("System", "Error processing command", err)
      setError("Failed to process command")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFetchTasks = async () => {
    try {
      addLog("System", "Fetching tasks from SAP...")
      const data = await fetchTasks()
      setTasks(data)
      addLog("SAP", `Fetched ${data.length} tasks`)
    } catch (err) {
      addLog("SAP", "Error fetching tasks", err)
    }
  }

  const handleApproveTask = async (parsed: ParsedIntent) => {
    // Simple fuzzy match for demo purposes
    const task = tasks.find(
      (t: Task) =>
        t.title.toLowerCase().includes(parsed.entity?.toLowerCase() || "") ||
        t.description?.toLowerCase().includes(parsed.entity?.toLowerCase() || ""),
    )

    if (task) {
      addLog("System", `Found task: ${task.title}`)
      await completeTask(task.id)
      addLog("SAP", `Approved task ${task.id}`)
      await handleFetchTasks() // Refresh list
    } else {
      addLog("System", `No matching task found for "${parsed.entity}"`)
    }
  }

  const handleStartProject = async (parsed: ParsedIntent) => {
    const projectName = parsed.entity || "New Project"
    addLog("System", `Starting project: ${projectName}`)
    const id = await startProject(projectName)
    addLog("SAP", `Project started with ID: ${id}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800">SAP Build Voice Command</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              debugMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            <Terminal className="w-4 h-4" />
            {debugMode ? "Dev Mode On" : "Dev Mode Off"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interaction Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Voice Control Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 opacity-50" />

            <div className="mb-6">
              <h2 className="text-2xl font-light text-slate-700 mb-2">What would you like to do?</h2>
              <p className="text-slate-400">Try "Show me pending tasks" or "Start project Alpha"</p>
            </div>

            <div className="flex justify-center mb-8">
              <button
                onClick={toggleListening}
                disabled={isProcessing}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                  isListening
                    ? "bg-red-500 text-white animate-pulse ring-4 ring-red-100"
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 hover:shadow-blue-200",
                  isProcessing && "bg-slate-400 cursor-not-allowed animate-none",
                )}
              >
                {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
              </button>
            </div>

            <div className="h-8 flex items-center justify-center">
              {isListening && <span className="text-red-500 font-medium animate-pulse">Listening...</span>}
              {isProcessing && (
                <span className="text-blue-600 font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-spin" /> Processing...
                </span>
              )}
              {!isListening && !isProcessing && transcript && <p className="text-slate-600 italic">"{transcript}"</p>}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* Tasks List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                Active Tasks
              </h3>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {tasks.length} Pending
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No active tasks found</div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-slate-900 mb-1">{task.title}</h4>
                        {task.description && <p className="text-sm text-slate-500 mb-2">{task.description}</p>}
                        <div className="flex gap-2">
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded border",
                              task.priority === "HIGH"
                                ? "bg-red-50 border-red-100 text-red-700"
                                : task.priority === "MEDIUM"
                                  ? "bg-amber-50 border-amber-100 text-amber-700"
                                  : "bg-green-50 border-green-100 text-green-700",
                            )}
                          >
                            {task.priority}
                          </span>
                          <span className="text-xs text-slate-400 px-2 py-0.5">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={() => completeTask(task.id)}
                          className="p-2 hover:bg-green-100 text-green-600 rounded-full"
                          title="Approve"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Debug Panel */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Play className="w-4 h-4 text-indigo-500" />
              Quick Simulations
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => processCommand("Show me pending tasks")}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-600 flex items-center justify-between group"
              >
                "Show me pending tasks"
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => processCommand("Approve the invoice")}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-600 flex items-center justify-between group"
              >
                "Approve the invoice"
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => processCommand("Start project Phoenix")}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-600 flex items-center justify-between group"
              >
                "Start project Phoenix"
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>

          {/* Debug Log */}
          {debugMode && (
            <div className="bg-slate-900 rounded-xl shadow-lg overflow-hidden text-slate-300 text-xs font-mono border border-slate-700">
              <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                <span className="font-semibold text-white">System Logs</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-700 text-[10px]">{logs.length} events</span>
              </div>
              <div className="h-[400px] overflow-y-auto p-4 space-y-3">
                {logs.map((log, i) => (
                  <div key={i} className="border-l-2 border-slate-600 pl-3">
                    <div className="flex gap-2 mb-1 opacity-70">
                      <span>[{log.timestamp}]</span>
                      <span
                        className={cn(
                          "font-bold",
                          log.source === "SAP"
                            ? "text-blue-400"
                            : log.source === "Gemini"
                              ? "text-purple-400"
                              : log.source === "User"
                                ? "text-green-400"
                                : "text-slate-400",
                        )}
                      >
                        {log.source}
                      </span>
                    </div>
                    <div className="text-slate-100 break-words">{log.message}</div>
                    {log.details && (
                      <pre className="mt-1 bg-black/30 p-2 rounded overflow-x-auto text-[10px] text-slate-400">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

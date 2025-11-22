export interface Task {
  id: string
  title: string
  status: "READY" | "COMPLETED" | "IN_PROGRESS"
  createdAt: string
  description?: string
  priority?: "HIGH" | "MEDIUM" | "LOW"
}

export type IntentType = "LIST_TASKS" | "APPROVE_TASK" | "START_PROJECT" | "UNKNOWN"

export interface ParsedIntent {
  intent: IntentType
  entity?: string // e.g., "Acme invoice" or "Project Beta"
  confidence: number
  originalTranscript: string
}

export interface LogEntry {
  timestamp: string
  source: "System" | "User" | "SAP" | "Gemini"
  message: string
  details?: any
}

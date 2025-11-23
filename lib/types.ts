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

export type { SAPTask } from "./sap-types"

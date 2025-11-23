// lib/sap-types.ts

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
export type TaskStatus = "READY" | "RESERVED" | "COMPLETED" | "CANCELED"

// 1. The shape of a Task (for listing My Inbox)
export interface SAPTask {
  id: string
  subject: string // e.g., "Approve Invoice"
  createdAt: string // ISO Date
  priority: TaskPriority
  status: TaskStatus
  description?: string
}

// 2. The payload to Start a Project
export interface StartWorkflowRequest {
  definitionId: string // The ID of your process (from SAP Build)
  context: Record<string, any> // Your form data (Project Name, Budget, etc.)
}

// 3. The payload to Approve/Reject
export type TaskDecision = "APPROVE" | "REJECT"

export interface CompleteTaskRequest {
  status: "COMPLETED"
  decision: TaskDecision // e.g., "APPROVE" or "REJECT"
  context?: Record<string, any> // Optional: Add comments or update data
}

// 4. The response when a Workflow starts
export interface WorkflowInstance {
  id: string
  definitionId: string
  subject: string
  status: "RUNNING" | "ERRONEOUS" | "SUSPENDED" | "CANCELED" | "COMPLETED"
  startedAt: string
  context?: Record<string, any> // Optional: Add comments or update data
}
import { SAP_CONFIG } from "./config"
import type { Task } from "./types"

// Logic Switch: Set to false to use real API calls
const USE_MOCK_DATA = true

// Mock Data
const MOCK_TASKS: Task[] = [
  {
    id: "t-001",
    title: "Approve Invoice #90210",
    status: "READY",
    createdAt: new Date().toISOString(),
    priority: "HIGH",
    description: "Invoice for office supplies from Acme Corp.",
  },
  {
    id: "t-002",
    title: "Review Q3 Budget",
    status: "READY",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    priority: "MEDIUM",
    description: "Quarterly budget review for the engineering department.",
  },
  {
    id: "t-003",
    title: "Onboard Employee: John Doe",
    status: "IN_PROGRESS",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    priority: "LOW",
  },
]

/**
 * Fetches the OAuth token from SAP BTP
 * Internal helper for real API calls
 */
async function getAuthToken(): Promise<string> {
  if (USE_MOCK_DATA) return "mock-token"

  const response = await fetch(`${SAP_CONFIG.AUTH_URL}?grant_type=client_credentials`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${SAP_CONFIG.CLIENT_ID}:${SAP_CONFIG.CLIENT_SECRET}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })

  if (!response.ok) throw new Error("Failed to fetch auth token")
  const data = await response.json()
  return data.access_token
}

export async function fetchTasks(): Promise<Task[]> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    return [...MOCK_TASKS]
  }

  try {
    const token = await getAuthToken()
    const response = await fetch(`${SAP_CONFIG.API_URL}/task-instances`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch tasks from SAP")
    return await response.json()
  } catch (error) {
    console.error("SAP Fetch Error:", error)
    throw error
  }
}

export async function completeTask(taskId: string, decision: "APPROVE" | "REJECT" = "APPROVE"): Promise<void> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const taskIndex = MOCK_TASKS.findIndex((t) => t.id === taskId)
    if (taskIndex > -1) {
      MOCK_TASKS[taskIndex].status = "COMPLETED"
    }
    return
  }

  try {
    const token = await getAuthToken()
    const response = await fetch(`${SAP_CONFIG.API_URL}/task-instances/${taskId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "COMPLETED",
        context: { decision: decision },
      }),
    })

    if (!response.ok) throw new Error(`Failed to ${decision.toLowerCase()} task`)
  } catch (error) {
    console.error("SAP Complete Task Error:", error)
    throw error
  }
}

export async function startProject(projectName: string): Promise<string> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    return `proj-${Math.floor(Math.random() * 1000)}`
  }

  try {
    const token = await getAuthToken()
    const response = await fetch(`${SAP_CONFIG.API_URL}/workflow-instances`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        definitionId: "sap.build.sample.project",
        context: { projectName },
      }),
    })

    if (!response.ok) throw new Error("Failed to start project")
    const data = await response.json()
    return data.id
  } catch (error) {
    console.error("SAP Start Project Error:", error)
    throw error
  }
}

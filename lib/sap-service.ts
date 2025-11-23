import { SAP_CONFIG } from "./config"
import type {
  SAPTask,
  TaskDecision,
  CompleteTaskRequest,
  WorkflowInstance,
  StartWorkflowRequest,
  TaskPriority,
  TaskStatus,
} from "./sap-types"

// Logic Switch: Set to false to use real API calls
const USE_MOCK_DATA = true

const SAP_API_PATHS = {
  tasks: "/task-instances",
  workflows: "/workflow-instances",
}

const DEFAULT_WORKFLOW_DEFINITION_ID = "sap.build.sample.project"

// Mock Data
const MOCK_TASKS: SAPTask[] = [
  {
    id: "t-001",
    subject: "Approve Invoice #90210",
    status: "READY",
    createdAt: new Date().toISOString(),
    priority: "HIGH",
    description: "Invoice for office supplies from Acme Corp.",
  },
  {
    id: "t-002",
    subject: "Review Q3 Budget",
    status: "READY",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    priority: "MEDIUM",
    description: "Quarterly budget review for the engineering department.",
  },
  {
    id: "t-003",
    subject: "Onboard Employee: John Doe",
    status: "RESERVED",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    priority: "LOW",
  },
]

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Fetches the OAuth token from SAP BTP
 * Internal helper for real API calls
 */
async function getAuthToken(): Promise<string> {
  if (USE_MOCK_DATA) return "mock-token"

  const authUrl = ensureConfig(SAP_CONFIG.AUTH_URL, "SAP_AUTH_URL")
  const clientId = ensureConfig(SAP_CONFIG.CLIENT_ID, "SAP_CLIENT_ID")
  const clientSecret = ensureConfig(SAP_CONFIG.CLIENT_SECRET, "SAP_CLIENT_SECRET")
  const credentials = `${clientId}:${clientSecret}`
  const basicAuth = encodeBase64(credentials)

  const response = await fetch(`${authUrl}?grant_type=client_credentials`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })

  if (!response.ok) throw new Error("Failed to fetch auth token")
  const data = await response.json()
  return data.access_token
}

export async function fetchTasks(): Promise<SAPTask[]> {
  if (USE_MOCK_DATA) {
    await delay(800)
    return MOCK_TASKS.map((task) => ({ ...task }))
  }

  try {
    const response = await callSapApi(SAP_API_PATHS.tasks)
    const data = await response.json()
    const records = Array.isArray(data) ? data : data.value ?? []
    return records.map(normalizeTask)
  } catch (error) {
    console.error("SAP Fetch Error:", error)
    throw error
  }
}

export async function completeTask(
  taskId: string,
  decision: TaskDecision = "APPROVE",
  context?: Record<string, any>,
): Promise<void> {
  if (USE_MOCK_DATA) {
    await delay(1000)
    const taskIndex = MOCK_TASKS.findIndex((t) => t.id === taskId)
    if (taskIndex > -1) {
      MOCK_TASKS[taskIndex].status = "COMPLETED"
    }
    return
  }

  try {
    const payload: CompleteTaskRequest = {
      status: "COMPLETED",
      decision,
      ...(context ? { context } : {}),
    }

    await callSapApi(`${SAP_API_PATHS.tasks}/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error("SAP Complete Task Error:", error)
    throw error
  }
}

export async function startProject(projectName: string): Promise<WorkflowInstance> {
  if (USE_MOCK_DATA) {
    await delay(1200)
    return {
      id: `proj-${Math.floor(Math.random() * 1000)}`,
      definitionId: DEFAULT_WORKFLOW_DEFINITION_ID,
      subject: projectName,
      status: "RUNNING",
      startedAt: new Date().toISOString(),
      context: { projectName },
    }
  }

  try {
    const payload: StartWorkflowRequest = {
      definitionId: DEFAULT_WORKFLOW_DEFINITION_ID,
      context: { projectName },
    }

    const response = await callSapApi(SAP_API_PATHS.workflows, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    return (await response.json()) as WorkflowInstance
  } catch (error) {
    console.error("SAP Start Project Error:", error)
    throw error
  }
}

function ensureConfig(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing SAP configuration value: ${name}`)
  }
  return value
}

function encodeBase64(value: string): string {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(value)
  }
  return Buffer.from(value).toString("base64")
}

async function callSapApi(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken()
  const url = buildApiUrl(path)
  const headers = mergeHeaders(
    {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    init.headers,
  )

  const response = await fetch(url, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`SAP API error (${response.status}): ${message}`)
  }

  return response
}

function buildApiUrl(path: string): string {
  const baseUrl = ensureConfig(SAP_CONFIG.API_URL, "SAP_API_URL")
  const normalizedBase = baseUrl.replace(/\/$/, "")
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

function mergeHeaders(defaults: Record<string, string>, overrides?: HeadersInit): Headers {
  const merged = new Headers(defaults)
  if (overrides) {
    const overrideHeaders = new Headers(overrides)
    overrideHeaders.forEach((value, key) => merged.set(key, value))
  }
  return merged
}

function normalizeTaskPriority(value?: string): TaskPriority {
  const normalized = value?.toUpperCase()
  switch (normalized) {
    case "LOW":
    case "MEDIUM":
    case "HIGH":
    case "VERY_HIGH":
      return normalized
    default:
      return "MEDIUM"
  }
}

function normalizeTaskStatus(value?: string): TaskStatus {
  const normalized = value?.toUpperCase()
  switch (normalized) {
    case "READY":
    case "RESERVED":
    case "COMPLETED":
    case "CANCELED":
      return normalized
    default:
      return "READY"
  }
}

function normalizeTask(raw: any): SAPTask {
  return {
    id: String(raw.id ?? raw.ID ?? crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
    subject: raw.subject ?? raw.title ?? "SAP Task",
    createdAt: raw.createdAt ?? raw.createdAtTime ?? new Date().toISOString(),
    priority: normalizeTaskPriority(raw.priority),
    status: normalizeTaskStatus(raw.status),
    description: raw.description ?? raw.Subject ?? undefined,
  }
}

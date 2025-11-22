import { GEMINI_CONFIG } from "./config"
import type { ParsedIntent } from "./types"

const USE_MOCK_DATA = true

export async function parseVoiceIntent(transcript: string): Promise<ParsedIntent> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    const lower = transcript.toLowerCase()

    if (lower.includes("approve") || lower.includes("complete")) {
      const entityMatch = transcript.match(/approve (.*)/i) || transcript.match(/complete (.*)/i)
      return {
        intent: "APPROVE_TASK",
        entity: entityMatch ? entityMatch[1].replace(/the/i, "").trim() : "unknown task",
        confidence: 0.95,
        originalTranscript: transcript,
      }
    }

    if (lower.includes("start") || lower.includes("create")) {
      const entityMatch = transcript.match(/start (.*)/i) || transcript.match(/create (.*)/i)
      return {
        intent: "START_PROJECT",
        entity: entityMatch ? entityMatch[1].replace(/project/i, "").trim() : "New Project",
        confidence: 0.9,
        originalTranscript: transcript,
      }
    }

    if (lower.includes("list") || lower.includes("pending") || lower.includes("show")) {
      return {
        intent: "LIST_TASKS",
        confidence: 0.98,
        originalTranscript: transcript,
      }
    }

    return {
      intent: "UNKNOWN",
      confidence: 0.5,
      originalTranscript: transcript,
    }
  }

  // Real Gemini Logic
  try {
    const prompt = `
      Analyze the following user voice command and extract the intent and entity.
      Possible intents: LIST_TASKS, APPROVE_TASK, START_PROJECT.
      Return ONLY a JSON object with keys: intent, entity (string or null), confidence (0-1).
      
      Command: "${transcript}"
    `

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_CONFIG.API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    )

    if (!response.ok) throw new Error("Gemini API Error")
    const data = await response.json()

    // Simplified parsing for the example - real implementation would need robust JSON parsing from the text response
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
    // Remove markdown code blocks if present
    const jsonStr = textResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    const result = JSON.parse(jsonStr)

    return {
      ...result,
      originalTranscript: transcript,
    }
  } catch (error) {
    console.error("Gemini Parse Error:", error)
    // Fallback
    return {
      intent: "UNKNOWN",
      confidence: 0,
      originalTranscript: transcript,
    }
  }
}

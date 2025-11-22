// Centralized configuration for SAP and Gemini services

export const SAP_CONFIG = {
  // TODO: REPLACE WITH YOUR SAP BTP SERVICE KEY DETAILS
  AUTH_URL: process.env.SAP_AUTH_URL || "",
  API_URL: process.env.SAP_API_URL || "",
  CLIENT_ID: process.env.SAP_CLIENT_ID || "",
  CLIENT_SECRET: process.env.SAP_CLIENT_SECRET || "",
}

export const GEMINI_CONFIG = {
  // TODO: REPLACE WITH YOUR GOOGLE GEMINI API KEY
  API_KEY: process.env.GEMINI_API_KEY || "",
}

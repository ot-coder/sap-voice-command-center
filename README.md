# SAP Voice Command Center

Voice-driven dashboard built with Next.js + Tailwind that lets SAP Build users fetch, approve, and launch workflows via natural speech. The UI showcases a microphone-driven task list, dev-friendly logs, and mock/live SAP + Gemini integrations.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack) & React 19
- **Styling**: Tailwind CSS 4 + shadcn/ui components + Lucide icons
- **Voice/AI**: Web Speech API (client side) and Google Gemini intent parsing
- **SAP Connectivity**: Workflow & Task APIs on SAP BTP (mockable)

## Project layout

```
├─ app/                # Next.js routes, layout, globals
├─ components/         # UI components (voice dashboard, shadcn primitives)
├─ hooks/              # Shared React hooks (toast, responsive helpers)
├─ lib/
│  ├─ config.ts        # Reads SAP/Gemini env vars
│  ├─ gemini-service.ts # Intent parsing (mock or real Gemini)
│  ├─ sap-service.ts    # SAP API client (mock + real fetch)
│  ├─ sap-types.ts      # Single source of truth for SAP domain types
│  └─ types.ts          # UI-facing types (logs, intents) re-exporting SAP types
├─ public/             # Icons and assets
├─ styles/             # Additional CSS entries
└─ README.md
```

## Data model reference (`lib/sap-types.ts`)

- `SAPTask`: Canonical task shape surfaced in the UI (`id`, `subject`, `priority`, `status`, etc.)
- `StartWorkflowRequest`: Payload for kicking off SAP Build workflows
- `CompleteTaskRequest`: Approval/rejection payload with `TaskDecision`
- `WorkflowInstance`: Response structure returned when a workflow is started

All services/components should import from `lib/sap-types.ts` (or via `lib/types.ts` re-exports) to avoid duplicate interfaces.

## Environment setup

Create `.env.local` in the project root. Sample template:

```env
SAP_AUTH_URL="https://<subdomain>.authentication.<region>.hana.ondemand.com/oauth/token"
SAP_API_URL="https://api.<region>.aws.ml.hana.ondemand.com"
SAP_CLIENT_ID="..."
SAP_CLIENT_SECRET="..."
GEMINI_API_KEY="..."
```

> Keep `.env.local` out of version control (already ignored via `.gitignore`). Rotate keys if they were committed previously.

## Running the app

```bash
pnpm install
pnpm dev
# open http://localhost:3000
```

Use the microphone button or quick simulation buttons to trigger commands. Toggle "Dev Mode" in the header to inspect real-time logs.

### Switching between mock and live SAP calls

`lib/sap-service.ts` exposes a `USE_MOCK_DATA` flag. Leave it `true` for demo/testing, or set to `false` to hit real SAP endpoints (requires valid env vars). Real-mode helpers include:

- OAuth token retrieval via `getAuthToken`
- `callSapApi` wrapper handling headers and error reporting
- `normalizeTask` to map SAP API responses into `SAPTask`

## Linting & formatting

- `pnpm lint` — runs ESLint (install `eslint` if not already added as a dev dependency)
- `pnpm format` — add a formatter script if desired (e.g., `prettier`)

## Deployment checklist

1. Secrets only in `.env` files; none checked into git
2. `USE_MOCK_DATA=false` only in production once SAP credentials are configured
3. Clean lint/test runs (`pnpm lint`, `pnpm dev`)
4. Update README when domain models or API surfaces change

## Future enhancements

- Plug in real Gemini parsing (currently mock friendly)
- Add automated tests for `sap-service` helpers and speech flows
- Expand dashboard with analytics, approvals, or project launch forms

---

Maintained by the SAP Voice Command Center team. Contributions welcome!

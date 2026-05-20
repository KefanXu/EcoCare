# EcoCare Dashboard

A React + TypeScript prototype that renders an interactive **ecological landscape** for a person living with a chronic condition (diabetes + diabetic foot ulcer) and pairs it with an **AI chat** that consumes user-selected entities and information flows as context for sense-making around Life-Changing Events (LCEs).

Grounded in the *Ecological Informatics* framework (see the accompanying papers): patient at center, four EST rings (microsystem → macrosystem) outward, four entity categories (component, stakeholder, information, practice), and directed information flows (data, guidance, feedback, communication). Activating an LCE reveals "fractures" in the care ecology that the user can interrogate with the AI.

## Stack

- **Client**: Vite + React + TypeScript + D3 + Zustand + Tailwind
- **Server (local dev)**: Express + OpenAI SDK pointed at any OpenAI-compatible LLM (DeepSeek by default)
- **Production (Vercel)**: static Vite build + Serverless Functions in [`api/`](api/) (`/api/chat`, `/api/followups`, `/api/proposals`, `/api/health`)

## Deploy to Vercel

This repo ships a SPA from [`client/dist`](client/dist) and mounts API routes alongside it so the browser can keep calling **`/api/...`** on the same origin (no rewrite of the frontend needed).

**One-time:**

1. Push the repo to GitHub/GitLab and [import it in Vercel](https://vercel.com/new).
2. Use the repository **root** as the project root (default).
3. Vercel will read [`vercel.json`](vercel.json): `installCommand` runs **`npm run install:all`** (installs root + `client/` + `server/`). The script passes **`--include=dev`** on each install so **TypeScript, Vite, and other build tooling** are still installed when Vercel sets `NODE_ENV=production` during install (fixes `tsc: command not found` on deploy).

**Environment variables** (Production and Preview):

| Variable | Example | Description |
| --- | --- | --- |
| `LLM_API_KEY` | _(your key)_ | Required for AI routes. Same as local `.env`. |
| `LLM_BASE_URL` | `https://api.deepseek.com` | Provider base URL (`https://api.openai.com/v1` for OpenAI). |
| `LLM_MODEL` | `deepseek-chat` | Model id. |

Do **not** upload `.env` to Vercel; set keys in **Project Settings → Environment Variables**.

**Smoke checks after deploy:**

- Open `https://<your-deployment>/api/health` — JSON with `"hasKey": true` when env is wired.
- In the app UI, send a chat message — the reply should stream; follow-ups and “Generate visual options” hit `/api/followups` and `/api/proposals`.

Streaming uses up to **60s** (`maxDuration` in [`vercel.json`](vercel.json)); increase on a Pro-tier plan if long answers timeout.

Optional: run `npx vercel dev` locally to exercise the Serverless handlers without deploying.

## Setup

```bash
npm run install:all
cp .env.example .env
# edit .env and set LLM_API_KEY
npm run dev
```

The client runs on `http://localhost:5173` and the server on `http://localhost:8787`. Vite proxies `/api/*` to the server.

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `LLM_API_KEY` | — | Required. Bearer token for the chat API. |
| `LLM_BASE_URL` | `https://api.deepseek.com` | Any OpenAI-compatible base URL. Use `https://api.openai.com/v1` for OpenAI. |
| `LLM_MODEL` | `deepseek-chat` | Chat model id. Use `gpt-4o-mini`, `deepseek-reasoner`, etc. |
| `PORT` | `8787` | Server port. |

## Using the prototype

1. Hover or click any entity (node) or information flow (edge) — selections appear as chips above the chat composer.
2. Pick an LCE from the top bar to apply a Life-Changing Event; affected entities glow red and impacted flows become dashed.
3. Ask the AI to make sense of what you selected, propose coping strategies, or unpack ripple effects across ecological layers.
4. Hit **Reset** to return to baseline.

## Layout

- Left ~65%: ecological landscape (pan / zoom, D3 SVG)
- Right ~35%: AI chat panel
- Top: scenario bar with LCE picker and legend toggle

# EcoCare Dashboard

A React + TypeScript prototype that renders an interactive **ecological landscape** for a person living with a chronic condition (diabetes + diabetic foot ulcer) and pairs it with an **AI chat** that consumes user-selected entities and information flows as context for sense-making around Life-Changing Events (LCEs).

Grounded in the *Ecological Informatics* framework (see the accompanying papers): patient at center, four EST rings (microsystem → macrosystem) outward, four entity categories (component, stakeholder, information, practice), and directed information flows (data, guidance, feedback, communication). Activating an LCE reveals "fractures" in the care ecology that the user can interrogate with the AI.

## Stack

- **Client**: Vite + React + TypeScript + D3 + Zustand + Tailwind
- **Server**: Express + OpenAI SDK pointed at any OpenAI-compatible LLM (DeepSeek by default)

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

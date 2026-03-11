# ◆ Gut Tracker

Personal colitis tracking dashboard.

## Deploy to Vercel (one-time setup)

1. Push this repository to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up with GitHub
3. Click "Add New Project" → Import this repository
4. Click "Deploy" — no configuration needed
5. Your dashboard will be live at `your-project-name.vercel.app`

## Local Development

```bash
npm install
npm run dev
```

## Features

- **Overview** — Gut score, trends, auto-insights, current protocol
- **Import** — Paste daily notes, auto-parse all fields
- **Timeline** — Full history with filtering and delete
- **Summaries** — Weekly/monthly roll-ups with auto-generated insights
- **Protocol** — Supplement timeline, change log, known reactions
- **Insights** — Symptom heatmap, AM/PM patterns, food triggers, flare timeline
- **Coach** — Practitioner knowledge base with optional AI document parsing

## Data

All data stored in browser localStorage with light encryption. Use the Export button to back up your data as JSON.

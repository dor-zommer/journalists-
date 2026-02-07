# CLAUDE.md - JournalistAI

## Project Overview

JournalistAI (העוזר העיתונאי החכם) is a client-side React + TypeScript + Vite web application for Israeli journalists. It monitors government decisions, scans legislative databases, and generates AI-powered editorial insights using Google Gemini. The entire UI is in Hebrew with full RTL support.

## Quick Reference

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 3000, host 0.0.0.0)
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

**Environment setup:** Copy `.env.local.example` to `.env.local` and set `GEMINI_API_KEY` from Google AI Studio.

**No test suite or linter is configured.** Verify changes manually in both desktop and mobile views.

## Tech Stack

- **React 19.2.0** with TypeScript 5.8 (strict, ES2022 target, react-jsx transform)
- **Vite 6.2.0** for dev server and bundling
- **TailwindCSS** via CDN (not installed as a dependency)
- **Google Gemini AI** (`@google/genai`) for all AI features
- **Lucide React** for icons
- **react-markdown** + **remark-gfm** (pinned to 4.0.0) for rendering AI output

## Project Structure

```
/
├── App.tsx                    # Root component, view routing, shared state
├── index.tsx                  # React DOM entry point
├── index.html                 # HTML template (lang="he", dir="rtl", Heebo font)
├── types.ts                   # All TypeScript types and enums
├── vite.config.ts             # Vite config (port 3000, env injection, path aliases)
├── components/
│   ├── Dashboard.tsx          # Welcome/landing page with feature cards
│   ├── Sidebar.tsx            # Navigation sidebar with mobile overlay
│   ├── MeetingDashboard.tsx   # Editorial meeting dashboard + AI report generation
│   ├── EditorialMeeting.tsx   # Database scanner (government, legislation, etc.)
│   ├── Monitor.tsx            # Topic/entity monitoring with relevance scoring
│   ├── SmartEditor.tsx        # AI text tools (proofread, summarize, headlines, etc.)
│   ├── DailyBrief.tsx         # Daily briefing generator
│   └── ImageEditor.tsx        # Image editor (stub/placeholder)
└── services/
    └── geminiService.ts       # All Gemini API calls and response parsing
```

## Architecture

### View System

Navigation uses `AppView` enum (in `types.ts`). The default view is `MEETING_DASHBOARD`.

```
AppView: DASHBOARD | MEETING_DASHBOARD | DATABASE_SCANNER | MONITOR | AI_STUDIO
```

App.tsx holds the `currentView` state and a `renderView()` switch that maps each enum value to a component.

### State Management

- All shared state lives in `App.tsx`: `currentView`, `savedItems`, `isMobileOpen`
- Components receive state and callbacks via props (no context, no state library)
- No persistence — all state is lost on page refresh

### Component Communication

Standard prop patterns used across components:
- `onChangeView: (view: AppView) => void` — navigate between views
- `onSaveToDashboard: (item: SavedItem) => void` — save item to editorial dashboard
- `onRemoveItem: (id: string) => void` — remove item from dashboard
- `savedItems: SavedItem[]` — current saved items

### AI Integration (services/geminiService.ts)

Two Gemini models are used:
- `gemini-3-pro-preview` — complex analysis tasks (thinking budget: 32,768 tokens)
- `gemini-3-flash-preview` — quick processing (thinking budget: 16,384 tokens)

Key functions:
- `generateEditorialMeeting(timeRange, category, isDeepScan)` — scans databases by category
- `monitorTopics(topics, entities, timeRange)` — monitors topics via web search
- `generateDailyBrief(categories, timeRange)` — daily intelligence report
- `generateConsolidatedReport(items)` — editor-in-chief summary
- `processTextWithGemini(text, task)` — text tools (proofread/summarize/headlines/quotes/to_news)
- `extractSources(response)` — extracts and deduplicates grounding sources

The API key is injected at build time via `process.env.GEMINI_API_KEY` (see `vite.config.ts`).

## Key Types (types.ts)

- `EditorialCategory`: `government_decisions | government_agenda | knesset_agenda | legislation_tazkirim | legislation_knesset | planning | courts | procurement`
- `TimeRange`: `24h_window | week_window | month | current_month | 12h | 24h | 48h | 72h`
- `SavedItem`: items saved to editorial dashboard with category, content, sources
- `MonitorResult`: search result with relevance score (1-10) and summary
- `GroundingSource`: `{ title, uri }` for fact-checking references

## Coding Conventions

### Hebrew & RTL

- All UI text is Hebrew. `index.html` sets `lang="he"` and `dir="rtl"`
- Font: Heebo (Google Fonts)
- Default text alignment: `text-right`
- Flexbox/grid layouts must account for RTL flow

### Styling

- TailwindCSS utility classes exclusively (loaded via CDN in `index.html`)
- Color palette: slate-based (`bg-slate-50`, `text-slate-900`, etc.)
- Responsive: mobile-first with `md:` breakpoints
- Custom markdown table styles defined in `index.html` `<style>` block

### TypeScript

- Strict typing required; use types from `types.ts`
- Functional components with hooks only
- Path alias: `@/*` maps to project root

### Components

- Keep components focused and single-purpose
- Follow existing prop patterns (see Component Communication above)
- Handle loading and error states for all AI operations
- Render AI responses with `react-markdown` + `remark-gfm`

## Common Tasks

### Adding a New View

1. Add entry to `AppView` enum in `types.ts`
2. Create component file in `components/`
3. Add case to `renderView()` switch in `App.tsx`
4. Add navigation item in `Sidebar.tsx`

### Adding an AI Feature

1. Add function in `services/geminiService.ts`
2. Check for API key availability
3. Handle loading/error states in the component
4. Type the response properly
5. Render output with `react-markdown`
6. Extract and display grounding sources when available

### Dependencies

- Keep `react` and `react-dom` versions in sync
- Pin `remark-gfm` to `4.0.0` (compatibility requirement)
- Use exact versions for critical dependencies

## CI/CD

GitHub Actions workflow (`.github/workflows/jekyll-gh-pages.yml`) deploys to GitHub Pages on pushes to `main`. The workflow uses Jekyll — not the Vite build output.

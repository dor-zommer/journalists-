# Copilot Instructions for JournalistAI

## Project Overview
JournalistAI (העוזר העיתונאי החכם) is a React + TypeScript + Vite application designed to assist journalists with:
- Monitoring government decisions, Knesset agendas, and legislative updates
- Scanning databases for editorial content
- AI-powered content analysis and editing
- Managing editorial meeting dashboards

## Technology Stack
- **Frontend**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 6.2.0
- **AI Integration**: Google Gemini AI (@google/genai ^1.30.0)
- **Styling**: TailwindCSS (via CDN)
- **UI Components**: Lucide React icons
- **Markdown Rendering**: react-markdown with remark-gfm

## Project Structure
```
/
├── App.tsx                 # Main app component with view routing
├── index.tsx              # App entry point
├── index.html             # HTML template with RTL support
├── types.ts               # TypeScript type definitions
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard
│   ├── MeetingDashboard.tsx  # Editorial meeting dashboard
│   ├── EditorialMeeting.tsx  # Database scanner
│   ├── Monitor.tsx        # Content monitoring
│   ├── SmartEditor.tsx    # AI-powered editor
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── DailyBrief.tsx     # Daily brief component
│   └── ImageEditor.tsx    # Image editing component
├── services/              # API and service modules
└── vite.config.ts         # Vite configuration

```

## Important Conventions

### Hebrew RTL Support
- **Language**: The application UI is in Hebrew (עברית)
- **Direction**: All layouts use RTL (Right-to-Left) direction
- **Font**: Uses 'Heebo' font family from Google Fonts
- **HTML**: The `index.html` has `lang="he"` and `dir="rtl"` attributes

When working with UI components:
- Text alignment should default to `text-right` for Hebrew content
- Flexbox/Grid layouts should consider RTL flow
- Icons and buttons should be positioned appropriately for RTL

### TypeScript Types
- All component props should be properly typed
- Use existing types from `types.ts` when applicable
- Common types include: `AppView`, `SavedItem`, `NewsUpdate`, `MonitorTopic`, `EditorialItem`

### Styling
- Uses TailwindCSS utility classes
- Custom table styles are defined in `index.html` for markdown tables
- Color scheme: slate-based palette (bg-slate-50, text-slate-900, etc.)
- Responsive design with mobile-first approach (uses md: breakpoints)

### State Management
- React hooks (useState) for local state
- Props drilling for shared state between parent/child components
- Main state lives in App.tsx (currentView, savedItems)

### API Integration
- Gemini API key is required (stored in .env.local as `GEMINI_API_KEY`)
- API key is accessed via `process.env.GEMINI_API_KEY` in the code
- Google Generative AI library is used for AI features

## Development Workflow

### Running the Application
1. Install dependencies: `npm install`
2. Set up environment: Create `.env.local` with `GEMINI_API_KEY=your_api_key`
3. Run dev server: `npm run dev` (runs on port 3000)
4. Build for production: `npm run build`
5. Preview production build: `npm run preview`

### Dev Server Configuration
- Port: 3000
- Host: 0.0.0.0 (allows external access for previews)
- Hot Module Replacement (HMR) enabled

### Preview in Development Environments
The app is configured to be accessible in GitHub Codespaces and other cloud development environments:
- Server binds to 0.0.0.0 for external access
- Port 3000 is forwarded automatically in most environments
- Access via: `http://localhost:3000` or the forwarded URL provided by your environment

### Code Quality
- Follow existing component patterns
- Use functional components with hooks
- Keep components focused and single-purpose
- Maintain TypeScript strict typing
- Use descriptive variable names (both English and Hebrew are acceptable)

## Component Patterns

### View Components
The app uses an enum-based view system (`AppView`) for navigation:
```typescript
enum AppView {
  DASHBOARD = 'DASHBOARD',
  MEETING_DASHBOARD = 'MEETING_DASHBOARD',
  DATABASE_SCANNER = 'DATABASE_SCANNER',
  MONITOR = 'MONITOR',
  AI_STUDIO = 'AI_STUDIO'
}
```

### Prop Patterns
Common prop patterns in components:
- `onChangeView`: Function to switch between views
- `onSaveToDashboard`: Callback to save items to dashboard
- `savedItems`: Array of saved editorial items
- `onRemoveItem`: Callback to remove items from dashboard

## AI Features
- Uses Google Gemini AI for content analysis and generation
- Supports grounding sources for fact-checking
- Markdown rendering for AI-generated content
- Custom prompts for different editorial tasks

## Testing & Quality
- No formal test suite currently (focus on manual testing)
- Test all changes in both desktop and mobile views
- Verify RTL layout correctness
- Check Gemini API integration when making AI-related changes

## Dependencies Management
- Keep React and related packages in sync (react, react-dom)
- Pin remark-gfm to version 4.0.0 (compatibility requirement)
- Use exact versions for critical dependencies

## Common Tasks

### Adding a New View
1. Add the view to `AppView` enum in `types.ts`
2. Create component in `components/` directory
3. Add case to `renderView()` switch in `App.tsx`
4. Add navigation item in `Sidebar.tsx`

### Working with AI Features
1. Always check for API key availability
2. Handle loading and error states
3. Use TypeScript types for AI responses
4. Render AI responses with react-markdown

### Styling Updates
1. Use TailwindCSS utilities
2. Maintain RTL-compatible layouts
3. Follow existing color scheme (slate palette)
4. Test on mobile breakpoints

## Notes for AI Assistants
- When suggesting Hebrew text, ensure proper RTL formatting
- Consider the journalistic context when working on features
- Maintain the professional, clean UI aesthetic
- Respect existing component architecture and patterns
- Always verify changes work in both desktop and mobile views

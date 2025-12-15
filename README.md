# Generative Grid

A spreadsheet-like web application for running LLM prompts across companies/stocks. Rows represent companies, columns represent prompt configurations, and cells display streaming LLM outputs.

## Features

- **Grid Library**: Create, rename, delete, and schedule multiple grids
- **Company Management**: Search and add companies, strategies, or watchlists with drag-and-drop reordering
- **Prompt Columns**: Configure prompts with tools (web search, filings, earnings calls), model selection, and auto-run
- **Dynamic Content**: Insert token pills for company data, dates, document content, and prior cell outputs
- **Cell Execution**: Streaming responses with concurrency limit (5), dependency tracking, and queue management
- **Cell Viewer**: Full-page detail view with Output, Rendered Prompt, Metadata, and Call Log tabs
- **Glass Morphism UI**: Modern design with blur effects and custom animations

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Zustand (state management)
- dnd-kit (drag-and-drop)
- React Router (navigation)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/binardo/vibe-grid-2.git
cd vibe-grid-2

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# OpenAI API Key (optional - uses dummy responses if not set)
VITE_OPENAI_API_KEY=your_openai_api_key

# Backend API URL (optional - uses dummy responses if not set)
VITE_API_BASE_URL=https://your-api-host.com
VITE_API_KEY=your_api_key
```

### Running the App

#### Development Server

```bash
npm run dev
```

The app will be available at http://localhost:5173

#### Production Build

```bash
npm run build
npm run preview
```

#### Linting

```bash
npm run lint
```

### VS Code One-Click Run

This project includes VS Code launch configurations. Open the project in VS Code and:

1. Press `F5` or go to Run > Start Debugging
2. Select one of the available configurations:
   - **Run Dev Server**: Start the development server
   - **Build Production**: Build for production
   - **Run Lint**: Run ESLint checks
   - **Preview Production Build**: Preview the production build

## Project Structure

```
src/
├── components/
│   ├── common/          # Shared components (GlassCard, DynamicPill, RingSpinner)
│   ├── grid/            # Grid components (GridCell, ColumnHeader, CompanyRow, etc.)
│   ├── library/         # Library components (SchedulePopup)
│   └── ui/              # shadcn/ui components
├── hooks/               # Custom hooks (useCellExecution)
├── pages/               # Page components (GridLibrary, GridScreen)
├── services/            # API services (api.ts, openai.ts)
├── stores/              # Zustand stores (gridStore.ts)
└── types/               # TypeScript types
```

## Documentation

See the `docs/` folder for:

- `requirements.md` - Full requirements specification
- `api_examples.md` - API endpoint examples
- `visual_design_spec.md` - Visual design specifications
- Mockup images and assets

## API Integration

The app supports two modes:

1. **Real API Mode**: Set `VITE_OPENAI_API_KEY` and `VITE_API_BASE_URL` environment variables
2. **Dummy Mode**: When API keys are not configured, the app uses dummy responses for development/testing

All API calls are logged to the browser console with method, URL, status, time, and bytes/error.

## Notes

- Data persistence is not implemented (UI state only) - data is lost on page refresh
- Backend scheduling is not implemented (UI only for schedule configuration)
- The OpenAI integration uses the Responses API with streaming

## License

MIT

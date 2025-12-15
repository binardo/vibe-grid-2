# Generative Grid Application Requirements

## Overview
A spreadsheet-like grid web application where:
- Rows = companies/stocks
- Columns = prompt configurations (prompt + tools + model + execution mode)
- Cells = LLM call outputs that stream into the UI

## Core Requirements

### Req 1: Grid Library
- List user's grids with schedule info
- Create new grids (default name: grid 1, grid 2, etc.)
- Rename grids
- "..." menu with Open, Schedule, Delete options
- Schedule popup for regeneration triggers

### Req 2: Grid Screen Layout
- Left column for stocks (frozen)
- Frozen header row
- Search box for stocks/strategies/watchlists
- Pause/Go grid button (cancels/queues LLM calls)
- Plus button to add first column

### Req 3: Company Resolution & Row Adding
- Load strategies on grid load (cache for session)
- Load user's watchlist named "watchlist"
- Debounced search (0.5s) for companies (top 6)
- Local search for strategies/watchlists (up to 4)
- Add single company or multiple from watchlist/strategy
- Insert at top (single) or alphabetically (multiple)
- Show company short name with info icon (SEDOL, full name on hover)
- Duplicate handling: move existing row to new position

### Req 4: Row Reordering & Actions
- 6-dot drag handle on right of company cell
- Drag to reorder rows
- Click handle for menu: Recalculate cells, Recalculate empty, Delete
- Delete cancels queued/in-progress cells

### Req 5: Prompt Columns
- Plus button to create column, opens full-screen form
- Form: Name (optional, auto-generated), Prompt (multiline), Tools, Model, Auto-run toggle
- Tools: Web search, Latest filing, Latest earnings call, Latest broker reports, Upload file
- Models: gpt-5-nano/mini/5.2 (minimal/low/medium/high), o4-mini-deep-research
- Default: gpt-5-nano low
- Column menu: calculate all/empty, edit, re-order, delete
- Column reorder respects dependencies

### Req 6: Dynamic Content Insertion
- Token pills in prompt: Company name, SEDOL, Current date/time, Forward Looking Hypothesis, Company fundamentals, Latest earnings call/date, Latest filing date/summary, Latest broker reports
- Reference prior cell outputs
- Pills are draggable, deletable
- Document resolution: Get Company Documents list (last year), Get document text (first 20 pages)
- Error handling for failed document resolution

### Req 7: Cell Execution
- Auto-run or on-demand per column
- Streaming responses into cells
- Spinner while in progress, queued indicator when waiting
- Concurrency limit: 5 concurrent LLM calls
- Top-to-bottom, left-to-right execution order
- Dependency tracking (wait for prior cell outputs)
- Cancel on row/column delete
- Error handling for API errors or zero tokens

### Req 8: Cell Rendering & Detail Viewer
- 3-line preview with ellipsis
- Spinner in bottom-right while streaming
- Click to open full-page viewer
- Tabs: Output, Rendered input prompt, Metadata, Call log
- Metadata: model, tokens in/out, datetime, cost, tools, execution count
- Copy buttons for output and rendered prompt
- Full-screen height viewer

### Req 9: Aggregation Prompts
- Button below each column to add aggregation prompt
- Similar form to column prompt
- Dynamic content for column results
- Aggregation cell below column
- Queued respecting dependencies

### Req 10: Regeneration Triggers (UI only)
- Date/recurrence triggers (e.g., daily at 7am)
- New source data triggers (new filing, new earnings call)
- UI only, no backend scheduling

### Req 11: API Integration
- OpenAI Responses API with streaming
- OPENAI_API_KEY from environment
- Configurable API host URL and key
- Dummy API fallbacks when not configured
- Console logging: method, URL, status, time, bytes/error

## Visual Design
- Glass morphism: rgba(255,255,255,0.65), blur(20-40px)
- Inter/System UI font
- 4px/8px baseline grid, 24px cell padding
- Spring animations for modals
- Custom ring spinners
- Custom scrollbars
- Background image asset

## API Endpoints
- GET /strategies - list strategies
- GET /stocks/universe?search=X - search companies
- GET /investment-intelligence/portfolios/holdings?portfolio_identifier=X - strategy holdings
- GET /investors/watchlist?watchlist_name=watchlist - watchlist holdings
- GET /companies/documents?company_identifier=X&start_date=X&end_date=X - document list
- GET /companies/documents/{doc_id} - document text

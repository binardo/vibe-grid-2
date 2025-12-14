export type CellStatus = 'idle' | 'queued' | 'running' | 'streaming' | 'complete' | 'error' | 'cancelled';

export type ToolType = 'web_search' | 'latest_filing' | 'latest_earnings_call' | 'latest_broker_reports' | 'upload_file';

export type ModelName = 'gpt-5-nano' | 'gpt-5-mini' | 'gpt-5.2' | 'o4-mini-deep-research';
export type EffortLevel = 'minimal' | 'low' | 'medium' | 'high';

export interface ModelConfig {
  model: ModelName;
  effort: EffortLevel;
}

export interface Tool {
  type: ToolType;
  fileId?: string;
  fileName?: string;
}

export type DynamicTokenType = 
  | 'company_name'
  | 'sedol'
  | 'current_date'
  | 'current_time'
  | 'forward_looking_hypothesis'
  | 'company_fundamentals'
  | 'latest_earnings_call'
  | 'latest_earnings_call_date'
  | 'latest_filing_date'
  | 'latest_filing_summary'
  | 'latest_broker_reports'
  | 'cell_output';

export interface DynamicToken {
  id: string;
  type: DynamicTokenType;
  columnId?: string;
  columnName?: string;
}

export interface PromptSegment {
  type: 'text' | 'token';
  content?: string;
  token?: DynamicToken;
}

export interface Company {
  sedol: string;
  company_name: string;
  sector?: string;
  industry?: string;
  region?: string;
  country?: string;
  sourceType?: 'single' | 'strategy' | 'watchlist';
  forwardLookingHypothesis?: string;
}

export interface Strategy {
  strategy: string;
  strategy_code: string;
  strategy_asset_type: string;
  main_representative_portfolio_icon_code: string;
}

export interface Document {
  global_doc_id: string;
  date: string;
  title: string;
  author?: string;
  snippet?: string;
  rdc_org_id: number;
  company_name: string;
  category: string;
  type: string;
  subtype?: string;
  variant?: string;
  filename?: string;
  url?: string;
}

export interface DocumentContent {
  global_doc_id: string;
  title: string;
  category: string;
  type: string;
  pages: { page_no: number; text: string }[];
}

export interface ColumnConfig {
  id: string;
  name: string;
  prompt: PromptSegment[];
  tools: Tool[];
  model: ModelConfig;
  autoRun: boolean;
  order: number;
}

export interface AggregationConfig {
  id: string;
  columnId: string;
  prompt: PromptSegment[];
  autoRun: boolean;
}

export interface CellMetadata {
  model: string;
  tokensIn: number;
  tokensOut: number;
  dateTime: string;
  cost: number;
  tools: Tool[];
  executionCount: number;
}

export interface CellData {
  id: string;
  companyId: string;
  columnId: string;
  status: CellStatus;
  output: string;
  renderedPrompt: string;
  error?: string;
  metadata?: CellMetadata;
  callLog?: {
    request: string;
    response: string;
    statusCode: number;
  };
}

export interface AggregationCellData {
  id: string;
  aggregationId: string;
  columnId: string;
  status: CellStatus;
  output: string;
  renderedPrompt: string;
  error?: string;
  metadata?: CellMetadata;
  callLog?: {
    request: string;
    response: string;
    statusCode: number;
  };
}

export interface ScheduleConfig {
  enabled: boolean;
  type: 'time' | 'source_data';
  timeConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  sourceDataConfig?: {
    onNewFiling: boolean;
    onNewEarningsCall: boolean;
  };
}

export interface Grid {
  id: string;
  name: string;
  companies: Company[];
  columns: ColumnConfig[];
  cells: Record<string, CellData>;
  aggregations: Record<string, AggregationConfig>;
  aggregationCells: Record<string, AggregationCellData>;
  schedule?: ScheduleConfig;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  type: 'company' | 'strategy' | 'watchlist';
  company?: Company;
  strategy?: Strategy;
  watchlistName?: string;
}

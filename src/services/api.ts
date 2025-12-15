import type { Company, Strategy, Document, DocumentContent } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_KEY = import.meta.env.VITE_API_KEY || '';

const USE_DUMMY_API = !API_BASE_URL;

function logApiCall(method: string, url: string, statusCode: number, timeMs: number, bytesOrError: number | string) {
  if (typeof bytesOrError === 'string') {
    console.log(`[API] ${method} ${url} - ${statusCode} - ${timeMs}ms - Error: ${bytesOrError}`);
  } else {
    console.log(`[API] ${method} ${url} - ${statusCode} - ${timeMs}ms - ${bytesOrError} bytes`);
  }
}

async function fetchWithLogging(url: string, options: RequestInit = {}): Promise<Response> {
  const startTime = Date.now();
  const method = options.method || 'GET';
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'accept-version': '1',
        ...(API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {}),
        ...options.headers,
      },
    });
    
    const timeMs = Date.now() - startTime;
    const contentLength = response.headers.get('content-length');
    
    if (response.ok) {
      logApiCall(method, url, response.status, timeMs, parseInt(contentLength || '0'));
    } else {
      const errorText = await response.text();
      logApiCall(method, url, response.status, timeMs, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    return response;
  } catch (error) {
    const timeMs = Date.now() - startTime;
    logApiCall(method, url, 0, timeMs, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

const dummyStrategies: Strategy[] = [
  { strategy: 'LTGG', strategy_code: 'LTGG', strategy_asset_type: 'Global Equity - Equity', main_representative_portfolio_icon_code: 'DPERS' },
  { strategy: 'US Growth', strategy_code: 'USEQUITY', strategy_asset_type: 'US Equity - Equity', main_representative_portfolio_icon_code: 'VANGUS' },
  { strategy: 'Global Alpha', strategy_code: 'GLOBALALPHA', strategy_asset_type: 'Global Equity - Equity', main_representative_portfolio_icon_code: 'VANGLOB' },
  { strategy: 'Japan Growth', strategy_code: 'JAPANGROWTH', strategy_asset_type: 'Japan - Equity', main_representative_portfolio_icon_code: 'WFJAP' },
  { strategy: 'Positive Change', strategy_code: 'Positive Change', strategy_asset_type: 'Global Equity - Equity', main_representative_portfolio_icon_code: 'OCPOSITIVE' },
];

const dummyCompanies: Company[] = [
  { sedol: '2046251', company_name: 'Apple', sector: 'Information Technology', industry: 'Technology Hardware, Storage & Peripherals', region: 'American', country: 'United States' },
  { sedol: '2588173', company_name: 'Microsoft Corp', sector: 'Information Technology', industry: 'Software', region: 'American', country: 'United States' },
  { sedol: 'BYVY8G0', company_name: 'Alphabet Inc', sector: 'Communication Services', industry: 'Interactive Media & Services', region: 'American', country: 'United States' },
  { sedol: 'B7TL820', company_name: 'Amazon.com', sector: 'Consumer Discretionary', industry: 'Broadline Retail', region: 'American', country: 'United States' },
  { sedol: '2379504', company_name: 'NVIDIA Corp', sector: 'Information Technology', industry: 'Semiconductors', region: 'American', country: 'United States' },
  { sedol: 'BN4Q0L8', company_name: 'Meta Platforms', sector: 'Communication Services', industry: 'Interactive Media & Services', region: 'American', country: 'United States' },
  { sedol: '2831811', company_name: 'Tesla Inc', sector: 'Consumer Discretionary', industry: 'Automobiles', region: 'American', country: 'United States' },
  { sedol: 'B4PPHH9', company_name: 'Berkshire Hathaway', sector: 'Financials', industry: 'Multi-Sector Holdings', region: 'American', country: 'United States' },
];

const dummyWatchlist: Company[] = [
  { sedol: 'B29NF31', company_name: 'Franco-Nevada Corp', sector: 'Materials', industry: 'Metals & Mining', country: 'Canada' },
  { sedol: 'B01C1P6', company_name: 'Bank Central Asia', sector: 'Financials', industry: 'Banks', country: 'Indonesia' },
  { sedol: '2046251', company_name: 'Apple', sector: 'Information Technology', industry: 'Technology Hardware', country: 'United States' },
];

const dummyStrategyHoldings: Record<string, Company[]> = {
  'LTGG': [
    { sedol: 'BLDBN41', company_name: 'Atlas Copco A', country: 'Sweden', sector: 'Industrials', industry: 'Machinery' },
    { sedol: 'BNKCF01', company_name: 'Lumine Group Inc', country: 'Canada', sector: 'Information Technology', industry: 'Software' },
    { sedol: 'BZ01RF1', company_name: 'Demant A/S', country: 'Denmark', sector: 'Health Care', industry: 'Health Care Equipment & Supplies' },
  ],
  'USEQUITY': dummyCompanies.slice(0, 4),
  'GLOBALALPHA': dummyCompanies.slice(2, 6),
  'JAPANGROWTH': [
    { sedol: '6021492', company_name: 'Aiphone Co.,Ltd.', sector: 'Electric Appliances', industry: 'Electric Appliances', region: 'Japanese', country: 'Japan' },
  ],
  'Positive Change': dummyCompanies.slice(4, 8),
};

export async function getStrategies(): Promise<Strategy[]> {
  if (USE_DUMMY_API) {
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('[API] GET /strategies - 200 - 300ms - dummy response');
    return dummyStrategies;
  }
  
  const response = await fetchWithLogging(`${API_BASE_URL}/strategies`);
  const data = await response.json();
  return data.message || [];
}

export async function searchCompanies(search: string, limit: number = 6): Promise<Company[]> {
  if (USE_DUMMY_API) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const filtered = dummyCompanies.filter(c => 
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      c.sedol.toLowerCase().includes(search.toLowerCase())
    ).slice(0, limit);
    console.log(`[API] GET /stocks/universe?search=${search} - 200 - 200ms - dummy response`);
    return filtered;
  }
  
  const response = await fetchWithLogging(`${API_BASE_URL}/stocks/universe?limit=${limit}&search=${encodeURIComponent(search)}`);
  const data = await response.json();
  return data.message?.results || [];
}

export async function getStrategyHoldings(strategyCode: string): Promise<Company[]> {
  if (USE_DUMMY_API) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const holdings = dummyStrategyHoldings[strategyCode] || [];
    console.log(`[API] GET /investment-intelligence/portfolios/holdings?portfolio_identifier=${strategyCode} - 200 - 400ms - dummy response`);
    return holdings;
  }
  
  const response = await fetchWithLogging(
    `${API_BASE_URL}/investment-intelligence/portfolios/holdings?portfolio_identifier=${strategyCode}&portfolio_identifier_type=strategy_code`
  );
  const data = await response.json();
  return data.holdings?.instrument_holdings || [];
}

export async function getWatchlistHoldings(watchlistName: string = 'watchlist'): Promise<Company[]> {
  if (USE_DUMMY_API) {
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log(`[API] GET /investors/watchlist?watchlist_name=${watchlistName} - 200 - 300ms - dummy response`);
    return dummyWatchlist;
  }
  
  const response = await fetchWithLogging(`${API_BASE_URL}/investors/watchlist?watchlist_name=${encodeURIComponent(watchlistName)}`);
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function getCompanyDocuments(
  sedol: string,
  startDate: string,
  endDate: string
): Promise<Document[]> {
  if (USE_DUMMY_API) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const dummyDocs: Document[] = [
      {
        global_doc_id: 'SE-16526988',
        date: '2025-10-29T21:30:00',
        title: 'Earnings conference call',
        rdc_org_id: 26589,
        company_name: 'Company',
        category: 'external',
        type: 'external_investor_calls',
        subtype: 'earnings_calls',
        variant: 'Earning Conference Call/Presentation',
        filename: 'SE-16526988.txt',
      },
      {
        global_doc_id: 'FI-85165693',
        date: '2025-10-29',
        title: 'Company 10-Q',
        rdc_org_id: 26589,
        company_name: 'Company',
        category: 'external',
        type: 'filing_documents',
        subtype: 'interim_report',
        variant: '10-Q',
        filename: '85165693.pdf',
      },
      {
        global_doc_id: 'ER-112697515858',
        date: '2025-10-30',
        title: 'Broker Research Report',
        author: 'Analyst',
        snippet: 'Company analysis...',
        rdc_org_id: 26589,
        company_name: 'Company',
        category: 'external',
        type: 'broker_research',
        filename: '112697515858.pdf',
      },
    ];
    console.log(`[API] GET /companies/documents?company_identifier=${sedol} - 200 - 300ms - dummy response`);
    return dummyDocs;
  }
  
  const response = await fetchWithLogging(
    `${API_BASE_URL}/companies/documents?company_identifier=${sedol}&company_identifier_type=sedol&start_date=${startDate}&end_date=${endDate}&limit=100`
  );
  const data = await response.json();
  return data.message?.documents || [];
}

export async function getDocumentContent(docId: string): Promise<DocumentContent> {
  if (USE_DUMMY_API) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const dummyContent: DocumentContent = {
      global_doc_id: docId,
      title: 'Document',
      category: 'external',
      type: 'filing_documents',
      pages: Array.from({ length: 20 }, (_, i) => ({
        page_no: i + 1,
        text: `This is page ${i + 1} of the document. It contains important financial information about the company's performance, strategy, and outlook. The management discusses key metrics and provides guidance for future quarters.`,
      })),
    };
    console.log(`[API] GET /companies/documents/${docId} - 200 - 500ms - dummy response`);
    return dummyContent;
  }
  
  const response = await fetchWithLogging(`${API_BASE_URL}/companies/documents/${docId}`);
  return response.json();
}

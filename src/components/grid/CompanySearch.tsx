import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Building2, TrendingUp, List, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGridStore } from '@/stores/gridStore';
import { searchCompanies, getStrategyHoldings, getWatchlistHoldings } from '@/services/api';
import type { Company, Strategy, SearchResult } from '@/types';

interface CompanySearchProps {
  gridId: string;
  onCompanyAdded?: () => void;
}

export function CompanySearch({ gridId, onCompanyAdded }: CompanySearchProps) {
  const { strategies, addCompany, addCompanies } = useGridStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHoldings, setIsLoadingHoldings] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  const searchLocal = useCallback((searchQuery: string): SearchResult[] => {
    const q = searchQuery.toLowerCase();
    const localResults: SearchResult[] = [];

    const matchingStrategies = strategies
      .filter(s => s.strategy.toLowerCase().includes(q) || s.strategy_code.toLowerCase().includes(q))
      .slice(0, 4);
    
    matchingStrategies.forEach(strategy => {
      localResults.push({ type: 'strategy', strategy });
    });

    if ('watchlist'.includes(q) || 'my watchlist'.includes(q)) {
      localResults.push({ type: 'watchlist', watchlistName: 'watchlist' });
    }

    return localResults;
  }, [strategies]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const [companies, localResults] = await Promise.all([
        searchCompanies(searchQuery, 6),
        Promise.resolve(searchLocal(searchQuery)),
      ]);

      const companyResults: SearchResult[] = companies.map(company => ({
        type: 'company',
        company,
      }));

      setResults([...companyResults, ...localResults.slice(0, 4)]);
    } catch (error) {
      console.error('Search error:', error);
      setResults(searchLocal(searchQuery));
    } finally {
      setIsLoading(false);
    }
  }, [searchLocal]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim()) {
      debounceRef.current = setTimeout(() => {
        performSearch(query);
      }, 500);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  const handleSelectCompany = (company: Company) => {
    addCompany(gridId, company);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onCompanyAdded?.();
  };

  const handleSelectStrategy = async (strategy: Strategy) => {
    setIsLoadingHoldings(true);
    try {
      const holdings = await getStrategyHoldings(strategy.strategy_code);
      addCompanies(gridId, holdings, 'strategy');
      setQuery('');
      setResults([]);
      setIsOpen(false);
      onCompanyAdded?.();
    } catch (error) {
      console.error('Failed to load strategy holdings:', error);
    } finally {
      setIsLoadingHoldings(false);
    }
  };

  const handleSelectWatchlist = async () => {
    setIsLoadingHoldings(true);
    try {
      const holdings = await getWatchlistHoldings('watchlist');
      addCompanies(gridId, holdings, 'watchlist');
      setQuery('');
      setResults([]);
      setIsOpen(false);
      onCompanyAdded?.();
    } catch (error) {
      console.error('Failed to load watchlist holdings:', error);
    } finally {
      setIsLoadingHoldings(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'company' && result.company) {
      handleSelectCompany(result.company);
    } else if (result.type === 'strategy' && result.strategy) {
      handleSelectStrategy(result.strategy);
    } else if (result.type === 'watchlist') {
      handleSelectWatchlist();
    }
  };

  const getIcon = (result: SearchResult) => {
    if (result.type === 'company') {
      return <Building2 className="w-4 h-4 text-slate-400" />;
    }
    if (result.type === 'strategy') {
      return <TrendingUp className="w-4 h-4 text-blue-500" />;
    }
    return <List className="w-4 h-4 text-purple-500" />;
  };

  const getLabel = (result: SearchResult) => {
    if (result.type === 'company' && result.company) {
      return `${result.company.sedol} - ${result.company.company_name}`;
    }
    if (result.type === 'strategy' && result.strategy) {
      return result.strategy.strategy;
    }
    return 'My Watchlist';
  };

  return (
    <div className="relative flex-1 max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Add companies, strategies..."
          className="pl-10 pr-4 bg-white/50 border-white/40 focus:bg-white/80 focus:border-blue-300 focus:ring-2 focus:ring-blue-200 transition-all"
        />
        {(isLoading || isLoadingHoldings) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-xl border border-white/40 shadow-xl overflow-hidden z-50">
          {results.map((result, index) => (
            <button
              key={`${result.type}-${index}`}
              onClick={() => handleSelect(result)}
              disabled={isLoadingHoldings}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left disabled:opacity-50"
            >
              {getIcon(result)}
              <span className="text-slate-700">{getLabel(result)}</span>
              {result.type !== 'company' && (
                <span className="ml-auto text-xs text-slate-400 uppercase">
                  {result.type}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

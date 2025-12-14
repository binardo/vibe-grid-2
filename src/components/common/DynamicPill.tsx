import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { DynamicToken } from '@/types';

interface DynamicPillProps {
  token: DynamicToken;
  onRemove?: () => void;
  draggable?: boolean;
  className?: string;
}

const tokenLabels: Record<string, string> = {
  company_name: 'Company Name',
  sedol: 'SEDOL',
  current_date: 'Current Date',
  current_time: 'Current Time',
  forward_looking_hypothesis: 'Forward Looking Hypothesis',
  company_fundamentals: 'Company Fundamentals',
  latest_earnings_call: 'Latest Earnings Call',
  latest_earnings_call_date: 'Latest Earnings Call Date',
  latest_filing_date: 'Latest Filing Date',
  latest_filing_summary: 'Latest Filing Summary',
  latest_broker_reports: 'Latest Broker Reports',
  cell_output: 'Cell Output',
};

export function DynamicPill({ token, onRemove, draggable = false, className }: DynamicPillProps) {
  const label = token.type === 'cell_output' && token.columnName
    ? `Cell output of ${token.columnName}`
    : tokenLabels[token.type] || token.type;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm',
        'bg-blue-100 text-blue-700 border border-blue-200',
        draggable && 'cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-105 transition-all',
        className
      )}
      draggable={draggable}
    >
      <span className="text-blue-500 font-medium">=</span>
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

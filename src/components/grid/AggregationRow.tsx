import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RingSpinner } from '@/components/common/RingSpinner';
import type { AggregationConfig, AggregationCellData } from '@/types';

interface AggregationRowProps {
  aggregation?: AggregationConfig;
  aggregationCell?: AggregationCellData;
  onAddAggregation: () => void;
  onEditAggregation: () => void;
  onCellClick: () => void;
}

export function AggregationRow({
  aggregation,
  aggregationCell,
  onAddAggregation,
  onEditAggregation,
  onCellClick,
}: AggregationRowProps) {
  if (!aggregation) {
    return (
      <div className="min-h-[60px] p-3 border-t border-white/30 flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddAggregation}
          className="text-slate-500 hover:text-slate-700 hover:bg-white/30"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Aggregation Prompt
        </Button>
      </div>
    );
  }

  const isStreaming = aggregationCell?.status === 'streaming' || aggregationCell?.status === 'running';
  const isQueued = aggregationCell?.status === 'queued';

  return (
    <div className="border-t border-white/30">
      <div
        onClick={onEditAggregation}
        className="p-3 bg-purple-50/30 border-b border-white/20 cursor-pointer hover:bg-purple-50/50 transition-colors"
      >
        <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">
          Aggregation Prompt
        </p>
      </div>
      
      <div
        onClick={onCellClick}
        className="min-h-[80px] p-3 cursor-pointer hover:bg-white/20 transition-colors relative"
      >
        {isQueued && (
          <div className="flex items-center justify-center h-full text-slate-500">
            <span className="text-sm">Queued</span>
          </div>
        )}
        
        {!isQueued && aggregationCell?.output && (
          <p className="text-sm text-slate-700 line-clamp-3">
            {aggregationCell.output}
          </p>
        )}
        
        {!isQueued && !aggregationCell?.output && aggregationCell?.status !== 'error' && (
          <p className="text-sm text-slate-400">No output yet</p>
        )}
        
        {aggregationCell?.status === 'error' && (
          <p className="text-sm text-red-500">{aggregationCell.error || 'Error'}</p>
        )}
        
        {isStreaming && (
          <div className="absolute bottom-2 right-2">
            <RingSpinner size="sm" />
          </div>
        )}
      </div>
    </div>
  );
}

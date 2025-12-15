import { cn } from '@/lib/utils';
import { RingSpinner } from '@/components/common/RingSpinner';
import { Clock, Link2, AlertCircle } from 'lucide-react';
import type { CellData } from '@/types';

interface GridCellProps {
  cell: CellData;
  queuePosition?: number;
  onClick: () => void;
}

export function GridCell({ cell, queuePosition, onClick }: GridCellProps) {
  const isStreaming = cell.status === 'streaming' || cell.status === 'running';
  const isQueued = cell.status === 'queued';
  const isError = cell.status === 'error';
  const isWaitingDependency = isQueued && queuePosition === -1;

  const getPreviewText = () => {
    if (!cell.output) return '';
    const lines = cell.output.split('\n').slice(0, 3);
    const text = lines.join('\n');
    if (cell.output.split('\n').length > 3 || text.length > 200) {
      return text.substring(0, 200) + '...';
    }
    return text;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative min-h-[100px] p-4 border-b border-r border-white/20 cursor-pointer transition-all',
        'hover:bg-white/20',
        isStreaming && 'bg-gradient-to-b from-blue-50/30 to-transparent',
        isError && 'bg-red-50/30'
      )}
    >
      {isQueued && !isWaitingDependency && (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <Clock className="w-5 h-5 mb-2 text-purple-500" />
          <span className="text-sm">Queued (Pos: {queuePosition})</span>
        </div>
      )}

      {isWaitingDependency && (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <Link2 className="w-5 h-5 mb-2 text-purple-500" />
          <span className="text-sm">Waiting dependency</span>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center h-full text-red-500">
          <AlertCircle className="w-5 h-5 mb-2" />
          <span className="text-sm text-center px-2">{cell.error || 'Error'}</span>
        </div>
      )}

      {!isQueued && !isError && (
        <>
          <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-3">
            {getPreviewText()}
          </p>
          
          {isStreaming && (
            <div className="absolute bottom-2 right-2">
              <RingSpinner size="sm" />
            </div>
          )}
        </>
      )}

      {cell.status === 'idle' && !cell.output && (
        <div className="flex items-center justify-center h-full text-slate-400 text-sm">
          Empty
        </div>
      )}
    </div>
  );
}

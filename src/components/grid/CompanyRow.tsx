import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Info, RefreshCw, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Company } from '@/types';

interface CompanyRowProps {
  company: Company;
  onDelete: () => void;
  onRecalculate: (emptyOnly: boolean) => void;
}

export function CompanyRow({ company, onDelete, onRecalculate }: CompanyRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: company.sedol });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-4 py-3 bg-white/30 border-b border-white/20 w-[200px] min-w-[200px] max-w-[200px] flex-none sticky left-0 z-10 backdrop-blur-md"
    >
      <span className="font-medium text-slate-800 flex-1 min-w-0 truncate">
        {company.company_name}
      </span>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1 hover:bg-white/50 rounded transition-colors">
              <Info className="w-4 h-4 text-slate-400" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-slate-800 text-white p-3 max-w-xs">
            <p className="font-medium">{company.company_name}</p>
            <p className="text-sm text-slate-300 mt-1">SEDOL: {company.sedol}</p>
            {company.sector && (
              <p className="text-sm text-slate-300">Sector: {company.sector}</p>
            )}
            {company.industry && (
              <p className="text-sm text-slate-300">Industry: {company.industry}</p>
            )}
            {company.country && (
              <p className="text-sm text-slate-300">Country: {company.country}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            {...attributes}
            {...listeners}
            className="p-1 hover:bg-white/50 rounded transition-colors cursor-grab active:cursor-grabbing"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(true);
            }}
          >
            <GripVertical className="w-4 h-4 text-slate-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-white/95 backdrop-blur-xl border border-white/40"
        >
          <DropdownMenuItem onClick={() => onRecalculate(false)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Recalculate cells
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRecalculate(true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Recalculate empty cells
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete company
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

import { useState } from 'react';
import { MoreHorizontal, Plus, RefreshCw, Pencil, Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { ColumnConfig } from '@/types';

interface ColumnHeaderProps {
  column: ColumnConfig;
  onEdit: () => void;
  onDelete: () => void;
  onCalculateAll: () => void;
  onCalculateEmpty: () => void;
}

export function ColumnHeader({
  column,
  onEdit,
  onDelete,
  onCalculateAll,
  onCalculateEmpty,
}: ColumnHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="min-w-[250px] px-4 py-3 bg-white/50 backdrop-blur-lg border-b border-r border-white/30 sticky top-0 z-20"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="p-1 hover:bg-white/50 rounded cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-slate-400" />
          </button>
          <span className="font-medium text-slate-800 truncate text-sm uppercase tracking-wide">
            {column.name}
          </span>
        </div>
        
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-4 h-4 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-white/95 backdrop-blur-xl border border-white/40"
          >
            <DropdownMenuItem onClick={onCalculateAll}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Calculate all cells
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCalculateEmpty}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Calculate empty cells
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface AddColumnHeaderProps {
  onClick: () => void;
}

export function AddColumnHeader({ onClick }: AddColumnHeaderProps) {
  return (
    <div className="min-w-[100px] px-4 py-3 bg-white/30 backdrop-blur-lg border-b border-r border-white/20 sticky top-0 z-20 flex items-center justify-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className="h-8 w-8 hover:bg-white/50"
      >
        <Plus className="w-5 h-5 text-slate-500" />
      </Button>
    </div>
  );
}

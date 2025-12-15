import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal } from 'lucide-react';
import { GlassCard } from '@/components/common/GlassCard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SchedulePopup } from '@/components/library/SchedulePopup';
import { useGridStore } from '@/stores/gridStore';
import type { Grid, ScheduleConfig } from '@/types';

function getScheduleDescription(schedule?: ScheduleConfig): string | null {
  if (!schedule?.enabled) return null;
  
  if (schedule.type === 'time') {
    const freq = schedule.timeConfig?.frequency;
    if (freq === 'daily') return `Scheduled: Daily at ${schedule.timeConfig?.time}`;
    if (freq === 'weekly') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `Scheduled: Weekly on ${days[schedule.timeConfig?.dayOfWeek || 0]}`;
    }
    if (freq === 'monthly') return `Scheduled: Monthly on day ${schedule.timeConfig?.dayOfMonth}`;
  }
  
  if (schedule.type === 'source_data') {
    const triggers = [];
    if (schedule.sourceDataConfig?.onNewFiling) triggers.push('new filing');
    if (schedule.sourceDataConfig?.onNewEarningsCall) triggers.push('new earnings call');
    if (triggers.length > 0) return `Triggered by: ${triggers.join(', ')}`;
  }
  
  return 'Scheduled: Custom';
}

export function GridLibrary() {
  const navigate = useNavigate();
  const { grids, createGrid, deleteGrid, renameGrid, updateGridSchedule, setCurrentGrid } = useGridStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [scheduleGridId, setScheduleGridId] = useState<string | null>(null);

  const handleCreateGrid = () => {
    const id = createGrid();
    navigate(`/grid/${id}`);
  };

  const handleOpenGrid = (grid: Grid) => {
    setCurrentGrid(grid.id);
    navigate(`/grid/${grid.id}`);
  };

  const handleStartRename = (grid: Grid) => {
    setEditingId(grid.id);
    setEditingName(grid.name);
  };

  const handleSaveRename = () => {
    if (editingId && editingName.trim()) {
      renameGrid(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleScheduleSave = (schedule: ScheduleConfig) => {
    if (scheduleGridId) {
      updateGridSchedule(scheduleGridId, schedule);
    }
  };

  const scheduleGrid = grids.find(g => g.id === scheduleGridId);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-2 h-2 bg-slate-400 rounded-sm" />
                  <div className="w-2 h-2 bg-slate-600 rounded-sm" />
                  <div className="w-2 h-2 bg-slate-500 rounded-sm" />
                  <div className="w-2 h-2 bg-slate-700 rounded-sm" />
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
                Generative Grid Library
              </h1>
            </div>
            <Button
              onClick={handleCreateGrid}
              className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Grid
            </Button>
          </div>

          <div className="space-y-3">
            {grids.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 opacity-30">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-400">
                    <rect x="10" y="10" width="35" height="35" rx="4" fill="currentColor" opacity="0.3" />
                    <rect x="55" y="10" width="35" height="35" rx="4" fill="currentColor" opacity="0.5" />
                    <rect x="10" y="55" width="35" height="35" rx="4" fill="currentColor" opacity="0.4" />
                    <rect x="55" y="55" width="35" height="35" rx="4" fill="currentColor" opacity="0.6" />
                  </svg>
                </div>
                <p className="text-slate-500 text-lg mb-4">No grids yet</p>
                <p className="text-slate-400 text-sm mb-6">Create your first grid to start analyzing companies</p>
                <Button
                  onClick={handleCreateGrid}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Grid
                </Button>
              </div>
            ) : (
              grids.map((grid) => (
                <div
                  key={grid.id}
                  className="group flex items-center justify-between p-4 rounded-xl bg-white/50 hover:bg-white/70 border border-white/40 transition-all hover:shadow-md cursor-pointer"
                  onClick={() => handleOpenGrid(grid)}
                >
                  <div className="flex-1 min-w-0">
                    {editingId === grid.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={handleSaveRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename();
                          if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditingName('');
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="max-w-xs bg-white/80"
                      />
                    ) : (
                      <>
                        <h3 className="font-medium text-slate-800 truncate">{grid.name}</h3>
                        {getScheduleDescription(grid.schedule) && (
                          <p className="text-sm text-slate-500 mt-0.5">
                            {getScheduleDescription(grid.schedule)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-5 h-5 text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-white/95 backdrop-blur-xl border border-white/40"
                    >
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleOpenGrid(grid);
                      }}>
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(grid);
                      }}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setScheduleGridId(grid.id);
                      }}>
                        Schedule
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGrid(grid.id);
                        }}
                        className="text-red-600 focus:text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {scheduleGrid && (
        <SchedulePopup
          open={!!scheduleGridId}
          onOpenChange={(open) => !open && setScheduleGridId(null)}
          schedule={scheduleGrid.schedule}
          onSave={handleScheduleSave}
          gridName={scheduleGrid.name}
        />
      )}
    </div>
  );
}

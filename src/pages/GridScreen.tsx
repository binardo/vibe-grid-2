import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ArrowLeft, Pause, Play } from 'lucide-react';
import { GlassCard } from '@/components/common/GlassCard';
import { Button } from '@/components/ui/button';
import { CompanySearch } from '@/components/grid/CompanySearch';
import { CompanyRow } from '@/components/grid/CompanyRow';
import { ColumnHeader, AddColumnHeader } from '@/components/grid/ColumnHeader';
import { GridCell } from '@/components/grid/GridCell';
import { ColumnEditor } from '@/components/grid/ColumnEditor';
import { CellViewer } from '@/components/grid/CellViewer';
import { AggregationRow } from '@/components/grid/AggregationRow';
import { useGridStore } from '@/stores/gridStore';
import { useCellExecution } from '@/hooks/useCellExecution';
import type { ColumnConfig, CellData } from '@/types';

export function GridScreen() {
  const { gridId } = useParams<{ gridId: string }>();
  const navigate = useNavigate();
  
  const {
    grids,
    isPaused,
    executionQueue,
    initializeData,
    setCurrentGrid,
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    removeCompany,
    reorderCompanies,
    recalculateCells,
    recalculateColumnCells,
    togglePause,
    addAggregation,
  } = useGridStore();
  
  const { queueCellsForColumn, queueCellsForCompany, queueAllCells } = useCellExecution(gridId || null);
  
  const [editingColumn, setEditingColumn] = useState<ColumnConfig | null>(null);
  const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false);
  const [viewingCell, setViewingCell] = useState<CellData | null>(null);
  const [viewingCellInfo, setViewingCellInfo] = useState<{ companyName: string; columnName: string } | null>(null);
  
  const grid = grids.find(g => g.id === gridId);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  useEffect(() => {
    initializeData();
  }, [initializeData]);
  
  useEffect(() => {
    if (gridId) {
      setCurrentGrid(gridId);
    }
  }, [gridId, setCurrentGrid]);
  
  const handleCompanyDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && grid) {
      const oldIndex = grid.companies.findIndex(c => c.sedol === active.id);
      const newIndex = grid.companies.findIndex(c => c.sedol === over.id);
      reorderCompanies(grid.id, oldIndex, newIndex);
    }
  };
  
  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && grid) {
      const oldIndex = grid.columns.findIndex(c => c.id === active.id);
      const newIndex = grid.columns.findIndex(c => c.id === over.id);
      reorderColumns(grid.id, oldIndex, newIndex);
    }
  };
  
  const handleAddColumn = () => {
    if (!gridId) return;
    const columnId = addColumn(gridId);
    const newColumn = grids.find(g => g.id === gridId)?.columns.find(c => c.id === columnId);
    if (newColumn) {
      setEditingColumn(newColumn);
      setIsColumnEditorOpen(true);
    }
  };
  
  const handleEditColumn = (column: ColumnConfig) => {
    setEditingColumn(column);
    setIsColumnEditorOpen(true);
  };
  
  const handleSaveColumn = (config: Partial<ColumnConfig>) => {
    if (!gridId || !editingColumn) return;
    updateColumn(gridId, editingColumn.id, config);
    
    const updatedColumn = { ...editingColumn, ...config };
    if (updatedColumn.autoRun && updatedColumn.prompt.length > 0) {
      // Reset all cells for this column to idle so they can be re-queued
      // This ensures that edited prompts (including new tokens) will re-run
      recalculateColumnCells(gridId, editingColumn.id, false);
      setTimeout(() => queueCellsForColumn(editingColumn.id), 100);
    }
  };
  
  const handleDeleteColumn = (columnId: string) => {
    if (!gridId) return;
    deleteColumn(gridId, columnId);
  };
  
  const handleDeleteCompany = (sedol: string) => {
    if (!gridId) return;
    removeCompany(gridId, sedol);
  };
  
  const handleRecalculateCompany = (sedol: string, emptyOnly: boolean) => {
    if (!gridId) return;
    recalculateCells(gridId, sedol, emptyOnly);
    setTimeout(() => queueCellsForCompany(sedol), 100);
  };
  
  const handleRecalculateColumn = (columnId: string, emptyOnly: boolean) => {
    if (!gridId) return;
    recalculateColumnCells(gridId, columnId, emptyOnly);
    setTimeout(() => queueCellsForColumn(columnId), 100);
  };
  
  const handleCellClick = (cell: CellData, companyName: string, columnName: string) => {
    setViewingCell(cell);
    setViewingCellInfo({ companyName, columnName });
  };
  
  const handleCompanyAdded = () => {
    setTimeout(() => queueAllCells(), 100);
  };
  
  const handleAddAggregation = (columnId: string) => {
    if (!gridId) return;
    addAggregation(gridId, columnId);
  };
  
  const getQueuePosition = (cellId: string): number => {
    const index = executionQueue.findIndex(item => item.cellId === cellId);
    if (index === -1) return -1;
    return index + 1;
  };
  
  if (!grid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Grid not found</p>
      </div>
    );
  }
  
  const priorColumns = (columnId: string) => {
    const columnIndex = grid.columns.findIndex(c => c.id === columnId);
    return grid.columns.slice(0, columnIndex);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-white/40 px-6 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
              <div className="grid grid-cols-2 gap-0.5">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-sm" />
                <div className="w-1.5 h-1.5 bg-slate-600 rounded-sm" />
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-sm" />
                <div className="w-1.5 h-1.5 bg-slate-700 rounded-sm" />
              </div>
            </div>
            <span className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
              Generative Grid App
            </span>
          </div>
          
          <CompanySearch gridId={grid.id} onCompanyAdded={handleCompanyAdded} />
          
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-slate-600">
              {isPaused ? 'Grid Paused' : 'Grid Enabled'}
            </span>
            <Button
              variant={isPaused ? 'default' : 'outline'}
              size="sm"
              onClick={togglePause}
              className={isPaused ? 'bg-blue-500 hover:bg-blue-600' : ''}
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-hidden">
        <GlassCard className="h-full overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="inline-flex flex-col min-w-full">
              <div className="flex sticky top-0 z-20">
                <div className="min-w-[200px] px-4 py-3 bg-white/70 backdrop-blur-lg border-b border-r border-white/30 sticky left-0 z-30">
                  <span className="font-medium text-slate-800 text-sm uppercase tracking-wide">
                    Company
                  </span>
                </div>
                
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleColumnDragEnd}
                >
                  <SortableContext
                    items={grid.columns.map(c => c.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    {grid.columns.map(column => (
                      <ColumnHeader
                        key={column.id}
                        column={column}
                        onEdit={() => handleEditColumn(column)}
                        onDelete={() => handleDeleteColumn(column.id)}
                        onCalculateAll={() => handleRecalculateColumn(column.id, false)}
                        onCalculateEmpty={() => handleRecalculateColumn(column.id, true)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                
                <AddColumnHeader onClick={handleAddColumn} />
              </div>

              {grid.companies.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-slate-500">
                  <div className="text-center">
                    <p className="text-lg mb-2">No companies added yet</p>
                    <p className="text-sm">Use the search bar above to add companies, strategies, or watchlists</p>
                  </div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleCompanyDragEnd}
                >
                  <SortableContext
                    items={grid.companies.map(c => c.sedol)}
                    strategy={verticalListSortingStrategy}
                  >
                    {grid.companies.map(company => (
                      <div key={company.sedol} className="flex">
                        <CompanyRow
                          company={company}
                          onDelete={() => handleDeleteCompany(company.sedol)}
                          onRecalculate={(emptyOnly) => handleRecalculateCompany(company.sedol, emptyOnly)}
                        />
                        
                        {grid.columns.map(column => {
                          const cellId = `${company.sedol}-${column.id}`;
                          const cell = grid.cells[cellId];
                          
                          return (
                            <div key={column.id} className="min-w-[250px]">
                              {cell && (
                                <GridCell
                                  cell={cell}
                                  queuePosition={getQueuePosition(cellId)}
                                  onClick={() => handleCellClick(cell, company.company_name, column.name)}
                                />
                              )}
                            </div>
                          );
                        })}
                        
                        <div className="min-w-[100px]" />
                      </div>
                    ))}
                  </SortableContext>
                </DndContext>
              )}

              {grid.columns.length > 0 && grid.companies.length > 0 && (
                <div className="flex border-t border-white/30">
                  <div className="min-w-[200px] sticky left-0 bg-white/30 backdrop-blur-md" />
                  
                  {grid.columns.map(column => {
                    const aggregation = Object.values(grid.aggregations).find(a => a.columnId === column.id);
                    const aggregationCell = aggregation
                      ? Object.values(grid.aggregationCells).find(c => c.aggregationId === aggregation.id)
                      : undefined;
                    
                    return (
                      <div key={column.id} className="min-w-[250px]">
                        <AggregationRow
                          aggregation={aggregation}
                          aggregationCell={aggregationCell}
                          onAddAggregation={() => handleAddAggregation(column.id)}
                          onEditAggregation={() => {}}
                          onCellClick={() => {}}
                        />
                      </div>
                    );
                  })}
                  
                  <div className="min-w-[100px]" />
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </main>

      <ColumnEditor
        open={isColumnEditorOpen}
        onOpenChange={setIsColumnEditorOpen}
        column={editingColumn}
        onSave={handleSaveColumn}
        priorColumns={editingColumn ? priorColumns(editingColumn.id) : []}
      />

      <CellViewer
        open={!!viewingCell}
        onOpenChange={(open) => !open && setViewingCell(null)}
        cell={viewingCell}
        companyName={viewingCellInfo?.companyName || ''}
        columnName={viewingCellInfo?.columnName || ''}
      />
    </div>
  );
}

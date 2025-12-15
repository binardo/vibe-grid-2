import { create } from 'zustand';
import type { 
  Grid, Company, ColumnConfig, CellData, CellStatus, 
  Strategy, AggregationConfig, AggregationCellData, ScheduleConfig
} from '../types';
import { getStrategies, getWatchlistHoldings } from '../services/api';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getCellId(companyId: string, columnId: string): string {
  return `${companyId}-${columnId}`;
}

interface ExecutionQueueItem {
  cellId: string;
  companyId: string;
  columnId: string;
  priority: number;
  dependencies: string[];
}

interface GridState {
  grids: Grid[];
  currentGridId: string | null;
  strategies: Strategy[];
  watchlist: Company[];
  isPaused: boolean;
  executionQueue: ExecutionQueueItem[];
  runningCells: Set<string>;
  abortControllers: Map<string, AbortController>;
  
  initializeData: () => Promise<void>;
  
  createGrid: (name?: string) => string;
  deleteGrid: (gridId: string) => void;
  renameGrid: (gridId: string, name: string) => void;
  setCurrentGrid: (gridId: string | null) => void;
  updateGridSchedule: (gridId: string, schedule: ScheduleConfig) => void;
  
  addCompany: (gridId: string, company: Company) => void;
  addCompanies: (gridId: string, companies: Company[], sourceType: 'strategy' | 'watchlist') => void;
  removeCompany: (gridId: string, sedol: string) => void;
  reorderCompanies: (gridId: string, fromIndex: number, toIndex: number) => void;
  
  addColumn: (gridId: string) => string;
  updateColumn: (gridId: string, columnId: string, config: Partial<ColumnConfig>) => void;
  deleteColumn: (gridId: string, columnId: string) => void;
  reorderColumns: (gridId: string, fromIndex: number, toIndex: number) => void;
  
  updateCellStatus: (gridId: string, cellId: string, status: CellStatus) => void;
  updateCellOutput: (gridId: string, cellId: string, output: string, append?: boolean) => void;
  setCellError: (gridId: string, cellId: string, error: string) => void;
  setCellComplete: (gridId: string, cellId: string, metadata: CellData['metadata']) => void;
  setCellCallLog: (gridId: string, cellId: string, callLog: CellData['callLog']) => void;
  setCellRenderedPrompt: (gridId: string, cellId: string, prompt: string) => void;
  
  addAggregation: (gridId: string, columnId: string) => string;
  updateAggregation: (gridId: string, aggId: string, config: Partial<AggregationConfig>) => void;
  deleteAggregation: (gridId: string, aggId: string) => void;
  updateAggregationCell: (gridId: string, cellId: string, updates: Partial<AggregationCellData>) => void;
  
  togglePause: () => void;
  queueCellExecution: (gridId: string, cellId: string, companyId: string, columnId: string, dependencies: string[]) => void;
  startCellExecution: (cellId: string) => AbortController;
  completeCellExecution: (cellId: string) => void;
  cancelCellExecution: (cellId: string) => void;
  cancelAllForCompany: (gridId: string, sedol: string) => void;
  cancelAllForColumn: (gridId: string, columnId: string) => void;
  
  recalculateCells: (gridId: string, sedol: string, emptyOnly: boolean) => void;
  recalculateColumnCells: (gridId: string, columnId: string, emptyOnly: boolean) => void;
}

export const useGridStore = create<GridState>((set, get) => ({
  grids: [],
  currentGridId: null,
  strategies: [],
  watchlist: [],
  isPaused: false,
  executionQueue: [],
  runningCells: new Set(),
  abortControllers: new Map(),
  
  initializeData: async () => {
    try {
      const [strategies, watchlist] = await Promise.all([
        getStrategies(),
        getWatchlistHoldings('watchlist'),
      ]);
      set({ strategies, watchlist });
    } catch (error) {
      console.error('Failed to initialize data:', error);
    }
  },
  
  createGrid: (name?: string) => {
    const state = get();
    const gridNumber = state.grids.length + 1;
    const gridName = name || `grid ${gridNumber}`;
    const id = generateId();
    
    const newGrid: Grid = {
      id,
      name: gridName,
      companies: [],
      columns: [],
      cells: {},
      aggregations: {},
      aggregationCells: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    set(state => ({
      grids: [...state.grids, newGrid],
      currentGridId: id,
    }));
    
    return id;
  },
  
  deleteGrid: (gridId: string) => {
    set(state => ({
      grids: state.grids.filter(g => g.id !== gridId),
      currentGridId: state.currentGridId === gridId ? null : state.currentGridId,
    }));
  },
  
  renameGrid: (gridId: string, name: string) => {
    set(state => ({
      grids: state.grids.map(g => 
        g.id === gridId ? { ...g, name, updatedAt: new Date().toISOString() } : g
      ),
    }));
  },
  
  setCurrentGrid: (gridId: string | null) => {
    set({ currentGridId: gridId });
  },
  
  updateGridSchedule: (gridId: string, schedule: ScheduleConfig) => {
    set(state => ({
      grids: state.grids.map(g =>
        g.id === gridId ? { ...g, schedule, updatedAt: new Date().toISOString() } : g
      ),
    }));
  },
  
  addCompany: (gridId: string, company: Company) => {
    set(state => {
      const grid = state.grids.find(g => g.id === gridId);
      if (!grid) return state;
      
      const existingIndex = grid.companies.findIndex(c => c.sedol === company.sedol);
      let newCompanies: Company[];
      
      if (existingIndex >= 0) {
        newCompanies = [
          { ...company, sourceType: 'single' },
          ...grid.companies.filter(c => c.sedol !== company.sedol),
        ];
      } else {
        newCompanies = [{ ...company, sourceType: 'single' }, ...grid.companies];
      }
      
      const newCells = { ...grid.cells };
      grid.columns.forEach(col => {
        const cellId = getCellId(company.sedol, col.id);
        if (!newCells[cellId]) {
          newCells[cellId] = {
            id: cellId,
            companyId: company.sedol,
            columnId: col.id,
            status: 'idle',
            output: '',
            renderedPrompt: '',
          };
        }
      });
      
      return {
        grids: state.grids.map(g =>
          g.id === gridId
            ? { ...g, companies: newCompanies, cells: newCells, updatedAt: new Date().toISOString() }
            : g
        ),
      };
    });
  },
  
  addCompanies: (gridId: string, companies: Company[], sourceType: 'strategy' | 'watchlist') => {
    set(state => {
      const grid = state.grids.find(g => g.id === gridId);
      if (!grid) return state;
      
      const sortedNew = [...companies].sort((a, b) => 
        a.company_name.localeCompare(b.company_name)
      );
      
      const existingSedols = new Set(sortedNew.map(c => c.sedol));
      const remainingCompanies = grid.companies.filter(c => !existingSedols.has(c.sedol));
      
      const newCompanies = [
        ...sortedNew.map(c => ({ ...c, sourceType })),
        ...remainingCompanies,
      ];
      
      const newCells = { ...grid.cells };
      sortedNew.forEach(company => {
        grid.columns.forEach(col => {
          const cellId = getCellId(company.sedol, col.id);
          if (!newCells[cellId]) {
            newCells[cellId] = {
              id: cellId,
              companyId: company.sedol,
              columnId: col.id,
              status: 'idle',
              output: '',
              renderedPrompt: '',
            };
          }
        });
      });
      
      return {
        grids: state.grids.map(g =>
          g.id === gridId
            ? { ...g, companies: newCompanies, cells: newCells, updatedAt: new Date().toISOString() }
            : g
        ),
      };
    });
  },
  
  removeCompany: (gridId: string, sedol: string) => {
    const state = get();
    state.cancelAllForCompany(gridId, sedol);
    
    set(state => {
      const grid = state.grids.find(g => g.id === gridId);
      if (!grid) return state;
      
      const newCells = { ...grid.cells };
      Object.keys(newCells).forEach(cellId => {
        if (newCells[cellId].companyId === sedol) {
          delete newCells[cellId];
        }
      });
      
      return {
        grids: state.grids.map(g =>
          g.id === gridId
            ? {
                ...g,
                companies: g.companies.filter(c => c.sedol !== sedol),
                cells: newCells,
                updatedAt: new Date().toISOString(),
              }
            : g
        ),
      };
    });
  },
  
  reorderCompanies: (gridId: string, fromIndex: number, toIndex: number) => {
    set(state => {
      const grid = state.grids.find(g => g.id === gridId);
      if (!grid) return state;
      
      const newCompanies = [...grid.companies];
      const [removed] = newCompanies.splice(fromIndex, 1);
      newCompanies.splice(toIndex, 0, removed);
      
      return {
        grids: state.grids.map(g =>
          g.id === gridId
            ? { ...g, companies: newCompanies, updatedAt: new Date().toISOString() }
            : g
        ),
      };
    });
  },
  
  addColumn: (gridId: string) => {
    const id = generateId();
    const state = get();
    const grid = state.grids.find(g => g.id === gridId);
    if (!grid) return id;
    
    const columnNumber = grid.columns.length + 1;
    
    const newColumn: ColumnConfig = {
      id,
      name: `Column ${columnNumber}`,
      prompt: [],
      tools: [],
      model: { model: 'gpt-5-nano', effort: 'low' },
      autoRun: true,
      order: grid.columns.length,
    };
    
    const newCells: Record<string, CellData> = {};
    grid.companies.forEach(company => {
      const cellId = getCellId(company.sedol, id);
      newCells[cellId] = {
        id: cellId,
        companyId: company.sedol,
        columnId: id,
        status: 'idle',
        output: '',
        renderedPrompt: '',
      };
    });
    
    set(state => ({
      grids: state.grids.map(g =>
        g.id === gridId
          ? {
              ...g,
              columns: [...g.columns, newColumn],
              cells: { ...g.cells, ...newCells },
              updatedAt: new Date().toISOString(),
            }
          : g
      ),
    }));
    
    return id;
  },
  
  updateColumn: (gridId: string, columnId: string, config: Partial<ColumnConfig>) => {
    set(state => ({
      grids: state.grids.map(g =>
        g.id === gridId
          ? {
              ...g,
              columns: g.columns.map(c =>
                c.id === columnId ? { ...c, ...config } : c
              ),
              updatedAt: new Date().toISOString(),
            }
          : g
      ),
    }));
  },
  
  deleteColumn: (gridId: string, columnId: string) => {
    const state = get();
    state.cancelAllForColumn(gridId, columnId);
    
    set(state => {
      const grid = state.grids.find(g => g.id === gridId);
      if (!grid) return state;
      
      const newCells = { ...grid.cells };
      Object.keys(newCells).forEach(cellId => {
        if (newCells[cellId].columnId === columnId) {
          delete newCells[cellId];
        }
      });
      
      const newAggregations = { ...grid.aggregations };
      const newAggCells = { ...grid.aggregationCells };
      Object.keys(newAggregations).forEach(aggId => {
        if (newAggregations[aggId].columnId === columnId) {
          delete newAggregations[aggId];
          Object.keys(newAggCells).forEach(cellId => {
            if (newAggCells[cellId].aggregationId === aggId) {
              delete newAggCells[cellId];
            }
          });
        }
      });
      
      return {
        grids: state.grids.map(g =>
          g.id === gridId
            ? {
                ...g,
                columns: g.columns.filter(c => c.id !== columnId),
                cells: newCells,
                aggregations: newAggregations,
                aggregationCells: newAggCells,
                updatedAt: new Date().toISOString(),
              }
            : g
        ),
      };
    });
  },
  
  reorderColumns: (gridId: string, fromIndex: number, toIndex: number) => {
    set(state => {
      const grid = state.grids.find(g => g.id === gridId);
      if (!grid) return state;
      
      const newColumns = [...grid.columns];
      const [removed] = newColumns.splice(fromIndex, 1);
      newColumns.splice(toIndex, 0, removed);
      
      newColumns.forEach((col, idx) => {
        col.order = idx;
      });
      
      return {
        grids: state.grids.map(g =>
          g.id === gridId
            ? { ...g, columns: newColumns, updatedAt: new Date().toISOString() }
            : g
        ),
      };
    });
  },
  
  updateCellStatus: (gridId: string, cellId: string, status: CellStatus) => {
    set(state => ({
      grids: state.grids.map(g =>
        g.id === gridId && g.cells[cellId]
          ? {
              ...g,
              cells: {
                ...g.cells,
                [cellId]: { ...g.cells[cellId], status },
              },
            }
          : g
      ),
    }));
  },
  
  updateCellOutput: (gridId: string, cellId: string, output: string, append = false) => {
    set(state => ({
      grids: state.grids.map(g =>
        g.id === gridId && g.cells[cellId]
          ? {
              ...g,
              cells: {
                ...g.cells,
                [cellId]: {
                  ...g.cells[cellId],
                  output: append ? g.cells[cellId].output + output : output,
                },
              },
            }
          : g
      ),
    }));
  },
  
  setCellError: (gridId: string, cellId: string, error: string) => {
    set(state => ({
      grids: state.grids.map(g =>
        g.id === gridId && g.cells[cellId]
          ? {
              ...g,
              cells: {
                ...g.cells,
                [cellId]: { ...g.cells[cellId], status: 'error', error },
              },
            }
          : g
      ),
    }));
  },
  
  setCellComplete: (gridId: string, cellId: string, metadata: CellData['metadata']) => {
    set(state => ({
      grids: state.grids.map(g =>
        g.id === gridId && g.cells[cellId]
          ? {
              ...g,
              cells: {
                ...g.cells,
                [cellId]: { ...g.cells[cellId], status: 'complete', metadata },
              },
            }
          : g
      ),
    }));
  },
  
  setCellCallLog: (gridId: string, cellId: string, callLog: CellData['callLog']) => {
    set(state => ({
      grids: state.grids.map(g =>
        g.id === gridId && g.cells[cellId]
          ? {
              ...g,
              cells: {
                ...g.cells,
                [cellId]: { ...g.cells[cellId], callLog },
              },
            }
          : g
      ),
    }));
  },
  
  setCellRenderedPrompt: (gridId: string, cellId: string, prompt: string) => {
    set(state => ({
      grids: state.grids.map(g =>
        g.id === gridId && g.cells[cellId]
          ? {
              ...g,
              cells: {
                ...g.cells,
                [cellId]: { ...g.cells[cellId], renderedPrompt: prompt },
              },
            }
          : g
      ),
    }));
  },
  
  addAggregation: (gridId: string, columnId: string) => {
    const id = generateId();
    
    const newAgg: AggregationConfig = {
      id,
      columnId,
      prompt: [],
      autoRun: true,
    };
    
    const cellId = `agg-${id}`;
    const newCell: AggregationCellData = {
      id: cellId,
      aggregationId: id,
      columnId,
      status: 'idle',
      output: '',
      renderedPrompt: '',
    };
    
    set(state => ({
      grids: state.grids.map(g =>
        g.id === gridId
          ? {
              ...g,
              aggregations: { ...g.aggregations, [id]: newAgg },
              aggregationCells: { ...g.aggregationCells, [cellId]: newCell },
              updatedAt: new Date().toISOString(),
            }
          : g
      ),
    }));
    
    return id;
  },
  
  updateAggregation: (gridId: string, aggId: string, config: Partial<AggregationConfig>) => {
    set(state => ({
      grids: state.grids.map(g =>
        g.id === gridId && g.aggregations[aggId]
          ? {
              ...g,
              aggregations: {
                ...g.aggregations,
                [aggId]: { ...g.aggregations[aggId], ...config },
              },
              updatedAt: new Date().toISOString(),
            }
          : g
      ),
    }));
  },
  
  deleteAggregation: (gridId: string, aggId: string) => {
    set(state => {
      const grid = state.grids.find(g => g.id === gridId);
      if (!grid) return state;
      
      const newAggregations = { ...grid.aggregations };
      delete newAggregations[aggId];
      
      const newAggCells = { ...grid.aggregationCells };
      Object.keys(newAggCells).forEach(cellId => {
        if (newAggCells[cellId].aggregationId === aggId) {
          delete newAggCells[cellId];
        }
      });
      
      return {
        grids: state.grids.map(g =>
          g.id === gridId
            ? {
                ...g,
                aggregations: newAggregations,
                aggregationCells: newAggCells,
                updatedAt: new Date().toISOString(),
              }
            : g
        ),
      };
    });
  },
  
  updateAggregationCell: (gridId: string, cellId: string, updates: Partial<AggregationCellData>) => {
    set(state => ({
      grids: state.grids.map(g =>
        g.id === gridId && g.aggregationCells[cellId]
          ? {
              ...g,
              aggregationCells: {
                ...g.aggregationCells,
                [cellId]: { ...g.aggregationCells[cellId], ...updates },
              },
            }
          : g
      ),
    }));
  },
  
  togglePause: () => {
    set(state => {
      if (!state.isPaused) {
        state.abortControllers.forEach(controller => controller.abort());
        
        const grid = state.grids.find(g => g.id === state.currentGridId);
        if (grid) {
          const updatedCells = { ...grid.cells };
          Object.keys(updatedCells).forEach(cellId => {
            if (updatedCells[cellId].status === 'running' || updatedCells[cellId].status === 'streaming') {
              updatedCells[cellId] = { ...updatedCells[cellId], status: 'queued' };
            }
          });
          
          return {
            isPaused: true,
            runningCells: new Set(),
            abortControllers: new Map(),
            grids: state.grids.map(g =>
              g.id === state.currentGridId ? { ...g, cells: updatedCells } : g
            ),
          };
        }
      }
      return { isPaused: !state.isPaused };
    });
  },
  
  queueCellExecution: (gridId: string, cellId: string, companyId: string, columnId: string, dependencies: string[]) => {
    set(state => {
      const grid = state.grids.find(g => g.id === gridId);
      if (!grid) return state;
      
      const company = grid.companies.find(c => c.sedol === companyId);
      const column = grid.columns.find(c => c.id === columnId);
      if (!company || !column) return state;
      
      const companyIndex = grid.companies.indexOf(company);
      const columnIndex = grid.columns.indexOf(column);
      const priority = companyIndex * 1000 + columnIndex;
      
      const existingIndex = state.executionQueue.findIndex(item => item.cellId === cellId);
      if (existingIndex >= 0) {
        return state;
      }
      
      return {
        executionQueue: [
          ...state.executionQueue,
          { cellId, companyId, columnId, priority, dependencies },
        ].sort((a, b) => a.priority - b.priority),
        grids: state.grids.map(g =>
          g.id === gridId && g.cells[cellId]
            ? {
                ...g,
                cells: {
                  ...g.cells,
                  [cellId]: { ...g.cells[cellId], status: 'queued' },
                },
              }
            : g
        ),
      };
    });
  },
  
  startCellExecution: (cellId: string) => {
    const controller = new AbortController();
    set(state => ({
      runningCells: new Set([...state.runningCells, cellId]),
      abortControllers: new Map([...state.abortControllers, [cellId, controller]]),
      executionQueue: state.executionQueue.filter(item => item.cellId !== cellId),
    }));
    return controller;
  },
  
  completeCellExecution: (cellId: string) => {
    set(state => {
      const newRunning = new Set(state.runningCells);
      newRunning.delete(cellId);
      const newControllers = new Map(state.abortControllers);
      newControllers.delete(cellId);
      return {
        runningCells: newRunning,
        abortControllers: newControllers,
      };
    });
  },
  
  cancelCellExecution: (cellId: string) => {
    const state = get();
    const controller = state.abortControllers.get(cellId);
    if (controller) {
      controller.abort();
    }
    
    set(state => {
      const newRunning = new Set(state.runningCells);
      newRunning.delete(cellId);
      const newControllers = new Map(state.abortControllers);
      newControllers.delete(cellId);
      return {
        runningCells: newRunning,
        abortControllers: newControllers,
        executionQueue: state.executionQueue.filter(item => item.cellId !== cellId),
      };
    });
  },
  
  cancelAllForCompany: (gridId: string, sedol: string) => {
    const state = get();
    const grid = state.grids.find(g => g.id === gridId);
    if (!grid) return;
    
    Object.keys(grid.cells).forEach(cellId => {
      if (grid.cells[cellId].companyId === sedol) {
        state.cancelCellExecution(cellId);
      }
    });
  },
  
  cancelAllForColumn: (gridId: string, columnId: string) => {
    const state = get();
    const grid = state.grids.find(g => g.id === gridId);
    if (!grid) return;
    
    Object.keys(grid.cells).forEach(cellId => {
      if (grid.cells[cellId].columnId === columnId) {
        state.cancelCellExecution(cellId);
      }
    });
  },
  
  recalculateCells: (gridId: string, sedol: string, emptyOnly: boolean) => {
    const state = get();
    const grid = state.grids.find(g => g.id === gridId);
    if (!grid) return;
    
    Object.keys(grid.cells).forEach(cellId => {
      const cell = grid.cells[cellId];
      if (cell.companyId === sedol) {
        if (!emptyOnly || !cell.output) {
          set(state => ({
            grids: state.grids.map(g =>
              g.id === gridId
                ? {
                    ...g,
                    cells: {
                      ...g.cells,
                      [cellId]: { ...g.cells[cellId], status: 'idle', output: '', error: undefined },
                    },
                  }
                : g
            ),
          }));
        }
      }
    });
  },
  
  recalculateColumnCells: (gridId: string, columnId: string, emptyOnly: boolean) => {
    const state = get();
    const grid = state.grids.find(g => g.id === gridId);
    if (!grid) return;
    
    Object.keys(grid.cells).forEach(cellId => {
      const cell = grid.cells[cellId];
      if (cell.columnId === columnId) {
        if (!emptyOnly || !cell.output) {
          set(state => ({
            grids: state.grids.map(g =>
              g.id === gridId
                ? {
                    ...g,
                    cells: {
                      ...g.cells,
                      [cellId]: { ...g.cells[cellId], status: 'idle', output: '', error: undefined },
                    },
                  }
                : g
            ),
          }));
        }
      }
    });
  },
}));

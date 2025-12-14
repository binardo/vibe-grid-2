import { useEffect, useCallback, useRef } from 'react';
import { useGridStore } from '../stores/gridStore';
import { streamLLMResponse, getLastCallLog } from '../services/openai';
import { getCompanyDocuments, getDocumentContent } from '../services/api';
import type { PromptSegment, Company, ColumnConfig } from '../types';

const MAX_CONCURRENT_CELLS = 5;

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}-${minutes}-${seconds}`;
}

async function resolveDocumentContent(
  sedol: string,
  tokenType: 'latest_earnings_call' | 'latest_filing_summary' | 'latest_broker_reports' | 'latest_earnings_call_date' | 'latest_filing_date'
): Promise<string> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  
  const documents = await getCompanyDocuments(sedol, startStr, endStr);
  
  if (!documents || documents.length === 0) {
    throw new Error('No documents found for the last year');
  }
  
  let targetDoc = null;
  
  if (tokenType === 'latest_earnings_call' || tokenType === 'latest_earnings_call_date') {
    targetDoc = documents.find(d => d.subtype === 'earnings_calls' || d.type === 'external_investor_calls');
  } else if (tokenType === 'latest_filing_summary' || tokenType === 'latest_filing_date') {
    targetDoc = documents.find(d => d.type === 'filing_documents');
  } else if (tokenType === 'latest_broker_reports') {
    targetDoc = documents.find(d => d.type === 'broker_research');
  }
  
  if (!targetDoc) {
    throw new Error(`No ${tokenType.replace(/_/g, ' ')} found in the last year`);
  }
  
  if (tokenType === 'latest_earnings_call_date' || tokenType === 'latest_filing_date') {
    return targetDoc.date.split('T')[0];
  }
  
  const content = await getDocumentContent(targetDoc.global_doc_id);
  
  if (!content || !content.pages || content.pages.length === 0) {
    throw new Error('Failed to retrieve document content');
  }
  
  const first20Pages = content.pages.slice(0, 20);
  return first20Pages.map(p => p.text).join('\n\n');
}

async function renderPrompt(
  segments: PromptSegment[],
  company: Company,
  _columns: ColumnConfig[],
  cells: Record<string, { output: string }>
): Promise<string> {
  const parts: string[] = [];
  
  for (const segment of segments) {
    if (segment.type === 'text') {
      parts.push(segment.content || '');
    } else if (segment.token) {
      const token = segment.token;
      
      switch (token.type) {
        case 'company_name':
          parts.push(company.company_name);
          break;
        case 'sedol':
          parts.push(company.sedol);
          break;
        case 'current_date':
          parts.push(formatDate(new Date()));
          break;
        case 'current_time':
          parts.push(formatTime(new Date()));
          break;
        case 'forward_looking_hypothesis':
          parts.push(company.forwardLookingHypothesis || '[No forward looking hypothesis available]');
          break;
        case 'company_fundamentals':
          parts.push(`Company: ${company.company_name}\nSEDOL: ${company.sedol}\nSector: ${company.sector || 'N/A'}\nIndustry: ${company.industry || 'N/A'}\nCountry: ${company.country || 'N/A'}`);
          break;
        case 'latest_earnings_call':
        case 'latest_earnings_call_date':
        case 'latest_filing_date':
        case 'latest_filing_summary':
        case 'latest_broker_reports':
          try {
            const content = await resolveDocumentContent(company.sedol, token.type);
            parts.push(content);
          } catch (error) {
            throw new Error(`Failed to resolve ${token.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          break;
        case 'cell_output':
          if (token.columnId) {
            const cellId = `${company.sedol}-${token.columnId}`;
            const cell = cells[cellId];
            if (cell && cell.output) {
              parts.push(cell.output);
            } else {
              parts.push('[Cell output not available]');
            }
          }
          break;
      }
    }
  }
  
  return parts.join('');
}

function getCellDependencies(
  segments: PromptSegment[],
  companyId: string,
  columns: ColumnConfig[],
  currentColumnId: string
): string[] {
  const deps: string[] = [];
  
  for (const segment of segments) {
    if (segment.type === 'token' && segment.token?.type === 'cell_output' && segment.token.columnId) {
      const depColumnId = segment.token.columnId;
      const depColumn = columns.find(c => c.id === depColumnId);
      const currentColumn = columns.find(c => c.id === currentColumnId);
      
      if (depColumn && currentColumn && depColumn.order < currentColumn.order) {
        deps.push(`${companyId}-${depColumnId}`);
      }
    }
  }
  
  return deps;
}

export function useCellExecution(gridId: string | null) {
  const {
    grids,
    isPaused,
    executionQueue,
    runningCells,
    updateCellStatus,
    updateCellOutput,
    setCellError,
    setCellComplete,
    setCellCallLog,
    setCellRenderedPrompt,
    startCellExecution,
    completeCellExecution,
    queueCellExecution,
  } = useGridStore();
  
  const processingRef = useRef(false);
  
  const executeCell = useCallback(async (
    cellId: string,
    companyId: string,
    columnId: string
  ) => {
    if (!gridId) return;
    
    const grid = grids.find(g => g.id === gridId);
    if (!grid) return;
    
    const company = grid.companies.find(c => c.sedol === companyId);
    const column = grid.columns.find(c => c.id === columnId);
    if (!company || !column) return;
    
    const controller = startCellExecution(cellId);
    updateCellStatus(gridId, cellId, 'running');
    
    try {
      const renderedPrompt = await renderPrompt(
        column.prompt,
        company,
        grid.columns,
        grid.cells
      );
      
      setCellRenderedPrompt(gridId, cellId, renderedPrompt);
      
      if (!renderedPrompt.trim()) {
        setCellError(gridId, cellId, 'Prompt is empty after rendering');
        completeCellExecution(cellId);
        return;
      }
      
      updateCellStatus(gridId, cellId, 'streaming');
      
      await streamLLMResponse(
        renderedPrompt,
        column.model,
        column.tools,
        {
          onToken: (token) => {
            updateCellOutput(gridId, cellId, token, true);
          },
          onComplete: (metadata) => {
            const callLog = getLastCallLog();
            if (callLog) {
              setCellCallLog(gridId, cellId, callLog);
            }
            setCellComplete(gridId, cellId, metadata);
            completeCellExecution(cellId);
          },
          onError: (error, statusCode) => {
            const callLog = getLastCallLog();
            if (callLog) {
              setCellCallLog(gridId, cellId, { ...callLog, statusCode: statusCode || 0 });
            }
            setCellError(gridId, cellId, `Error: ${error}${statusCode ? ` (Status: ${statusCode})` : ''}`);
            completeCellExecution(cellId);
          },
        },
        controller.signal
      );
    } catch (error) {
      setCellError(
        gridId,
        cellId,
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      completeCellExecution(cellId);
    }
  }, [gridId, grids, startCellExecution, updateCellStatus, updateCellOutput, setCellError, setCellComplete, setCellCallLog, setCellRenderedPrompt, completeCellExecution]);
  
  const processQueue = useCallback(() => {
    if (processingRef.current || isPaused || !gridId) return;
    
    processingRef.current = true;
    
    const grid = grids.find(g => g.id === gridId);
    if (!grid) {
      processingRef.current = false;
      return;
    }
    
    const availableSlots = MAX_CONCURRENT_CELLS - runningCells.size;
    if (availableSlots <= 0) {
      processingRef.current = false;
      return;
    }
    
    const cellsToStart: typeof executionQueue = [];
    
    for (const item of executionQueue) {
      if (cellsToStart.length >= availableSlots) break;
      
      const depsResolved = item.dependencies.every(depCellId => {
        const depCell = grid.cells[depCellId];
        return depCell && depCell.status === 'complete';
      });
      
      if (depsResolved) {
        cellsToStart.push(item);
      }
    }
    
    cellsToStart.forEach(item => {
      executeCell(item.cellId, item.companyId, item.columnId);
    });
    
    processingRef.current = false;
  }, [isPaused, gridId, grids, executionQueue, runningCells, executeCell]);
  
  useEffect(() => {
    if (!isPaused && executionQueue.length > 0) {
      const timer = setTimeout(processQueue, 100);
      return () => clearTimeout(timer);
    }
  }, [isPaused, executionQueue, runningCells, processQueue]);
  
  const queueCellsForColumn = useCallback((columnId: string) => {
    if (!gridId) return;
    
    const grid = grids.find(g => g.id === gridId);
    if (!grid) return;
    
    const column = grid.columns.find(c => c.id === columnId);
    if (!column) return;
    
    grid.companies.forEach(company => {
      const cellId = `${company.sedol}-${columnId}`;
      const cell = grid.cells[cellId];
      
      if (cell && (cell.status === 'idle' || cell.status === 'error')) {
        const deps = getCellDependencies(column.prompt, company.sedol, grid.columns, columnId);
        queueCellExecution(gridId, cellId, company.sedol, columnId, deps);
      }
    });
  }, [gridId, grids, queueCellExecution]);
  
  const queueCellsForCompany = useCallback((sedol: string) => {
    if (!gridId) return;
    
    const grid = grids.find(g => g.id === gridId);
    if (!grid) return;
    
    grid.columns.forEach(column => {
      const cellId = `${sedol}-${column.id}`;
      const cell = grid.cells[cellId];
      
      if (cell && (cell.status === 'idle' || cell.status === 'error')) {
        const deps = getCellDependencies(column.prompt, sedol, grid.columns, column.id);
        queueCellExecution(gridId, cellId, sedol, column.id, deps);
      }
    });
  }, [gridId, grids, queueCellExecution]);
  
  const queueAllCells = useCallback(() => {
    if (!gridId) return;
    
    const grid = grids.find(g => g.id === gridId);
    if (!grid) return;
    
    grid.companies.forEach(company => {
      grid.columns.forEach(column => {
        if (column.autoRun) {
          const cellId = `${company.sedol}-${column.id}`;
          const cell = grid.cells[cellId];
          
          if (cell && cell.status === 'idle') {
            const deps = getCellDependencies(column.prompt, company.sedol, grid.columns, column.id);
            queueCellExecution(gridId, cellId, company.sedol, column.id, deps);
          }
        }
      });
    });
  }, [gridId, grids, queueCellExecution]);
  
  return {
    queueCellsForColumn,
    queueCellsForCompany,
    queueAllCells,
    processQueue,
  };
}

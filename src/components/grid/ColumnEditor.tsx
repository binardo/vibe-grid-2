import { useState, useEffect, useRef } from 'react';
import { X, Plus, Globe, FileText, Phone, Briefcase, Upload } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DynamicPill } from '@/components/common/DynamicPill';
import type { ColumnConfig, PromptSegment, Tool, ToolType, ModelName, EffortLevel, DynamicToken, DynamicTokenType } from '@/types';

interface ColumnEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: ColumnConfig | null;
  onSave: (config: Partial<ColumnConfig>) => void;
  priorColumns: ColumnConfig[];
}

const toolIcons: Record<ToolType, React.ReactNode> = {
  web_search: <Globe className="w-4 h-4" />,
  latest_filing: <FileText className="w-4 h-4" />,
  latest_earnings_call: <Phone className="w-4 h-4" />,
  latest_broker_reports: <Briefcase className="w-4 h-4" />,
  upload_file: <Upload className="w-4 h-4" />,
};

const toolLabels: Record<ToolType, string> = {
  web_search: 'Web search',
  latest_filing: 'Latest filing',
  latest_earnings_call: 'Latest earnings call',
  latest_broker_reports: 'Latest broker reports',
  upload_file: 'Upload a file',
};

const dynamicTokenOptions: { type: DynamicTokenType; label: string; requiresStrategy?: boolean }[] = [
  { type: 'company_name', label: 'Company Name' },
  { type: 'sedol', label: 'SEDOL' },
  { type: 'current_date', label: 'Current Date' },
  { type: 'current_time', label: 'Current Time' },
  { type: 'forward_looking_hypothesis', label: 'Forward Looking Hypothesis', requiresStrategy: true },
  { type: 'company_fundamentals', label: 'Company Fundamentals' },
  { type: 'latest_earnings_call', label: 'Latest Earnings Call' },
  { type: 'latest_earnings_call_date', label: 'Latest Earnings Call Date' },
  { type: 'latest_filing_date', label: 'Latest Filing Date' },
  { type: 'latest_filing_summary', label: 'Latest Filing Summary' },
  { type: 'latest_broker_reports', label: 'Latest Broker Reports' },
];

const models: { value: ModelName; label: string }[] = [
  { value: 'gpt-5-nano', label: 'gpt-5-nano' },
  { value: 'gpt-5-mini', label: 'gpt-5-mini' },
  { value: 'gpt-5.2', label: 'gpt-5.2' },
  { value: 'o4-mini-deep-research', label: 'o4-mini-deep-research' },
];

const effortLevels: EffortLevel[] = ['minimal', 'low', 'medium', 'high'];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function ColumnEditor({ open, onOpenChange, column, onSave, priorColumns }: ColumnEditorProps) {
  const [name, setName] = useState('');
  const [segments, setSegments] = useState<PromptSegment[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [model, setModel] = useState<ModelName>('gpt-5-nano');
  const [effort, setEffort] = useState<EffortLevel>('low');
  const [autoRun, setAutoRun] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (column) {
      setName(column.name);
      setSegments(column.prompt);
      setTools(column.tools);
      setModel(column.model.model);
      setEffort(column.model.effort);
      setAutoRun(column.autoRun);
    } else {
      setName('');
      setSegments([]);
      setTools([]);
      setModel('gpt-5-nano');
      setEffort('low');
      setAutoRun(true);
    }
  }, [column, open]);

  const handleAddTool = (type: ToolType) => {
    if (!tools.find(t => t.type === type)) {
      setTools([...tools, { type }]);
    }
  };

  const handleRemoveTool = (type: ToolType) => {
    setTools(tools.filter(t => t.type !== type));
  };

  const handleAddToken = (type: DynamicTokenType, columnId?: string, columnName?: string) => {
    const token: DynamicToken = {
      id: generateId(),
      type,
      columnId,
      columnName,
    };
    setSegments([...segments, { type: 'token', token }]);
  };

  const handleRemoveToken = (tokenId: string) => {
    setSegments(segments.filter(s => s.type !== 'token' || s.token?.id !== tokenId));
  };

  const handleTextChange = (text: string) => {
    const textSegments = segments.filter(s => s.type === 'token');
    const newSegments: PromptSegment[] = [];
    
    if (text) {
      newSegments.push({ type: 'text', content: text });
    }
    
    textSegments.forEach(s => newSegments.push(s));
    setSegments(newSegments);
  };

  const getTextContent = () => {
    return segments
      .filter(s => s.type === 'text')
      .map(s => s.content)
      .join('');
  };

  const handleSave = () => {
    onSave({
      name: name || undefined,
      prompt: segments,
      tools,
      model: { model, effort },
      autoRun,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col bg-white/95 backdrop-blur-xl border border-white/40 p-0">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">
            {column ? 'Edit Prompt: Column' : 'New Prompt Column'}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-700">Name: (optional)</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Auto-generated if left blank"
              className="bg-white/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-700">Prompt</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                    Insert Dynamic Content
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur-xl max-h-80 overflow-y-auto">
                  {dynamicTokenOptions.map(option => (
                    <DropdownMenuItem
                      key={option.type}
                      onClick={() => handleAddToken(option.type)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                  {priorColumns.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-medium text-slate-500 border-t">
                        Cell Outputs
                      </div>
                      {priorColumns.map(col => (
                        <DropdownMenuItem
                          key={col.id}
                          onClick={() => handleAddToken('cell_output', col.id, col.name)}
                        >
                          Cell output of {col.name}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={getTextContent()}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Enter your prompt here..."
                className="w-full min-h-[200px] p-4 bg-white/50 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
              />
              
              {segments.filter(s => s.type === 'token').length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50/50 border-t border-slate-200 rounded-b-lg">
                  {segments
                    .filter(s => s.type === 'token')
                    .map(s => s.token && (
                      <DynamicPill
                        key={s.token.id}
                        token={s.token}
                        onRemove={() => handleRemoveToken(s.token!.id)}
                        draggable
                      />
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Label className="text-slate-700">Tools</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Tool
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white/95 backdrop-blur-xl">
                  {(Object.keys(toolLabels) as ToolType[]).map(type => (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => handleAddTool(type)}
                      disabled={tools.some(t => t.type === type)}
                    >
                      {toolIcons[type]}
                      <span className="ml-2">{toolLabels[type]}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {tools.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tools.map(tool => (
                  <span
                    key={tool.type}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm"
                  >
                    {toolIcons[tool.type]}
                    {toolLabels[tool.type]}
                    <button
                      onClick={() => handleRemoveTool(tool.type)}
                      className="hover:bg-slate-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="space-y-2">
              <Label className="text-slate-700">Model</Label>
              <div className="flex items-center gap-2">
                <Select value={model} onValueChange={(v) => setModel(v as ModelName)}>
                  <SelectTrigger className="w-40 bg-white/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {model !== 'o4-mini-deep-research' && (
                  <Select value={effort} onValueChange={(v) => setEffort(v as EffortLevel)}>
                    <SelectTrigger className="w-28 bg-white/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {effortLevels.map(level => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={autoRun}
                onCheckedChange={setAutoRun}
                className="data-[state=checked]:bg-blue-500"
              />
              <Label className="text-slate-700">Auto-run</Label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600">
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

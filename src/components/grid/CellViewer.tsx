import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RingSpinner } from '@/components/common/RingSpinner';
import type { CellData } from '@/types';

interface CellViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell: CellData | null;
  companyName: string;
  columnName: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-2"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy
        </>
      )}
    </Button>
  );
}

export function CellViewer({ open, onOpenChange, cell, companyName, columnName }: CellViewerProps) {
  if (!cell) return null;

  const isStreaming = cell.status === 'streaming' || cell.status === 'running';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col bg-white/95 backdrop-blur-xl border border-white/40 p-0">
        <div className="p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {companyName} - {columnName}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Status: {cell.status}
              {isStreaming && <RingSpinner size="sm" className="inline-block ml-2" />}
            </p>
          </div>
        </div>

        <Tabs defaultValue="output" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 justify-start bg-slate-100/50">
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="prompt">Rendered Input Prompt</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="calllog">Call Log</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="output" className="h-full m-0 p-6 overflow-y-auto">
              <div className="flex justify-end mb-4">
                <CopyButton text={cell.output} />
              </div>
              {cell.error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <p className="font-medium">Error</p>
                  <p className="mt-1">{cell.error}</p>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-4 rounded-lg">
                    {cell.output || 'No output yet'}
                  </pre>
                </div>
              )}
              {isStreaming && (
                <div className="flex items-center gap-2 mt-4 text-blue-600">
                  <RingSpinner size="sm" />
                  <span className="text-sm">Streaming...</span>
                </div>
              )}
            </TabsContent>

            <TabsContent value="prompt" className="h-full m-0 p-6 overflow-y-auto">
              <div className="flex justify-end mb-4">
                <CopyButton text={cell.renderedPrompt} />
              </div>
              <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-4 rounded-lg">
                {cell.renderedPrompt || 'No rendered prompt available'}
              </pre>
            </TabsContent>

            <TabsContent value="metadata" className="h-full m-0 p-6 overflow-y-auto">
              {cell.metadata ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">Model</p>
                      <p className="font-medium text-slate-800">{cell.metadata.model}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">Date/Time</p>
                      <p className="font-medium text-slate-800">
                        {new Date(cell.metadata.dateTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">Tokens In</p>
                      <p className="font-medium text-slate-800">{cell.metadata.tokensIn}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">Tokens Out</p>
                      <p className="font-medium text-slate-800">{cell.metadata.tokensOut}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">Estimated Cost</p>
                      <p className="font-medium text-slate-800">
                        ${cell.metadata.cost.toFixed(6)}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">Execution Count</p>
                      <p className="font-medium text-slate-800">{cell.metadata.executionCount}</p>
                    </div>
                  </div>
                  
                  {cell.metadata.tools.length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500 mb-2">Tools Used</p>
                      <div className="flex flex-wrap gap-2">
                        {cell.metadata.tools.map((tool, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-white rounded text-sm text-slate-700"
                          >
                            {tool.type.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500">No metadata available</p>
              )}
            </TabsContent>

            <TabsContent value="calllog" className="h-full m-0 p-6 overflow-y-auto">
              {cell.callLog ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-slate-800">Request</h3>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs text-slate-700 bg-slate-50 p-4 rounded-lg overflow-x-auto">
                      {cell.callLog.request}
                    </pre>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-slate-800">
                        Response (Status: {cell.callLog.statusCode})
                      </h3>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs text-slate-700 bg-slate-50 p-4 rounded-lg overflow-x-auto">
                      {cell.callLog.response}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">No call log available</p>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

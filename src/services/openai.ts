import type { ModelConfig, Tool, CellMetadata } from '../types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const USE_DUMMY_OPENAI = !OPENAI_API_KEY;

function logOpenAICall(method: string, url: string, statusCode: number, timeMs: number, bytesOrError: number | string) {
  if (typeof bytesOrError === 'string') {
    console.log(`[OpenAI] ${method} ${url} - ${statusCode} - ${timeMs}ms - Error: ${bytesOrError}`);
  } else {
    console.log(`[OpenAI] ${method} ${url} - ${statusCode} - ${timeMs}ms - ${bytesOrError} bytes`);
  }
}

function mapToolsToOpenAI(tools: Tool[]): object[] {
  return tools.map(tool => {
    switch (tool.type) {
      case 'web_search':
        return { type: 'web_search_preview' };
      default:
        return { type: 'web_search_preview' };
    }
  });
}

function getModelString(config: ModelConfig): string {
  if (config.model === 'o4-mini-deep-research') {
    return 'o4-mini';
  }
  return config.model;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (metadata: CellMetadata) => void;
  onError: (error: string, statusCode?: number) => void;
}

export interface CallLogData {
  request: string;
  response: string;
  statusCode: number;
}

let callLogCapture: CallLogData | null = null;

export function getLastCallLog(): CallLogData | null {
  return callLogCapture;
}

async function* dummyStreamResponse(): AsyncGenerator<string> {
  const responses = [
    "Based on my analysis of the company's recent performance, ",
    "there are several key factors to consider. ",
    "First, revenue growth has been strong, ",
    "driven by expansion in core markets. ",
    "Second, the company has maintained healthy margins ",
    "despite inflationary pressures. ",
    "Third, management has provided positive guidance ",
    "for the upcoming quarters. ",
    "Overall, the outlook appears favorable ",
    "with potential upside from new product launches ",
    "and market expansion initiatives.",
  ];
  
  for (const chunk of responses) {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    yield chunk;
  }
}

export async function streamLLMResponse(
  prompt: string,
  modelConfig: ModelConfig,
  tools: Tool[],
  callbacks: StreamCallbacks,
  abortSignal?: AbortSignal
): Promise<void> {
  const startTime = Date.now();
  let totalTokens = 0;
  let fullResponse = '';
  
  if (USE_DUMMY_OPENAI) {
    console.log(`[OpenAI] POST /v1/responses - streaming - dummy mode`);
    
    callLogCapture = {
      request: JSON.stringify({
        model: getModelString(modelConfig),
        input: prompt,
        tools: mapToolsToOpenAI(tools),
        stream: true,
      }, null, 2),
      response: '',
      statusCode: 200,
    };
    
    try {
      for await (const token of dummyStreamResponse()) {
        if (abortSignal?.aborted) {
          callbacks.onError('Request cancelled', 0);
          return;
        }
        fullResponse += token;
        totalTokens += token.split(' ').length;
        callbacks.onToken(token);
      }
      
      callLogCapture.response = JSON.stringify({
        id: 'dummy-response-id',
        output: [{ type: 'message', content: [{ type: 'output_text', text: fullResponse }] }],
        usage: { input_tokens: prompt.split(' ').length, output_tokens: totalTokens },
      }, null, 2);
      
      const timeMs = Date.now() - startTime;
      logOpenAICall('POST', '/v1/responses', 200, timeMs, fullResponse.length);
      
      callbacks.onComplete({
        model: getModelString(modelConfig),
        tokensIn: prompt.split(' ').length,
        tokensOut: totalTokens,
        dateTime: new Date().toISOString(),
        cost: (prompt.split(' ').length * 0.00001) + (totalTokens * 0.00003),
        tools,
        executionCount: 1,
      });
    } catch (error) {
      if (abortSignal?.aborted) {
        callbacks.onError('Request cancelled', 0);
        return;
      }
      callbacks.onError(error instanceof Error ? error.message : 'Unknown error');
    }
    return;
  }
  
  const requestBody = {
    model: getModelString(modelConfig),
    input: prompt,
    tools: tools.length > 0 ? mapToolsToOpenAI(tools) : undefined,
    stream: true,
  };
  
  callLogCapture = {
    request: JSON.stringify(requestBody, null, 2),
    response: '',
    statusCode: 0,
  };
  
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
      signal: abortSignal,
    });
    
    callLogCapture.statusCode = response.status;
    
    if (!response.ok) {
      const errorText = await response.text();
      callLogCapture.response = errorText;
      const timeMs = Date.now() - startTime;
      logOpenAICall('POST', '/v1/responses', response.status, timeMs, errorText);
      callbacks.onError(`API Error: ${response.status} - ${errorText}`, response.status);
      return;
    }
    
    if (!response.body) {
      callbacks.onError('No response body', response.status);
      return;
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let inputTokens = 0;
    let outputTokens = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'response.output_text.delta') {
              const text = parsed.delta || '';
              fullResponse += text;
              callbacks.onToken(text);
            }
            
            if (parsed.type === 'response.done') {
              inputTokens = parsed.response?.usage?.input_tokens || 0;
              outputTokens = parsed.response?.usage?.output_tokens || 0;
              callLogCapture.response = JSON.stringify(parsed, null, 2);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
    
    const timeMs = Date.now() - startTime;
    logOpenAICall('POST', '/v1/responses', response.status, timeMs, fullResponse.length);
    
    if (fullResponse.length === 0) {
      callbacks.onError('No output received from API', response.status);
      return;
    }
    
    callbacks.onComplete({
      model: getModelString(modelConfig),
      tokensIn: inputTokens,
      tokensOut: outputTokens,
      dateTime: new Date().toISOString(),
      cost: (inputTokens * 0.00001) + (outputTokens * 0.00003),
      tools,
      executionCount: 1,
    });
  } catch (error) {
    if (abortSignal?.aborted) {
      callbacks.onError('Request cancelled', 0);
      return;
    }
    const timeMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logOpenAICall('POST', '/v1/responses', 0, timeMs, errorMsg);
    callbacks.onError(errorMsg);
  }
}

export async function generateColumnName(prompt: string): Promise<string> {
  if (USE_DUMMY_OPENAI) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const words = prompt.split(' ').slice(0, 5);
    return words.join(' ').substring(0, 30) || 'Analysis';
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: `Generate a short, descriptive name (3-5 words max) for a column that runs this prompt: "${prompt.substring(0, 200)}". Return only the name, nothing else.`,
      }),
    });
    
    if (!response.ok) {
      return 'Analysis';
    }
    
    const data = await response.json();
    const name = data.output?.[0]?.content?.[0]?.text || 'Analysis';
    return name.substring(0, 50);
  } catch {
    return 'Analysis';
  }
}

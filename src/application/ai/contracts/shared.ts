/** How the response was produced — never implies authoritative domain mutation. */
export type AiResponseSource = "mock-ai" | "deterministic-fallback";

export type AiServiceStatus = "success" | "fallback" | "unavailable";

export interface EventCitation {
  eventId: string;
  sequence: number;
  type: string;
  timestamp: string;
}

export interface AiServiceResult<T> {
  data: T;
  status: AiServiceStatus;
  source: AiResponseSource;
  generatedAt: string;
  fallbackReason?: string;
}

export function createAiResult<T>(params: {
  data: T;
  status: AiServiceStatus;
  source: AiResponseSource;
  fallbackReason?: string;
}): AiServiceResult<T> {
  return {
    data: params.data,
    status: params.status,
    source: params.source,
    generatedAt: new Date().toISOString(),
    fallbackReason: params.fallbackReason,
  };
}

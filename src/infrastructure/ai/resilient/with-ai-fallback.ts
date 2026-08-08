import type { AiServiceResult } from "@/application/ai/contracts/shared";

/**
 * Wraps an AI service call with deterministic fallback when unavailable or failing.
 */
export async function withAiFallback<T>(
  operation: () => Promise<AiServiceResult<T>>,
  fallback: () => AiServiceResult<T>,
  options?: { forceFallback?: boolean },
): Promise<AiServiceResult<T>> {
  if (options?.forceFallback) {
    const fb = fallback();
    return {
      ...fb,
      status: "fallback",
      fallbackReason: fb.fallbackReason ?? "AI service forced to fallback",
    };
  }

  try {
    const result = await operation();
    if (result.status === "unavailable") {
      const fb = fallback();
      return {
        ...fb,
        status: "fallback",
        fallbackReason: result.fallbackReason ?? "AI service reported unavailable",
      };
    }
    return result;
  } catch (error) {
    const fb = fallback();
    return {
      ...fb,
      status: "fallback",
      fallbackReason:
        error instanceof Error ? error.message : "AI service threw an unexpected error",
    };
  }
}

export function wrapUnavailableService<T>(
  fallback: () => AiServiceResult<T>,
): { isAvailable: () => false; execute: () => Promise<AiServiceResult<T>> } {
  return {
    isAvailable: () => false,
    execute: async () => {
      const fb = fallback();
      return {
        ...fb,
        status: "fallback",
        fallbackReason: "AI service is unavailable",
      };
    },
  };
}

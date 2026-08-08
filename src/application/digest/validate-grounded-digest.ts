import type { DigestContext } from "@/application/digest/types/digest-context";
import type { GroundedDigestProviderOutput } from "@/application/ai/contracts/digest-provider.contract";

export interface GroundedDigestValidationResult {
  valid: boolean;
  reason?: string;
}

const FORBIDDEN_PHRASES = [
  /burnout/i,
  /productivity/i,
  /performance review/i,
  /underperform/i,
  /lazy/i,
  /effort level/i,
  /emotional state/i,
  /probably intended/i,
  /likely meant/i,
  /must be frustrated/i,
];

/**
 * Validates provider output against grounding rules before showing to users.
 */
export function validateGroundedDigestOutput(
  output: GroundedDigestProviderOutput,
  context: DigestContext,
): GroundedDigestValidationResult {
  const allowedEventIds = new Set(context.events.map((e) => e.eventId));

  for (const id of output.citedEventIds) {
    if (!allowedEventIds.has(id)) {
      return {
        valid: false,
        reason: `Cited event ${id} is not present in DigestContext`,
      };
    }
  }

  for (const item of output.items) {
    for (const id of item.citedEventIds) {
      if (!allowedEventIds.has(id)) {
        return {
          valid: false,
          reason: `Narrative item cites unknown event ${id}`,
        };
      }
    }
    if (item.citedEventIds.length === 0 && context.events.length > 0) {
      return {
        valid: false,
        reason: "Narrative item has no source event citations",
      };
    }
  }

  const combined = `${output.headline} ${output.narrative} ${output.items.map((i) => i.text).join(" ")}`;
  for (const pattern of FORBIDDEN_PHRASES) {
    if (pattern.test(combined)) {
      return { valid: false, reason: "Output contains forbidden speculative language" };
    }
  }

  if (context.events.length > 0 && !output.narrative.trim() && output.items.length === 0) {
    return { valid: false, reason: "Empty narrative for non-empty event set" };
  }

  return { valid: true };
}

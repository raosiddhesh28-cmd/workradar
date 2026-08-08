import type { AiServiceResult } from "./shared";

export interface ParsedTaskCapture {
  intent: "create_task";
  title: string;
  dueDate: string | null;
  assigneeHint: string | null;
  linkedGoalHint: string | null;
}

export interface ParsedBlockerFlag {
  intent: "flag_blocker";
  taskHint: string | null;
  description: string;
}

export interface ParsedUnknownIntent {
  intent: "unknown";
  reason: string;
}

export type ParsedIntent = ParsedTaskCapture | ParsedBlockerFlag | ParsedUnknownIntent;

export interface NlInputParsingInput {
  rawInput: string;
  actorPersonId: string;
  orgId: string;
}

export interface NlInputParsingOutput {
  parsed: ParsedIntent;
  confidence: number;
  /** Parsed results always require human confirmation before any mutation. */
  requiresConfirmation: true;
  originalInput: string;
}

/**
 * Assistive natural-language input parsing.
 * Returns a proposed intent for confirmation — never mutates graph state directly.
 */
export interface INaturalLanguageInputParsingService {
  isAvailable(): boolean;
  parseInput(input: NlInputParsingInput): Promise<AiServiceResult<NlInputParsingOutput>>;
}

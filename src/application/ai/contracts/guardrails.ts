/**
 * Architectural guardrails for all AI assistive services.
 * AI is downstream of the Event/Signal Bus and deterministic domain logic.
 * These constraints are enforced by interface design, read-only context, and tests.
 */
export const AI_GUARDRAILS = {
  mustNotCalculateAuthoritativeImpactScore: true,
  mustNotModifyTaskPriority: true,
  mustNotModifyGoals: true,
  mustNotModifyDependencies: true,
  mustNotInferEmployeePerformance: true,
  mustNotInferProductivity: true,
  mustNotInferBurnoutRisk: true,
  mustNotMakeAutonomousOrganizationalDecisions: true,
} as const;

export type AiGuardrail = keyof typeof AI_GUARDRAILS;

export const AI_GUARDRAIL_DESCRIPTIONS: Record<AiGuardrail, string> = {
  mustNotCalculateAuthoritativeImpactScore:
    "Impact Score is computed only by domain/scoring deterministic engine",
  mustNotModifyTaskPriority:
    "AI may narrate or advise; it never reorders or changes task priority",
  mustNotModifyGoals: "AI never creates, updates, or deletes goals",
  mustNotModifyDependencies: "AI never creates, updates, or deletes dependencies",
  mustNotInferEmployeePerformance:
    "AI never scores, ranks, or judges individual employee performance",
  mustNotInferProductivity:
    "AI never infers or reports productivity metrics about people",
  mustNotInferBurnoutRisk:
    "AI never infers burnout, workload risk, or wellness signals about people",
  mustNotMakeAutonomousOrganizationalDecisions:
    "AI never commits organizational changes without explicit human confirmation",
};

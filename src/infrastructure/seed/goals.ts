import type { Goal, Initiative } from "@/domain/types";
import { ORG_ID } from "./teams";

export const goals: Goal[] = [
  {
    id: "goal-q3-retention",
    orgId: ORG_ID,
    title: "Improve Q3 Customer Retention",
    level: "company",
    parentGoalId: null,
    healthStatus: "at_risk",
    ownerId: "person-vp-eng",
    strategicWeight: 1,
    initiativeId: "init-retention",
  },
  {
    id: "goal-platform-reliability",
    orgId: ORG_ID,
    title: "Q3 Platform Reliability",
    level: "company",
    parentGoalId: null,
    healthStatus: "on_track",
    ownerId: "person-vp-eng",
    strategicWeight: 0.9,
    initiativeId: "init-reliability",
  },
  {
    id: "goal-mobile-launch",
    orgId: ORG_ID,
    title: "Mobile App v2 Launch",
    level: "team",
    parentGoalId: "goal-q3-retention",
    healthStatus: "at_risk",
    ownerId: "person-sam",
    strategicWeight: 0.8,
    initiativeId: "init-mobile",
  },
  {
    id: "goal-api-migration",
    orgId: ORG_ID,
    title: "API Gateway Migration",
    level: "team",
    parentGoalId: "goal-platform-reliability",
    healthStatus: "on_track",
    ownerId: "person-devon",
    strategicWeight: 0.7,
    initiativeId: "init-api",
  },
  {
    id: "goal-enterprise-sla",
    orgId: ORG_ID,
    title: "Enterprise SLA Compliance",
    level: "team",
    parentGoalId: "goal-q3-retention",
    healthStatus: "on_track",
    ownerId: "person-taylor",
    strategicWeight: 0.75,
    initiativeId: "init-sla",
  },
];

export const initiatives: Initiative[] = [
  { id: "init-retention", orgId: ORG_ID, title: "Retention Program", goalId: "goal-q3-retention" },
  { id: "init-reliability", orgId: ORG_ID, title: "Reliability Initiative", goalId: "goal-platform-reliability" },
  { id: "init-mobile", orgId: ORG_ID, title: "Mobile v2", goalId: "goal-mobile-launch" },
  { id: "init-api", orgId: ORG_ID, title: "API Migration", goalId: "goal-api-migration" },
  { id: "init-sla", orgId: ORG_ID, title: "SLA Program", goalId: "goal-enterprise-sla" },
];

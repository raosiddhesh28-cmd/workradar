import type { Team } from "@/domain/types";

export const ORG_ID = "org-acme";
export const NOW = new Date("2026-08-08T09:00:00.000Z");

export const teams: Team[] = [
  { id: "team-platform", orgId: ORG_ID, name: "Platform Engineering" },
  { id: "team-product", orgId: ORG_ID, name: "Product & Design" },
  { id: "team-cs", orgId: ORG_ID, name: "Customer Success" },
  { id: "team-revops", orgId: ORG_ID, name: "Revenue Ops" },
];

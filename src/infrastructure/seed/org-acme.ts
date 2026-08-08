import type { OrgGraph } from "@/domain/types";
import { teams } from "./teams";
import { people } from "./people";
import { goals, initiatives } from "./goals";
import { tasks } from "./tasks";
import { dependencies } from "./dependencies";
import { events } from "./events";
import { ORG_ID } from "./teams";

export function createAcmeOrgGraph(): OrgGraph {
  return {
    orgId: ORG_ID,
    teams,
    people,
    goals,
    initiatives,
    tasks: structuredClone(tasks),
    dependencies: structuredClone(dependencies),
    events: structuredClone(events),
  };
}

export { ORG_ID, NOW } from "./teams";
export { DEFAULT_PERSON_ID, DEMO_PERSONAS } from "./people";

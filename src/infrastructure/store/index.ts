import { createAcmeOrgGraph } from "../seed/org-acme";
import { initGraphStore, type GraphStore } from "./graph-store";
import { resetEventBus } from "../events";

let graphStore: GraphStore | null = null;

export function getGraphStore(): GraphStore {
  if (!graphStore) {
    graphStore = initGraphStore(createAcmeOrgGraph());
  }
  return graphStore;
}

export function resetGraphStore(): void {
  graphStore = initGraphStore(createAcmeOrgGraph());
  resetEventBus();
}

export { initGraphStore, type GraphStore } from "./graph-store";

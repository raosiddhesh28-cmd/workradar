import {
  searchWorkRadar,
  hasSearchResults,
  type WorkRadarSearchResults,
} from "@/domain/search/workradar-search";
import { getGraphStore } from "@/infrastructure/store";

export function getSearchResults(query: string): WorkRadarSearchResults {
  const graph = getGraphStore().getGraph();
  return searchWorkRadar(graph, query);
}

export function searchHasResults(query: string): boolean {
  return hasSearchResults(getSearchResults(query));
}

export type { WorkRadarSearchResults };

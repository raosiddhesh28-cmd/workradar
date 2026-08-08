import { InMemoryEventBus } from "./in-memory-event-bus";
import type { IEventStore } from "./event-bus.interface";
import { projectSeedOrgEventToDomainEvent } from "@/domain/events/projector";
import { events as seedOrgEvents } from "@/infrastructure/seed/events";
import { getGraphStore } from "@/infrastructure/store";
import { projectDomainEventToOrgEvent } from "@/domain/events/projector";

let eventBus: IEventStore | null = null;

function createGraphProjectionSubscriber(bus: IEventStore): void {
  bus.subscribe((event) => {
    const store = getGraphStore();
    store.addEvent(projectDomainEventToOrgEvent(event));
  });
}

function hydrateFromSeed(bus: IEventStore): void {
  const historical = seedOrgEvents.map((orgEvent, index) =>
    projectSeedOrgEventToDomainEvent(orgEvent, index + 1),
  );
  bus.loadHistorical(historical);
}

export function getEventBus(): IEventStore {
  if (!eventBus) {
    eventBus = new InMemoryEventBus();
    hydrateFromSeed(eventBus);
    createGraphProjectionSubscriber(eventBus);
  }
  return eventBus;
}

export function resetEventBus(): IEventStore {
  eventBus = new InMemoryEventBus();
  hydrateFromSeed(eventBus);
  createGraphProjectionSubscriber(eventBus);
  return eventBus;
}

export { InMemoryEventBus } from "./in-memory-event-bus";
export type { IEventBus, IEventStore } from "./event-bus.interface";

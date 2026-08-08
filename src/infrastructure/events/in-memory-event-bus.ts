import type {
  DomainEvent,
  DomainEventFilter,
  DomainEventTypeName,
  ReadonlyDomainEvent,
} from "@/domain/events/types";
import type {
  DomainEventListener,
  EventBusSubscribeOptions,
  IEventStore,
} from "./event-bus.interface";

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  Object.freeze(value);
  for (const key of Object.keys(value as object)) {
    const child = (value as Record<string, unknown>)[key];
    if (child !== null && typeof child === "object" && !Object.isFrozen(child)) {
      deepFreeze(child);
    }
  }
  return value;
}

function matchesFilter(event: ReadonlyDomainEvent, filter: DomainEventFilter): boolean {
  if (filter.types && !filter.types.includes(event.type)) return false;
  if (filter.since && event.timestamp <= filter.since) return false;
  if (filter.until && event.timestamp > filter.until) return false;
  if (filter.entityId && event.entityId !== filter.entityId) return false;
  if (filter.taskId && event.taskId !== filter.taskId) return false;
  if (filter.goalId && event.goalId !== filter.goalId) return false;
  if (filter.dependencyId && event.dependencyId !== filter.dependencyId) return false;
  if (filter.actorPersonId && event.actorPersonId !== filter.actorPersonId) return false;
  return true;
}

export class InMemoryEventBus implements IEventStore {
  private readonly events: ReadonlyDomainEvent[] = [];
  private sequence = 0;
  private readonly listeners: Array<{
    listener: DomainEventListener;
    types?: DomainEventTypeName[];
  }> = [];

  publish(event: DomainEvent): ReadonlyDomainEvent {
    if (event.sequence !== 0 && event.sequence <= this.sequence) {
      throw new Error(
        `Event sequence ${event.sequence} is invalid for publish (current: ${this.sequence})`,
      );
    }

    const published = deepFreeze({
      ...event,
      sequence: this.sequence + 1,
      relatedPersonIds: [...event.relatedPersonIds],
      payload: structuredClone(event.payload),
    }) as ReadonlyDomainEvent;

    this.sequence = published.sequence;
    this.events.push(published);
    this.notify(published);
    return published;
  }

  loadHistorical(events: ReadonlyArray<ReadonlyDomainEvent>): void {
    for (const event of events) {
      if (event.sequence <= this.sequence) {
        throw new Error(
          `Historical event sequence ${event.sequence} must be greater than ${this.sequence}`,
        );
      }
      deepFreeze(event);
      this.events.push(event);
      this.sequence = event.sequence;
    }
  }

  getAll(): ReadonlyArray<ReadonlyDomainEvent> {
    return [...this.events];
  }

  query(filter?: DomainEventFilter): ReadonlyArray<ReadonlyDomainEvent> {
    if (!filter) return this.getAll();
    return this.events.filter((e) => matchesFilter(e, filter));
  }

  getSince(timestamp: string): ReadonlyArray<ReadonlyDomainEvent> {
    return this.events.filter((e) => e.timestamp > timestamp);
  }

  subscribe(listener: DomainEventListener, options?: EventBusSubscribeOptions): () => void {
    const entry = { listener, types: options?.types };
    this.listeners.push(entry);
    return () => {
      const idx = this.listeners.indexOf(entry);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  getSequence(): number {
    return this.sequence;
  }

  private notify(event: ReadonlyDomainEvent): void {
    for (const { listener, types } of this.listeners) {
      if (types && !types.includes(event.type)) continue;
      listener(event);
    }
  }
}

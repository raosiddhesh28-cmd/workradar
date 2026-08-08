import type {
  DomainEvent,
  DomainEventFilter,
  DomainEventTypeName,
  ReadonlyDomainEvent,
} from "@/domain/events/types";

export type DomainEventListener = (event: ReadonlyDomainEvent) => void;

export interface EventBusSubscribeOptions {
  types?: DomainEventTypeName[];
}

/**
 * Append-only Event/Signal Bus port.
 * Implementations must not mutate published events and must preserve publication order.
 */
export interface IEventBus {
  /** Append an event. Returns the immutable published record with assigned sequence. */
  publish(event: DomainEvent): ReadonlyDomainEvent;

  /** All events in publication order (immutable snapshots). */
  getAll(): ReadonlyArray<ReadonlyDomainEvent>;

  /** Filtered query; results are in publication order. */
  query(filter?: DomainEventFilter): ReadonlyArray<ReadonlyDomainEvent>;

  /** Events published strictly after the given ISO timestamp. */
  getSince(timestamp: string): ReadonlyArray<ReadonlyDomainEvent>;

  /** Subscribe to new publications. Returns unsubscribe function. */
  subscribe(
    listener: DomainEventListener,
    options?: EventBusSubscribeOptions,
  ): () => void;

  /** Current publication count (for tests and diagnostics). */
  getSequence(): number;
}

/**
 * Persistent event store port — future replacement for in-memory bus backing store.
 */
export interface IEventStore extends IEventBus {
  /** Bulk load historical events (e.g. seed hydration). Events must already have sequences. */
  loadHistorical(events: ReadonlyArray<ReadonlyDomainEvent>): void;
}

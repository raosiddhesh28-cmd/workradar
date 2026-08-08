import type { DomainEvent, ReadonlyDomainEvent } from "@/domain/events/types";
import { getEventBus } from "@/infrastructure/events";

/**
 * Publishes a domain event to the append-only bus.
 * Does not touch Impact Score — scoring remains in domain/scoring only.
 */
export function publishDomainEvent(event: DomainEvent): ReadonlyDomainEvent {
  return getEventBus().publish(event);
}

export function queryDomainEvents(
  filter?: Parameters<ReturnType<typeof getEventBus>["query"]>[0],
): ReadonlyArray<ReadonlyDomainEvent> {
  return getEventBus().query(filter);
}

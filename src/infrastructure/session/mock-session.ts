import { cookies } from "next/headers";
import { DEFAULT_PERSON_ID } from "@/infrastructure/seed/people";
import { getGraphStore } from "@/infrastructure/store";
import type { Person } from "@/domain/types";

export const SESSION_COOKIE = "workradar-person-id";

export async function getCurrentPersonId(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? DEFAULT_PERSON_ID;
}

export async function getCurrentPerson(): Promise<Person> {
  const id = await getCurrentPersonId();
  const person = getGraphStore().getPerson(id);
  if (!person) throw new Error(`Unknown person: ${id}`);
  return person;
}

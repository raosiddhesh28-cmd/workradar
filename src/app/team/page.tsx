import { notFound } from "next/navigation";
import { getTeamRollup } from "@/application/services/aerial-view.service";
import { getCurrentPersonId } from "@/infrastructure/session/mock-session";
import { LinkButton } from "@/components/shared/LinkButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TeamPage() {
  const personId = await getCurrentPersonId();
  const rollup = await getTeamRollup(personId);
  if (!rollup) notFound();

  return (
    <main className="mx-auto max-w-5xl w-full px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Team Aerial Rollup</h1>
          <p className="text-muted-foreground text-sm">
            {rollup.manager.name} — team status without a status meeting
          </p>
        </div>
        <LinkButton href="/aerial" variant="outline">
          ← My aerial view
        </LinkButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rollup.reports.map((report) => (
          <Card key={report.person.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span>{report.person.name}</span>
                {report.hasBlocker && (
                  <Badge variant="outline" className="text-amber-600">
                    Blocker
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{report.person.title}</p>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>
                Top work:{" "}
                <span className="font-medium">
                  {report.topTask ?? "None ranked"}
                </span>
              </p>
              <p className="text-muted-foreground">
                {report.topWorkCount} ranked items · {report.blockerCount} active
                blockers
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {rollup.teamBlockers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team blockers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rollup.teamBlockers.map((b) => (
              <div key={b.dependency.id} className="text-sm border rounded p-3 space-y-2">
                <p className="font-medium">{b.taskTitle}</p>
                <p className="text-muted-foreground">
                  {b.blockedPersonName ?? b.otherPartyName} · {b.daysBlocked}d blocked
                  {b.daysOverdue != null && b.daysOverdue > 0
                    ? ` · ${b.daysOverdue}d overdue`
                    : ""}
                </p>
                {b.narrative && (
                  <p className="text-sm leading-snug">{b.narrative}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}

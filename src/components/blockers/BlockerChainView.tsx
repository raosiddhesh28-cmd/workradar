import type { BlockerChain } from "@/domain/graph/blocker-chain";
import { LinkButton } from "@/components/shared/LinkButton";

interface BlockerChainViewProps {
  chain: BlockerChain;
  compact?: boolean;
  showRootBlocker?: boolean;
}

export function BlockerChainView({
  chain,
  compact = false,
  showRootBlocker = true,
}: BlockerChainViewProps) {
  if (chain.nodes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No dependency chain available from graph data.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="font-mono text-sm space-y-1">
        {chain.nodes.map((node, index) => (
          <div key={`${node.taskId}-${index}`} className="flex flex-col items-start">
            {index > 0 && (
              <span className="text-muted-foreground pl-2" aria-hidden>
                ↓
              </span>
            )}
            <span className={index === 0 ? "font-medium" : ""}>{node.taskTitle}</span>
            {!compact && node.ownerName && (
              <span className="text-xs text-muted-foreground pl-0">
                {node.ownerName}
                {node.daysOverdue != null && node.daysOverdue > 0
                  ? ` · ${node.daysOverdue} day${node.daysOverdue === 1 ? "" : "s"} overdue`
                  : ""}
              </span>
            )}
          </div>
        ))}
      </div>

      {showRootBlocker && chain.rootBlockerTitle && (
        <div className="text-sm space-y-1 border-t pt-2">
          <p className="font-medium">
            {chain.immediateBlockerTaskId === chain.rootBlockerTaskId
              ? "Direct blocker"
              : "Root blocker"}
          </p>
          <p>{chain.rootBlockerTitle}</p>
          {chain.nodes.find((n) => n.taskId === chain.rootBlockerTaskId)?.ownerName && (
            <p className="text-muted-foreground">
              Owner:{" "}
              {chain.nodes.find((n) => n.taskId === chain.rootBlockerTaskId)?.ownerName}
            </p>
          )}
        </div>
      )}

      {chain.nodes[0]?.goalTitle && (
        <div className="text-sm space-y-1">
          <p className="font-medium">Goal</p>
          <p>{chain.nodes[0].goalTitle}</p>
          {chain.nodes[0].goalHealth && (
            <p className="text-muted-foreground capitalize">
              Status: {chain.nodes[0].goalHealth.replace("_", " ")}
            </p>
          )}
        </div>
      )}

      {chain.cycleDetected && (
        <p className="text-sm text-amber-600">
          Cyclic dependency detected — traversal stopped safely.
        </p>
      )}

      {chain.hasDeeperUpstream && !chain.cycleDetected && (
        <p className="text-sm text-muted-foreground">
          Deeper upstream blockers exist beyond the configured traversal depth.
        </p>
      )}

      {chain.rootBlockerTaskId && !compact && (
        <LinkButton
          href={`/tasks/${chain.rootBlockerTaskId}`}
          variant="outline"
          size="sm"
        >
          View task
        </LinkButton>
      )}
    </div>
  );
}

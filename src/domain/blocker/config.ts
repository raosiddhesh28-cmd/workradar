/**
 * Blocker narrative traversal configuration.
 * Independent from Impact Score maxTraverseDepth (downstream impact only).
 */
export const DEFAULT_BLOCKER_CHAIN_CONFIG = {
  maxBlockerChainDepth: 4,
} as const;

export type BlockerChainConfig = typeof DEFAULT_BLOCKER_CHAIN_CONFIG;

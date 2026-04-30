import type {
  NpcRealityReactionLog,
  NpcRealityReactionResult,
  NpcRealityReactionRule,
  NpcRealityReactionSource,
} from './types';

const DEFAULT_RECENT_DAYS = 3;
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;

type LatestRealityGainLogOptions = {
  now?: number;
  recentDays?: number;
};

function isSupportedRealitySource(source: NpcRealityReactionLog['source']): source is NpcRealityReactionSource {
  return source === 'todo' || source === 'habit';
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function matchesSource(log: NpcRealityReactionLog, source?: NpcRealityReactionSource): boolean {
  return !source || log.source === source;
}

function matchesCategories(log: NpcRealityReactionLog, category?: string | string[]): boolean {
  if (!category) return true;
  const categories = Array.isArray(category) ? category : [category];
  return categories.includes(log.category);
}

export function matchesTitleIncludes(title: string, keywords: string[]): boolean {
  const normalizedTitle = normalizeText(title);
  return keywords.some((keyword) => normalizedTitle.includes(normalizeText(keyword)));
}

export function stableHash(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function isGainLogRevertedLater(gainLog: NpcRealityReactionLog, logs: NpcRealityReactionLog[]): boolean {
  return logs.some(
    (log) =>
      log.direction === 'revert' &&
      log.source === gainLog.source &&
      log.sourceId === gainLog.sourceId &&
      log.createdAt > gainLog.createdAt
  );
}

export function getLatestRealityGainLog(
  logs: NpcRealityReactionLog[],
  options: LatestRealityGainLogOptions = {}
): NpcRealityReactionLog | undefined {
  const now = options.now ?? Date.now();
  const recentDays = options.recentDays ?? DEFAULT_RECENT_DAYS;
  const cutoff = now - recentDays * RECENT_WINDOW_MS;

  return logs
    .filter((log) => log.createdAt >= cutoff)
    .filter((log) => log.direction === 'gain')
    .filter((log) => isSupportedRealitySource(log.source))
    .filter((log) => !isGainLogRevertedLater(log, logs))
    .sort((left, right) => right.createdAt - left.createdAt)
    .at(0);
}

export function findNpcRealityReactionRule(
  log: NpcRealityReactionLog,
  rules: NpcRealityReactionRule[],
  npcId: string
): NpcRealityReactionRule | undefined {
  const scopedRules = rules.filter((rule) => rule.npcId === npcId);

  const titleRule = scopedRules.find(
    (rule) =>
      rule.match.titleIncludes &&
      matchesSource(log, rule.match.source) &&
      matchesCategories(log, rule.match.category) &&
      matchesTitleIncludes(log.title, rule.match.titleIncludes)
  );
  if (titleRule) return titleRule;

  const categoryRule = scopedRules.find(
    (rule) =>
      rule.match.category &&
      matchesSource(log, rule.match.source) &&
      matchesCategories(log, rule.match.category)
  );
  if (categoryRule) return categoryRule;

  return scopedRules.find(
    (rule) =>
      !rule.match.titleIncludes &&
      !rule.match.category &&
      matchesSource(log, rule.match.source)
  );
}

export function createNpcRealityReaction({
  npcId,
  logs,
  rules,
  noRecentLogText,
}: {
  npcId: string;
  logs: NpcRealityReactionLog[];
  rules: NpcRealityReactionRule[];
  noRecentLogText: string;
}): NpcRealityReactionResult {
  const latestLog = getLatestRealityGainLog(logs);
  if (!latestLog) {
    return {
      text: noRecentLogText,
      ruleKey: 'no_recent_log',
    };
  }

  const rule = findNpcRealityReactionRule(latestLog, rules, npcId);
  if (!rule || rule.templates.length === 0) {
    return {
      text: noRecentLogText,
      log: latestLog,
      ruleKey: 'fallback',
    };
  }

  const index = stableHash(`${npcId}:${latestLog.id}:${rule.key}`) % rule.templates.length;
  return {
    text: rule.templates[index] ?? noRecentLogText,
    log: latestLog,
    ruleKey: rule.key,
  };
}

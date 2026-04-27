import { getTodaySummary } from '@/stores';

export function buildTodaySummaryText(): string {
  const summary = getTodaySummary();
  const parts: string[] = [];
  parts.push(`习惯完成 ${summary.habitsDoneCount}`);
  parts.push(`待办完成 ${summary.todosDoneCount}`);

  if (summary.streaks && Object.keys(summary.streaks).length > 0) {
    const top = Object.entries(summary.streaks)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, days]) => `${id}:${days}天`)
      .join('，');
    parts.push(`连续：${top}`);
  }

  return `今日摘要：${parts.join('；')}`;
}


import { getMoodLabel } from '@/core/constants/mood';
import type { FragmentType, LabFragment } from '@/stores/fragmentStore';

type FragmentWithOptionalMeta = LabFragment & {
  title?: string;
  body?: string;
  text?: string;
  tags?: string[];
  category?: string;
  note?: string;
  content?: string;
};

function safeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function safeTextList(values: unknown[]): string[] {
  return values
    .map((value) => {
      if (typeof value === 'string') return value.trim();
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
      return '';
    })
    .filter((value) => value.length > 0);
}

export function getFragmentTitle(fragment: LabFragment): string {
  if (fragment.type === 'inspiration') {
    const withMeta = fragment as FragmentWithOptionalMeta;
    const rawTitle = safeText(withMeta.title);
    if (rawTitle) return rawTitle;

    const firstLine = fragment.content.split('\n').find((line) => line.trim().length > 0)?.trim() ?? '';
    return truncateText(firstLine || fragment.content.trim(), 28) || '灵感碎片';
  }

  const withMeta = fragment as FragmentWithOptionalMeta;
  const rawTitle = safeText(withMeta.title);
  if (rawTitle) return rawTitle;
  return `${getMoodLabel(fragment.mood)} · 强度 ${fragment.intensity}`;
}

export function getFragmentSummary(fragment: LabFragment): string {
  if (fragment.type === 'inspiration') {
    const withMeta = fragment as FragmentWithOptionalMeta;
    const text = safeText(withMeta.body) || safeText(withMeta.text) || fragment.content.trim();
    return truncateText(text, 80) || '这条灵感还没有更多内容。';
  }

  const withMeta = fragment as FragmentWithOptionalMeta;
  const note = fragment.note.trim();
  const extras = [getMoodLabel(fragment.mood), safeText(withMeta.category)].filter(Boolean).join(' · ');
  if (note) return truncateText(note, 80);
  return extras || '这一刻的心情还没有写下更多备注。';
}

export function getFragmentTags(fragment: LabFragment): string[] {
  const withMeta = fragment as FragmentWithOptionalMeta;
  if (!Array.isArray(withMeta.tags)) return [];
  return Array.from(
    new Set(
      withMeta.tags
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter((tag) => tag.length > 0)
    )
  );
}

export function getFragmentSearchText(fragment: LabFragment): string {
  const withMeta = fragment as FragmentWithOptionalMeta;
  const values =
    fragment.type === 'inspiration'
      ? safeTextList([
          fragment.type,
          withMeta.title,
          withMeta.body,
          withMeta.text,
          withMeta.note,
          fragment.content,
        ])
      : safeTextList([
          fragment.type,
          withMeta.title,
          withMeta.body,
          withMeta.text,
          withMeta.content,
          fragment.note,
          fragment.mood,
          getMoodLabel(fragment.mood),
          fragment.intensity,
        ]);

  return [...values, ...getFragmentTags(fragment)].join(' ').trim().toLowerCase();
}

export function matchesFragmentSearch(fragment: LabFragment, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) return true;
  return getFragmentSearchText(fragment).includes(normalizedQuery);
}

export function getFragmentCreatedAt(fragment: LabFragment): number {
  return fragment.updatedAt ?? fragment.createdAt;
}

export function getFragmentTypeLabel(type: FragmentType): string {
  return type === 'inspiration' ? '灵感碎片' : '心情碎片';
}

export function formatFragmentTime(timestamp?: number): string {
  if (!timestamp || !Number.isFinite(timestamp)) return '时间未知';
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

export function truncateText(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

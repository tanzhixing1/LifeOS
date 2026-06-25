import { getLocalISODate } from '@/core/utils/date';
import type { DailyTimelineRecord } from '@/stores';

export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
export const CALENDAR_ROW_COUNT = 6;
export const DAYS_PER_WEEK = 7;
export const SOURCE_LABELS: Record<DailyTimelineRecord['source'], string> = {
  todo: '待办',
  habit: '习惯',
  schedule: '行程',
  manual: '手动',
};
export const SOURCE_DETAIL_LABELS: Record<DailyTimelineRecord['source'], string> = {
  todo: '待办记录',
  habit: '习惯记录',
  schedule: '行程记录',
  manual: '手动记录',
};
export const DEFAULT_MANUAL_CATEGORY = '日常';
export const DEFAULT_TIMELINE_CATEGORY_COLOR = '#8B6FA1';
export const TIMELINE_CATEGORY_OPTIONS = ['日常', '健康', '友情', '恋爱', '打游戏', '厕所', '喝水', '睡觉'] as const;
export const TIMELINE_RECOMMENDED_COLORS = ['#8B6FA1', '#C69A2E', '#5E8FD2', '#5C9B72', '#D66B2D', '#C56F92', '#7D9A8A', '#6B5AC7'];
export const TIMELINE_COLOR_PALETTE = [
  ['#F4B4B4', '#E38181', '#D85E5E', '#B84242', '#7F2A2A', '#5A1D1D', '#F1D3C6', '#C8B9AE'],
  ['#F3C7A6', '#E9A46E', '#D66B2D', '#C45A20', '#8A3B12', '#5F280D', '#F3D5B8', '#CDB49A'],
  ['#F5E8AB', '#E7CD63', '#C69A2E', '#A27A18', '#745710', '#4B390B', '#ECE2C1', '#CFC3A0'],
  ['#D6EDB8', '#A9D67B', '#74B85D', '#5C9B72', '#3B6F48', '#284A31', '#DCE8C9', '#B8C9A7'],
  ['#BDEBE3', '#78D0C5', '#44AFA9', '#2B8A88', '#1C6463', '#124344', '#C7E3DD', '#A6C1BB'],
  ['#C8E4F4', '#8CBFE7', '#5E8FD2', '#436EB5', '#2B4C82', '#1B3257', '#D1DCEA', '#AAB8C8'],
  ['#D7D0F6', '#AA9AE9', '#7B68D6', '#6B5AC7', '#4B3E95', '#312862', '#DDD5F0', '#B9B1D0'],
  ['#F1D0EA', '#DFA1D0', '#C56F92', '#A85679', '#7A3E57', '#552A3C', '#E9D2DE', '#C9B2BE'],
  ['#F6F2EC', '#E1D8CD', '#C8B9AE', '#A5968D', '#7B7069', '#514A45', '#D7D2D8', '#9C97A0'],
];

export type TimelineCategoryOption = (typeof TIMELINE_CATEGORY_OPTIONS)[number];
export type TimelineCategoryMeta = {
  color: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
};

export type CalendarDay = {
  date: Date;
  dateISO: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isToday: boolean;
  isSelected: boolean;
  recordCount: number;
};

const TIMELINE_CATEGORY_META: Record<TimelineCategoryOption, TimelineCategoryMeta> = {
  日常: { color: '#8F6F56', textColor: '#8F6F56', backgroundColor: 'rgba(143,111,86,0.16)', borderColor: 'rgba(143,111,86,0.24)' },
  健康: { color: '#4E8A70', textColor: '#4E8A70', backgroundColor: 'rgba(78,138,112,0.16)', borderColor: 'rgba(78,138,112,0.24)' },
  友情: { color: '#5679A6', textColor: '#5679A6', backgroundColor: 'rgba(86,121,166,0.16)', borderColor: 'rgba(86,121,166,0.24)' },
  恋爱: { color: '#B05F7A', textColor: '#B05F7A', backgroundColor: 'rgba(176,95,122,0.16)', borderColor: 'rgba(176,95,122,0.24)' },
  打游戏: { color: '#6B5AC7', textColor: '#6B5AC7', backgroundColor: 'rgba(107,90,199,0.16)', borderColor: 'rgba(107,90,199,0.24)' },
  厕所: { color: '#7B7E89', textColor: '#7B7E89', backgroundColor: 'rgba(123,126,137,0.16)', borderColor: 'rgba(123,126,137,0.24)' },
  喝水: { color: '#3A8FB0', textColor: '#3A8FB0', backgroundColor: 'rgba(58,143,176,0.16)', borderColor: 'rgba(58,143,176,0.24)' },
  睡觉: { color: '#6B68A6', textColor: '#6B68A6', backgroundColor: 'rgba(107,104,166,0.16)', borderColor: 'rgba(107,104,166,0.24)' },
};

export function normalizeHexColor(value?: string): string | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return /^#([0-9A-F]{6})$/.test(normalized) ? normalized : null;
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return `rgba(139,111,161,${alpha})`;
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

export function getTimelineCategoryDefaultColor(category?: string): string {
  if (!category) return DEFAULT_TIMELINE_CATEGORY_COLOR;
  return TIMELINE_CATEGORY_META[category as TimelineCategoryOption]?.color ?? DEFAULT_TIMELINE_CATEGORY_COLOR;
}

export function getTimelineCategoryMeta(category?: string, categoryColor?: string): TimelineCategoryMeta {
  const presetMeta = category ? TIMELINE_CATEGORY_META[category as TimelineCategoryOption] : null;
  const color = normalizeHexColor(categoryColor) ?? presetMeta?.color ?? DEFAULT_TIMELINE_CATEGORY_COLOR;
  return {
    color,
    textColor: normalizeHexColor(categoryColor) ? color : presetMeta?.textColor ?? DEFAULT_TIMELINE_CATEGORY_COLOR,
    backgroundColor: normalizeHexColor(categoryColor) ? hexToRgba(color, 0.16) : presetMeta?.backgroundColor ?? hexToRgba(DEFAULT_TIMELINE_CATEGORY_COLOR, 0.12),
    borderColor: normalizeHexColor(categoryColor) ? hexToRgba(color, 0.28) : presetMeta?.borderColor ?? hexToRgba(DEFAULT_TIMELINE_CATEGORY_COLOR, 0.22),
  };
}

export function formatWishMartMoney(priceCents: number): string {
  return `¥${(priceCents / 100).toFixed(2)}`;
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function clampDateToMonth(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, Math.min(day, getDaysInMonth(year, monthIndex)));
}

export function getDefaultTimeInputValue(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function formatTimeInputValue(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function parseTimeInput(timeInput: string): { hours: number; minutes: number } | null {
  const match = timeInput.trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export function getManualOccurredAt(date: Date, timeInput: string): number {
  const parsed = parseTimeInput(timeInput) ?? { hours: 9, minutes: 0 };
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), parsed.hours, parsed.minutes).getTime();
}

export function getTimelineTime(record: DailyTimelineRecord): number {
  return record.occurredAt ?? record.createdAt;
}

export function formatTimelineTime(record: DailyTimelineRecord): string {
  return new Date(getTimelineTime(record)).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function buildCalendarDays(visibleMonth: Date, selectedDateISO: string, todayISO: string, recordCountsByDate: Map<string, number>): CalendarDay[] {
  const year = visibleMonth.getFullYear();
  const monthIndex = visibleMonth.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const gridStart = new Date(year, monthIndex, 1 - firstDay.getDay());

  return Array.from({ length: CALENDAR_ROW_COUNT * DAYS_PER_WEEK }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateISO = getLocalISODate(date);

    return {
      date,
      dateISO,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getFullYear() === year && date.getMonth() === monthIndex,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isToday: dateISO === todayISO,
      isSelected: dateISO === selectedDateISO,
      recordCount: recordCountsByDate.get(dateISO) ?? 0,
    };
  });
}

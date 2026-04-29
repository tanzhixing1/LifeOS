export type MoodKind = '开心' | '平静' | '焦虑' | '难过' | '生气' | '疲惫' | '抓狂' | '战斗';
export type LegacyMoodKind = '战斗状态';
export type MoodValue = MoodKind | LegacyMoodKind;

export type MoodIntensity = 1 | 2 | 3 | 4 | 5;

export type MoodMeta = {
  mark: string;
  color: string;
  bg: string;
};

export const MOOD_OPTIONS: MoodKind[] = ['开心', '平静', '焦虑', '难过', '生气', '疲惫', '抓狂', '战斗'];

export const MOOD_META: Record<MoodKind, MoodMeta> = {
  开心: { mark: '✦', color: '#C79B3B', bg: 'rgba(244,203,110,0.18)' },
  平静: { mark: '☾', color: '#7D9A8A', bg: 'rgba(125,154,138,0.16)' },
  焦虑: { mark: '◇', color: '#A98ABC', bg: 'rgba(169,138,188,0.16)' },
  难过: { mark: '☁', color: '#7590B0', bg: 'rgba(117,144,176,0.16)' },
  生气: { mark: '△', color: '#C87979', bg: 'rgba(200,121,121,0.15)' },
  疲惫: { mark: '…', color: '#9A8F84', bg: 'rgba(154,143,132,0.16)' },
  抓狂: { mark: '⚡', color: '#D66B2D', bg: 'rgba(214,107,45,0.20)' },
  战斗: { mark: '⚔', color: '#C69A2E', bg: 'rgba(198,154,46,0.20)' },
};

export function normalizeMoodKind(mood: MoodValue | string): MoodKind {
  if (mood === '战斗状态') return '战斗';
  if (MOOD_OPTIONS.includes(mood as MoodKind)) return mood as MoodKind;
  return '平静';
}

export function getMoodLabel(mood: MoodValue | string): MoodKind {
  return normalizeMoodKind(mood);
}

export function getMoodMeta(mood: MoodValue | string): MoodMeta {
  return MOOD_META[normalizeMoodKind(mood)];
}

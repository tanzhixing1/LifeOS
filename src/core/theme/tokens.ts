import type { TextStyle, ViewStyle } from 'react-native';

export const uiTokens = {
  colors: {
    light: {
      page: '#F2EEE8',
      card: '#FBF7F1',
      cardAlt: '#F7F0EA',
      border: '#D8D0C7',
      text: '#2E2A26',
      muted: '#7A756F',
      accent: '#D1BBDE',
      accentStrong: '#8B6FA1',
      accentSoft: 'rgba(209,187,222,0.24)',
      danger: '#D96C6C',
      dangerSoft: 'rgba(217,108,108,0.12)',
      input: 'rgba(255,255,255,0.42)',
      overlay: 'rgba(0,0,0,0.35)',
    },
    dark: {
      page: '#171819',
      card: '#1C1F22',
      cardAlt: '#202328',
      border: '#2A3036',
      text: '#ECEDEE',
      muted: '#A7B0BE',
      accent: '#D1BBDE',
      accentStrong: '#E4CBF2',
      accentSoft: 'rgba(209,187,222,0.16)',
      danger: '#D96C6C',
      dangerSoft: 'rgba(217,108,108,0.16)',
      input: 'rgba(255,255,255,0.06)',
      overlay: 'rgba(0,0,0,0.48)',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 14,
    xl: 18,
    xxl: 24,
  },
  radius: {
    sm: 12,
    md: 14,
    lg: 18,
    xl: 22,
    pill: 999,
  },
  typography: {
    screenTitle: { fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: 0, textAlign: 'center' } satisfies TextStyle,
    pageTitle: { fontSize: 26, lineHeight: 32, fontWeight: '900', letterSpacing: 0, textAlign: 'center' } satisfies TextStyle,
    sectionTitle: { fontSize: 18, lineHeight: 24, fontWeight: '900' } satisfies TextStyle,
    cardTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900' } satisfies TextStyle,
    body: { fontSize: 15, lineHeight: 21, fontWeight: '800' } satisfies TextStyle,
    meta: { fontSize: 12, lineHeight: 16, fontWeight: '800' } satisfies TextStyle,
    button: { fontSize: 15, lineHeight: 18, fontWeight: '900' } satisfies TextStyle,
    chip: { fontSize: 13, lineHeight: 16, fontWeight: '900' } satisfies TextStyle,
  },
  layout: {
    screenPaddingX: 18,
    screenPaddingTop: 18,
    headerPaddingTop: 4,
    tabBarExtraPadding: 40,
    cardGap: 10,
  },
} as const;

export type UiThemeName = keyof typeof uiTokens.colors;
export type UiPalette = (typeof uiTokens.colors)[UiThemeName];

export const softShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
  elevation: 2,
} satisfies ViewStyle;

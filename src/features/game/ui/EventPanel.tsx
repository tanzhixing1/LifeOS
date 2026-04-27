import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Choice, EventNode } from '@/features/game/engine/types';

export type EventPanelProps = {
  event: EventNode;
  choices: Choice[];
  onSelectChoice: (choice: Choice) => void;
};

export function EventPanel({ event, choices, onSelectChoice }: EventPanelProps) {
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#6D8AAE', dark: '#88A9D4' }, 'tint');

  return (
    <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <ThemedText style={styles.title}>{event.title}</ThemedText>
      <View style={styles.paragraphs}>
        {event.paragraphs.map((p, i) => (
          <ThemedText key={`${event.id}.p.${i}`} style={[styles.paragraph, { color: mutedText }]}>
            {p}
          </ThemedText>
        ))}
      </View>

      <View style={styles.options}>
        {choices.map((c, i) => (
          <Pressable
            key={`${event.id}.o.${i}`}
            onPress={() => onSelectChoice(c)}
            style={({ pressed }) => [
              styles.option,
              { borderColor: cardBorder, opacity: pressed ? 0.92 : 1 },
            ]}>
            <ThemedText style={[styles.optionText, { color: accent }]}>{c.text}</ThemedText>
          </Pressable>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '900' },
  paragraphs: { gap: 8 },
  paragraph: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  options: { gap: 10, paddingTop: 4 },
  option: { borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12 },
  optionText: { fontSize: 14, lineHeight: 18, fontWeight: '800' },
});


import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useMessengerStore } from '@/stores/messengerStore';

export function ContextualMessengerHost() {
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');

  const queue = useMessengerStore((s) => s.queue);
  const pop = useMessengerStore((s) => s.pop);
  const muteToday = useMessengerStore((s) => s.muteToday);

  const current = queue.length > 0 ? queue[0] : null;
  const visible = current != null;

  const title = useMemo(() => current?.title ?? '', [current]);
  const body = useMemo(() => current?.body ?? '', [current]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => pop()}>
      <Pressable style={styles.mask} onPress={() => pop()}>
        <Pressable style={styles.maskInner} />
      </Pressable>

      <View style={styles.center}>
        <ThemedView style={[styles.panel, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={[styles.body, { color: mutedText }]}>{body}</ThemedText>

          <View style={styles.actions}>
            <Pressable onPress={() => { muteToday(); pop(); }} style={[styles.btn, { borderColor: cardBorder }]}>
              <ThemedText style={[styles.btnText, { color: mutedText }]}>今天别吵我</ThemedText>
            </Pressable>
            <Pressable onPress={() => pop()} style={[styles.btn, { borderColor: accent, backgroundColor: accent }]}>
              <ThemedText style={[styles.btnText, { color: '#fff' }]}>知道了</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  maskInner: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  panel: { width: '100%', borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  title: { fontSize: 16, lineHeight: 20, fontWeight: '900', textAlign: 'center' },
  body: { fontSize: 13, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10, paddingTop: 4 },
  btn: { flex: 1, height: 42, borderWidth: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 14, lineHeight: 18, fontWeight: '900' },
});


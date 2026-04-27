import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { UIIcon } from '@/core/constants/ui-icons';
import { useThemeColor } from '@/hooks/use-theme-color';

export type IconGridProps = {
  icons: UIIcon[];
  selectedId: string;
  onSelect: (id: string) => void;
  columns?: number;
};

export function IconGrid({ icons, selectedId, onSelect, columns = 5 }: IconGridProps) {
  const border = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');

  return (
    <View style={styles.wrap}>
      {icons.map((icon) => {
        const active = icon.id === selectedId;
        return (
          <Pressable
            key={icon.id}
            onPress={() => onSelect(icon.id)}
            style={[
              styles.cell,
              {
                width: `${100 / columns}%`,
              },
            ]}>
            <View
              style={[
                styles.cellInner,
                {
                  borderColor: active ? accent : border,
                  backgroundColor: active ? 'rgba(209,187,222,0.18)' : 'transparent',
                },
              ]}>
              <ThemedText style={styles.icon}>{icon.label}</ThemedText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { paddingVertical: 6 },
  cellInner: {
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderRadius: 14,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20, lineHeight: 24, fontWeight: '900' },
});


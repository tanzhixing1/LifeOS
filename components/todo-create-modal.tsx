import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { IconGrid } from '@/components/icon-grid';
import { ThemedText } from '@/components/themed-text';
import { TODO_CATEGORIES, type TodoCategory } from '@/core/constants/todo-category';
import { UI_ICONS } from '@/core/constants/ui-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTodoStore } from '@/stores/todoStore';

type DueSelection =
  | { kind: 'none' }
  | { kind: 'timestamp'; value: number; label: string };

export type TodoCreateModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  onCreated?: (id: string) => void;
};

function buildDueOptions(now: Date): DueSelection[] {
  const base = new Date(now);
  const dayStart = new Date(base);
  dayStart.setHours(0, 0, 0, 0);

  function at(dayOffset: number, hour: number, minute: number, label: string): DueSelection {
    const d = new Date(dayStart);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return { kind: 'timestamp', value: d.getTime(), label };
  }

  return [
    { kind: 'none' },
    at(0, 12, 0, '今天 12:00'),
    at(0, 18, 0, '今天 18:00'),
    at(0, 22, 0, '今天 22:00'),
    at(1, 9, 0, '明天 09:00'),
    at(1, 18, 0, '明天 18:00'),
    at(2, 9, 0, '后天 09:00'),
  ];
}

export function TodoCreateModal({ visible, onRequestClose, onCreated }: TodoCreateModalProps) {
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');

  const addTodo = useTodoStore((s) => s.addTodo);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TodoCategory>('自我');
  const [iconId, setIconId] = useState('default');
  const [due, setDue] = useState<DueSelection>({ kind: 'none' });
  const [duePickerVisible, setDuePickerVisible] = useState(false);

  const dueOptions = useMemo(() => buildDueOptions(new Date()), [visible]);

  const canSave = title.trim().length > 0;

  function resetForm() {
    setTitle('');
    setCategory('自我');
    setIconId('default');
    setDue({ kind: 'none' });
    setDuePickerVisible(false);
  }

  function close() {
    onRequestClose();
    resetForm();
  }

  function save() {
    if (!canSave) return;
    const dueAt = due.kind === 'timestamp' ? due.value : null;
    const id = addTodo({
      title: title.trim(),
      dueAt,
      category,
      iconId,
      done: false,
    });
    onCreated?.(id);
    close();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.mask} onPress={close}>
        <Pressable style={styles.maskInner} />
      </Pressable>

      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.kav}>
        <View style={[styles.sheet, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.sheetTop}>
            <View style={styles.handle} />
          </View>

          <ThemedText style={styles.title}>新建事务（别磨蹭）</ThemedText>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.group}>
              <ThemedText style={[styles.label, { color: mutedText }]}>事项名称（必填）</ThemedText>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="例如：把今天这点破事做完"
                placeholderTextColor="#9F9A93"
                style={[
                  styles.input,
                  { borderColor: cardBorder, color: '#3D3A36', backgroundColor: 'rgba(255,255,255,0.35)' },
                ]}
                returnKeyType="done"
              />
            </View>

            <View style={styles.group}>
              <ThemedText style={[styles.label, { color: mutedText }]}>截止时间（可空）</ThemedText>
              <Pressable
                onPress={() => setDuePickerVisible(true)}
                style={({ pressed }) => [
                  styles.pickRow,
                  { borderColor: cardBorder, opacity: pressed ? 0.92 : 1 },
                ]}>
                <ThemedText style={[styles.pickText, { color: mutedText }]}>
                  {due.kind === 'timestamp' ? due.label : '不设截止（你就继续摆烂）'}
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.group}>
              <ThemedText style={[styles.label, { color: mutedText }]}>类型（单选）</ThemedText>
              <View style={styles.chips}>
                {TODO_CATEGORIES.map((c) => {
                  const active = c === category;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setCategory(c)}
                      style={[
                        styles.chip,
                        {
                          borderColor: active ? accent : cardBorder,
                          backgroundColor: active ? 'rgba(209,187,222,0.18)' : 'transparent',
                        },
                      ]}>
                      <ThemedText style={[styles.chipText, { color: active ? accent : mutedText }]}>{c}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.group}>
              <ThemedText style={[styles.label, { color: mutedText }]}>自选图标（单选）</ThemedText>
              <IconGrid icons={UI_ICONS} selectedId={iconId} onSelect={setIconId} />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable onPress={close} style={[styles.btn, { borderColor: cardBorder }]}>
              <ThemedText style={[styles.btnText, { color: mutedText }]}>算了</ThemedText>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={!canSave}
              style={[
                styles.btn,
                {
                  borderColor: canSave ? accent : cardBorder,
                  backgroundColor: canSave ? accent : 'transparent',
                  opacity: canSave ? 1 : 0.6,
                },
              ]}>
              <ThemedText style={[styles.btnText, { color: canSave ? '#fff' : mutedText }]}>保存</ThemedText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={duePickerVisible} transparent animationType="fade" onRequestClose={() => setDuePickerVisible(false)}>
        <Pressable style={styles.pickerMask} onPress={() => setDuePickerVisible(false)}>
          <Pressable style={styles.pickerPanel} onPress={() => {}}>
            <ThemedText style={styles.pickerTitle}>挑个时间（随便也行）</ThemedText>
            {dueOptions.map((opt, idx) => {
              const active = opt.kind === 'none' ? due.kind === 'none' : due.kind === 'timestamp' && due.value === opt.value;
              const label = opt.kind === 'none' ? '不设截止' : opt.label;
              return (
                <Pressable
                  key={`${label}.${idx}`}
                  onPress={() => {
                    setDue(opt);
                    setDuePickerVisible(false);
                  }}
                  style={[
                    styles.pickerItem,
                    { borderColor: active ? accent : cardBorder, backgroundColor: active ? 'rgba(209,187,222,0.18)' : 'transparent' },
                  ]}>
                  <ThemedText style={[styles.pickerItemText, { color: active ? accent : mutedText }]}>{label}</ThemedText>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  maskInner: { flex: 1 },
  kav: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: { borderWidth: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 14, paddingBottom: 16, gap: 10 },
  sheetTop: { alignItems: 'center', justifyContent: 'center', height: 26 },
  handle: { width: 44, height: 5, borderRadius: 999, backgroundColor: 'rgba(122,117,111,0.35)' },
  title: { fontSize: 16, lineHeight: 20, fontWeight: '900', textAlign: 'center' },
  content: { paddingBottom: 10, gap: 14 },
  group: { gap: 8 },
  label: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  input: { height: 46, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, fontSize: 14, fontWeight: '700' },
  pickRow: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12 },
  pickText: { fontSize: 13, lineHeight: 16, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 10, paddingTop: 2 },
  btn: { flex: 1, height: 42, borderWidth: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 15, lineHeight: 18, fontWeight: '900' },

  pickerMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  pickerPanel: { width: '100%', borderRadius: 18, borderWidth: 1, padding: 14, gap: 10, backgroundColor: 'rgba(247,243,238,0.98)' },
  pickerTitle: { fontSize: 15, lineHeight: 18, fontWeight: '900', textAlign: 'center' },
  pickerItem: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12 },
  pickerItemText: { fontSize: 13, lineHeight: 16, fontWeight: '900', textAlign: 'center' },
});


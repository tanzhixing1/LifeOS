import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/core/ui/AppButton';
import { AppChip } from '@/core/ui/AppChip';
import { uiTokens } from '@/core/theme/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WISH_STATUS_META, WISH_STATUS_ORDER } from '@/features/tools/wish-mart/constants';
import type { WishItem, WishStatus } from '@/stores/wishlistStore';

type WishEditorModalProps = {
  visible: boolean;
  editingItem: WishItem | null;
  onRequestClose: () => void;
  onSave: (input: { name: string; priceCents: number; category?: string; note?: string; status: WishStatus }) => void;
  onDelete: (item: WishItem) => void;
};

const RECEIPT_FONT_FAMILY = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

function formatPriceInput(priceCents: number): string {
  if (!priceCents) return '';
  return (priceCents / 100).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

function parsePriceInput(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return 0;
  if (!/^-?\d+(\.\d{0,2})?$/.test(trimmed)) return null;

  const negative = trimmed.startsWith('-');
  const normalized = negative ? trimmed.slice(1) : trimmed;
  const [wholePart, fractionPart = ''] = normalized.split('.');
  const cents = Number.parseInt(wholePart || '0', 10) * 100 + Number.parseInt(fractionPart.padEnd(2, '0') || '0', 10);
  return negative ? 0 : cents;
}

export function WishEditorModal({ visible, editingItem, onRequestClose, onSave, onDelete }: WishEditorModalProps) {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];
  const reportAccent = theme === 'light' ? '#8B6FA1' : '#D7C2E5';
  const danger = theme === 'light' ? '#C96B78' : '#DF8C96';
  const [name, setName] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<WishStatus>('want');
  const [formError, setFormError] = useState('');

  const title = editingItem ? 'EDIT WISH' : 'NEW WISH';
  const subtitle = editingItem ? '编辑愿望单' : '新增愿望单';

  useEffect(() => {
    if (!visible) return;

    setName(editingItem?.name ?? '');
    setPriceInput(editingItem ? formatPriceInput(editingItem.priceCents) : '');
    setCategory(editingItem?.category ?? '');
    setNote(editingItem?.note ?? '');
    setStatus(editingItem?.status ?? 'want');
    setFormError('');
  }, [editingItem, visible]);

  const pricePreview = useMemo(() => {
    const parsed = parsePriceInput(priceInput);
    return parsed == null ? null : (parsed / 100).toFixed(2);
  }, [priceInput]);

  function handleSave() {
    const nextName = name.trim();
    if (!nextName) {
      setFormError('请先填写商品名称。');
      return;
    }

    const priceCents = parsePriceInput(priceInput);
    if (priceCents == null) {
      setFormError('金额格式不正确，最多保留两位小数。');
      return;
    }

    onSave({
      name: nextName,
      priceCents,
      category: category.trim() || undefined,
      note: note.trim() || undefined,
      status,
    });
    onRequestClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
      <Pressable style={[styles.mask, { backgroundColor: palette.overlay }]} onPress={onRequestClose}>
        <Pressable style={styles.maskInner} />
      </Pressable>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.sheetKav}>
        <View style={[styles.sheet, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.sheetTop}>
            <View style={[styles.sheetHandle, { backgroundColor: palette.border }]} />
          </View>

          <View style={styles.titleWrap}>
            <ThemedText style={[styles.kicker, { color: reportAccent, fontFamily: RECEIPT_FONT_FAMILY }]}>{title}</ThemedText>
            <ThemedText style={styles.sheetTitle}>{subtitle}</ThemedText>
            <ThemedText style={[styles.sheetHint, { color: palette.muted }]}>金额留空会按 0 处理，负数会自动归零。</ThemedText>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
            <View style={styles.group}>
              <ThemedText style={[styles.label, { color: palette.muted }]}>商品名称</ThemedText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="例如：机械键盘 / 香水 / 小桌灯"
                placeholderTextColor={palette.muted}
                style={[styles.input, { borderColor: palette.border, color: palette.text, backgroundColor: palette.input }]}
                returnKeyType="done"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.group, styles.rowItem]}>
                <ThemedText style={[styles.label, { color: palette.muted }]}>金额（元）</ThemedText>
                <TextInput
                  value={priceInput}
                  onChangeText={setPriceInput}
                  placeholder="0"
                  placeholderTextColor={palette.muted}
                  keyboardType="decimal-pad"
                  style={[
                    styles.input,
                    styles.monoInput,
                    { borderColor: palette.border, color: palette.text, backgroundColor: palette.input },
                  ]}
                  returnKeyType="done"
                />
                <ThemedText style={[styles.supportText, { color: palette.muted }]}>
                  {pricePreview == null ? '请输入合法金额' : `合计会记为 ¥${pricePreview}`}
                </ThemedText>
              </View>

              <View style={[styles.group, styles.rowItem]}>
                <ThemedText style={[styles.label, { color: palette.muted }]}>分类</ThemedText>
                <TextInput
                  value={category}
                  onChangeText={setCategory}
                  placeholder="数码 / 衣物 / 家居"
                  placeholderTextColor={palette.muted}
                  style={[styles.input, { borderColor: palette.border, color: palette.text, backgroundColor: palette.input }]}
                  returnKeyType="done"
                />
              </View>
            </View>

            <View style={styles.group}>
              <ThemedText style={[styles.label, { color: palette.muted }]}>状态</ThemedText>
              <View style={styles.statusRow}>
                {WISH_STATUS_ORDER.map((option) => {
                  const meta = WISH_STATUS_META[option];
                  const selected = option === status;
                  return (
                    <AppChip
                      key={option}
                      title={`${meta.shortLabel} / ${meta.label}`}
                      selected={selected}
                      onPress={() => setStatus(option)}
                      style={{
                        borderColor: meta.border,
                        backgroundColor: selected ? meta.tintSoft : 'transparent',
                      }}
                      textStyle={{ color: selected ? meta.tint : palette.text }}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.group}>
              <ThemedText style={[styles.label, { color: palette.muted }]}>备注 / 为什么想买</ThemedText>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="例如：想提升桌面手感，先放三天看看会不会冷静下来"
                placeholderTextColor={palette.muted}
                style={[
                  styles.input,
                  styles.noteInput,
                  { borderColor: palette.border, color: palette.text, backgroundColor: palette.input },
                ]}
                multiline
                textAlignVertical="top"
              />
            </View>

            {formError ? <ThemedText style={[styles.formError, { color: danger }]}>{formError}</ThemedText> : null}
          </ScrollView>

          <View style={styles.actions}>
            {editingItem ? (
              <AppButton title="删除" variant="outline" onPress={() => onDelete(editingItem)} style={styles.action} />
            ) : null}
            <AppButton title="取消" variant="outline" onPress={onRequestClose} style={styles.action} />
            <AppButton title="保存" onPress={handleSave} style={styles.action} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: { flex: 1 },
  maskInner: { flex: 1 },
  sheetKav: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: {
    borderWidth: 1,
    borderTopLeftRadius: uiTokens.radius.xl,
    borderTopRightRadius: uiTokens.radius.xl,
    paddingHorizontal: uiTokens.spacing.lg,
    paddingTop: uiTokens.spacing.md,
    paddingBottom: uiTokens.spacing.xl,
    maxHeight: '86%',
  },
  sheetTop: { alignItems: 'center', justifyContent: 'center', height: 24 },
  sheetHandle: { width: 44, height: 5, borderRadius: uiTokens.radius.pill },
  titleWrap: { alignItems: 'center', gap: 4, marginBottom: uiTokens.spacing.md },
  kicker: { fontSize: 11, lineHeight: 14, fontWeight: '900', letterSpacing: 1.2 },
  sheetTitle: { fontSize: 18, lineHeight: 23, fontWeight: '900' },
  sheetHint: { fontSize: 12, lineHeight: 17, fontWeight: '800', textAlign: 'center' },
  form: { gap: uiTokens.spacing.md, paddingBottom: uiTokens.spacing.sm },
  group: { gap: uiTokens.spacing.sm },
  row: { flexDirection: 'row', gap: uiTokens.spacing.sm },
  rowItem: { flex: 1 },
  label: uiTokens.typography.chip,
  input: {
    minHeight: 46,
    borderWidth: 1.5,
    borderRadius: uiTokens.radius.lg,
    paddingHorizontal: uiTokens.spacing.md,
    paddingVertical: uiTokens.spacing.sm,
    fontSize: 15,
    fontWeight: '800',
  },
  monoInput: {
    fontFamily: RECEIPT_FONT_FAMILY,
    letterSpacing: 0.4,
  },
  noteInput: { minHeight: 92 },
  supportText: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: uiTokens.spacing.xs },
  formError: { fontSize: 12, lineHeight: 17, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: uiTokens.spacing.sm, marginTop: uiTokens.spacing.sm, paddingTop: uiTokens.spacing.sm },
  action: { flex: 1 },
});

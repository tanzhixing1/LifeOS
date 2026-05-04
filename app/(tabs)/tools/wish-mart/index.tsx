import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/core/ui/AppButton';
import { AppChip } from '@/core/ui/AppChip';
import { ScreenScaffold } from '@/core/ui/ScreenScaffold';
import { SectionCard } from '@/core/ui/SectionCard';
import { uiTokens } from '@/core/theme/tokens';
import { WISH_MART_BARCODE, WISH_RECEIPT_DIVIDER, WISH_STATUS_META, WISH_STATUS_ORDER } from '@/features/tools/wish-mart/constants';
import { selectWishCooldownDays, selectWishItemsByStatus, selectWishStats } from '@/features/tools/wish-mart/selectors';
import { WishEditorModal } from '@/features/tools/wish-mart/ui/WishEditorModal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type WishItem, type WishStatus, useWishlistStore } from '@/stores';

const RECEIPT_FONT_FAMILY = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

function formatMoney(priceCents: number): string {
  return `¥${(priceCents / 100).toFixed(2)}`;
}

function formatCreatedLabel(item: WishItem): string {
  const createdDate = new Date(item.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  if (item.status === 'bought' && item.boughtAt) {
    const boughtDate = new Date(item.boughtAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    return `已购 ${boughtDate} · 记于 ${createdDate}`;
  }

  const cooldownDays = selectWishCooldownDays(item);
  if (cooldownDays <= 0) return `今天记下 · ${createdDate}`;
  return `冷静 ${cooldownDays} 天 · ${createdDate}`;
}

function getExpandedTitle(status: WishStatus): string {
  return `${WISH_STATUS_META[status].shortLabel} ITEMS`;
}

function getExpandedEmptyText(status: WishStatus): string {
  return `暂无${WISH_STATUS_META[status].label}商品。`;
}

export default function WishMartScreen() {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];
  const reportAccent = theme === 'light' ? '#8B6FA1' : '#D7C2E5';
  const receiptBackground = theme === 'light' ? '#FFF9F2' : '#1F2124';
  const receiptBorder = theme === 'light' ? '#D8D0C7' : palette.border;
  const receiptMuted = theme === 'light' ? '#7A756F' : palette.muted;
  const receiptPanel = theme === 'light' ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.04)';
  const stampTint = theme === 'light' ? '#C96B78' : '#DF8C96';

  const items = useWishlistStore((state) => state.items);
  const addItem = useWishlistStore((state) => state.addItem);
  const updateItem = useWishlistStore((state) => state.updateItem);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<WishItem | null>(null);
  const [expandedStatus, setExpandedStatus] = useState<WishStatus | null>(null);

  const stats = useMemo(() => selectWishStats(items), [items]);
  const expandedItems = useMemo(
    () => (expandedStatus ? selectWishItemsByStatus(items, expandedStatus) : []),
    [expandedStatus, items]
  );

  function toggleExpandedStatus(status: WishStatus) {
    setExpandedStatus((current) => (current === status ? null : status));
  }

  function openCreateModal() {
    setEditingItem(null);
    setModalVisible(true);
  }

  function openEditModal(item: WishItem) {
    setEditingItem(item);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingItem(null);
  }

  function handleSave(input: { name: string; priceCents: number; category?: string; note?: string; status: WishItem['status'] }) {
    if (editingItem) {
      updateItem(editingItem.id, input);
      return;
    }

    addItem(input);
  }

  function handleDelete(item: WishItem) {
    Alert.alert('删除愿望单', `确定删除“${item.name}”吗？删除后不会保留回收站。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          removeItem(item.id);
          closeModal();
        },
      },
    ]);
  }

  return (
    <ScreenScaffold scroll>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}>
          <ThemedText style={[styles.backText, { color: palette.muted }]}>返回</ThemedText>
        </Pressable>
        <View style={styles.titleWrap}>
          <ThemedText style={[styles.kicker, { color: reportAccent, fontFamily: RECEIPT_FONT_FAMILY }]}>WISH MART</ThemedText>
          <ThemedText style={styles.pageTitle}>愿望小票</ThemedText>
          <ThemedText style={[styles.pageSub, { color: palette.muted }]}>默认只看小票总览，需要时再展开状态明细。</ThemedText>
        </View>
        <AppChip title="+ 新增" onPress={openCreateModal} style={styles.addChip} />
      </View>

      <View style={[styles.receiptCard, { backgroundColor: receiptBackground, borderColor: receiptBorder }]}>
        <View style={[styles.receiptTape, { backgroundColor: theme === 'light' ? 'rgba(209,187,222,0.42)' : 'rgba(209,187,222,0.16)' }]} />
        <ThemedText style={[styles.receiptTitle, { color: palette.text, fontFamily: RECEIPT_FONT_FAMILY }]}>WISH MART</ThemedText>
        <ThemedText style={[styles.receiptSubTitle, { color: receiptMuted, fontFamily: RECEIPT_FONT_FAMILY }]}>
          Your cooling-off shopping note
        </ThemedText>
        <ThemedText style={[styles.receiptDivider, { color: receiptMuted, fontFamily: RECEIPT_FONT_FAMILY }]}>{WISH_RECEIPT_DIVIDER}</ThemedText>

        <View style={styles.receiptMetaRow}>
          <ThemedText style={[styles.receiptMetaText, { color: receiptMuted, fontFamily: RECEIPT_FONT_FAMILY }]}>
            ITEMS {String(stats.totalCount).padStart(2, '0')}
          </ThemedText>
          <ThemedText style={[styles.receiptMetaText, { color: receiptMuted, fontFamily: RECEIPT_FONT_FAMILY }]}>
            TOTAL {formatMoney(stats.totalAmountCents)}
          </ThemedText>
        </View>

        <ThemedText style={[styles.receiptDivider, { color: receiptMuted, fontFamily: RECEIPT_FONT_FAMILY }]}>{WISH_RECEIPT_DIVIDER}</ThemedText>

        <View style={styles.summaryGrid}>
          {WISH_STATUS_ORDER.map((status, index) => {
            const selected = expandedStatus === status;
            const summary = stats.byStatus[status];
            return (
              <ReceiptStatusRow
                key={status}
                status={status}
                isLast={index === WISH_STATUS_ORDER.length - 1}
                selected={selected}
                paperBorder={receiptBorder}
                mutedText={receiptMuted}
                amount={formatMoney(summary.amountCents)}
                count={summary.count}
                onPress={() => toggleExpandedStatus(status)}
              />
            );
          })}
        </View>

        <View style={[styles.totalBlock, { borderColor: receiptBorder }]}>
          <View style={styles.totalRow}>
            <ThemedText style={[styles.totalLabel, { color: palette.text, fontFamily: RECEIPT_FONT_FAMILY }]}>TOTAL</ThemedText>
            <ThemedText style={[styles.totalValue, { color: palette.text, fontFamily: RECEIPT_FONT_FAMILY }]}>
              {formatMoney(stats.totalAmountCents)}
            </ThemedText>
          </View>
          <ThemedText style={[styles.totalHint, { color: receiptMuted }]}>
            点击上面的状态行查看明细；再次点击即可收起。
          </ThemedText>
        </View>
      </View>

      {expandedStatus ? (
        <SectionCard style={[styles.detailSheet, { backgroundColor: receiptBackground, borderColor: receiptBorder }]}>
          <View style={styles.detailHeader}>
            <View>
              <ThemedText style={[styles.detailKicker, { color: WISH_STATUS_META[expandedStatus].tint, fontFamily: RECEIPT_FONT_FAMILY }]}>
                {getExpandedTitle(expandedStatus)}
              </ThemedText>
              <ThemedText style={styles.detailTitle}>{WISH_STATUS_META[expandedStatus].label}明细</ThemedText>
            </View>
            <ThemedText style={[styles.detailCount, { color: receiptMuted, fontFamily: RECEIPT_FONT_FAMILY }]}>
              {expandedItems.length} x
            </ThemedText>
          </View>

          <ThemedText style={[styles.receiptDivider, { color: receiptMuted, fontFamily: RECEIPT_FONT_FAMILY }]}>{WISH_RECEIPT_DIVIDER}</ThemedText>

          {expandedItems.length === 0 ? (
            <View style={[styles.detailEmpty, { backgroundColor: receiptPanel, borderColor: receiptBorder }]}>
              <ThemedText style={[styles.detailEmptyTitle, { color: palette.text }]}>{getExpandedEmptyText(expandedStatus)}</ThemedText>
              <ThemedText style={[styles.detailEmptyText, { color: receiptMuted }]}>这一区先保持空白也没关系，想买时再记下来。</ThemedText>
            </View>
          ) : (
            <View style={styles.detailList}>
              {expandedItems.map((item) => (
                <CompactWishRow
                  key={item.id}
                  item={item}
                  paperBorder={receiptBorder}
                  paperFill={receiptPanel}
                  mutedText={receiptMuted}
                  textColor={palette.text}
                  stampTint={stampTint}
                  onPress={() => openEditModal(item)}
                />
              ))}
            </View>
          )}
        </SectionCard>
      ) : null}

      {stats.totalCount === 0 && !expandedStatus ? (
        <SectionCard style={[styles.emptyPrompt, { backgroundColor: receiptBackground, borderColor: receiptBorder }]}>
          <ThemedText style={[styles.emptyMeta, { color: reportAccent, fontFamily: RECEIPT_FONT_FAMILY }]}>EMPTY RECEIPT</ThemedText>
          <ThemedText style={styles.emptyTitle}>还没有想买的东西</ThemedText>
          <ThemedText style={[styles.emptyText, { color: palette.muted }]}>先把冲动记下来，再决定值不值得买。</ThemedText>
          <AppButton title="新增第一条愿望" onPress={openCreateModal} />
        </SectionCard>
      ) : null}

      <View style={styles.footer}>
        <ThemedText style={[styles.receiptDivider, { color: receiptMuted, fontFamily: RECEIPT_FONT_FAMILY }]}>{WISH_RECEIPT_DIVIDER}</ThemedText>
        <ThemedText style={[styles.barcodeText, { color: receiptMuted, fontFamily: RECEIPT_FONT_FAMILY }]}>{WISH_MART_BARCODE}</ThemedText>
      </View>

      <WishEditorModal
        visible={modalVisible}
        editingItem={editingItem}
        onRequestClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </ScreenScaffold>
  );
}

function ReceiptStatusRow({
  status,
  isLast,
  selected,
  paperBorder,
  mutedText,
  amount,
  count,
  onPress,
}: {
  status: WishStatus;
  isLast: boolean;
  selected: boolean;
  paperBorder: string;
  mutedText: string;
  amount: string;
  count: number;
  onPress: () => void;
}) {
  const meta = WISH_STATUS_META[status];
  const arrow = selected ? '⌄' : '>';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.summaryRow,
        {
          borderBottomColor: selected ? meta.border : paperBorder,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          opacity: pressed ? 0.92 : 1,
        },
        selected ? styles.summaryRowSelected : undefined,
      ]}>
      <View style={styles.summaryLabelWrap}>
        <View style={[styles.summaryMarker, { backgroundColor: selected ? meta.tint : 'transparent' }]} />
        <View style={styles.summaryLabelLine}>
          <ThemedText style={[styles.summaryLabel, { color: meta.tint, fontFamily: RECEIPT_FONT_FAMILY }]}>{meta.shortLabel}</ThemedText>
          <ThemedText style={[styles.summarySlash, { color: mutedText, fontFamily: RECEIPT_FONT_FAMILY }]}>/</ThemedText>
          <ThemedText style={[styles.summarySubLabel, { color: selected ? meta.tint : mutedText }]}>{meta.label}</ThemedText>
        </View>
      </View>
      <View style={styles.summaryValueWrap}>
        <ThemedText style={[styles.summaryValue, { fontFamily: RECEIPT_FONT_FAMILY }]}>{count} x</ThemedText>
        <ThemedText style={[styles.summaryAmount, { fontFamily: RECEIPT_FONT_FAMILY }]}>{amount}</ThemedText>
      </View>
      <ThemedText style={[styles.summaryArrow, { color: meta.tint, fontFamily: RECEIPT_FONT_FAMILY }]}>{arrow}</ThemedText>
    </Pressable>
  );
}

function CompactWishRow({
  item,
  paperBorder,
  paperFill,
  mutedText,
  textColor,
  stampTint,
  onPress,
}: {
  item: WishItem;
  paperBorder: string;
  paperFill: string;
  mutedText: string;
  textColor: string;
  stampTint: string;
  onPress: () => void;
}) {
  const meta = WISH_STATUS_META[item.status];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.detailRow,
        {
          borderColor: paperBorder,
          backgroundColor: paperFill,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <View style={styles.detailRowTop}>
        <View style={styles.detailMain}>
          <ThemedText numberOfLines={1} style={[styles.detailItemName, { color: textColor }]}>
            {item.name}
          </ThemedText>
          <View style={styles.detailMetaRow}>
            {item.category ? <ThemedText style={[styles.detailMetaText, { color: mutedText }]}>{item.category}</ThemedText> : null}
            {item.category ? <ThemedText style={[styles.detailMetaText, { color: mutedText }]}>·</ThemedText> : null}
            <ThemedText style={[styles.detailMetaText, { color: mutedText }]}>{formatCreatedLabel(item)}</ThemedText>
          </View>
        </View>

        <View style={styles.detailPriceWrap}>
          <ThemedText style={[styles.detailPrice, { color: textColor, fontFamily: RECEIPT_FONT_FAMILY }]}>
            {formatMoney(item.priceCents)}
          </ThemedText>
          <View style={[styles.detailStampMini, { borderColor: meta.border, backgroundColor: meta.tintSoft }]}>
            <ThemedText style={[styles.detailStampMiniText, { color: meta.tint, fontFamily: RECEIPT_FONT_FAMILY }]}>
              {meta.shortLabel}
            </ThemedText>
          </View>
        </View>
      </View>

      {item.note ? (
        <ThemedText numberOfLines={2} style={[styles.detailNote, { color: mutedText }]}>
          {item.note}
        </ThemedText>
      ) : null}

      <View style={styles.detailBottom}>
        <ThemedText style={[styles.detailBottomText, { color: mutedText }]}>
          {meta.shortLabel} / {meta.label}
        </ThemedText>
        <View style={[styles.detailStamp, { borderColor: stampTint }]}>
          <ThemedText style={[styles.detailStampText, { color: stampTint, fontFamily: RECEIPT_FONT_FAMILY }]}>
            {meta.stampLabel}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: uiTokens.spacing.md },
  backText: { ...uiTokens.typography.chip, width: 42 },
  titleWrap: { flex: 1, alignItems: 'center', gap: 3 },
  kicker: { fontSize: 11, lineHeight: 14, fontWeight: '900', letterSpacing: 1.2 },
  pageTitle: uiTokens.typography.pageTitle,
  pageSub: { fontSize: 13, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  addChip: { width: 72, paddingHorizontal: 0 },
  receiptCard: {
    borderWidth: 1,
    borderRadius: 26,
    paddingHorizontal: uiTokens.spacing.xl,
    paddingTop: 28,
    paddingBottom: uiTokens.spacing.xl,
    gap: uiTokens.spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  receiptTape: {
    position: 'absolute',
    top: -10,
    left: 28,
    width: 74,
    height: 24,
    borderRadius: 6,
    transform: [{ rotate: '-6deg' }],
  },
  receiptTitle: { fontSize: 22, lineHeight: 27, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  receiptSubTitle: { fontSize: 12, lineHeight: 16, fontWeight: '800', textAlign: 'center' },
  receiptDivider: { fontSize: 11, lineHeight: 14, letterSpacing: 0.5, textAlign: 'center' },
  receiptMetaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: uiTokens.spacing.md },
  receiptMetaText: { fontSize: 11, lineHeight: 15, fontWeight: '800', letterSpacing: 0.8 },
  summaryGrid: { marginTop: 2 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: uiTokens.spacing.md,
    paddingVertical: 11,
  },
  summaryRowSelected: {
    backgroundColor: 'transparent',
  },
  summaryLabelWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: uiTokens.spacing.sm, minWidth: 0 },
  summaryMarker: {
    width: 10,
    height: 2,
    borderRadius: uiTokens.radius.pill,
  },
  summaryLabelLine: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  summaryLabel: { fontSize: 13, lineHeight: 16, fontWeight: '900', letterSpacing: 1 },
  summarySlash: { fontSize: 11, lineHeight: 14, fontWeight: '900' },
  summarySubLabel: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  summaryValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryValue: { fontSize: 12, lineHeight: 16, fontWeight: '900', letterSpacing: 0.8 },
  summaryAmount: { fontSize: 12, lineHeight: 16, fontWeight: '900', letterSpacing: 0.4 },
  summaryArrow: { width: 14, fontSize: 14, lineHeight: 16, fontWeight: '900', textAlign: 'right' },
  totalBlock: {
    marginTop: uiTokens.spacing.sm,
    paddingTop: uiTokens.spacing.md,
    borderTopWidth: 1,
    gap: 6,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: uiTokens.spacing.md },
  totalLabel: { fontSize: 18, lineHeight: 23, fontWeight: '900', letterSpacing: 1.2 },
  totalValue: { fontSize: 18, lineHeight: 23, fontWeight: '900', letterSpacing: 0.8 },
  totalHint: { fontSize: 12, lineHeight: 17, fontWeight: '800' },
  detailSheet: { gap: uiTokens.spacing.sm, overflow: 'hidden' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: uiTokens.spacing.md },
  detailKicker: { fontSize: 11, lineHeight: 14, fontWeight: '900', letterSpacing: 1.1 },
  detailTitle: { fontSize: 17, lineHeight: 21, fontWeight: '900' },
  detailCount: { fontSize: 12, lineHeight: 16, fontWeight: '900', letterSpacing: 0.8 },
  detailList: { gap: uiTokens.spacing.sm },
  detailRow: {
    borderWidth: 1,
    borderRadius: uiTokens.radius.lg,
    paddingHorizontal: uiTokens.spacing.md,
    paddingVertical: uiTokens.spacing.sm,
    gap: uiTokens.spacing.xs,
  },
  detailRowTop: { flexDirection: 'row', gap: uiTokens.spacing.md },
  detailMain: { flex: 1, gap: 4 },
  detailItemName: { fontSize: 15, lineHeight: 20, fontWeight: '900' },
  detailMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center' },
  detailMetaText: { fontSize: 11, lineHeight: 15, fontWeight: '800' },
  detailPriceWrap: { alignItems: 'flex-end', gap: 6 },
  detailPrice: { fontSize: 16, lineHeight: 20, fontWeight: '900', letterSpacing: 0.3 },
  detailStampMini: {
    borderWidth: 1,
    borderRadius: uiTokens.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  detailStampMiniText: { fontSize: 10, lineHeight: 12, fontWeight: '900', letterSpacing: 0.8 },
  detailNote: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  detailBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: uiTokens.spacing.md, marginTop: 2 },
  detailBottomText: { fontSize: 11, lineHeight: 15, fontWeight: '900' },
  detailStamp: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    transform: [{ rotate: '-8deg' }],
  },
  detailStampText: { fontSize: 12, lineHeight: 15, fontWeight: '900', letterSpacing: 1 },
  detailEmpty: {
    borderWidth: 1,
    borderRadius: uiTokens.radius.lg,
    padding: uiTokens.spacing.lg,
    alignItems: 'center',
    gap: uiTokens.spacing.xs,
  },
  detailEmptyTitle: { fontSize: 15, lineHeight: 20, fontWeight: '900', textAlign: 'center' },
  detailEmptyText: { fontSize: 12, lineHeight: 17, fontWeight: '800', textAlign: 'center' },
  emptyPrompt: { alignItems: 'center', gap: uiTokens.spacing.sm },
  emptyMeta: { fontSize: 11, lineHeight: 14, fontWeight: '900', letterSpacing: 1.2 },
  emptyTitle: { fontSize: 19, lineHeight: 24, fontWeight: '900', textAlign: 'center' },
  emptyText: { fontSize: 13, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  barcodeText: { fontSize: 11, lineHeight: 14, fontWeight: '800', letterSpacing: 0.9, textAlign: 'center' },
  footer: { paddingTop: uiTokens.spacing.sm, gap: 4 },
});

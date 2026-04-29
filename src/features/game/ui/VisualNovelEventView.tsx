import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { CharacterSprite, Choice, VisualNovelEventNode } from '@/features/game/engine/types';

export type VisualNovelEventViewProps = {
  event: VisualNovelEventNode;
  choices: Choice[];
  onSelectChoice: (choice: Choice) => void;
};

export function VisualNovelEventView({ event, choices, onSelectChoice }: VisualNovelEventViewProps) {
  const insets = useSafeAreaInsets();
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#6D8AAE', dark: '#88A9D4' }, 'tint');
  const textColor = useThemeColor({ light: '#3D3A36', dark: '#E4E4E7' }, 'text');

  const [dialogueIndex, setDialogueIndex] = useState(0);

  useEffect(() => {
    setDialogueIndex(0);
  }, [event.id]);

  const hasDialogue = event.dialogue.length > 0;
  const isChoiceStep = dialogueIndex >= event.dialogue.length;
  const currentLine = hasDialogue ? event.dialogue[Math.min(dialogueIndex, event.dialogue.length - 1)] : undefined;
  const backgroundId = currentLine?.backgroundId ?? event.backgroundId;
  const speakerLabel = currentLine?.speakerName ?? currentLine?.speakerId ?? '旁白';
  const activeSpriteId = currentLine?.spriteId ?? currentLine?.speakerId;
  const characters = useMemo(() => event.characters ?? [], [event.characters]);

  function advanceDialogue() {
    if (!hasDialogue || isChoiceStep) return;
    setDialogueIndex((index) => Math.min(index + 1, event.dialogue.length));
  }

  return (
    <View style={[styles.scene, { borderColor: cardBorder }]}>
      <View style={styles.backgroundLayer}>
        <View style={styles.backgroundTop} />
        <View style={styles.backgroundBottom} />
        {backgroundId ? (
          <ThemedText style={[styles.backgroundId, { color: mutedText }]} numberOfLines={1}>
            {backgroundId}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.stage}>
        {characters.map((character) => (
          <CharacterPlaceholder
            key={character.id}
            character={character}
            active={activeSpriteId === character.id}
            borderColor={cardBorder}
            textColor={textColor}
            mutedText={mutedText}
          />
        ))}
      </View>

      {isChoiceStep ? (
        <View style={styles.choiceOverlay}>
          {choices.map((choice, index) => (
            <Pressable
              key={`${event.id}.vn.choice.${index}`}
              onPress={() => onSelectChoice(choice)}
              style={({ pressed }) => [
                styles.choiceButton,
                {
                  borderColor: accent,
                  backgroundColor: pressed ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.82)',
                },
              ]}>
              <ThemedText style={[styles.choiceText, { color: accent }]}>{choice.text}</ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={advanceDialogue}
        disabled={isChoiceStep}
        style={({ pressed }) => [
          styles.dialogueBox,
          {
            borderColor: cardBorder,
            opacity: pressed ? 0.96 : 1,
            paddingBottom: Math.max(16, insets.bottom + 10),
          },
        ]}>
        <View style={[styles.namePlate, { borderColor: cardBorder }]}>
          <ThemedText style={[styles.nameText, { color: textColor }]} numberOfLines={1}>
            {speakerLabel}
          </ThemedText>
        </View>
        <ThemedText style={[styles.dialogueText, { color: textColor }]}>{currentLine?.text ?? '...'}</ThemedText>
        {!isChoiceStep ? (
          <ThemedText style={[styles.continueText, { color: mutedText }]}>点击继续</ThemedText>
        ) : null}
      </Pressable>
    </View>
  );
}

function CharacterPlaceholder({
  character,
  active,
  borderColor,
  textColor,
  mutedText,
}: {
  character: CharacterSprite;
  active: boolean;
  borderColor: string;
  textColor: string;
  mutedText: string;
}) {
  return (
    <View
      style={[
        styles.character,
        getCharacterPosition(character.position),
        {
          borderColor,
          opacity: active ? 1 : 0.72,
          transform: [{ scale: character.scale ?? 1 }],
        },
      ]}>
      <View style={[styles.avatar, { borderColor }]}>
        <ThemedText style={[styles.avatarText, { color: active ? textColor : mutedText }]}>人</ThemedText>
      </View>
      <ThemedText style={[styles.characterName, { color: active ? textColor : mutedText }]} numberOfLines={1}>
        {character.name}
      </ThemedText>
      {character.defaultExpression ? (
        <ThemedText style={[styles.expression, { color: mutedText }]} numberOfLines={1}>
          {character.defaultExpression}
        </ThemedText>
      ) : null}
    </View>
  );
}

function getCharacterPosition(position: CharacterSprite['position']) {
  if (position === 'left') return styles.characterLeft;
  if (position === 'right') return styles.characterRight;
  return styles.characterCenter;
}

const styles = StyleSheet.create({
  scene: {
    height: 520,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: '#D9E5EA',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundTop: {
    flex: 1,
    backgroundColor: '#BFD3DB',
  },
  backgroundBottom: {
    flex: 1,
    backgroundColor: '#E5D5C3',
  },
  backgroundId: {
    position: 'absolute',
    top: 14,
    right: 14,
    maxWidth: '70%',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    opacity: 0.32,
  },
  stage: {
    ...StyleSheet.absoluteFillObject,
    bottom: 150,
  },
  character: {
    position: 'absolute',
    bottom: 0,
    width: 112,
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  characterLeft: {
    left: '8%',
  },
  characterCenter: {
    left: '50%',
    marginLeft: -56,
  },
  characterRight: {
    right: '8%',
  },
  avatar: {
    width: 92,
    height: 150,
    borderWidth: 1.5,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
  },
  characterName: {
    maxWidth: 112,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  expression: {
    maxWidth: 112,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  choiceOverlay: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 178,
    gap: 8,
  },
  choiceButton: {
    minHeight: 44,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  choiceText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  dialogueBox: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    minHeight: 142,
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(247,243,238,0.92)',
    paddingHorizontal: 14,
    paddingTop: 18,
    gap: 8,
  },
  namePlate: {
    position: 'absolute',
    top: -15,
    left: 14,
    maxWidth: '62%',
    minHeight: 30,
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
  },
  dialogueText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
  },
  continueText: {
    alignSelf: 'flex-end',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
  },
});

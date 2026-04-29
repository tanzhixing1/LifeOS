import React, { useEffect, useMemo, useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { getGameBackground, getGameSprite } from '@/features/game/assets/gameAssetRegistry';
import type { CharacterSprite, Choice, DialogueLine, VisualNovelEventNode } from '@/features/game/engine/types';
import { useThemeColor } from '@/hooks/use-theme-color';

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
  const backgroundSource = getGameBackground(backgroundId);
  const speakerLabel = currentLine?.speakerName ?? currentLine?.speakerId ?? '旁白';
  const characters = useMemo(() => event.characters ?? [], [event.characters]);

  function advanceDialogue() {
    if (!hasDialogue || isChoiceStep) return;
    setDialogueIndex((index) => Math.min(index + 1, event.dialogue.length));
  }

  return (
    <View style={[styles.scene, { borderColor: cardBorder }]}>
      {backgroundSource ? (
        <ImageBackground source={backgroundSource} resizeMode="cover" style={styles.backgroundLayer} imageStyle={styles.backgroundImage}>
          <View style={styles.backgroundOverlay} />
        </ImageBackground>
      ) : (
        <View style={styles.backgroundLayer}>
          <View style={styles.backgroundTop} />
          <View style={styles.backgroundBottom} />
          {backgroundId ? (
            <ThemedText style={[styles.backgroundId, { color: mutedText }]} numberOfLines={1}>
              {backgroundId}
            </ThemedText>
          ) : null}
        </View>
      )}

      <View style={styles.stage}>
        {characters.map((character) => {
          const spriteSource = resolveCharacterSprite(character, currentLine);
          const isActive = currentLine?.speakerId === character.id || currentLine?.spriteId === character.defaultSpriteId;

          return (
            <CharacterActor
              key={character.id}
              character={character}
              spriteSource={spriteSource}
              active={isActive}
              borderColor={cardBorder}
              textColor={textColor}
              mutedText={mutedText}
            />
          );
        })}
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
                  backgroundColor: pressed ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.84)',
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

function CharacterActor({
  character,
  spriteSource,
  active,
  borderColor,
  textColor,
  mutedText,
}: {
  character: CharacterSprite;
  spriteSource: ImageSourcePropType | null;
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
          opacity: active ? 1 : 0.72,
          transform: [{ scale: character.scale ?? 1 }],
        },
      ]}>
      {spriteSource ? (
        <Image source={spriteSource} resizeMode="contain" style={styles.spriteImage} />
      ) : (
        <View style={[styles.avatar, { borderColor }]}>
          <ThemedText style={[styles.avatarText, { color: active ? textColor : mutedText }]}>人</ThemedText>
        </View>
      )}

      <View style={styles.characterCaption}>
        <ThemedText style={[styles.characterName, { color: active ? textColor : mutedText }]} numberOfLines={1}>
          {character.name}
        </ThemedText>
        {character.defaultExpression ? (
          <ThemedText style={[styles.expression, { color: mutedText }]} numberOfLines={1}>
            {character.defaultExpression}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

function resolveCharacterSprite(character: CharacterSprite, line?: DialogueLine): ImageSourcePropType | null {
  if (line?.speakerId === character.id && line.spriteId) {
    const sprite = getGameSprite(line.spriteId);
    if (sprite) return sprite;
  }

  if (line?.speakerId === character.id && line.speakerId && line.expression) {
    const sprite = getGameSprite(`${line.speakerId}_${line.expression}`);
    if (sprite) return sprite;
  }

  if (character.defaultSpriteId) {
    const sprite = getGameSprite(character.defaultSpriteId);
    if (sprite) return sprite;
  }

  if (character.defaultExpression) {
    return getGameSprite(`${character.id}_${character.defaultExpression}`);
  }

  return null;
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
  backgroundImage: {
    borderRadius: 18,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(39, 30, 24, 0.18)',
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
    width: 170,
    minHeight: 278,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  characterLeft: {
    left: '2%',
  },
  characterCenter: {
    left: '50%',
    marginLeft: -85,
  },
  characterRight: {
    right: '2%',
  },
  spriteImage: {
    width: 170,
    height: 248,
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
  characterCaption: {
    width: 132,
    marginTop: 4,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  characterName: {
    maxWidth: 124,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  expression: {
    maxWidth: 124,
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

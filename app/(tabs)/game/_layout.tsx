import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { GameGlobalMenu } from '@/features/game/ui/GameGlobalMenu';

export default function GameLayout() {
  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }} />
      <GameGlobalMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

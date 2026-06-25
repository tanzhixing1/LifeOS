import { Stack } from 'expo-router';
import React from 'react';

export default function LabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="inspiration" />
      <Stack.Screen name="mood" />
      <Stack.Screen name="fragments/index" />
      <Stack.Screen name="fragments/[id]" />
    </Stack>
  );
}

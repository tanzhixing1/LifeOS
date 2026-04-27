import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ContextualMessengerHost } from '@/components/contextual-messenger-host';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'Modal',
            headerStyle: { backgroundColor: '#09090B' },
            headerTintColor: '#E4E4E7',
            headerTitleStyle: { color: '#E4E4E7' },
          }}
        />
      </Stack>
      <ContextualMessengerHost />
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

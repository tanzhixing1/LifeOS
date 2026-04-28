import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#71717A',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          height: 68,
          borderRadius: 18,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopWidth: 0,
          backgroundColor: '#09090B',
          borderWidth: 1,
          borderColor: '#27272A',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="tools"
        options={{
          title: '工具',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="checkmark.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="game"
        options={{
          title: '游戏',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="sparkles" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bubble.left.and.bubble.right.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="lab"
        options={{
          title: '扩展',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '设置',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

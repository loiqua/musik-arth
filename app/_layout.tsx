import { Stack } from 'expo-router';
import React from 'react';
import { COLORS } from '../constants/Theme';
import { useColorScheme } from '../hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  const headerColor = isDark ? COLORS.textDark : COLORS.text;
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="track-details" options={{ headerShown: false }} />
      <Stack.Screen name="albums" options={{ headerShown: false }} />
      <Stack.Screen name="album-details" options={{ headerShown: false }} />
    </Stack>
  );
} 
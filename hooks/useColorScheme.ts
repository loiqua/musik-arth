import { useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

export function useColorScheme(): NonNullable<ColorSchemeName> {
  const [colorScheme, setColorScheme] = useState<NonNullable<ColorSchemeName>>(
    Appearance.getColorScheme() || 'light'
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      setColorScheme(newColorScheme || 'light');
    });

    return () => subscription.remove();
  }, []);

  return colorScheme;
}

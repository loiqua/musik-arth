import { useState, useEffect } from 'react';
import { ColorSchemeName } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): NonNullable<ColorSchemeName> {
  const [colorScheme, setColorScheme] = useState<NonNullable<ColorSchemeName>>('light');

  useEffect(() => {
    // Utiliser les media queries pour détecter le thème du système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateColorScheme = (e: MediaQueryListEvent | MediaQueryList) => {
      setColorScheme(e.matches ? 'dark' : 'light');
    };
    
    // Initialiser
    updateColorScheme(mediaQuery);
    
    // Écouter les changements
    mediaQuery.addEventListener('change', updateColorScheme);
    
    return () => {
      mediaQuery.removeEventListener('change', updateColorScheme);
    };
  }, []);

  return colorScheme;
}

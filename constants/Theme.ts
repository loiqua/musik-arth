import { Platform } from 'react-native';

export const COLORS = {
  // Primary colors
  primary: '#FF2D55', // Apple Music red
  primaryDark: '#D3234A',
  primaryLight: '#FF6482',
  
  // Background colors
  background: '#FFFFFF',
  backgroundDark: '#121212',
  
  // Card colors
  card: '#F9F9F9',
  cardDark: '#1C1C1E',
  
  // Text colors
  text: '#000000',
  textSecondary: '#8E8E93',
  textDark: '#FFFFFF',
  textSecondaryDark: '#AEAEB2',
  
  // UI elements
  border: '#E5E5EA',
  borderDark: '#38383A',
  
  // Player controls
  playerBackground: 'rgba(255, 255, 255, 0.9)',
  playerBackgroundDark: 'rgba(18, 18, 18, 0.9)',
  
  // Gradients
  gradientStart: '#FF2D55',
  gradientEnd: '#FF375F',
  gradientStartDark: '#D3234A',
  gradientEndDark: '#FF2D55',
};

export const FONTS = {
  regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  
  sizes: {
    xs: 12,
    small: 14,
    medium: 16,
    large: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
};

export const SPACING = {
  xs: 4,
  small: 8,
  medium: 16,
  large: 24,
  xl: 32,
  xxl: 48,
};

export const LAYOUT = {
  borderRadius: {
    small: 6,
    medium: 12,
    large: 16,
    xl: 24,
  },
  
  // Album art sizes
  albumArt: {
    small: 56,
    medium: 80,
    large: 160,
    xl: 300,
  },
  
  // Mini player height
  miniPlayerHeight: 64,
  
  // Tab bar height
  tabBarHeight: 56,
  
  // Screen padding
  screenPadding: SPACING.medium,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};


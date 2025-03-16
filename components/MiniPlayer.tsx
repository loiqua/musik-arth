import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { COLORS, FONTS, LAYOUT, SHADOWS, SPACING } from '../constants/Theme';
import { useMusicStore } from '../store/musicStore';
import { formatTitle, getPlaceholderArtwork } from '../utils/audioUtils';

interface MiniPlayerProps {
  onPress: () => void;
}

const { width } = Dimensions.get('window');

const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const currentTrack = useMusicStore(state => state.currentTrack);
  const isPlaying = useMusicStore(state => state.isPlaying);
  const pauseTrack = useMusicStore(state => state.pauseTrack);
  const resumeTrack = useMusicStore(state => state.resumeTrack);
  const playNextTrack = useMusicStore(state => state.playNextTrack);
  
  if (!currentTrack) return null;
  
  const artworkSource = currentTrack.artwork 
    ? { uri: currentTrack.artwork } 
    : { uri: getPlaceholderArtwork(currentTrack.title, currentTrack.artist) };
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  
  return (
    <BlurView
      intensity={80}
      tint={isDark ? 'dark' : 'light'}
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
      ]}
    >
      <TouchableOpacity
        style={styles.contentContainer}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Image source={artworkSource} style={styles.artwork} />
        
        <View style={styles.infoContainer}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {formatTitle(currentTrack.title)}
          </Text>
          <Text style={[styles.artist, { color: secondaryTextColor }]} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>
        
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            onPress={isPlaying ? pauseTrack : resumeTrack}
            style={styles.controlButton}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color={COLORS.primary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={playNextTrack}
            style={styles.controlButton}
          >
            <Ionicons
              name="play-forward"
              size={24}
              color={textColor}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: LAYOUT.tabBarHeight,
    left: 0,
    right: 0,
    height: LAYOUT.miniPlayerHeight,
    zIndex: 999,
    ...SHADOWS.medium,
  },
  containerLight: {
    borderTopColor: COLORS.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  containerDark: {
    borderTopColor: COLORS.borderDark,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.medium,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: LAYOUT.borderRadius.small,
  },
  infoContainer: {
    flex: 1,
    marginLeft: SPACING.medium,
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    marginBottom: 2,
  },
  artist: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: SPACING.small,
    marginLeft: SPACING.small,
  },
});

export default MiniPlayer; 
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '../hooks/useColorScheme';
import { COLORS, FONTS, LAYOUT, SHADOWS, SPACING } from '../constants/Theme';
import { useMusicStore } from '../store/musicStore';
import { formatTitle, getPlaceholderArtwork } from '../utils/audioUtils';
import * as Haptics from 'expo-haptics';

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
  const playPreviousTrack = useMusicStore(state => state.playPreviousTrack);
  const toggleFavorite = useMusicStore(state => state.toggleFavorite);
  
  if (!currentTrack) return null;
  
  const artworkSource = currentTrack.artwork 
    ? { uri: currentTrack.artwork } 
    : { uri: getPlaceholderArtwork(currentTrack.title, currentTrack.artist) };
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  const backgroundColor = isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(245, 245, 245, 0.9)';
  const controlBgColor = isDark ? '#333' : '#FFF';
  
  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const handleNext = () => {
    playNextTrack();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handlePrevious = () => {
    playPreviousTrack();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleToggleFavorite = () => {
    if (currentTrack) {
      toggleFavorite(currentTrack.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  return (
    <BlurView
      intensity={80}
      tint={isDark ? 'dark' : 'light'}
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
      ]}
    >
      <View style={styles.playerContainer}>
        {/* Artwork et informations de la piste */}
        <TouchableOpacity 
          style={styles.trackInfoContainer}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Image 
            source={artworkSource} 
            style={styles.artwork}
          />
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {formatTitle(currentTrack.title)}
            </Text>
            <Text style={[styles.artist, { color: secondaryTextColor }]} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Contrôles de lecture */}
        <View style={styles.controlsContainer}>
          {/* Previous button */}
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handlePrevious}
          >
            <Ionicons 
              name="play-skip-back" 
              size={22} 
              color={textColor} 
            />
          </TouchableOpacity>
          
          {/* Play/Pause button */}
          <TouchableOpacity 
            style={[styles.playPauseButton, { backgroundColor: controlBgColor }]}
            onPress={handlePlayPause}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={22} 
              color={isDark ? '#FFF' : '#000'} 
            />
          </TouchableOpacity>
          
          {/* Next button */}
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleNext}
          >
            <Ionicons 
              name="play-skip-forward" 
              size={22} 
              color={textColor} 
            />
          </TouchableOpacity>
          
          {/* Favorite button */}
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleToggleFavorite}
          >
            <Ionicons 
              name={currentTrack.isFavorite ? "heart" : "heart-outline"} 
              size={22} 
              color={currentTrack.isFavorite ? COLORS.primary : textColor} 
            />
          </TouchableOpacity>
        </View>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.medium,
  },
  containerLight: {
    borderTopColor: COLORS.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  containerDark: {
    borderTopColor: COLORS.borderDark,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  playerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: SPACING.small,
  },
  trackInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.medium,
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  textContainer: {
    marginLeft: SPACING.small,
    flex: 1,
  },
  title: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.small,
    marginBottom: 2,
  },
  artist: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.xs,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: SPACING.small,
  },
  playPauseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default MiniPlayer; 
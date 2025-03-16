import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { useMusicStore } from '../store/musicStore';
import { formatTime, getPlaceholderArtwork } from '../utils/audioUtils';
import { useColorScheme } from '../hooks/useColorScheme';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import SimpleSlider from './SimpleSlider';

const { width } = Dimensions.get('window');

function MusicPlayer() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const {
    currentTrack,
    isPlaying,
    playbackPosition,
    playbackDuration,
    isLoading,
    playTrack,
    pauseTrack,
    resumeTrack,
    playNextTrack,
    playPreviousTrack,
    seekTo,
    toggleFavorite,
  } = useMusicStore();
  
  const [sliderValue, setSliderValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  
  useEffect(() => {
    if (!isSeeking && playbackDuration > 0) {
      setSliderValue(playbackPosition / playbackDuration);
    }
  }, [playbackPosition, playbackDuration, isSeeking]);
  
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [isPlaying, pauseTrack, resumeTrack]);
  
  const handlePrevious = useCallback(() => {
    playPreviousTrack();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [playPreviousTrack]);
  
  const handleNext = useCallback(() => {
    playNextTrack();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [playNextTrack]);
  
  const handleSeekStart = useCallback(() => {
    setIsSeeking(true);
  }, []);
  
  const handleSeekComplete = useCallback((value: number) => {
    if (playbackDuration > 0) {
      seekTo(value * playbackDuration);
    }
    // Utiliser requestAnimationFrame pour améliorer les performances
    requestAnimationFrame(() => {
      setIsSeeking(false);
    });
  }, [playbackDuration, seekTo]);
  
  const handleToggleFavorite = useCallback(() => {
    if (currentTrack) {
      toggleFavorite(currentTrack.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentTrack, toggleFavorite]);
  
  const navigateToDetails = useCallback(() => {
    if (currentTrack) {
      router.push(`/track-details?trackId=${currentTrack.id}`);
    }
  }, [currentTrack, router]);
  
  if (!currentTrack) {
    return null;
  }
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  const backgroundColor = isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(245, 245, 245, 0.9)';
  const controlBgColor = isDark ? '#333' : '#FFF';
  
  const artworkSource = currentTrack.artwork 
    ? { uri: currentTrack.artwork } 
    : { uri: getPlaceholderArtwork(currentTrack.title, currentTrack.artist) };
  
  return (
    <BlurView
      intensity={80}
      tint={isDark ? 'dark' : 'light'}
      style={styles.container}
    >
      {/* Track info - visible when tapped */}
      <TouchableOpacity 
        style={styles.trackInfoContainer}
        onPress={navigateToDetails}
        activeOpacity={0.7}
      >
        <Image source={artworkSource} style={styles.artwork} />
        
        <View style={styles.textContainer}>
          <Text 
            style={[styles.title, { color: textColor }]} 
            numberOfLines={1}
          >
            {currentTrack.title}
          </Text>
          
          <Text 
            style={[styles.artist, { color: secondaryTextColor }]} 
            numberOfLines={1}
          >
            {currentTrack.artist}
          </Text>
        </View>
        
        <Text style={[styles.timeText, { color: secondaryTextColor }]}>
          {formatTime(playbackPosition)}
        </Text>
      </TouchableOpacity>
      
      {/* Contrôles de lecture modernes */}
      <View style={[styles.modernControlsContainer, { backgroundColor }]}>
        {/* Menu button */}
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={navigateToDetails}
        >
          <Ionicons 
            name="menu-outline" 
            size={22} 
            color={textColor} 
          />
        </TouchableOpacity>
        
        {/* Previous button */}
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={handlePrevious}
          disabled={isLoading}
        >
          <Ionicons 
            name="play-skip-back" 
            size={22} 
            color={isLoading ? secondaryTextColor : textColor} 
          />
        </TouchableOpacity>
        
        {/* Play/Pause button */}
        <TouchableOpacity 
          style={[styles.playPauseButton, { backgroundColor: controlBgColor }]}
          onPress={handlePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={22} 
              color={isDark ? '#FFF' : '#000'} 
            />
          )}
        </TouchableOpacity>
        
        {/* Next button */}
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={handleNext}
          disabled={isLoading}
        >
          <Ionicons 
            name="play-skip-forward" 
            size={22} 
            color={isLoading ? secondaryTextColor : textColor} 
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
      
      {/* Slider pour la progression */}
      <View style={styles.progressContainer}>
        <SimpleSlider
          value={sliderValue}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor={COLORS.primary}
          maximumTrackTintColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
          thumbTintColor={COLORS.primary}
          onSlidingStart={handleSeekStart}
          onSlidingComplete={handleSeekComplete}
          style={styles.slider}
        />
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: SPACING.small,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  trackInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.small,
    marginBottom: SPACING.small,
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: SPACING.medium,
    justifyContent: 'center',
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
  timeText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.xs,
    marginLeft: SPACING.small,
  },
  progressContainer: {
    marginTop: SPACING.small,
  },
  slider: {
    height: 20,
    marginHorizontal: -SPACING.small,
  },
  modernControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
    borderRadius: 30,
    marginVertical: SPACING.small,
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

// Utiliser memo pour éviter les rendus inutiles
export default memo(MusicPlayer); 
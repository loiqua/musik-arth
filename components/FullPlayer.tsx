import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { useMusicStore } from '../store/musicStore';
import { formatTime, getPlaceholderArtwork } from '../utils/audioUtils';
import SimpleSlider from './SimpleSlider';

interface FullPlayerProps {
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

const FullPlayer: React.FC<FullPlayerProps> = ({ onClose }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const currentTrack = useMusicStore(state => state.currentTrack);
  const isPlaying = useMusicStore(state => state.isPlaying);
  const playbackPosition = useMusicStore(state => state.playbackPosition);
  const playbackDuration = useMusicStore(state => state.playbackDuration);
  const pauseTrack = useMusicStore(state => state.pauseTrack);
  const resumeTrack = useMusicStore(state => state.resumeTrack);
  const playNextTrack = useMusicStore(state => state.playNextTrack);
  const playPreviousTrack = useMusicStore(state => state.playPreviousTrack);
  const seekTo = useMusicStore(state => state.seekTo);
  
  const [sliderValue, setSliderValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  
  // Animation for the player
  const translateY = new Animated.Value(0);
  
  // Pan responder for swipe down to close
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > height * 0.2) {
        // Swipe down threshold reached, close the player
        Animated.timing(translateY, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }).start(onClose);
      } else {
        // Reset position
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });
  
  // Update slider value when playback position changes
  useEffect(() => {
    if (!isSeeking && playbackDuration > 0) {
      setSliderValue(playbackPosition / playbackDuration);
    }
  }, [playbackPosition, playbackDuration, isSeeking]);
  
  if (!currentTrack) return null;
  
  const artworkSource = currentTrack.artwork 
    ? { uri: currentTrack.artwork } 
    : { uri: getPlaceholderArtwork(currentTrack.title, currentTrack.artist) };
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  
  const handleSeekStart = () => {
    setIsSeeking(true);
  };
  
  const handleSeekComplete = (value: number) => {
    setIsSeeking(false);
    const position = value * playbackDuration;
    seekTo(position);
  };
  
  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor },
        { transform: [{ translateY }] },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="chevron-down" size={28} color={textColor} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Now Playing
          </Text>
        </View>
        
        <TouchableOpacity style={styles.optionsButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={textColor} />
        </TouchableOpacity>
      </View>
      
      {/* Artwork */}
      <View style={styles.artworkContainer}>
        <Image
          source={artworkSource}
          style={styles.artwork}
          resizeMode="cover"
        />
      </View>
      
      {/* Track Info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
          {currentTrack.title}
        </Text>
        <Text style={[styles.artist, { color: secondaryTextColor }]} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <SimpleSlider
          style={styles.slider}
          value={sliderValue}
          onSlidingStart={handleSeekStart}
          onSlidingComplete={handleSeekComplete}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor={COLORS.primary}
          maximumTrackTintColor={isDark ? COLORS.borderDark : COLORS.border}
          thumbTintColor={COLORS.primary}
        />
        
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: secondaryTextColor }]}>
            {formatTime(playbackPosition)}
          </Text>
          <Text style={[styles.timeText, { color: secondaryTextColor }]}>
            {formatTime(playbackDuration)}
          </Text>
        </View>
      </View>
      
      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.secondaryControlButton}>
          <Ionicons name="shuffle" size={24} color={secondaryTextColor} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={playPreviousTrack}
        >
          <Ionicons name="play-skip-back" size={36} color={textColor} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.playButton}
          onPress={isPlaying ? pauseTrack : resumeTrack}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={32}
            color={isDark ? COLORS.backgroundDark : COLORS.background}
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={playNextTrack}
        >
          <Ionicons name="play-skip-forward" size={36} color={textColor} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryControlButton}>
          <Ionicons name="repeat" size={24} color={secondaryTextColor} />
        </TouchableOpacity>
      </View>
      
      {/* Bottom Controls */}
      <View style={styles.bottomControlsContainer}>
        <TouchableOpacity style={styles.bottomControlButton}>
          <Ionicons name="share-outline" size={24} color={secondaryTextColor} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.bottomControlButton}>
          <Ionicons name="list-outline" size={24} color={secondaryTextColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50, // Account for status bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.medium,
    marginBottom: SPACING.large,
  },
  closeButton: {
    padding: SPACING.small,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
  },
  optionsButton: {
    padding: SPACING.small,
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  artwork: {
    width: width - SPACING.xxl * 2,
    height: width - SPACING.xxl * 2,
    borderRadius: LAYOUT.borderRadius.medium,
  },
  infoContainer: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.xxl,
    marginBottom: SPACING.small,
    textAlign: 'center',
  },
  artist: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.large,
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.large,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -SPACING.small,
  },
  timeText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  secondaryControlButton: {
    padding: SPACING.small,
  },
  controlButton: {
    padding: SPACING.small,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xxl,
  },
  bottomControlButton: {
    padding: SPACING.medium,
  },
});

export default FullPlayer; 
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { Track } from '../store/musicStore';
import { formatTime, formatTitle, getPlaceholderArtwork } from '../utils/audioUtils';

interface TrackItemProps {
  track: Track;
  onPress: (track: Track) => void;
  isPlaying?: boolean;
  showArtwork?: boolean;
  showAlbum?: boolean;
  showDuration?: boolean;
  showOptions?: boolean;
  onOptionsPress?: (track: Track) => void;
}

const TrackItem: React.FC<TrackItemProps> = ({
  track,
  onPress,
  isPlaying = false,
  showArtwork = true,
  showAlbum = true,
  showDuration = true,
  showOptions = true,
  onOptionsPress,
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  
  const artworkSource = track.artwork 
    ? { uri: track.artwork } 
    : { uri: getPlaceholderArtwork(track.title, track.artist) };
  
  const handleLongPress = () => {
    router.push(`/track-details?trackId=${track.id}`);
  };
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(track)}
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      {showArtwork && (
        <Image
          source={artworkSource}
          style={styles.artwork}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.infoContainer}>
        <Text 
          style={[
            styles.title, 
            { color: isPlaying ? COLORS.primary : textColor }
          ]}
          numberOfLines={1}
        >
          {formatTitle(track.title)}
          {track.isLocal && (
            <Text style={{ color: COLORS.primary }}> • Local</Text>
          )}
        </Text>
        
        <Text 
          style={[styles.artist, { color: secondaryTextColor }]}
          numberOfLines={1}
        >
          {track.artist}
          {showAlbum && track.album !== 'Unknown Album' && ` • ${track.album}`}
        </Text>
      </View>
      
      <View style={styles.rightContainer}>
        {showDuration && (
          <Text style={[styles.duration, { color: secondaryTextColor }]}>
            {formatTime(track.duration)}
          </Text>
        )}
        
        {showOptions && (
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={() => {
              if (onOptionsPress) {
                onOptionsPress(track);
              } else {
                router.push(`/track-details?trackId=${track.id}`);
              }
            }}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons 
              name="ellipsis-horizontal" 
              size={20} 
              color={secondaryTextColor} 
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.medium,
  },
  artwork: {
    width: LAYOUT.albumArt.small,
    height: LAYOUT.albumArt.small,
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
    marginBottom: 4,
  },
  artist: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
    marginRight: SPACING.small,
  },
  optionsButton: {
    padding: SPACING.xs,
  },
});

export default TrackItem;
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { Playlist } from '../store/musicStore';
import { getColorFromString } from '../utils/audioUtils';

interface PlaylistItemProps {
  playlist: Playlist;
  onPress: (playlist: Playlist) => void;
  trackCount?: number;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({
  playlist,
  onPress,
  trackCount,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  
  // Generate a color based on the playlist name
  const color = getColorFromString(playlist.name);
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(playlist)}
      activeOpacity={0.7}
    >
      <View style={styles.artworkContainer}>
        <View
          style={[styles.artwork, { backgroundColor: color }]}
        >
          <Ionicons name="musical-notes" size={32} color="#FFFFFF" />
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text 
          style={[styles.name, { color: textColor }]}
          numberOfLines={1}
        >
          {playlist.name}
        </Text>
        
        <Text 
          style={[styles.trackCount, { color: secondaryTextColor }]}
          numberOfLines={1}
        >
          {trackCount || playlist.tracks.length} {(trackCount || playlist.tracks.length) === 1 ? 'song' : 'songs'}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.optionsButton}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Ionicons 
          name="ellipsis-horizontal" 
          size={20} 
          color={secondaryTextColor} 
        />
      </TouchableOpacity>
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
  artworkContainer: {
    width: LAYOUT.albumArt.small,
    height: LAYOUT.albumArt.small,
    borderRadius: LAYOUT.borderRadius.small,
    overflow: 'hidden',
  },
  artwork: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: SPACING.medium,
    justifyContent: 'center',
  },
  name: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    marginBottom: 4,
  },
  trackCount: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
  },
  optionsButton: {
    padding: SPACING.xs,
  },
});

export default PlaylistItem; 
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { Track, useMusicStore } from '../store/musicStore';
import { formatTime, formatTitle, getPlaceholderArtwork, getColorFromString } from '../utils/audioUtils';
import { useColorScheme } from '../hooks/useColorScheme';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import SimpleSlider from '../components/SimpleSlider';
import AppHeader from '../components/AppHeader';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function TrackDetailsScreen() {
  const router = useRouter();
  const { trackId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  
  const {
    tracks,
    playlists,
    currentTrack,
    playTrack,
    pauseTrack,
    deleteTrack,
    toggleFavorite,
    isPlaying,
    playbackPosition,
    playbackDuration,
    seekTo,
    playNextTrack,
    playPreviousTrack,
  } = useMusicStore();
  
  // Trouver la piste correspondante
  const track = tracks.find(t => t.id === trackId) as Track;
  
  // Si la piste n'existe pas, retourner à l'écran précédent
  if (!track) {
    router.back();
    return null;
  }
  
  // Mettre à jour la valeur du slider en fonction de la position de lecture
  useEffect(() => {
    if (!isSeeking && playbackDuration > 0 && currentTrack?.id === track.id) {
      setSliderValue(playbackPosition / playbackDuration);
    }
  }, [playbackPosition, playbackDuration, isSeeking, currentTrack, track.id]);
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const secondaryTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  
  // Nettoyer le titre pour l'affichage
  const cleanTitle = formatTitle(track.title);
  
  // Générer une couleur de fond basée sur le titre et l'artiste pour l'artwork par défaut
  const placeholderColor = getColorFromString(`${track.title}${track.artist}`);
  
  // Determine artwork source
  const artworkSource = track?.artwork 
    ? { uri: track.artwork } 
    : { uri: getPlaceholderArtwork(track?.title || 'Unknown', track?.artist || 'Unknown') };
  
  // Trouver les playlists qui contiennent cette piste
  const trackPlaylists = playlists.filter(playlist => 
    playlist.tracks.includes(track.id)
  );
  
  const handlePlayPause = () => {
    if (currentTrack?.id === track.id && isPlaying) {
      pauseTrack();
    } else {
      playTrack(track);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const handleToggleFavorite = () => {
    toggleFavorite(track.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Supprimer la piste',
      'Êtes-vous sûr de vouloir supprimer cette piste ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteTrack(track.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleOptionsPress = () => {
    // Afficher les options pour la piste
    handleDelete();
  };
  
  const handleSeekStart = useCallback(() => {
    setIsSeeking(true);
  }, []);
  
  const handleSeekComplete = useCallback((value: number) => {
    if (playbackDuration > 0 && currentTrack?.id === track.id) {
      seekTo(value * playbackDuration);
    }
    // Utiliser requestAnimationFrame pour améliorer les performances
    requestAnimationFrame(() => {
      setIsSeeking(false);
    });
  }, [playbackDuration, seekTo, currentTrack, track.id]);
  
  const handleNext = useCallback(() => {
    playNextTrack();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [playNextTrack]);
  
  const handlePrevious = useCallback(() => {
    playPreviousTrack();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [playPreviousTrack]);
  
  // Déterminer si la piste actuelle est en cours de lecture
  const isCurrentTrack = currentTrack?.id === track.id;
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <AppHeader 
        title="Track Details" 
        leftComponent={
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={handleOptionsPress}>
            <Ionicons name="ellipsis-horizontal" size={24} color={textColor} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Artwork */}
          <View style={styles.artworkContainer}>
            <Image 
              source={artworkSource} 
              style={styles.artwork} 
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)']}
              style={styles.artworkOverlay}
            />
            {isPlaying && (
              <View style={styles.playingIndicator}>
                <Ionicons name="musical-notes" size={24} color="#fff" />
              </View>
            )}
          </View>
          
          {/* Track Info */}
          <View style={styles.infoContainer}>
            <Text style={[styles.title, { color: textColor }]}>
              {cleanTitle}
            </Text>
            <Text style={[styles.artist, { color: secondaryTextColor }]}>
              {track.artist !== 'Unknown Artist' ? track.artist : 'Artiste inconnu'}
            </Text>
            <Text style={[styles.album, { color: secondaryTextColor }]}>
              {track.album !== 'Unknown Album' ? track.album : 'Album inconnu'}
            </Text>
            
            <View style={styles.badgeContainer}>
              {track.isLocal && (
                <View style={styles.badge}>
                  <Ionicons name="folder" size={14} color={COLORS.primary} />
                  <Text style={[styles.badgeText, { color: COLORS.primary }]}>
                    Fichier local
                  </Text>
                </View>
              )}
              
              <View style={styles.badge}>
                <Ionicons name="time-outline" size={14} color={secondaryTextColor} />
                <Text style={[styles.badgeText, { color: secondaryTextColor }]}>
                  {formatTime(track.duration)}
                </Text>
              </View>
              
              {track.isFavorite && (
                <View style={styles.badge}>
                  <Ionicons name="heart" size={14} color={COLORS.primary} />
                  <Text style={[styles.badgeText, { color: COLORS.primary }]}>
                    Favori
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Timeline / Progress Bar */}
          <View style={styles.timelineContainer}>
            <SimpleSlider
              value={isCurrentTrack ? sliderValue : 0}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
              thumbTintColor={COLORS.primary}
              onSlidingStart={handleSeekStart}
              onSlidingComplete={handleSeekComplete}
              style={styles.slider}
            />
            
            <View style={styles.timeTextContainer}>
              <Text style={[styles.timeText, { color: secondaryTextColor }]}>
                {isCurrentTrack ? formatTime(playbackPosition) : '00:00'}
              </Text>
              <Text style={[styles.timeText, { color: secondaryTextColor }]}>
                {formatTime(track.duration)}
              </Text>
            </View>
          </View>
          
          {/* Playback Controls */}
          <View style={styles.playbackControlsContainer}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={handlePrevious}
            >
              <Ionicons 
                name="play-skip-back" 
                size={28} 
                color={textColor} 
              />
            </TouchableOpacity>
            
            {/* Play Button */}
            <TouchableOpacity 
              style={[styles.playButton, { backgroundColor: COLORS.primary }]}
              onPress={handlePlayPause}
            >
              <Ionicons 
                name={(isCurrentTrack && isPlaying) ? "pause" : "play"} 
                size={28} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={handleNext}
            >
              <Ionicons 
                name="play-skip-forward" 
                size={28} 
                color={textColor} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Actions */}
          <View style={styles.actionsContainer}>
            {/* Favorite Button */}
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={handleToggleFavorite}
            >
              <Ionicons 
                name={track.isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={track.isFavorite ? COLORS.primary : textColor} 
              />
              <Text style={[styles.actionText, { color: track.isFavorite ? COLORS.primary : textColor }]}>
                {track.isFavorite ? 'Favori' : 'Ajouter aux favoris'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Playlists */}
          {trackPlaylists.length > 0 && (
            <View style={styles.playlistsSection}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Dans les playlists
              </Text>
              
              {trackPlaylists.map(playlist => (
                <View key={playlist.id} style={[styles.playlistItem, { backgroundColor: isDark ? COLORS.cardDark : COLORS.card }]}>
                  <Ionicons name="list" size={20} color={secondaryTextColor} />
                  <Text style={[styles.playlistName, { color: textColor }]}>
                    {playlist.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: LAYOUT.miniPlayerHeight + SPACING.large,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.large,
    alignItems: 'center',
    paddingBottom: SPACING.large,
  },
  artworkContainer: {
    position: 'relative',
    width: Dimensions.get('window').width * 0.8,
    height: Dimensions.get('window').width * 0.8,
    alignSelf: 'center',
    marginVertical: SPACING.large,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  artworkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  playingIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  infoContainer: {
    width: '100%',
    marginTop: SPACING.medium,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.xl,
    textAlign: 'center',
    marginBottom: SPACING.small,
  },
  artist: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.large,
    textAlign: 'center',
    marginBottom: SPACING.small,
  },
  album: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    textAlign: 'center',
    marginBottom: SPACING.medium,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: SPACING.small,
    marginBottom: SPACING.large,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.3)',
    marginHorizontal: SPACING.small,
    marginBottom: SPACING.small,
  },
  badgeText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.small,
    marginLeft: 4,
  },
  timelineContainer: {
    width: '100%',
    marginTop: SPACING.large,
    marginBottom: SPACING.medium,
  },
  slider: {
    height: 40,
    width: '100%',
  },
  timeTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: SPACING.small,
    marginTop: -SPACING.small,
  },
  timeText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
  },
  playbackControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: SPACING.large,
  },
  controlButton: {
    padding: SPACING.medium,
    marginHorizontal: SPACING.large,
  },
  playButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionsContainer: {
    width: '100%',
    marginTop: SPACING.medium,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    borderRadius: 30,
    marginBottom: SPACING.medium,
  },
  actionText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    marginLeft: SPACING.small,
  },
  playlistsSection: {
    width: '100%',
    marginTop: SPACING.large,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.large,
    marginBottom: SPACING.medium,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.medium,
    borderRadius: LAYOUT.borderRadius.small,
    marginBottom: SPACING.small,
  },
  playlistName: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    marginLeft: SPACING.small,
  },
});
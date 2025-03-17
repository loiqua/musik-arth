import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useMusicStore } from '../store/musicStore';
import AppHeader from '../components/AppHeader';

export default function CreatePlaylistScreen() {
  const [playlistName, setPlaylistName] = useState('');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const createPlaylist = useMusicStore(state => state.createPlaylist);
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
  const inputBackgroundColor = isDark ? COLORS.cardDark : COLORS.card;
  
  const handleCreatePlaylist = () => {
    if (!playlistName.trim()) {
      Alert.alert(
        'Nom requis',
        'Veuillez entrer un nom pour la playlist.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    createPlaylist(playlistName.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Alert.alert(
      'Playlist créée',
      `La playlist "${playlistName}" a été créée avec succès.`,
      [
        { 
          text: 'OK', 
          onPress: () => router.back() 
        }
      ]
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <AppHeader
        title="Créer une playlist"
        showBackButton
        onBackPress={() => router.back()}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.formContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="musical-notes" size={64} color={COLORS.primary} />
          </View>
          
          <Text style={[styles.label, { color: textColor }]}>
            Nom de la playlist
          </Text>
          
          <TextInput
            style={[
              styles.input,
              { 
                color: textColor,
                backgroundColor: inputBackgroundColor,
                borderColor: playlistName ? COLORS.primary : 'transparent'
              }
            ]}
            placeholder="Ma playlist"
            placeholderTextColor={placeholderColor}
            value={playlistName}
            onChangeText={setPlaylistName}
            autoFocus
            maxLength={50}
          />
          
          <TouchableOpacity
            style={[
              styles.createButton,
              { 
                backgroundColor: playlistName.trim() ? COLORS.primary : 'rgba(0, 122, 255, 0.5)',
                opacity: playlistName.trim() ? 1 : 0.7
              }
            ]}
            onPress={handleCreatePlaylist}
            disabled={!playlistName.trim()}
          >
            <Text style={styles.createButtonText}>
              Créer la playlist
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.large,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.large,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    marginBottom: SPACING.small,
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.large,
    padding: SPACING.medium,
    borderRadius: LAYOUT.borderRadius.small,
    marginBottom: SPACING.large,
    borderWidth: 2,
  },
  createButton: {
    padding: SPACING.medium,
    borderRadius: LAYOUT.borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    color: 'white',
  },
}); 
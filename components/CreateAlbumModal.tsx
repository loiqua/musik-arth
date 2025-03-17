import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useMusicStore } from '../store/musicStore';
import { getAlbumPlaceholderArtwork } from '../utils/audioUtils';

interface CreateAlbumModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function CreateAlbumModal({ visible, onClose, onComplete }: CreateAlbumModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { createAlbum } = useMusicStore();
  
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumArtist, setAlbumArtist] = useState('');
  const [albumArtwork, setAlbumArtwork] = useState<string | undefined>(undefined);
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  const placeholderTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  
  const resetForm = () => {
    setAlbumTitle('');
    setAlbumArtist('');
    setAlbumArtwork(undefined);
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  const handleCreate = () => {
    if (!albumTitle.trim()) {
      Alert.alert('Titre requis', 'Veuillez saisir un titre pour l\'album');
      return;
    }
    
    // Créer l'album avec les données fournies
    createAlbum(albumTitle, albumArtist, albumArtwork);
    
    resetForm();
    onClose();
    if (onComplete) onComplete();
  };
  
  const pickImage = async () => {
    try {
      // Demander la permission d'accéder à la galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à votre galerie d\'images');
        return;
      }
      
      // Lancer le sélecteur d'images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAlbumArtwork(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };
  
  // Générer une image de placeholder si aucune image n'est sélectionnée
  const artworkSource = albumArtwork
    ? { uri: albumArtwork }
    : { uri: getAlbumPlaceholderArtwork(albumTitle || 'Nouvel Album', albumArtist || 'Artiste') };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View
          style={[
            styles.modalView,
            { backgroundColor: backgroundColor },
            Platform.OS === 'ios' && styles.modalViewIOS,
          ]}
        >
          {/* Header with close button */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              Nouvel Album
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Album Artwork Selection */}
          <TouchableOpacity
            style={styles.artworkContainer}
            onPress={pickImage}
          >
            <Image 
              source={artworkSource}
              style={styles.artworkImage}
              resizeMode="cover"
            />
            <View style={styles.artworkOverlay}>
              <Ionicons name="camera" size={32} color="#FFFFFF" />
              <Text style={styles.artworkText}>
                {albumArtwork ? 'Changer l\'image' : 'Ajouter une image'}
              </Text>
            </View>
          </TouchableOpacity>
          
          {/* Album Title Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: textColor }]}>
              Titre de l'album *
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: textColor, borderColor: isDark ? COLORS.borderDark : COLORS.border },
              ]}
              placeholderTextColor={placeholderTextColor}
              placeholder="Saisissez le titre de l'album"
              value={albumTitle}
              onChangeText={setAlbumTitle}
            />
          </View>
          
          {/* Album Artist Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: textColor }]}>
              Artiste
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: textColor, borderColor: isDark ? COLORS.borderDark : COLORS.border },
              ]}
              placeholderTextColor={placeholderTextColor}
              placeholder="Saisissez le nom de l'artiste"
              value={albumArtist}
              onChangeText={setAlbumArtist}
            />
          </View>
          
          <Text style={[styles.helperText, { color: placeholderTextColor }]}>
            * Champ obligatoire
          </Text>
          
          {/* Create Button */}
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: COLORS.primary },
              !albumTitle.trim() && styles.disabledButton,
            ]}
            onPress={handleCreate}
            disabled={!albumTitle.trim()}
          >
            <Text style={styles.createButtonText}>Créer l'album</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxWidth: 400,
    borderRadius: LAYOUT.borderRadius.large,
    padding: SPACING.large,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalViewIOS: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.large,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.large,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: SPACING.large,
    overflow: 'hidden',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  artworkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkText: {
    color: '#FFFFFF',
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.small,
    marginTop: SPACING.small,
  },
  inputContainer: {
    marginBottom: SPACING.medium,
  },
  inputLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.small,
    marginBottom: SPACING.xs,
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadius.medium,
    padding: SPACING.medium,
    paddingHorizontal: SPACING.large,
  },
  helperText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
    marginTop: SPACING.xs,
    marginBottom: SPACING.large,
  },
  createButton: {
    height: 50,
    borderRadius: LAYOUT.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.medium,
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
}); 
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { useMusicStore } from '../store/musicStore';

interface AddOnlineTrackModalProps {
  visible: boolean;
  onClose: () => void;
}

const AddOnlineTrackModal: React.FC<AddOnlineTrackModalProps> = ({ visible, onClose }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  
  const { importOnlineTrack, isLoading } = useMusicStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const backgroundColor = isDark ? COLORS.backgroundDark : COLORS.background;
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  
  const handleSubmit = async () => {
    if (!url || !title) return;
    
    await importOnlineTrack(url, title, artist, album);
    resetForm();
    onClose();
  };
  
  const resetForm = () => {
    setUrl('');
    setTitle('');
    setArtist('');
    setAlbum('');
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor }]}>
          <Text style={[styles.title, { color: textColor }]}>
            Ajouter une piste en ligne
          </Text>
          
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="URL du fichier audio"
            placeholderTextColor={isDark ? COLORS.textSecondaryDark : COLORS.textSecondary}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
          />
          
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Titre"
            placeholderTextColor={isDark ? COLORS.textSecondaryDark : COLORS.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
          
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Artiste (optionnel)"
            placeholderTextColor={isDark ? COLORS.textSecondaryDark : COLORS.textSecondary}
            value={artist}
            onChangeText={setArtist}
          />
          
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Album (optionnel)"
            placeholderTextColor={isDark ? COLORS.textSecondaryDark : COLORS.textSecondary}
            value={album}
            onChangeText={setAlbum}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                resetForm();
                onClose();
              }}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (!url || !title) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={!url || !title || isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Chargement...' : 'Ajouter'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: '90%',
    borderRadius: LAYOUT.borderRadius.medium,
    padding: SPACING.large,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONTS.sizes.large,
    marginBottom: SPACING.large,
    textAlign: 'center',
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: LAYOUT.borderRadius.small,
    padding: SPACING.medium,
    marginBottom: SPACING.medium,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.medium,
  },
  button: {
    flex: 1,
    padding: SPACING.medium,
    borderRadius: LAYOUT.borderRadius.small,
    alignItems: 'center',
    marginHorizontal: SPACING.small,
  },
  cancelButton: {
    backgroundColor: COLORS.textSecondary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    color: '#FFFFFF',
  },
});

export default AddOnlineTrackModal; 
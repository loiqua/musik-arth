import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useColorScheme } from '../hooks/useColorScheme';
import { COLORS, FONTS, LAYOUT, SPACING } from '../constants/Theme';
import { useMusicStore } from '../store/musicStore';

interface CreatePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  visible,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [playlistName, setPlaylistName] = useState('');
  const createPlaylist = useMusicStore(state => state.createPlaylist);
  
  const textColor = isDark ? COLORS.textDark : COLORS.text;
  const backgroundColor = isDark ? COLORS.cardDark : COLORS.card;
  const placeholderTextColor = isDark ? COLORS.textSecondaryDark : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.borderDark : COLORS.border;
  
  const handleCreate = () => {
    if (playlistName.trim()) {
      createPlaylist(playlistName.trim());
      setPlaylistName('');
      onClose();
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={90}
        tint={isDark ? 'dark' : 'light'}
        style={styles.overlay}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
              
              <Text style={[styles.title, { color: textColor }]}>
                New Playlist
              </Text>
              
              <TouchableOpacity
                onPress={handleCreate}
                style={[
                  styles.createButton,
                  { opacity: playlistName.trim() ? 1 : 0.5 },
                ]}
                disabled={!playlistName.trim()}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.content}>
              <View style={[styles.inputContainer, { borderColor }]}>
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="Playlist Name"
                  placeholderTextColor={placeholderTextColor}
                  value={playlistName}
                  onChangeText={setPlaylistName}
                  autoFocus
                  maxLength={50}
                />
              </View>
              
              <Text style={[styles.helperText, { color: placeholderTextColor }]}>
                Give your playlist a name that describes the mood, theme, or occasion.
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.large,
  },
  keyboardAvoidingView: {
    width: '100%',
    maxWidth: 500,
  },
  container: {
    borderRadius: LAYOUT.borderRadius.medium,
    overflow: 'hidden',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: SPACING.small,
  },
  title: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.large,
  },
  createButton: {
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
  },
  createButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.medium,
    color: COLORS.primary,
  },
  content: {
    padding: SPACING.large,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadius.small,
    marginBottom: SPACING.medium,
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.large,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.medium,
  },
  helperText: {
    fontFamily: FONTS.regular,
    fontSize: FONTS.sizes.small,
  },
});

export default CreatePlaylistModal; 
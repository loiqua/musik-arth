import * as FileSystem from 'expo-file-system';

/**
 * Supprime un fichier de manière sécurisée, en gérant le cas où l'URI pourrait être null
 * @param uri L'URI du fichier à supprimer
 * @returns Promise<void>
 */
export const deleteFileIfExists = async (uri: string | null): Promise<void> => {
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

/**
 * Vérifie si un URI commence par un préfixe donné, en gérant le cas où l'URI pourrait être null
 * @param uri L'URI à vérifier
 * @param prefix Le préfixe à rechercher
 * @returns boolean
 */
export const uriStartsWith = (uri: string | null, prefix: string): boolean => {
  return uri?.startsWith(prefix) ?? false;
};

/**
 * Fonction interne pour supprimer un fichier (accepte uniquement des chaînes non-null)
 */
const deleteFile = async (uri: string): Promise<void> => {
  try {
    await FileSystem.deleteAsync(uri);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

/**
 * Supprime un fichier local si nécessaire
 * @param uri L'URI du fichier à supprimer
 * @param isLocal Indique si le fichier est local
 * @returns Promise<void>
 */
export const deleteLocalFileIfNeeded = async (uri: string | null, isLocal?: boolean): Promise<void> => {
  if (!uri || !isLocal || !FileSystem.documentDirectory) return;

  if (uri.startsWith(FileSystem.documentDirectory)) {
    try {
      await FileSystem.deleteAsync(uri);
    } catch (error) {
      console.error('Error deleting local file:', error);
    }
  }
};
  
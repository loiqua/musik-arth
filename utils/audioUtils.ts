/**
 * Format milliseconds to MM:SS format
 */
export const formatTime = (milliseconds: number): string => {
  if (!milliseconds || isNaN(milliseconds)) return '00:00';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format track title to handle long titles
 */
export const formatTitle = (title: string, maxLength: number = 30): string => {
  if (!title) return 'Unknown Title';
  
  // Remove file extension if present
  const titleWithoutExt = title.replace(/\.(mp3|wav|ogg|m4a|flac)$/i, '');
  
  if (titleWithoutExt.length <= maxLength) return titleWithoutExt;
  return `${titleWithoutExt.substring(0, maxLength)}...`;
};

/**
 * Get a color based on the string (for playlist/album covers)
 */
export const getColorFromString = (str: string): string => {
  if (!str) return '#7c4dff'; // Default purple
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#f44336', // Red
    '#e91e63', // Pink
    '#9c27b0', // Purple
    '#673ab7', // Deep Purple
    '#3f51b5', // Indigo
    '#2196f3', // Blue
    '#03a9f4', // Light Blue
    '#00bcd4', // Cyan
    '#009688', // Teal
    '#4caf50', // Green
    '#8bc34a', // Light Green
    '#cddc39', // Lime
    '#ffc107', // Amber
    '#ff9800', // Orange
    '#ff5722', // Deep Orange
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Get a gradient based on the string (for album/artist covers)
 */
export const getGradientFromString = (str: string): { start: string; end: string } => {
  if (!str) return { start: '#7c4dff', end: '#448aff' }; // Default gradient
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const gradients = [
    { start: '#ff9a9e', end: '#fad0c4' }, // Light pink to peach
    { start: '#a18cd1', end: '#fbc2eb' }, // Purple to pink
    { start: '#ffecd2', end: '#fcb69f' }, // Light yellow to peach
    { start: '#ff867a', end: '#ff8c7f' }, // Coral shades
    { start: '#84fab0', end: '#8fd3f4' }, // Green to blue
    { start: '#a6c0fe', end: '#f68084' }, // Blue to pink
    { start: '#d4fc79', end: '#96e6a1' }, // Light green shades
    { start: '#43e97b', end: '#38f9d7' }, // Green to cyan
    { start: '#fa709a', end: '#fee140' }, // Pink to yellow
    { start: '#667eea', end: '#764ba2' }, // Blue to purple
    { start: '#ff0844', end: '#ffb199' }, // Red to peach
    { start: '#ff758c', end: '#ff7eb3' }, // Pink shades
    { start: '#c471f5', end: '#fa71cd' }, // Purple to pink
    { start: '#7f7fd5', end: '#86a8e7' }, // Purple to blue
    { start: '#f83600', end: '#f9d423' }, // Orange to yellow
  ];
  
  return gradients[Math.abs(hash) % gradients.length];
};

/**
 * Get a pattern type based on the string
 */
export const getPatternFromString = (str: string): string => {
  if (!str) return 'waves';
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const patterns = [
    'waves',
    'circles',
    'triangles',
    'squares',
    'lines',
    'dots',
    'vinyl',
    'soundwave',
    'equalizer',
    'geometric'
  ];
  
  return patterns[Math.abs(hash) % patterns.length];
};

/**
 * Generate placeholder artwork for tracks without artwork
 */
export const getPlaceholderArtwork = (title: string, artist: string): string => {
  // Retourner une URL pour les pochettes manquantes
  return 'https://cdn-icons-png.flaticon.com/512/3844/3844724.png';
};

/**
 * Generate placeholder artwork for albums without artwork
 */
export const getAlbumPlaceholderArtwork = (albumName: string, artistName: string = ''): string => {
  // Retourner une URL pour les pochettes d'album manquantes
  return 'https://cdn-icons-png.flaticon.com/512/26/26805.png';
};

/**
 * Generate placeholder artwork for artists without artwork
 */
export const getArtistPlaceholderArtwork = (artistName: string): string => {
  // Retourner une URL pour les pochettes d'artiste manquantes
  return 'https://cdn-icons-png.flaticon.com/512/3659/3659784.png';
};

// Fonction pour ajuster la luminosité d'une couleur
const adjustColorBrightness = (hex: string, percent: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const adjustedR = Math.max(0, Math.min(255, r + percent));
  const adjustedG = Math.max(0, Math.min(255, g + percent));
  const adjustedB = Math.max(0, Math.min(255, b + percent));
  
  return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
};

// Fonction pour déterminer une couleur contrastante (noir ou blanc) en fonction de la luminosité
const getContrastColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Formule de luminosité perçue
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};
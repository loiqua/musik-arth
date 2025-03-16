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
 * Generate placeholder artwork for tracks without artwork
 */
export const getPlaceholderArtwork = (title: string, artist: string): string => {
  const color = getColorFromString(`${title}${artist}`);
  
  // Return a data URI for a simple SVG with a music note icon
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="${color.replace('#', '%23')}" />
    <path d="M125,50 L125,135 C125,143.3 118.3,150 110,150 C101.7,150 95,143.3 95,135 C95,126.7 101.7,120 110,120 C112.5,120 115,120.6 117.1,121.5 L117.1,70 L85,80 L85,125 C85,133.3 78.3,140 70,140 C61.7,140 55,133.3 55,125 C55,116.7 61.7,110 70,110 C72.5,110 75,110.6 77.1,111.5 L77.1,60 L125,50 Z" fill="white" />
  </svg>`;
};
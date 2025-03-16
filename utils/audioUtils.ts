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
  const initials = `${title.charAt(0)}${artist ? artist.charAt(0) : ''}`.toUpperCase();
  
  // Return a data URI for a simple SVG
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="${color.replace('#', '%23')}" />
    <text x="50%" y="50%" font-family="Arial" font-size="80" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  </svg>`;
};
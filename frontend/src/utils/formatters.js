/**
 * Format seconds into MM:SS format
 * 
 * @param {Number} seconds - Number of seconds to format
 * @return {String} Time in MM:SS format
 */
export function formatTime(seconds) {
  if (!seconds && seconds !== 0) return '--:--';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  // Pad with leading zeros if needed
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
  return `${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Format emotion name to title case and readable format
 * Handles various input formats (kebab-case, snake_case)
 * 
 * @param {String} emotion - Emotion name to format
 * @return {String} Formatted emotion name
 */
export function formatEmotionName(emotion) {
  if (!emotion) return '';
  
  // Handle special cases
  const specialCases = {
    'valence': 'Valence',
    'arousal': 'Arousal'
  };
  
  if (specialCases[emotion.toLowerCase()]) {
    return specialCases[emotion.toLowerCase()];
  }
  
  // Convert snake_case or kebab-case to space-separated
  let formatted = emotion
    .replace(/_/g, ' ')
    .replace(/-/g, ' ');
  
  // Title case each word
  return formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format emotion score as percentage with fixed precision
 * 
 * @param {Number} score - Score value (0-1)
 * @return {String} Formatted percentage string
 */
export function formatEmotionScore(score) {
  if (score === undefined || score === null) return '--';
  
  // Convert to percentage with one decimal point
  return `${(score * 100).toFixed(1)}%`;
}

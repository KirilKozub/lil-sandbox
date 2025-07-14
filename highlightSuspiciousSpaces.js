const suspiciousSpacesRegex = /[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g;

function highlightSuspiciousSpaces(str) {
  return str.replace(suspiciousSpacesRegex, ch => `⟪\\u${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}⟫`);
}
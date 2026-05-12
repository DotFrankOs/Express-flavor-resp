export function normalizeImageUrl(imagePath) {
  if (!imagePath) return null;
  
  if (/^https?:\/\//.test(imagePath) || imagePath.startsWith('//')) {
    return imagePath;
  }
  
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  
  return '/' + imagePath.replace(/^\.?\/?/, '');
}
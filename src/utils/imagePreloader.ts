/**
 * Preload images to improve performance and enable browser caching
 */
const imageCache = new Set<string>();

export const preloadImages = (imageUrls: string[]) => {
  imageUrls.forEach((url) => {
    // Skip if already cached
    if (imageCache.has(url)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
    
    // Also preload the actual image to browser cache
    const img = new Image();
    img.src = url;
    
    imageCache.add(url);
  });
};

/**
 * Preload critical images when component mounts
 * Uses browser idle time to avoid blocking main thread
 */
export const useImagePreloader = (imageUrls: string[]) => {
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback if available, otherwise setTimeout
    const schedulePreload = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => preloadImages(imageUrls), { timeout: 2000 });
      } else {
        setTimeout(() => preloadImages(imageUrls), 100);
      }
    };
    
    schedulePreload();
  }
};


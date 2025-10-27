import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const DynamicFavicon: React.FC = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const updateFavicon = () => {
      console.log('DynamicFavicon: Updating favicon for theme:', resolvedTheme);
      
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll('link[rel*="icon"]');
      existingLinks.forEach(link => link.remove());

      // Add new favicon based on theme (using 32x32 PNG as main favicon)
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/png';
      favicon.sizes = '32x32';
      favicon.href = resolvedTheme === 'dark' ? '/icon-32-dark.png' : '/icon-32.png';
      document.head.appendChild(favicon);
      console.log('DynamicFavicon: Added favicon:', favicon.href);

      // Add PNG icons for different sizes
      const sizes = [16, 32, 192, 512];
      sizes.forEach(size => {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.sizes = `${size}x${size}`;
        link.href = resolvedTheme === 'dark' 
          ? `/icon-${size}-dark.png` 
          : `/icon-${size}.png`;
        document.head.appendChild(link);
        console.log('DynamicFavicon: Added icon', size, ':', link.href);
      });

      // Add Apple touch icon
      const appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      appleTouchIcon.sizes = '180x180';
      appleTouchIcon.href = resolvedTheme === 'dark' 
        ? '/apple-touch-icon-dark.png' 
        : '/apple-touch-icon.png';
      document.head.appendChild(appleTouchIcon);
      console.log('DynamicFavicon: Added apple touch icon:', appleTouchIcon.href);

      // Update manifest for PWA
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (manifestLink) {
        // Create a new manifest with theme-appropriate icons
        const manifest = {
          name: "Cineshelf",
          short_name: "Cineshelf",
          description: "Your Physical Media Collection Manager",
          start_url: "/",
          display: "standalone",
          background_color: resolvedTheme === 'dark' ? "#1a1a1a" : "#ffffff",
          theme_color: resolvedTheme === 'dark' ? "#1a3a3a" : "#2D5A5A",
          icons: [
            {
              src: resolvedTheme === 'dark' ? "/icon-192-dark.png" : "/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: resolvedTheme === 'dark' ? "/icon-512-dark.png" : "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            }
          ]
        };

        // Create a blob URL for the manifest
        const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        const manifestUrl = URL.createObjectURL(manifestBlob);
        manifestLink.href = manifestUrl;
        console.log('DynamicFavicon: Updated manifest for theme:', resolvedTheme);
      }
    };

    // Only update if theme is actually resolved (not the initial 'light' default)
    if (resolvedTheme) {
      updateFavicon();
    }
  }, [resolvedTheme]);

  return null; // This component doesn't render anything
};

export default DynamicFavicon;

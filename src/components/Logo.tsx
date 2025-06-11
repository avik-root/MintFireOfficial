
"use client";

import NextImage from 'next/image'; // Renamed to NextImage to avoid conflict
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

const UPLOADS_DIR_NAME = 'uploads';
const LOGO_DIR_NAME = 'logo';

const possibleLogoPaths = [
  `/${UPLOADS_DIR_NAME}/${LOGO_DIR_NAME}/logo.png`,
  `/${UPLOADS_DIR_NAME}/${LOGO_DIR_NAME}/logo.jpg`,
  `/${UPLOADS_DIR_NAME}/${LOGO_DIR_NAME}/logo.jpeg`,
];

const Logo = () => {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    // This effect runs once on mount to set the initial logo path to try
    if (possibleLogoPaths.length > 0) {
      setLogoSrc(possibleLogoPaths[0] + `?timestamp=${new Date().getTime()}`); // Add cache buster
    } else {
      setUseFallback(true); // No paths to try
    }
  }, []);

  const handleImageError = () => {
    const nextAttemptIndex = attemptIndex + 1;
    if (nextAttemptIndex < possibleLogoPaths.length) {
      setAttemptIndex(nextAttemptIndex);
      setLogoSrc(possibleLogoPaths[nextAttemptIndex] + `?timestamp=${new Date().getTime()}`); // Cache buster
    } else {
      setUseFallback(true); // All attempts failed
    }
  };

  if (useFallback || !logoSrc) {
    return (
      <Link href="/" className="flex items-center space-x-2 group">
        <Zap className="h-8 w-8 text-primary group-hover:text-accent transition-colors duration-300 glowing-icon-primary" />
        <span className="font-headline text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 glitch-text" data-text="MintFire">
          MintFire
        </span>
      </Link>
    );
  }

  return (
    <Link href="/" className="flex items-center space-x-2 group h-8"> {/* Ensure Link itself has defined height for consistent layout */}
      <div className="relative h-8 w-auto aspect-auto" style={{ minWidth: '32px' }}> {/* Container for image */}
        <NextImage
          src={logoSrc}
          alt="MintFire Logo"
          fill // Use fill and let parent control size via aspect ratio or fixed dimensions
          style={{ objectFit: 'contain' }} // 'contain' is usually best for logos
          className="group-hover:opacity-80 transition-opacity"
          onError={handleImageError}
          priority // Logo is often LCP
          unoptimized={true} // Good for local dynamic images to avoid Next.js image opt issues during dev or if path changes
        />
      </div>
      <span className="font-headline text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 glitch-text" data-text="MintFire">
        MintFire
      </span>
    </Link>
  );
};

export default Logo;

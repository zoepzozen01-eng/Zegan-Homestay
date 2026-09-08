import React from 'react';
import officialLogoImg from '../assets/images/zegan_official_logo_1787811644426.jpg';

interface ZeganLogoProps {
  variant?: 'mark' | 'full' | 'badge' | 'image';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isLight?: boolean;
}

/**
 * Pure SVG Logo Vector of ZEGAN HOMESTAY & CAFE
 * Designed with precise organic lines that blend into the earthy Javanese theme:
 * - Traditional Gable House Roof (Joglo/Limasan silhouette)
 * - Foliage/Leaves sprouting on top-right (Green leaf)
 * - Welcoming human figure with open arms inside
 * - Flowing aesthetic base
 * Perfectly adapts its stroke and fills to the ambient theme.
 */
export function ZeganEmblem({ 
  className = "w-8 h-8", 
  isLight = false 
}: { 
  className?: string; 
  isLight?: boolean 
}) {
  const primaryStroke = isLight ? "#fef3c7" : "#3f2c1d"; // Warm amber-ivory / Deep teak-stone
  const secondaryStroke = isLight ? "#fde68a" : "#784b28";
  const leafColor = isLight ? "#86efac" : "#2d6a4f"; // Natural foliage green
  const accentGold = isLight ? "#fbbf24" : "#b45309"; // Warm golden amber

  return (
    <svg 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`shrink-0 transition-transform duration-300 ${className}`}
      aria-label="Zegan Homestay & Cafe Emblem"
    >
      {/* 1. House Gable Roof with Traditional Peak */}
      <path 
        d="M26 62 L60 28 L94 62" 
        stroke={primaryStroke} 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Left and Right Wall Pillars */}
      <path 
        d="M32 60 V88 M88 60 V88" 
        stroke={primaryStroke} 
        strokeWidth="5.5" 
        strokeLinecap="round" 
      />

      {/* 2. Sprouting Organic Leaves on the Right Roof (Heritage Nuance) */}
      <g>
        {/* Leaf Stem */}
        <path 
          d="M80 44 C88 34 94 20 98 12" 
          stroke={leafColor} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
        />
        {/* Top Leaf */}
        <path 
          d="M98 12 C96 22 88 28 84 28 C84 20 90 14 98 12 Z" 
          fill={leafColor} 
        />
        {/* Middle Leaf */}
        <path 
          d="M104 22 C98 28 92 30 89 26 C92 20 100 18 104 22 Z" 
          fill={leafColor} 
        />
        {/* Side Leaf */}
        <path 
          d="M86 36 C94 36 98 32 96 28 C90 28 86 32 86 36 Z" 
          fill={leafColor} 
        />
      </g>

      {/* 3. Welcoming Human Figure (Guest Hospitality Silhouette) */}
      <circle 
        cx="60" 
        cy="48" 
        r="5.5" 
        fill={accentGold} 
      />
      {/* Dynamic Welcoming Arms Open Wide */}
      <path 
        d="M40 58 C48 72 72 72 80 58" 
        stroke={primaryStroke} 
        strokeWidth="5" 
        strokeLinecap="round" 
      />
      {/* Flowing Lower Body / Welcoming Gesture */}
      <path 
        d="M48 68 C56 82 64 82 72 68" 
        stroke={secondaryStroke} 
        strokeWidth="4" 
        strokeLinecap="round" 
      />
      {/* Graceful Base Swirl (Ground / Traditional Floor) */}
      <path 
        d="M34 84 C48 88 72 88 86 84" 
        stroke={accentGold} 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M46 94 C54 97 66 97 74 94" 
        stroke={leafColor} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
    </svg>
  );
}

/**
 * Image representation with blending filters that blend naturally into light or dark surfaces
 */
export function ZeganBlendedImage({
  size = 'md',
  isLight = false,
  className = ''
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLight?: boolean;
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-20 h-20 rounded-2xl'
  };

  return (
    <div className={`relative overflow-hidden shrink-0 transition-all duration-300 ${sizeClasses[size]} ${
      isLight
        ? 'bg-stone-900/60 ring-1 ring-amber-400/30 shadow-md shadow-black/30'
        : 'bg-amber-100/60 ring-1 ring-amber-900/15 shadow-sm'
    } ${className}`}>
      <img
        src={officialLogoImg}
        alt="Zegan Homestay & Cafe"
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLight 
            ? 'opacity-90 contrast-105 brightness-95' 
            : 'mix-blend-multiply opacity-95 contrast-110'
        }`}
      />
      {/* Soft warm vignette overlay for seamless ambient blending */}
      <div className={`absolute inset-0 pointer-events-none rounded-[inherit] ${
        isLight 
          ? 'ring-1 ring-inset ring-amber-300/20' 
          : 'ring-1 ring-inset ring-amber-800/10'
      }`} />
    </div>
  );
}

export default function ZeganLogo({ 
  variant = 'full', 
  size = 'md', 
  className = '', 
  isLight = false 
}: ZeganLogoProps) {
  const emblemSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
    xl: 'w-16 h-16 sm:w-20 sm:h-20'
  };

  if (variant === 'image') {
    return <ZeganBlendedImage size={size} isLight={isLight} className={className} />;
  }

  if (variant === 'mark') {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl transition-all duration-300 ${
        isLight 
          ? 'bg-stone-900/40 p-1.5 ring-1 ring-white/10' 
          : 'bg-amber-900/5 p-1.5 ring-1 ring-amber-900/10'
      } ${className}`}>
        <ZeganEmblem className={emblemSizes[size]} isLight={isLight} />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl backdrop-blur-md transition-all ${
        isLight 
          ? 'bg-stone-900/60 ring-1 ring-stone-700/60 text-stone-100 shadow-lg shadow-black/20' 
          : 'bg-amber-50/90 ring-1 ring-amber-200/80 text-stone-900 shadow-sm'
      } ${className}`}>
        <ZeganEmblem className="w-6 h-6" isLight={isLight} />
        <div className="flex flex-col text-left">
          <span className="font-serif font-black tracking-wider text-xs uppercase leading-none">
            ZEGAN <span className={isLight ? 'text-amber-300 font-light' : 'text-amber-800 font-light'}>HOMESTAY</span>
          </span>
          <span className="text-[8px] tracking-[0.16em] uppercase font-medium opacity-75 mt-0.5">
            Homestay &amp; Cafe
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Emblem with subtle organic tint that blends smoothly into surrounding container */}
      <div className={`relative flex items-center justify-center p-1.5 rounded-2xl transition-all duration-300 shrink-0 ${
        isLight 
          ? 'bg-stone-950/40 ring-1 ring-white/10 shadow-inner' 
          : 'bg-amber-900/5 ring-1 ring-amber-900/10'
      }`}>
        <ZeganEmblem className={emblemSizes[size]} isLight={isLight} />
      </div>

      <div className="flex flex-col text-left">
        <div className={`font-serif font-black tracking-wider uppercase leading-none ${
          size === 'xl' 
            ? 'text-2xl sm:text-3xl' 
            : size === 'lg' 
              ? 'text-xl sm:text-2xl' 
              : 'text-lg sm:text-xl'
        } ${isLight ? 'text-white' : 'text-stone-900'}`}>
          ZEGAN{' '}
          <span className={`font-serif font-light italic transition-colors ${
            isLight ? 'text-amber-300' : 'text-amber-800'
          }`}>
            HOMESTAY
          </span>
        </div>
        <span className={`text-[10px] sm:text-[11px] tracking-[0.2em] font-semibold uppercase mt-0.5 transition-colors ${
          isLight ? 'text-stone-300/90' : 'text-stone-600'
        }`}>
          Homestay &amp; Cafe • Yogyakarta
        </span>
      </div>
    </div>
  );
}

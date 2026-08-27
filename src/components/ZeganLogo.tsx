import React from 'react';

interface ZeganLogoProps {
  variant?: 'mark' | 'full' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isLight?: boolean;
}

/**
 * Pure SVG Logo Vector of ZEGAN HOMESTAY & CAFE
 * Designed with precise organic lines:
 * - Traditional Gable House Roof
 * - Foliage/Leaves sprouting on top-right (Green leaf)
 * - Welcoming human figure with open arms inside
 * - Flowing aesthetic base
 * - High-end typography
 * Seamlessly blends with both Light/Amber and Dark/Atmospheric themes without boxed backgrounds.
 */
export function ZeganEmblem({ 
  className = "w-8 h-8", 
  isLight = false 
}: { 
  className?: string; 
  isLight?: boolean 
}) {
  const primaryStroke = isLight ? "#fef3c7" : "#292524"; // Warm ivory on dark / Stone-800 on light
  const secondaryStroke = isLight ? "#fde68a" : "#44403c";
  const leafColor = isLight ? "#86efac" : "#15803d"; // Vibrant spring green or rich forest green
  const accentGold = isLight ? "#f59e0b" : "#b45309"; // Warm amber/gold

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
      {/* Head */}
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

  if (variant === 'mark') {
    return <ZeganEmblem className={`${emblemSizes[size]} ${className}`} isLight={isLight} />;
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl backdrop-blur-md transition-all ${
        isLight 
          ? 'bg-stone-900/60 border border-stone-700/60 text-stone-100 shadow-lg shadow-black/20' 
          : 'bg-amber-50/80 border border-amber-200/80 text-stone-900 shadow-sm'
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
      {/* Emblem with subtle organic glow/tint that blends directly with surrounding UI */}
      <div className={`relative flex items-center justify-center p-1.5 rounded-2xl transition-all duration-300 ${
        isLight 
          ? 'bg-stone-950/40 border border-white/10 shadow-inner' 
          : 'bg-amber-100/50 border border-amber-200/60 shadow-sm'
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

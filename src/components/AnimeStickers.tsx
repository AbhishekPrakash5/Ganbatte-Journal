import React from 'react';
import type { AnimeSticker, StickerId } from '../types';
import { Sparkles } from 'lucide-react';

export const ALL_ANIME_STICKERS: AnimeSticker[] = [
  {
    id: 'ramen',
    name: 'Ichiraku Ramen',
    japaneseName: '一楽ラーメン',
    meaning: 'Deep comfort, nourishing warmth & joyful recovery',
    theme: 'Naruto Classic',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'calcifer',
    name: 'Calcifer Hearth Spirit',
    japaneseName: 'カルシファーの炎',
    meaning: 'Bright vitality, creative spark & playful warmth',
    theme: 'Ghibli Hearth',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  {
    id: 'leaf',
    name: 'Konoha Whimsical Leaf',
    japaneseName: '木の葉の意志',
    meaning: 'Serene grounding, natural stillness & resilient spirit',
    theme: 'Hidden Leaf',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    id: 'sootsprite',
    name: 'Susuwatari Star Sprite',
    japaneseName: 'ススワタリと金平糖',
    meaning: 'Gentle wonder, quiet hope & tender self-care',
    theme: 'Ghibli Wonder',
    badgeColor: 'bg-stone-100 text-stone-900 border-stone-300',
  },
  {
    id: 'kitsune',
    name: 'Kurama Nine-Tails Fox',
    japaneseName: 'おやすみ九尾',
    meaning: 'Peaceful restorative sleep, safety & deep rest',
    theme: 'Nine-Tails Rest',
    badgeColor: 'bg-orange-100 text-amber-900 border-orange-300',
  },
  {
    id: 'totoro',
    name: 'Forest Guardian',
    japaneseName: '森の守り神',
    meaning: 'Deep shelter, mindful presence & soothing sanctuary',
    theme: 'Ghibli Nature',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
  },
  {
    id: 'origami',
    name: 'Shikigami Sky Bird',
    japaneseName: '式神の折り鶴',
    meaning: 'Clarity, release of burdens & soaring focus',
    theme: 'Ninja Paper Art',
    badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  },
  {
    id: 'dango',
    name: 'Hanami Sweet Dango',
    japaneseName: '花見だんご',
    meaning: 'Savoring the present, sweetness & simple gratitude',
    theme: 'Leaf Village',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
  },
];

export function getStickerForEmotion(emotion?: string): AnimeSticker {
  const norm = (emotion || '').toLowerCase();
  if (norm === 'joyful') return ALL_ANIME_STICKERS[1]; // calcifer
  if (norm === 'calm') return ALL_ANIME_STICKERS[2]; // leaf
  if (norm === 'fatigued') return ALL_ANIME_STICKERS[4]; // kitsune
  if (norm === 'overwhelmed') return ALL_ANIME_STICKERS[3]; // sootsprite
  if (norm === 'anxious') return ALL_ANIME_STICKERS[3]; // sootsprite
  if (norm === 'grateful') return ALL_ANIME_STICKERS[7]; // dango
  if (norm === 'restless') return ALL_ANIME_STICKERS[6]; // origami
  return ALL_ANIME_STICKERS[0]; // ramen for reflective / general
}

interface StickerArtProps {
  id: StickerId;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

export const AnimatedStickerArt: React.FC<StickerArtProps> = ({ id, size = 'md' }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    hero: 'w-28 h-28 sm:w-32 sm:h-32',
  };

  const currentSizeClass = sizeMap[size];

  switch (id) {
    case 'ramen':
      return (
        <div className={`relative ${currentSizeClass} flex items-center justify-center select-none`}>
          {/* Animated Steam Plumes */}
          <div className="absolute -top-3 left-1/4 w-1.5 h-4 bg-orange-200/70 rounded-full blur-[0.5px] animate-anime-steam-1 pointer-events-none" />
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-5 bg-amber-200/80 rounded-full blur-[0.5px] animate-anime-steam-2 pointer-events-none" />
          <div className="absolute -top-3 right-1/4 w-1.5 h-4 bg-orange-200/70 rounded-full blur-[0.5px] animate-anime-steam-3 pointer-events-none" />

          {/* Ramen Bowl Vector */}
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md animate-anime-bob">
            {/* Wooden Chopsticks */}
            <line x1="20" y1="20" x2="88" y2="48" stroke="#8B5A2B" strokeWidth="4" strokeLinecap="round" />
            <line x1="18" y1="24" x2="86" y2="52" stroke="#654321" strokeWidth="3.5" strokeLinecap="round" />

            {/* Soup Broth Gold */}
            <ellipse cx="50" cy="52" rx="38" ry="18" fill="#F59E0B" />
            <ellipse cx="50" cy="52" rx="34" ry="15" fill="#FBBF24" />

            {/* Nori Sheet */}
            <rect x="22" y="38" width="12" height="18" rx="2" fill="#1C3829" transform="rotate(-15 28 47)" />

            {/* Soft-Boiled Egg */}
            <ellipse cx="40" cy="53" rx="8" ry="11" fill="#FEF3C7" transform="rotate(20 40 53)" />
            <circle cx="41" cy="53" r="5.5" fill="#EA580C" />
            <circle cx="42" cy="52" r="1.5" fill="#FFF" />

            {/* Narutomaki Swirl (Classic Naruto Fishcake) */}
            <g transform="translate(62, 46)">
              <circle cx="0" cy="0" r="9" fill="#FFFFFF" stroke="#F43F5E" strokeWidth="1.5" />
              <path
                d="M -5,0 C -5,-4 0,-6 2,-5 C 5,-4 5,0 3,2 C 1,4 -2,3 -2,1 C -2,-0.5 0,-1.5 1,-1"
                fill="none"
                stroke="#F43F5E"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>

            {/* Green Scallions */}
            <circle cx="48" cy="46" r="2.5" fill="#16A34A" />
            <circle cx="53" cy="50" r="2.5" fill="#22C55E" />
            <circle cx="36" cy="48" r="2" fill="#15803D" />

            {/* Ceramic Bowl Body with Naruto Red/Gold Bands */}
            <path
              d="M 12 50 C 12 78 30 88 50 88 C 70 88 88 78 88 50 Z"
              fill="#FFFFFF"
              stroke="#EA580C"
              strokeWidth="3.5"
            />
            {/* Red Rim Band */}
            <path
              d="M 14 50 C 14 74 32 84 50 84 C 68 84 86 74 86 50 Z"
              fill="none"
              stroke="#F97316"
              strokeWidth="2"
            />
            {/* Uzumaki Spiral on Bowl Front */}
            <path
              d="M 46 68 C 44 65 47 62 50 63 C 54 64 54 69 50 71 C 46 72 43 68 44 65"
              fill="none"
              stroke="#EA580C"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Bowl Base */}
            <rect x="36" y="86" width="28" height="6" rx="3" fill="#D97706" />
          </svg>
        </div>
      );

    case 'calcifer':
      return (
        <div className={`relative ${currentSizeClass} flex items-center justify-center select-none`}>
          {/* Dancing Embers */}
          <div className="absolute -top-2 left-2 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-anime-shimmer pointer-events-none" />
          <div className="absolute top-1 right-2 w-2 h-2 bg-orange-400 rounded-full animate-anime-shimmer pointer-events-none" style={{ animationDelay: '0.6s' }} />

          {/* Calcifer Flame Vector */}
          <svg viewBox="0 0 100 100" className="w-full h-full animate-anime-flame drop-shadow-lg">
            {/* Outer Flame Wings */}
            <path
              d="M 50 8 C 30 25 15 50 18 72 C 20 88 35 94 50 94 C 65 94 80 88 82 72 C 85 50 70 25 50 8 Z"
              fill="url(#calciferOuterGradient)"
            />
            {/* Inner Golden Hearth */}
            <path
              d="M 50 24 C 36 38 26 56 28 72 C 30 84 40 88 50 88 C 60 88 70 84 72 72 C 74 56 64 38 50 24 Z"
              fill="url(#calciferInnerGradient)"
            />
            {/* Core Heart */}
            <ellipse cx="50" cy="74" rx="14" ry="10" fill="#FEF08A" />

            {/* Cute Cartoon Blinking Eyes */}
            <g className="animate-anime-blink">
              <ellipse cx="38" cy="56" rx="6" ry="8" fill="#FFFFFF" />
              <ellipse cx="62" cy="56" rx="6" ry="8" fill="#FFFFFF" />
              <circle cx="39" cy="56" r="3.5" fill="#1C1917" />
              <circle cx="61" cy="56" r="3.5" fill="#1C1917" />
              <circle cx="41" cy="54" r="1.5" fill="#FFFFFF" />
              <circle cx="63" cy="54" r="1.5" fill="#FFFFFF" />
            </g>

            {/* Rosy Cheeks */}
            <ellipse cx="28" cy="66" rx="4.5" ry="3" fill="#F43F5E" opacity="0.6" />
            <ellipse cx="72" cy="66" rx="4.5" ry="3" fill="#F43F5E" opacity="0.6" />

            {/* Cheerful Mouth */}
            <path
              d="M 42 66 Q 50 73 58 66"
              fill="#991B1B"
              stroke="#7F1D1D"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path d="M 46 67 Q 50 70 54 67" fill="#F87171" />

            {/* Fire Log Pieces at bottom */}
            <rect x="22" y="88" width="26" height="7" rx="3" fill="#5A3825" stroke="#382115" strokeWidth="1" transform="rotate(-8 35 91)" />
            <rect x="52" y="88" width="26" height="7" rx="3" fill="#6B4226" stroke="#382115" strokeWidth="1" transform="rotate(8 65 91)" />

            <defs>
              <linearGradient id="calciferOuterGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="60%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
              <linearGradient id="calciferInnerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="70%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );

    case 'leaf':
      return (
        <div className={`relative ${currentSizeClass} flex items-center justify-center select-none`}>
          {/* Swirling Chakra Wind Ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-amber-300/60 animate-spin" style={{ animationDuration: '9s' }} />

          {/* Konoha Leaf Vector */}
          <svg viewBox="0 0 100 100" className="w-full h-full animate-anime-sway drop-shadow-md">
            {/* Leaf Body */}
            <path
              d="M 50 12 C 72 24 88 50 82 72 C 76 88 56 92 46 84 C 30 72 18 52 26 30 C 32 18 42 12 50 12 Z"
              fill="url(#leafGradient)"
              stroke="#15803D"
              strokeWidth="2.5"
            />
            {/* Center Spine */}
            <path
              d="M 50 14 Q 52 50 44 86"
              fill="none"
              stroke="#14532D"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Side Veins */}
            <path d="M 49 32 Q 65 38 72 44" fill="none" stroke="#166534" strokeWidth="1.5" />
            <path d="M 48 48 Q 66 54 74 62" fill="none" stroke="#166534" strokeWidth="1.5" />
            <path d="M 47 38 Q 33 46 28 54" fill="none" stroke="#166534" strokeWidth="1.5" />
            <path d="M 46 56 Q 34 66 32 74" fill="none" stroke="#166534" strokeWidth="1.5" />

            {/* Uzumaki Spiral Ninjutsu Emblem */}
            <g transform="translate(54, 52)">
              <circle cx="0" cy="0" r="14" fill="#FEF08A" opacity="0.85" stroke="#EA580C" strokeWidth="1.5" />
              <path
                d="M -7,0 C -7,-5 0,-8 4,-6 C 8,-4 8,2 5,5 C 2,8 -3,7 -4,4 C -5,1 -2,-2 0,-2 C 2,-2 2,0 1,1"
                fill="none"
                stroke="#EA580C"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>

            {/* Dew Drop */}
            <circle cx="36" cy="34" r="3.5" fill="#BAE6FD" opacity="0.8" />
            <circle cx="35" cy="33" r="1" fill="#FFFFFF" />

            <defs>
              <linearGradient id="leafGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4ADE80" />
                <stop offset="50%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#15803D" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );

    case 'sootsprite':
      return (
        <div className={`relative ${currentSizeClass} flex items-center justify-center select-none`}>
          {/* Twinkling Golden Star Candy Glow */}
          <div className="absolute top-1 right-1 w-4 h-4 bg-yellow-300/60 rounded-full blur-[2px] animate-anime-shimmer pointer-events-none" />

          {/* Susuwatari Soot Sprite Vector */}
          <svg viewBox="0 0 100 100" className="w-full h-full animate-anime-bob drop-shadow-md">
            {/* Fuzzy Spikes Silhouette */}
            <g fill="#1C1917">
              <circle cx="48" cy="52" r="30" />
              {/* Spikes all around */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <polygon
                  key={deg}
                  points="48,16 45,26 51,26"
                  transform={`rotate(${deg} 48 52)`}
                />
              ))}
            </g>

            {/* Little Stick Arms holding Konpeito Candy */}
            <line x1="64" y1="52" x2="76" y2="44" stroke="#1C1917" strokeWidth="3" strokeLinecap="round" />
            <line x1="58" y1="62" x2="74" y2="50" stroke="#1C1917" strokeWidth="3" strokeLinecap="round" />

            {/* Star Candy (Konpeito) */}
            <g transform="translate(76, 44)" className="animate-anime-shimmer">
              <path
                d="M 0,-9 L 3,-3 L 9,-2 L 5,3 L 6,9 L 0,6 L -6,9 L -5,3 L -9,-2 L -3,-3 Z"
                fill="#FBBF24"
                stroke="#F59E0B"
                strokeWidth="1"
              />
              <circle cx="0" cy="0" r="3" fill="#FEF08A" />
            </g>

            {/* Big Curious Googly Eyes */}
            <g className="animate-anime-blink">
              <circle cx="38" cy="48" r="9.5" fill="#FFFFFF" />
              <circle cx="58" cy="48" r="9.5" fill="#FFFFFF" />
              {/* Pupils looking slightly up towards candy */}
              <circle cx="41" cy="47" r="4.5" fill="#0C0A09" />
              <circle cx="61" cy="47" r="4.5" fill="#0C0A09" />
              {/* Highlights */}
              <circle cx="43" cy="45" r="1.8" fill="#FFFFFF" />
              <circle cx="63" cy="45" r="1.8" fill="#FFFFFF" />
            </g>

            {/* Tiny Soft Feet */}
            <ellipse cx="38" cy="80" rx="5" ry="3" fill="#1C1917" />
            <ellipse cx="56" cy="80" rx="5" ry="3" fill="#1C1917" />
          </svg>
        </div>
      );

    case 'kitsune':
      return (
        <div className={`relative ${currentSizeClass} flex items-center justify-center select-none`}>
          {/* Zzz Rest Particles */}
          <span className="absolute -top-1 right-2 text-xs font-bold text-amber-500 animate-anime-shimmer pointer-events-none">
            zZ
          </span>

          {/* Sleeping Nine-Tails Fox Vector */}
          <svg viewBox="0 0 100 100" className="w-full h-full animate-anime-breathe drop-shadow-md">
            {/* Nine Fluffy Tails Curled Around */}
            <g fill="url(#kitsuneTailsGradient)" stroke="#C2410C" strokeWidth="1">
              <path d="M 50 82 C 78 88 94 72 88 50 C 82 34 68 40 70 56 Z" />
              <path d="M 50 82 C 84 76 96 54 84 36 C 74 24 64 34 68 50 Z" />
              <path d="M 50 82 C 88 64 90 40 76 26 C 66 18 58 30 64 46 Z" />
              <path d="M 50 82 C 30 92 12 78 14 56 C 16 38 30 44 32 60 Z" />
              <path d="M 50 82 C 16 78 8 56 16 38 C 24 26 34 36 32 52 Z" />
            </g>

            {/* Curled Sleeping Body */}
            <ellipse cx="50" cy="62" rx="26" ry="20" fill="url(#kitsuneBodyGradient)" stroke="#C2410C" strokeWidth="2" />

            {/* White Chest & Belly Fur */}
            <path d="M 38 68 Q 50 78 62 68 Q 50 60 38 68 Z" fill="#FFFBEB" />

            {/* Fox Head Sleeping */}
            <circle cx="42" cy="50" r="16" fill="#EA580C" stroke="#C2410C" strokeWidth="1.5" />
            <path d="M 32 54 L 24 58 L 34 62 Z" fill="#EA580C" /> {/* Muzzle */}
            <circle cx="24" cy="58" r="2" fill="#1C1917" /> {/* Black nose */}

            {/* Cute Closed Sleeping Eye Slits */}
            <path d="M 34 50 Q 38 54 42 50" fill="none" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />

            {/* Fox Ears with White Fluff */}
            <polygon points="34,38 38,20 46,34" fill="#EA580C" stroke="#C2410C" strokeWidth="1.5" />
            <polygon points="36,36 39,24 44,34" fill="#FFFBEB" />
            <polygon points="46,36 54,20 58,38" fill="#EA580C" stroke="#C2410C" strokeWidth="1.5" />
            <polygon points="48,35 53,24 56,36" fill="#FFFBEB" />

            {/* Subtle Forehead Whiskers Mark */}
            <line x1="30" y1="52" x2="36" y2="52" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="30" y1="56" x2="36" y2="55" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />

            <defs>
              <linearGradient id="kitsuneBodyGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
              <linearGradient id="kitsuneTailsGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="50%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );

    case 'totoro':
      return (
        <div className={`relative ${currentSizeClass} flex items-center justify-center select-none`}>
          {/* Forest Spores */}
          <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-teal-300 rounded-full animate-anime-shimmer pointer-events-none" />

          {/* Totoro Forest Spirit with Leaf Umbrella */}
          <svg viewBox="0 0 100 100" className="w-full h-full animate-anime-bob drop-shadow-md">
            {/* Lotus Leaf Umbrella */}
            <path
              d="M 22 28 C 30 14 70 14 78 28 C 68 26 50 30 22 28 Z"
              fill="#22C55E"
              stroke="#15803D"
              strokeWidth="2"
            />
            {/* Umbrella Stem */}
            <line x1="50" y1="26" x2="52" y2="52" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />

            {/* Totoro Gray Pear Body */}
            <path
              d="M 32 46 C 30 36 70 36 68 46 C 76 56 80 74 74 86 C 68 94 32 94 26 86 C 20 74 24 56 32 46 Z"
              fill="#78716C"
              stroke="#57534E"
              strokeWidth="2"
            />

            {/* Pointy Ears */}
            <ellipse cx="36" cy="34" rx="4" ry="10" fill="#78716C" stroke="#57534E" strokeWidth="1.5" />
            <ellipse cx="64" cy="34" rx="4" ry="10" fill="#78716C" stroke="#57534E" strokeWidth="1.5" />

            {/* Cream Tummy */}
            <ellipse cx="50" cy="70" rx="18" ry="16" fill="#F5F5F4" />

            {/* Tummy Arrows (Chevrons) */}
            <path d="M 44 62 L 47 65 L 50 62" fill="none" stroke="#78716C" strokeWidth="2" strokeLinecap="round" />
            <path d="M 50 62 L 53 65 L 56 62" fill="none" stroke="#78716C" strokeWidth="2" strokeLinecap="round" />
            <path d="M 41 68 L 44 71 L 47 68" fill="none" stroke="#78716C" strokeWidth="2" strokeLinecap="round" />
            <path d="M 53 68 L 56 71 L 59 68" fill="none" stroke="#78716C" strokeWidth="2" strokeLinecap="round" />

            {/* Wide Friendly Eyes */}
            <circle cx="42" cy="46" r="4.5" fill="#FFFFFF" />
            <circle cx="58" cy="46" r="4.5" fill="#FFFFFF" />
            <circle cx="42" cy="46" r="2" fill="#1C1917" />
            <circle cx="58" cy="46" r="2" fill="#1C1917" />

            {/* Cute Little Triangle Nose */}
            <polygon points="48,49 52,49 50,52" fill="#1C1917" />

            {/* Little Whiskers */}
            <line x1="28" y1="48" x2="36" y2="49" stroke="#1C1917" strokeWidth="1.5" />
            <line x1="28" y1="52" x2="36" y2="52" stroke="#1C1917" strokeWidth="1.5" />
            <line x1="64" y1="49" x2="72" y2="48" stroke="#1C1917" strokeWidth="1.5" />
            <line x1="64" y1="52" x2="72" y2="52" stroke="#1C1917" strokeWidth="1.5" />
          </svg>
        </div>
      );

    case 'origami':
      return (
        <div className={`relative ${currentSizeClass} flex items-center justify-center select-none`}>
          {/* Origami Bird Vector */}
          <svg viewBox="0 0 100 100" className="w-full h-full animate-anime-bob drop-shadow-md">
            {/* Left Flapping Wing */}
            <polygon
              points="48,50 14,26 36,60"
              fill="#FEF08A"
              stroke="#EAB308"
              strokeWidth="1.5"
              className="animate-anime-wing"
            />
            {/* Right Wing */}
            <polygon
              points="52,50 86,26 64,60"
              fill="#FDE047"
              stroke="#EAB308"
              strokeWidth="1.5"
            />
            {/* Center Folded Body */}
            <polygon points="48,46 50,78 52,46" fill="#FFFFFF" stroke="#CA8A04" strokeWidth="1.5" />
            {/* Beak / Head Fold */}
            <polygon points="48,46 50,30 56,36" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
            {/* Pointy Tail Fold */}
            <polygon points="49,76 50,90 51,76" fill="#FDE047" stroke="#EAB308" strokeWidth="1.5" />

            {/* Sparkle Trail */}
            <circle cx="28" cy="74" r="2" fill="#F59E0B" className="animate-anime-shimmer" />
            <circle cx="72" cy="74" r="2.5" fill="#FBBF24" className="animate-anime-shimmer" />
          </svg>
        </div>
      );

    case 'dango':
      return (
        <div className={`relative ${currentSizeClass} flex items-center justify-center select-none`}>
          {/* Sweet Hanami Dango Skewer */}
          <svg viewBox="0 0 100 100" className="w-full h-full animate-anime-bob drop-shadow-md">
            {/* Bamboo Skewer */}
            <line x1="20" y1="84" x2="78" y2="22" stroke="#B45309" strokeWidth="4" strokeLinecap="round" />

            {/* Green Matcha Dango (Bottom) */}
            <circle cx="36" cy="68" r="13" fill="#86EFAC" stroke="#16A34A" strokeWidth="2" />
            <circle cx="33" cy="65" r="3.5" fill="#FFFFFF" opacity="0.6" />

            {/* White Vanilla Dango (Middle) */}
            <circle cx="50" cy="52" r="13" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="2" />
            <circle cx="47" cy="49" r="3.5" fill="#FFFFFF" opacity="0.9" />

            {/* Pink Sakura Dango (Top) */}
            <circle cx="64" cy="36" r="13" fill="#FDA4AF" stroke="#E11D48" strokeWidth="2" />
            <circle cx="61" cy="33" r="3.5" fill="#FFFFFF" opacity="0.6" />

            {/* Kawaii Face on Top Pink Dango */}
            <g className="animate-anime-blink">
              <circle cx="59" cy="36" r="1.5" fill="#881337" />
              <circle cx="67" cy="34" r="1.5" fill="#881337" />
              <path d="M 62 38 Q 64 41 66 38" fill="none" stroke="#881337" strokeWidth="1" strokeLinecap="round" />
            </g>

            {/* Sparkles */}
            <path
              d="M 78 18 L 80 23 L 85 24 L 81 27 L 82 32 L 78 29 L 74 32 L 75 27 L 71 24 L 76 23 Z"
              fill="#FDE047"
              className="animate-anime-shimmer"
            />
          </svg>
        </div>
      );

    default:
      return null;
  }
};

interface AnimeStickerBadgeProps {
  sticker: AnimeSticker;
  onClick?: () => void;
  interactive?: boolean;
}

export const AnimeStickerBadge: React.FC<AnimeStickerBadgeProps> = ({
  sticker,
  onClick,
  interactive = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-amber-300 bg-linear-to-r from-amber-50 to-orange-50 text-amber-950 shadow-2xs ${
        interactive ? 'cursor-pointer hover:border-orange-400 hover:shadow-xs transition-all' : ''
      }`}
      title={`${sticker.name} (${sticker.japaneseName}) - ${sticker.meaning}`}
    >
      <AnimatedStickerArt id={sticker.id} size="sm" />
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold leading-tight text-amber-950">{sticker.name}</span>
          <span className="text-[10px] text-amber-700/80 font-medium font-serif-natural">
            {sticker.japaneseName}
          </span>
        </div>
        <span className="text-[10px] text-amber-800/75 leading-tight truncate max-w-[180px]">
          {sticker.meaning}
        </span>
      </div>
    </div>
  );
};

interface AnimeStickerPickerProps {
  selectedStickerId: StickerId;
  onSelectSticker: (sticker: AnimeSticker) => void;
}

export const AnimeStickerPicker: React.FC<AnimeStickerPickerProps> = ({
  selectedStickerId,
  onSelectSticker,
}) => {
  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-900/80 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          Seal with an Anime & Ghibli Sticker Stamp:
        </span>
        <span className="text-[11px] text-amber-700/80">Tap to change seal</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {ALL_ANIME_STICKERS.map((stk) => {
          const isSelected = stk.id === selectedStickerId;
          return (
            <button
              key={stk.id}
              type="button"
              onClick={() => onSelectSticker(stk)}
              className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-amber-100/90 border-orange-500 ring-2 ring-orange-400/40 shadow-xs'
                  : 'bg-white/80 hover:bg-amber-50/60 border-amber-200/80 hover:border-amber-300'
              }`}
            >
              <AnimatedStickerArt id={stk.id} size="md" />
              <span className="text-xs font-bold text-amber-950 leading-tight">{stk.name}</span>
              <span className="text-[10px] text-amber-700 leading-tight line-clamp-1">{stk.meaning}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

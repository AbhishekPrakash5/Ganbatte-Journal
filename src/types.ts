export interface LocationMetadata {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  city?: string;
  neighborhood?: string;
  placeName?: string;
  placeCategory?: 'park' | 'cafe' | 'home' | 'office' | 'transit' | 'nature' | 'urban' | 'other';
}

export type MoodCategory = 'joyful' | 'calm' | 'reflective' | 'anxious' | 'fatigued' | 'overwhelmed' | 'grateful' | 'restless';

export type StickerId = 'ramen' | 'calcifer' | 'leaf' | 'sootsprite' | 'kitsune' | 'totoro' | 'origami' | 'dango';

export interface AnimeSticker {
  id: StickerId;
  name: string;
  japaneseName: string;
  meaning: string;
  theme: string;
  badgeColor?: string;
}

export interface MoodAnalysis {
  sentiment: string;
  moodScore: number; // 1 to 10
  primaryEmotion: MoodCategory;
  emotionalSummary: string;
  suggestions: string[];
  locationPatternNote?: string;
  isCrisisDetected?: boolean;
  crisisMessage?: string;
  sticker?: AnimeSticker;
}

export interface JournalEntry {
  id: string;
  userId: string;
  text: string;
  clarifyingQuestion?: string;
  emotionResponse?: string;
  sentiment?: string;
  moodScore?: number;
  primaryEmotion?: MoodCategory;
  emotionalSummary?: string;
  suggestions?: string[];
  location?: LocationMetadata;
  locationPatternNote?: string;
  isCrisisDetected?: boolean;
  sticker?: AnimeSticker;
  createdAt: string;
  updatedAt?: string;
}

export interface ClarifyResponse {
  acknowledgement: string;
  clarifyingQuestion: string;
  isCrisisDetected?: boolean;
  crisisMessage?: string;
}

export interface LocationPatternInsight {
  placeName: string;
  placeCategory: string;
  count: number;
  averageMood: number;
  predominantEmotion: string;
  insight: string;
}

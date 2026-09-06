import React from 'react';
import { Compass, Sparkles, Trees, Home, Coffee, Briefcase, Car, Mountain, Building, Lightbulb } from 'lucide-react';
import type { JournalEntry } from '../types';

interface LocationMoodPatternsProps {
  entries: JournalEntry[];
  onSwitchToWrite: () => void;
}

export const LocationMoodPatterns: React.FC<LocationMoodPatternsProps> = ({
  entries,
  onSwitchToWrite,
}) => {
  // Aggregate records by placeCategory
  const categoryStats: Record<
    string,
    {
      category: string;
      count: number;
      totalMood: number;
      emotions: Record<string, number>;
      places: Set<string>;
    }
  > = {};

  entries.forEach((entry) => {
    const cat = entry.location?.placeCategory || 'home';
    if (!categoryStats[cat]) {
      categoryStats[cat] = {
        category: cat,
        count: 0,
        totalMood: 0,
        emotions: {},
        places: new Set(),
      };
    }
    categoryStats[cat].count += 1;
    categoryStats[cat].totalMood += entry.moodScore ?? 7;

    const emo = entry.primaryEmotion || 'reflective';
    categoryStats[cat].emotions[emo] = (categoryStats[cat].emotions[emo] || 0) + 1;

    if (entry.location?.placeName) {
      categoryStats[cat].places.add(entry.location.placeName);
    }
  });

  const categoriesList = Object.values(categoryStats)
    .map((stat) => {
      const avgMood = Number((stat.totalMood / stat.count).toFixed(1));
      let topEmotion = 'reflective';
      let topEmotionCount = 0;
      for (const [e, count] of Object.entries(stat.emotions)) {
        if (count > topEmotionCount) {
          topEmotion = e;
          topEmotionCount = count;
        }
      }

      return {
        category: stat.category,
        count: stat.count,
        avgMood,
        topEmotion,
        places: Array.from(stat.places),
      };
    })
    .sort((a, b) => b.avgMood - a.avgMood);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'park':
        return <Trees className="w-5 h-5 text-emerald-600" />;
      case 'nature':
        return <Mountain className="w-5 h-5 text-emerald-700" />;
      case 'home':
        return <Home className="w-5 h-5 text-orange-600" />;
      case 'cafe':
        return <Coffee className="w-5 h-5 text-amber-600" />;
      case 'office':
        return <Briefcase className="w-5 h-5 text-amber-700" />;
      case 'transit':
        return <Car className="w-5 h-5 text-orange-500" />;
      case 'urban':
        return <Building className="w-5 h-5 text-amber-800" />;
      default:
        return <Compass className="w-5 h-5 text-orange-600" />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'park':
        return 'Parks & Greenery';
      case 'nature':
        return 'Nature Trails & Outdoors';
      case 'home':
        return 'Home Sanctuary';
      case 'cafe':
        return 'Cafes & Quiet Corners';
      case 'office':
        return 'Workplace & Office';
      case 'transit':
        return 'Commute & Travel';
      case 'urban':
        return 'Urban & Streets';
      default:
        return 'General Settings';
    }
  };

  // Generate automated environmental synthesis
  const generateSynthesisPattern = () => {
    if (entries.length === 0) return null;

    const parkStat = categoriesList.find((c) => c.category === 'park' || c.category === 'nature');
    const homeStat = categoriesList.find((c) => c.category === 'home');
    const cafeStat = categoriesList.find((c) => c.category === 'cafe');

    if (parkStat && parkStat.avgMood >= 7.5) {
      return `You tend to feel more energetic and calm when journaling near ${getCategoryLabel(
        parkStat.category
      ).toLowerCase()} (averaging ${parkStat.avgMood}/10). Natural surroundings consistently elevate your emotional clarity and chakra focus.`;
    }

    if (cafeStat && cafeStat.avgMood >= 7.0) {
      return `Cafes and ambient tea spaces provide a comfortable stimulus for your focus, where your reflections trend toward deep mindfulness.`;
    }

    if (homeStat) {
      return `Your home sanctuary is your primary space for grounding and decompressing, averaging a steady ${homeStat.avgMood}/10 vitality score.`;
    }

    if (categoriesList.length > 0) {
      return `Your highest vitality occurs in ${getCategoryLabel(
        categoriesList[0].category
      )} (average mood ${categoriesList[0].avgMood}/10, primarily feeling ${categoriesList[0].topEmotion}).`;
    }

    return 'Log a few more reflections in different locations to reveal deep patterns in how environments impact your mood.';
  };

  const patternSummary = generateSynthesisPattern();

  return (
    <div id="location-patterns-container" className="max-w-4xl mx-auto space-y-6">
      {/* Pattern Highlight Banner */}
      <div className="bg-linear-to-r from-amber-100/90 via-orange-50/80 to-amber-50 rounded-2xl border border-amber-300 p-6 sm:p-7 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-orange-600 font-serif-natural italic text-base sm:text-lg font-bold">
          <span>🍥</span>
          <h3>Gemini Environmental Synthesis</h3>
        </div>

        <p className="text-base sm:text-lg font-serif-natural text-amber-950 font-medium leading-relaxed">
          {patternSummary ||
            'As you record reflections across your daily spots, Gemini synthesizes how different environments nurture your mental wellbeing and ninja vitality.'}
        </p>

        <p className="text-xs text-amber-800/80 font-medium">
          Derived from {entries.length} personal reflection{entries.length === 1 ? '' : 's'} stored in your isolated Firestore database.
        </p>
      </div>

      {/* Breakdown per Environment */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-amber-200/90 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-amber-100 pb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-orange-600" />
              Environment Vitality Breakdown
            </h3>
            <p className="text-xs text-amber-800/70 mt-1">Average vitality scores and predominant emotional tones by place</p>
          </div>
        </div>

        {categoriesList.length === 0 ? (
          <div className="text-center p-8 space-y-2">
            <Compass className="w-8 h-8 text-amber-300 mx-auto" />
            <p className="text-xs text-amber-800">No location records yet.</p>
            <button
              onClick={onSwitchToWrite}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
            >
              Write a reflection and capture your spot &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoriesList.map((item) => (
              <div
                key={item.category}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white border border-amber-300 shadow-2xs">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-950">{getCategoryLabel(item.category)}</h4>
                      <p className="text-[11px] text-amber-800/80">
                        {item.count} entr{item.count === 1 ? 'y' : 'ies'}
                        {item.places.length > 0 ? ` (${item.places.slice(0, 2).join(', ')})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-serif-natural font-bold text-orange-600">{item.avgMood}</span>
                    <span className="text-[10px] text-amber-800"> / 10</span>
                  </div>
                </div>

                {/* Progress bar in Naruto theme */}
                <div className="w-full bg-amber-200/60 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.avgMood >= 8
                        ? 'bg-linear-to-r from-orange-600 to-amber-500'
                        : item.avgMood >= 6
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(10, item.avgMood * 10))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-amber-900">
                  <span>Predominant Tone:</span>
                  <span className="font-bold text-amber-950 capitalize bg-white px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                    {item.topEmotion}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mindful Environment Tips */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-amber-200/90 p-6 space-y-4">
        <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-amber-900 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-orange-500" />
          Mindful Environment Habits
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-amber-950">
          <div className="p-4 bg-white rounded-xl border border-dashed border-amber-300">
            <span className="font-bold text-amber-950 block mb-1">🍃 Hidden Leaf Woods</span>
            Spending 15 minutes near trees or natural breeze restores mental stamina and emotional chakra.
          </div>
          <div className="p-4 bg-white rounded-xl border border-dashed border-amber-300">
            <span className="font-bold text-amber-950 block mb-1">🏡 Sanctuary Nook</span>
            Designate a specific corner with warm amber lighting and a cozy mat solely for quiet reflections.
          </div>
          <div className="p-4 bg-white rounded-xl border border-dashed border-amber-300">
            <span className="font-bold text-amber-950 block mb-1">🍜 Ramen & Tea Shacks</span>
            Warm broth and steam stimulate gentle gratitude, comfort, and restorative contemplation.
          </div>
        </div>
      </div>
    </div>
  );
};

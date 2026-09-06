import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Compass,
  Heart,
  Lightbulb,
  CornerDownRight,
  ShieldAlert,
} from 'lucide-react';
import type { LocationMetadata, JournalEntry, MoodCategory, AnimeSticker } from '../types';
import { saveJournalEntry, saveLocalEntry } from '../lib/firebase';
import {
  AnimatedStickerArt,
  AnimeStickerBadge,
  AnimeStickerPicker,
  getStickerForEmotion,
} from './AnimeStickers';

interface JournalEditorProps {
  userId: string;
  pastEntries: JournalEntry[];
  onEntrySaved: (entry: JournalEntry) => void;
  onOpenCrisis: (message?: string) => void;
  onSignIn?: () => void;
}

const PLACE_CATEGORIES = [
  { id: 'park', label: 'Park / Outdoors' },
  { id: 'home', label: 'Home Sanctuary' },
  { id: 'cafe', label: 'Cafe / Eatery' },
  { id: 'office', label: 'Work / Office' },
  { id: 'nature', label: 'Nature / Trail' },
  { id: 'transit', label: 'Commute / Transit' },
  { id: 'urban', label: 'City / Street' },
  { id: 'other', label: 'Other' },
] as const;

export const JournalEditor: React.FC<JournalEditorProps> = ({
  userId,
  pastEntries,
  onEntrySaved,
  onOpenCrisis,
  onSignIn,
}) => {
  // Stage in journal conversation
  // 1: Writing entry & location
  // 2: Clarifying question received from Gemini, user writing answer
  // 3: Complete analysis, suggestions, saved to Firestore
  const [stage, setStage] = useState<'write' | 'clarify' | 'saved'>('write');

  // Input states
  const [journalText, setJournalText] = useState('');
  const [location, setLocation] = useState<LocationMetadata>({
    placeName: 'Home Haven',
    placeCategory: 'home',
    city: 'Local Area',
  });
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  // Step 2 Clarify response from Gemini
  const [acknowledgement, setAcknowledgement] = useState('');
  const [clarifyingQuestion, setClarifyingQuestion] = useState('');
  const [emotionResponse, setEmotionResponse] = useState('');

  // Step 3 Analysis results
  const [savedEntry, setSavedEntry] = useState<JournalEntry | null>(null);
  const [selectedSticker, setSelectedSticker] = useState<AnimeSticker | null>(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  // Status & loading states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingSavePayload, setPendingSavePayload] = useState<JournalEntry | null>(null);
  const [isSavedLocallyOnly, setIsSavedLocallyOnly] = useState(false);

  // Auto-detect location on mount if permitted
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.permissions?.query({ name: 'geolocation' as PermissionName }).then((result) => {
        if (result.state === 'granted') {
          detectLocation();
        }
      }).catch(() => {
        // Permissions query optional catch
      });
    }
  }, []);

  const detectLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Pinpointing coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = Math.round(position.coords.accuracy);

        setLocation((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          accuracy: acc,
        }));

        try {
          setLocationStatus('Resolving neighborhood context...');
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            {
              headers: { 'Accept-Language': 'en' },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const address = data.address || {};
            const neighborhood = address.neighbourhood || address.suburb || address.quarter || '';
            const city = address.city || address.town || address.village || address.county || '';
            const broadPlace = data.name || neighborhood || city || 'Neighborhood';

            // Heuristic category from place details
            let inferredCategory: LocationMetadata['placeCategory'] = 'urban';
            const rawName = (data.display_name || '').toLowerCase();
            if (rawName.includes('park') || rawName.includes('garden') || rawName.includes('reserve')) {
              inferredCategory = 'park';
            } else if (rawName.includes('cafe') || rawName.includes('coffee') || rawName.includes('bakery')) {
              inferredCategory = 'cafe';
            } else if (rawName.includes('station') || rawName.includes('transit') || rawName.includes('metro')) {
              inferredCategory = 'transit';
            }

            setLocation((prev) => ({
              ...prev,
              latitude: lat,
              longitude: lng,
              accuracy: acc,
              city,
              neighborhood,
              placeName: broadPlace,
              placeCategory: prev.placeCategory === 'home' ? inferredCategory : prev.placeCategory,
            }));
            setLocationStatus(`Located: ${broadPlace}${city ? `, ${city}` : ''}`);
          } else {
            setLocationStatus(`Coordinates logged (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
          }
        } catch {
          setLocationStatus(`Coordinates logged (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('Location access declined. You can enter your spot manually.');
        } else {
          setLocationStatus('Could not reach GPS. Enter your spot manually below.');
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Step 1: Submit entry to Gemini for empathetic acknowledgement + clarifying question
  const handleAskClarifyingQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalText.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/journal/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: journalText,
          location,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect with empathetic companion.');
      }

      const data = await response.json();

      if (data.isCrisisDetected) {
        onOpenCrisis(data.crisisMessage);
      }

      setAcknowledgement(data.acknowledgement);
      setClarifyingQuestion(data.clarifyingQuestion);
      setStage('clarify');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Unable to connect to the companion. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit response to clarifying question, perform emotional analysis, and save to Firestore
  const handleCompleteAnalysisAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emotionResponse.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    // Extract summary of past entries to let Gemini detect location-mood patterns
    const pastSummary = pastEntries.slice(0, 10).map((entry) => ({
      placeName: entry.location?.placeName || 'Unknown location',
      placeCategory: entry.location?.placeCategory || 'general',
      primaryEmotion: entry.primaryEmotion || entry.sentiment,
      moodScore: entry.moodScore ?? 7,
    }));

    try {
      const response = await fetch('/api/journal/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: journalText,
          clarifyingQuestion,
          emotionResponse,
          location,
          pastEntriesSummary: pastSummary,
        }),
      });

      if (!response.ok) {
        throw new Error('Emotional analysis service encountered an issue.');
      }

      const analysis = await response.json();

      if (analysis.isCrisisDetected) {
        onOpenCrisis(analysis.crisisMessage);
      }

      const assignedSticker: AnimeSticker = analysis.sticker || getStickerForEmotion(analysis.primaryEmotion);
      setSelectedSticker(assignedSticker);

      const newEntry: JournalEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: userId || 'anonymous_guest',
        text: journalText,
        clarifyingQuestion,
        emotionResponse,
        sentiment: analysis.sentiment,
        moodScore: analysis.moodScore,
        primaryEmotion: analysis.primaryEmotion as MoodCategory,
        emotionalSummary: analysis.emotionalSummary,
        suggestions: analysis.suggestions || [],
        location,
        locationPatternNote: analysis.locationPatternNote,
        isCrisisDetected: Boolean(analysis.isCrisisDetected),
        sticker: assignedSticker,
        createdAt: new Date().toISOString(),
      };

      setPendingSavePayload(newEntry);

      // Attempt to save (saves to Firestore if authenticated, or safely persists locally for guests)
      try {
        const saveResult = await saveJournalEntry(newEntry);
        const finalEntry: JournalEntry = {
          ...newEntry,
          userId: saveResult.actualUserId,
        };
        setIsSavedLocallyOnly(saveResult.isLocalOnly);
        setSavedEntry(finalEntry);
        onEntrySaved(finalEntry);
        setStage('saved');
      } catch (fsErr) {
        console.warn('Firestore write fallback to local storage:', fsErr);
        saveLocalEntry(newEntry);
        setIsSavedLocallyOnly(true);
        setSavedEntry(newEntry);
        onEntrySaved(newEntry);
        setStage('saved');
      }
    } catch (err: any) {
      console.error('Error analyzing entry:', err);
      setErrorMessage('Could not analyze your reflection. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeSticker = async (newSticker: AnimeSticker) => {
    setSelectedSticker(newSticker);
    if (savedEntry) {
      const updated: JournalEntry = { ...savedEntry, sticker: newSticker };
      setSavedEntry(updated);
      onEntrySaved(updated);
      try {
        await saveJournalEntry(updated);
      } catch {
        saveLocalEntry(updated);
      }
    }
  };

  // Retry save to guarantee transaction completeness
  const handleRetrySave = async () => {
    if (!pendingSavePayload) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const saveResult = await saveJournalEntry(pendingSavePayload);
      const finalEntry: JournalEntry = {
        ...pendingSavePayload,
        userId: saveResult.actualUserId,
      };
      setIsSavedLocallyOnly(saveResult.isLocalOnly);
      setSavedEntry(finalEntry);
      onEntrySaved(finalEntry);
      setStage('saved');
    } catch (err: any) {
      console.error('Retry save failed:', err);
      // Fallback to local storage so user never loses their thoughts
      saveLocalEntry(pendingSavePayload);
      setIsSavedLocallyOnly(true);
      setSavedEntry(pendingSavePayload);
      onEntrySaved(pendingSavePayload);
      setStage('saved');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForNewEntry = () => {
    setJournalText('');
    setEmotionResponse('');
    setAcknowledgement('');
    setClarifyingQuestion('');
    setSavedEntry(null);
    setSelectedSticker(null);
    setShowStickerPicker(false);
    setPendingSavePayload(null);
    setStage('write');
  };

  return (
    <div id="journal-editor-container" className="max-w-3xl mx-auto space-y-6">
      {/* Error / Retry Banner */}
      {errorMessage && (
        <div
          id="journal-error-banner"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {pendingSavePayload && (
            <button
              id="retry-save-btn"
              onClick={handleRetrySave}
              disabled={isLoading}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-medium rounded-full text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Retry Save
            </button>
          )}
        </div>
      )}

      {/* Stage 1: Write Initial Journal Entry & Tag Location */}
      {stage === 'write' && (
        <form onSubmit={handleAskClarifyingQuestion} className="bg-[#FFFDF9] rounded-2xl border border-amber-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-amber-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg select-none">🍥</span>
                <h2 className="text-2xl sm:text-3xl font-serif-natural font-bold text-amber-950">How was your day?</h2>
              </div>
              <p className="text-xs sm:text-sm text-amber-800/80">Your thoughts are safe here. Unpack your moments freely with ninja heart.</p>
            </div>
            <div className="flex items-center gap-2 text-amber-900 bg-amber-100/80 px-3.5 py-1.5 rounded-full border border-amber-300 text-xs font-semibold">
              <span>📍</span>
              <span>{location.placeName || 'Local Spot'}</span>
            </div>
          </div>

          {/* Location Context Pill Bar */}
          <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-900">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span>Geotag Context:</span>
                <span className="font-bold text-amber-950 bg-white px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                  {location.placeName || 'Local Spot'}
                </span>
                {location.city && <span className="text-amber-800/70">({location.city})</span>}
              </div>

              <button
                type="button"
                id="detect-location-btn"
                onClick={detectLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 text-xs text-amber-900 hover:text-amber-950 font-semibold px-3 py-1.5 bg-amber-100 hover:bg-amber-200/70 border border-amber-300 rounded-full transition-colors shadow-2xs"
              >
                <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-orange-600' : 'text-orange-600'}`} />
                {isLocating ? 'Detecting...' : 'Detect GPS'}
              </button>
            </div>

            {locationStatus && <p className="text-[11px] text-amber-800 italic">{locationStatus}</p>}

            {/* Custom Location Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="custom-place-name" className="block text-[11px] font-bold text-amber-900/80 mb-1">
                  Place or Sanctuary Name
                </label>
                <input
                  id="custom-place-name"
                  type="text"
                  value={location.placeName || ''}
                  onChange={(e) => setLocation({ ...location, placeName: e.target.value })}
                  placeholder="e.g., Hidden Leaf Tea Shop, Sunlit Reading Nook"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-amber-300 bg-white text-amber-950 focus:outline-hidden focus:ring-2 focus:ring-orange-400/30 focus:border-orange-500 font-medium"
                />
              </div>

              <div>
                <label htmlFor="custom-place-category" className="block text-[11px] font-bold text-amber-900/80 mb-1">
                  Environment Category
                </label>
                <select
                  id="custom-place-category"
                  value={location.placeCategory || 'home'}
                  onChange={(e) => setLocation({ ...location, placeCategory: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-amber-300 bg-white text-amber-950 focus:outline-hidden focus:ring-2 focus:ring-orange-400/30 focus:border-orange-500 font-medium"
                >
                  {PLACE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Journal Textarea */}
          <div>
            <textarea
              id="journal-entry-textarea"
              rows={7}
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="What happened today? How did your surroundings feel, and what stayed on your mind?..."
              className="w-full p-4 sm:p-5 text-sm text-amber-950 leading-relaxed bg-[#FFFDF9] rounded-xl border border-amber-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-400/30 focus:border-orange-500 transition-all placeholder:text-amber-800/50 resize-y font-normal"
              required
            />
            <div className="flex justify-between items-center text-[11px] text-amber-800/70 mt-1.5 px-1">
              <span>Encrypted & owner-isolated in Firestore subcollections.</span>
              <span>{journalText.length} characters</span>
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-between items-center pt-2 border-t border-amber-100">
            <span className="text-xs font-semibold text-amber-900/70">Ready for reflection?</span>
            <button
              id="submit-journal-step1"
              type="submit"
              disabled={isLoading || !journalText.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 disabled:from-amber-200 disabled:to-amber-300 disabled:text-amber-700 text-white text-xs font-bold rounded-full shadow-xs transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white/90" />
                  Gemini is listening...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-100" />
                  Reflect with Gemini Guide
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Stage 2: Clarifying Question from Gemini */}
      {stage === 'clarify' && (
        <form onSubmit={handleCompleteAnalysisAndSave} className="bg-[#FFFDF9] rounded-2xl border border-amber-200/90 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
          {/* Empathetic Acknowledgement */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-orange-600 font-serif-natural italic text-lg font-bold">
              <span>✦</span>
              <h3>Gemini's Reflection</h3>
            </div>
            <div className="bg-amber-50/70 p-5 rounded-xl border border-amber-300/80 text-amber-950 leading-relaxed relative shadow-2xs">
              <p className="text-sm italic font-serif-natural">"{acknowledgement}"</p>
            </div>
          </div>

          {/* The ONE Clarifying Question */}
          <div className="bg-linear-to-r from-amber-100/90 via-orange-50/80 to-amber-50 p-5 rounded-xl border border-orange-200 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-bold text-amber-900">
              <CornerDownRight className="w-4 h-4 text-orange-600" />
              <span>Clarifying Question about your core emotion:</span>
            </div>
            <p className="text-base font-serif-natural text-amber-950 font-bold leading-relaxed">
              {clarifyingQuestion}
            </p>

            {/* Answer Input */}
            <div className="pt-2">
              <label htmlFor="emotion-response-input" className="block text-xs font-bold text-amber-900 mb-1.5">
                Your Emotional Reflection:
              </label>
              <textarea
                id="emotion-response-input"
                rows={3}
                value={emotionResponse}
                onChange={(e) => setEmotionResponse(e.target.value)}
                placeholder="I felt a sense of calm relief, yet a quiet fatigue from the week..."
                className="w-full p-3.5 text-sm text-amber-950 bg-white rounded-xl border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-orange-400/30 focus:border-orange-500 placeholder:text-amber-800/50 font-normal"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-amber-100">
            <button
              type="button"
              id="back-to-writing-btn"
              onClick={() => setStage('write')}
              className="text-xs text-amber-900 hover:text-amber-950 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors font-medium"
            >
              &larr; Back to edit reflection
            </button>

            <button
              id="complete-analysis-btn"
              type="submit"
              disabled={isLoading || !emotionResponse.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 bg-linear-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 disabled:from-amber-200 disabled:to-amber-300 disabled:text-amber-700 text-white text-xs font-bold rounded-full shadow-xs transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white/90" />
                  Synthesizing environment & anime seal...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white/90" />
                  Analyze, Seal & Save to Firestore
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Stage 3: Saved Confirmation & Insights with Animated Anime/Ghibli Sticker */}
      {stage === 'saved' && savedEntry && (
        <div className="bg-[#FFFDF9] rounded-2xl border-2 border-amber-300/90 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-orange-600 border border-amber-300 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif-natural font-bold text-amber-950">
                  {isSavedLocallyOnly ? 'Reflection Preserved in Local Journal' : 'Reflections Sealed in Firestore'}
                </h3>
                <p className="text-xs text-amber-800/80 font-medium">
                  {isSavedLocallyOnly
                    ? 'Safeguarded in your browser session. Sign in to sync with your private Firestore database.'
                    : `Stored securely in /users/${savedEntry.userId.slice(0, 10)}.../entries`}
                </p>
              </div>
            </div>

            {savedEntry.moodScore && (
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800">Vitality Level</span>
                <p className="text-xl font-serif-natural font-bold text-amber-950">
                  <span className="text-orange-600 font-extrabold">{savedEntry.moodScore}</span> / 10
                </p>
              </div>
            )}
          </div>

          {/* ANIMATED ANIME & GHIBLI STICKER HERO SHOWCASE */}
          {savedEntry.sticker && (
            <div className="bg-linear-to-br from-amber-50 via-orange-50/60 to-yellow-50/80 rounded-2xl border-2 border-dashed border-amber-300 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 shadow-2xs">
              <div className="shrink-0 p-2 bg-white rounded-2xl border border-amber-200 shadow-sm">
                <AnimatedStickerArt id={savedEntry.sticker.id} size="hero" />
              </div>
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-300 text-[10px] font-bold uppercase tracking-wider">
                  <span>🍥</span>
                  <span>Reflection Sticker Seal &bull; {savedEntry.sticker.theme}</span>
                </div>
                <h4 className="text-lg font-serif-natural font-bold text-amber-950 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span>{savedEntry.sticker.name}</span>
                  <span className="text-sm font-medium text-amber-800/80 font-serif-natural">
                    ({savedEntry.sticker.japaneseName})
                  </span>
                </h4>
                <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
                  {savedEntry.sticker.meaning}
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowStickerPicker(!showStickerPicker)}
                    className="inline-flex items-center gap-1.5 text-xs text-orange-700 hover:text-orange-800 font-bold bg-white px-3 py-1.5 rounded-full border border-amber-300 hover:border-orange-400 transition-all shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {showStickerPicker ? 'Close Sticker Tray' : 'Change Sticker Seal'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Sticker Picker Tray */}
          {showStickerPicker && (
            <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-300 shadow-2xs animate-in fade-in duration-200">
              <AnimeStickerPicker
                selectedStickerId={savedEntry.sticker?.id || 'ramen'}
                onSelectSticker={(newStk) => handleChangeSticker(newStk)}
              />
            </div>
          )}

          {/* Sync Prompt if Local Only */}
          {isSavedLocallyOnly && onSignIn && (
            <div className="p-4 bg-amber-100/70 rounded-xl border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-amber-950 font-medium">
                Want to access your reflections across all devices with encrypted Firestore cloud storage?
              </p>
              <button
                type="button"
                onClick={onSignIn}
                className="px-4 py-2 bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold rounded-full shadow-xs whitespace-nowrap transition-all"
              >
                Sign in with Google to Sync
              </button>
            </div>
          )}

          {/* Tone & Emotion Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Tone:</span>
            <span className="px-3 py-1 bg-amber-100 text-amber-950 border border-amber-300 rounded-full text-xs font-bold capitalize">
              {savedEntry.sentiment || 'Reflective'}
            </span>
            {savedEntry.primaryEmotion && (
              <span className="px-3 py-1 bg-orange-100 text-orange-950 border border-orange-300 rounded-full text-xs font-semibold capitalize">
                Emotion: {savedEntry.primaryEmotion}
              </span>
            )}
            <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              {savedEntry.location?.placeName || 'Local'}
            </span>
          </div>

          {/* Emotional Summary */}
          {savedEntry.emotionalSummary && (
            <p className="text-xs sm:text-sm text-amber-950 italic bg-amber-50/50 p-4 rounded-xl border border-amber-200 leading-relaxed font-serif-natural">
              "{savedEntry.emotionalSummary}"
            </p>
          )}

          {/* Environment-Tailored Suggestions */}
          {savedEntry.suggestions && savedEntry.suggestions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-amber-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-orange-500" />
                Actionable Steps for {savedEntry.location?.placeName || 'Your Environment'}
              </h4>
              <div className="flex flex-col gap-2">
                {savedEntry.suggestions.map((sug, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-dashed border-amber-300 text-xs text-amber-950 shadow-2xs"
                  >
                    <span className="w-6 h-6 flex items-center justify-center bg-linear-to-tr from-orange-600 to-amber-500 text-white rounded-full text-[11px] font-bold shrink-0 shadow-2xs">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-amber-950">{sug}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location-Mood Pattern Reflection */}
          {savedEntry.locationPatternNote && (
            <div className="p-4 bg-amber-100/60 rounded-xl border border-amber-300 text-xs text-amber-950 flex items-start gap-3">
              <div className="text-xl shrink-0 select-none">🍃</div>
              <div>
                <span className="font-bold text-amber-950 block mb-0.5">Location-Mood Insight</span>
                <span className="text-amber-900 leading-relaxed font-medium">{savedEntry.locationPatternNote}</span>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              id="write-another-entry-btn"
              onClick={resetForNewEntry}
              className="px-6 py-2.5 bg-linear-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white text-xs font-bold rounded-full transition-all shadow-xs"
            >
              Write Another Reflection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

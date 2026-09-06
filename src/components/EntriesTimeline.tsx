import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Sparkles,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Heart,
} from 'lucide-react';
import type { JournalEntry } from '../types';
import { deleteJournalEntry } from '../lib/firebase';
import { AnimatedStickerArt, AnimeStickerBadge } from './AnimeStickers';

interface EntriesTimelineProps {
  entries: JournalEntry[];
  userId: string;
  onEntryDeleted: (id: string) => void;
  onSwitchToWrite: () => void;
}

export const EntriesTimeline: React.FC<EntriesTimelineProps> = ({
  entries,
  userId,
  onEntryDeleted,
  onSwitchToWrite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('all');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      (entry.text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.location?.placeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.sentiment || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.sticker?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.sticker?.theme || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEmotion =
      selectedEmotion === 'all' || entry.primaryEmotion === selectedEmotion;

    return matchesSearch && matchesEmotion;
  });

  const handleDelete = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this reflection?')) return;
    setDeletingId(entryId);
    try {
      await deleteJournalEntry(userId, entryId);
      onEntryDeleted(entryId);
    } catch (err) {
      console.error('Failed to delete entry:', err);
      alert('Could not delete entry. Please check your network connection.');
    } finally {
      setDeletingId(null);
    }
  };

  const getMoodColor = (score?: number) => {
    if (!score) return 'bg-amber-100 text-amber-900 border-amber-300';
    if (score >= 8) return 'bg-orange-100 text-orange-950 border-orange-300 font-bold';
    if (score >= 6) return 'bg-amber-100 text-amber-950 border-amber-300 font-semibold';
    return 'bg-rose-100 text-rose-900 border-rose-300';
  };

  return (
    <div id="entries-timeline-container" className="max-w-4xl mx-auto space-y-6">
      {/* Filter and Search Bar */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-amber-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-700" />
          <input
            id="timeline-search-input"
            type="text"
            placeholder="Search words, stickers, places..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-full border border-amber-300 bg-white text-amber-950 focus:outline-hidden focus:ring-2 focus:ring-orange-400/30 focus:border-orange-500 placeholder:text-amber-800/50 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 shrink-0 mr-1">Tone:</span>
          {['all', 'joyful', 'calm', 'reflective', 'anxious', 'fatigued'].map((emo) => (
            <button
              key={emo}
              onClick={() => setSelectedEmotion(emo)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                selectedEmotion === emo
                  ? 'bg-linear-to-r from-orange-600 to-amber-500 text-white shadow-2xs'
                  : 'bg-amber-100/70 text-amber-900 hover:bg-amber-200/70 hover:text-amber-950 border border-amber-200'
              }`}
            >
              {emo}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-[#FFFDF9] rounded-2xl border-2 border-dashed border-amber-300 p-12 text-center space-y-3">
          <div className="text-3xl select-none">🍥</div>
          <h3 className="text-base font-serif-natural font-bold text-amber-950">No reflections found</h3>
          <p className="text-xs text-amber-800/80 max-w-sm mx-auto font-medium">
            {entries.length === 0
              ? 'Your ninja scroll is waiting for its first entry. Unpack your thoughts and seal them with an anime sticker.'
              : 'No reflections match your current search and emotion filters.'}
          </p>
          {entries.length === 0 && (
            <button
              onClick={onSwitchToWrite}
              className="mt-2 px-6 py-2.5 bg-linear-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-full text-xs font-bold transition-all shadow-xs"
            >
              Write First Reflection
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const isExpanded = expandedEntryId === entry.id;
            const dateFormatted = new Date(entry.createdAt).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={entry.id}
                id={`entry-card-${entry.id}`}
                className="bg-[#FFFDF9] rounded-2xl border border-amber-200/90 p-5 sm:p-6 shadow-xs hover:border-orange-400/80 transition-all space-y-4"
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-orange-600" />
                      <span>{dateFormatted}</span>
                    </div>

                    {entry.location?.placeName && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-900 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-300 font-medium">
                        <MapPin className="w-3 h-3 text-orange-600" />
                        {entry.location.placeName}
                        {entry.location.city ? `, ${entry.location.city}` : ''}
                      </span>
                    )}

                    {/* Anime Sticker Badge */}
                    {entry.sticker && (
                      <AnimeStickerBadge sticker={entry.sticker} />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Vitality score */}
                    {typeof entry.moodScore === 'number' && (
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getMoodColor(
                          entry.moodScore
                        )}`}
                      >
                        Vitality: {entry.moodScore}/10
                      </span>
                    )}

                    {/* Emotion badge */}
                    {entry.primaryEmotion && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 font-bold capitalize">
                        {entry.primaryEmotion}
                      </span>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className="p-1.5 text-amber-700 hover:text-rose-700 rounded-full hover:bg-rose-50 transition-colors"
                      title="Delete reflection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main text and Sticker Art side-by-side */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {entry.sticker && (
                    <div className="shrink-0 p-2 bg-white rounded-xl border border-amber-200/80 shadow-2xs">
                      <AnimatedStickerArt id={entry.sticker.id} size="md" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-amber-950 italic leading-relaxed whitespace-pre-wrap font-serif-natural">
                      "{entry.text}"
                    </p>
                  </div>
                </div>

                {/* Sentiment summary */}
                {entry.sentiment && (
                  <div className="text-xs text-amber-950 bg-amber-50/70 p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span className="font-bold text-amber-950">Tone:</span>
                    <span className="capitalize font-semibold text-orange-700">{entry.sentiment}</span>
                    {entry.emotionalSummary && (
                      <span className="text-amber-800 truncate hidden md:inline">— {entry.emotionalSummary}</span>
                    )}
                  </div>
                )}

                {/* Collapsible conversation details & suggestions */}
                <div className="pt-1">
                  <button
                    onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" /> Hide Dialogue & Steps
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" /> View Dialogue & Ninja Steps
                      </>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-amber-100 space-y-3 animate-in fade-in duration-150">
                      {/* Clarifying Dialogue */}
                      {entry.clarifyingQuestion && (
                        <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2 text-xs">
                          <p className="font-bold text-amber-950">
                            Gemini Question: <span className="font-serif-natural text-sm font-normal text-amber-900">{entry.clarifyingQuestion}</span>
                          </p>
                          {entry.emotionResponse && (
                            <p className="font-bold text-orange-600">
                              Your Answer: <span className="font-normal text-amber-950 italic">"{entry.emotionResponse}"</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Suggestions */}
                      {entry.suggestions && entry.suggestions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-wider font-bold text-amber-800 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-orange-500" />
                            Tailored steps for {entry.location?.placeName || 'location'}:
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {entry.suggestions.map((sug, i) => (
                              <div key={i} className="text-xs text-amber-950 bg-white p-3 rounded-lg border border-dashed border-amber-300 flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-linear-to-r from-orange-600 to-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                                  {i + 1}
                                </span>
                                <span className="font-medium">{sug}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Location Pattern Note */}
                      {entry.locationPatternNote && (
                        <div className="text-[11px] text-amber-900 bg-amber-100/60 p-3 rounded-xl border border-amber-300 flex items-start gap-2">
                          <span className="text-sm select-none">🍃</span>
                          <span>{entry.locationPatternNote}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

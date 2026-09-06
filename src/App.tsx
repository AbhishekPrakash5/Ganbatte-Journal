/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { JournalEditor } from './components/JournalEditor';
import { EntriesTimeline } from './components/EntriesTimeline';
import { EntriesMap } from './components/EntriesMap';
import { LocationMoodPatterns } from './components/LocationMoodPatterns';
import { CrisisModal } from './components/CrisisModal';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  subscribeToUserEntries,
  testFirestoreConnection,
  autoSignInAnonymous,
  getLocalEntries,
  syncLocalEntriesToFirestore,
  type User,
} from './lib/firebase';
import type { JournalEntry } from './types';
import { BookHeart, Sparkles, MapPin, Compass } from 'lucide-react';

const SAMPLE_ENTRIES: JournalEntry[] = [
  {
    id: 'sample_1',
    userId: 'demo_user',
    text: 'Spent an hour walking through the park under the late afternoon sunlight. The rustle of pine trees and gentle breeze felt like an instant weight lifted off my shoulders.',
    clarifyingQuestion: 'What core emotion did that walk through the trees awaken in you?',
    emotionResponse: 'A deep sense of relief and spacious joy that I had been craving all week.',
    sentiment: 'Bright & Grounded',
    moodScore: 9,
    primaryEmotion: 'joyful',
    emotionalSummary: 'Connecting with outdoor natural spaces catalyzed an immediate transition from stress to restorative vitality.',
    suggestions: [
      'Take 3 deep breaths of crisp outdoor air before transitioning back to work',
      'Hydrate with cool water and carry this stillness into your evening',
      'Pause for 60 seconds of gentle neck and shoulder releases',
    ],
    location: {
      latitude: 37.7715,
      longitude: -122.4686,
      accuracy: 10,
      placeName: 'Golden Gate Park Conservatory',
      placeCategory: 'park',
      neighborhood: 'Golden Gate Park',
      city: 'San Francisco',
    },
    locationPatternNote: 'You tend to feel significantly more energetic and joyful when journaling near green park locations.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'sample_2',
    userId: 'demo_user',
    text: 'Tucked away at a quiet wooden table in the neighborhood cafe. Sip of hot dark roast and people-watching while sketching thoughts.',
    clarifyingQuestion: 'When you listened to the ambient chatter, how did your inner world respond?',
    emotionResponse: 'I felt peacefully anchored, not rushed or pressured by deadlines.',
    sentiment: 'Serene & Mindful',
    moodScore: 8,
    primaryEmotion: 'calm',
    emotionalSummary: 'The ambient third-space environment provided a supportive rhythm for mindful contemplation.',
    suggestions: [
      'Savor the warmth of your mug with both hands for 30 seconds',
      'Write down one intention for the rest of your day',
      'Keep your pace steady as you prepare to step back outside',
    ],
    location: {
      latitude: 37.7564,
      longitude: -122.4214,
      accuracy: 15,
      placeName: 'Ritual Coffee Corner',
      placeCategory: 'cafe',
      neighborhood: 'Mission District',
      city: 'San Francisco',
    },
    locationPatternNote: 'Cafes provide a dependable anchor for your reflective flow and focus.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'sample_3',
    userId: 'demo_user',
    text: 'Heavy mental fatigue after six hours of continuous meetings. My eyes were burning, but I lit a honey beeswax candle in my living room.',
    clarifyingQuestion: 'Looking beneath the mental tiredness, what was your body asking for?',
    emotionResponse: 'Gentle permission to stop producing and simply rest without guilt.',
    sentiment: 'Gentle Fatigue & Acceptance',
    moodScore: 5,
    primaryEmotion: 'fatigued',
    emotionalSummary: 'Acknowledging honest exhaustion is the first vital step in resetting personal boundaries.',
    suggestions: [
      'Dim overhead lights and switch to warm, low-level illumination',
      'Lie flat on the floor for 5 minutes with legs elevated on the sofa',
      'Drink a warm mug of chamomile or peppermint tea',
    ],
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 5,
      placeName: 'Home Haven Living Room',
      placeCategory: 'home',
      neighborhood: 'Hayes Valley',
      city: 'San Francisco',
    },
    locationPatternNote: 'Your home reflections trend toward honest decompression and recovery.',
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDemoUser, setIsDemoUser] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>(SAMPLE_ENTRIES);
  const [activeTab, setActiveTab] = useState<'write' | 'timeline' | 'map' | 'patterns'>('write');

  // Crisis Modal State
  const [isCrisisOpen, setIsCrisisOpen] = useState(false);
  const [crisisMessage, setCrisisMessage] = useState<string | undefined>(undefined);

  // Firestore status
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);

  // Auth observer & initial connection test
  useEffect(() => {
    testFirestoreConnection().then((ok) => setIsDbConnected(ok));

    // Try anonymous authentication for seamless cloud persistence when permitted
    autoSignInAnonymous();

    // Check for any locally saved journal entries from prior offline or guest sessions
    const local = getLocalEntries();
    if (local.length > 0) {
      setEntries((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const filtered = local.filter((e) => !existingIds.has(e.id));
        return [...filtered, ...prev];
      });
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsDemoUser(false);
        // If user signed into a real account, sync any pending local reflections to their Firestore
        if (!user.isAnonymous) {
          syncLocalEntriesToFirestore(user.uid).then((synced) => {
            if (synced > 0) {
              console.log(`Successfully synced ${synced} reflections to Cloud Firestore.`);
            }
          });
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore updates when signed in
  useEffect(() => {
    if (!currentUser) {
      if (isDemoUser && entries.length === 0) {
        setEntries(SAMPLE_ENTRIES);
      }
      return;
    }

    const unsubscribe = subscribeToUserEntries(
      currentUser.uid,
      (userEntries) => {
        setEntries(userEntries);
      },
      (error) => {
        console.warn('Firestore subscription notice:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isDemoUser]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      // If popup blocked or iframe issue, notify user gracefully
      if (err?.code === 'auth/popup-blocked') {
        alert('Popup was blocked by your browser. Please allow popups or use preview mode.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        // User closed popup
      } else {
        alert(`Google Sign-In: ${err?.message || 'Please try again.'}`);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsDemoUser(true);
      setEntries(SAMPLE_ENTRIES);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const handleToggleDemoMode = () => {
    if (currentUser) {
      handleSignOut();
    } else {
      setIsDemoUser((prev) => !prev);
      if (!isDemoUser) {
        setEntries(SAMPLE_ENTRIES);
      } else {
        setEntries([]);
      }
    }
  };

  const handleEntrySaved = (newEntry: JournalEntry) => {
    setEntries((prev) => [newEntry, ...prev.filter((e) => e.id !== newEntry.id)]);
  };

  const handleEntryDeleted = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleOpenCrisis = (message?: string) => {
    setCrisisMessage(message);
    setIsCrisisOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCFB] text-[#3E3833] selection:bg-[#EDE9E1] selection:text-[#3E3833]">
      {/* Header */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenCrisis={() => handleOpenCrisis()}
        isDemoUser={isDemoUser && !currentUser}
        onToggleDemoMode={handleToggleDemoMode}
        entryCount={entries.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'write' && (
          <JournalEditor
            userId={currentUser?.uid || (isDemoUser ? 'demo_user' : 'guest')}
            pastEntries={entries}
            onEntrySaved={handleEntrySaved}
            onOpenCrisis={handleOpenCrisis}
            onSignIn={handleSignIn}
          />
        )}

        {activeTab === 'timeline' && (
          <EntriesTimeline
            entries={entries}
            userId={currentUser?.uid || (isDemoUser ? 'demo_user' : 'guest')}
            onEntryDeleted={handleEntryDeleted}
            onSwitchToWrite={() => setActiveTab('write')}
          />
        )}

        {activeTab === 'map' && (
          <EntriesMap
            entries={entries}
            onSelectEntry={(entry) => {
              setActiveTab('timeline');
            }}
          />
        )}

        {activeTab === 'patterns' && (
          <LocationMoodPatterns
            entries={entries}
            onSwitchToWrite={() => setActiveTab('write')}
          />
        )}
      </main>

      {/* Warm Amber Theme Footer */}
      <footer className="border-t border-amber-200/90 bg-[#FFFDF9] py-6 text-xs text-amber-800/80">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 font-medium text-amber-950">
            <div className="w-7 h-7 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs shadow-xs">
              <span>🍥</span>
            </div>
            <span className="font-serif-natural italic text-base font-bold">Ganbatte Journal</span>
            <span className="text-amber-300">&bull;</span>
            <span className="text-amber-800/80 text-xs font-medium">Mindful paths & emotional sanctuary</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800/70">Chakra Rhythm</span>
              <div className="flex items-end gap-1 h-5">
                <div className="w-1.5 h-3 bg-orange-500 rounded-full" title="Vitality"></div>
                <div className="w-1.5 h-2 bg-amber-200 rounded-full"></div>
                <div className="w-1.5 h-4 bg-amber-500 rounded-full" title="Calm"></div>
                <div className="w-1.5 h-2.5 bg-amber-200 rounded-full"></div>
                <div className="w-1.5 h-3.5 bg-orange-600 rounded-full" title="Reflective"></div>
                <div className="w-1.5 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-amber-900">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100/70 rounded-full border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>Isolated Firestore Subcollection</span>
              </span>
              <button
                onClick={() => handleOpenCrisis()}
                className="text-rose-700 hover:text-rose-800 hover:underline font-bold"
              >
                Crisis Helplines (988)
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Emergency Crisis Modal */}
      <CrisisModal
        isOpen={isCrisisOpen}
        onClose={() => setIsCrisisOpen(false)}
        crisisMessage={crisisMessage}
      />
    </div>
  );
}

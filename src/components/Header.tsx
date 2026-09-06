import React from 'react';
import { BookHeart, MapPin, Sparkles, Clock, Compass, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import type { User } from '../lib/firebase';

interface HeaderProps {
  currentUser: User | null;
  activeTab: 'write' | 'timeline' | 'map' | 'patterns';
  setActiveTab: (tab: 'write' | 'timeline' | 'map' | 'patterns') => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenCrisis: () => void;
  isDemoUser: boolean;
  onToggleDemoMode: () => void;
  entryCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onSignIn,
  onSignOut,
  onOpenCrisis,
  isDemoUser,
  onToggleDemoMode,
  entryCount,
}) => {
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header id="app-header" className="border-b border-amber-200/90 bg-[#FFFDF9]/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-linear-to-tr from-amber-500 via-orange-500 to-amber-400 rounded-2xl flex items-center justify-center text-white shadow-md shadow-orange-500/20 border border-orange-300">
              <span className="text-2xl select-none filter drop-shadow-xs">🍥</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-serif-natural italic font-bold tracking-tight text-amber-950">
                  Ganbatte Journal
                </h1>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-100/80 rounded-full border border-amber-300">
                  <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Ichiraku Ramen</span>
                </div>
              </div>
              <p className="text-xs text-amber-800/80 font-medium">Empathetic diary, anime reflection seals & geotagged sanctuary</p>
            </div>
          </div>

          {/* Mobile Helpline Quick Button */}
          <button
            onClick={onOpenCrisis}
            className="md:hidden p-2 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors border border-rose-200"
            title="Emergency Support & Helplines"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>

        {/* Right side date, auth & actions */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          <span className="hidden lg:inline text-xs font-semibold text-amber-900/70">{todayFormatted}</span>

          {/* Emergency Support Link */}
          <button
            id="header-crisis-btn"
            onClick={onOpenCrisis}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 rounded-full transition-colors shadow-2xs"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Support Helplines (988)
          </button>

          {/* User Profile / Auth State */}
          {currentUser ? (
            <div className="flex items-center gap-2.5 bg-amber-50/90 border border-amber-300 px-3.5 py-1.5 rounded-full shadow-2xs">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User profile'}
                  className="w-6 h-6 rounded-full object-cover border border-amber-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center font-bold">
                  {currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-amber-950 leading-tight truncate max-w-[120px]">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-amber-700 font-medium">{entryCount} reflections</p>
              </div>
              <button
                id="sign-out-btn"
                onClick={onSignOut}
                className="ml-1 p-1 text-amber-700 hover:text-amber-950 hover:bg-amber-200/70 rounded-full transition-colors"
                title="Sign out of Firebase"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="google-signin-btn"
                onClick={onSignIn}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-full shadow-xs transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-white" />
                Sign in with Google
              </button>
              <button
                id="demo-mode-toggle"
                onClick={onToggleDemoMode}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                  isDemoUser
                    ? 'bg-amber-200/80 text-amber-950 border-amber-400'
                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                }`}
                title="Preview sample journal without signing in"
              >
                {isDemoUser ? 'Sample Journal' : 'Guest Preview'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none border-t border-amber-200/60" aria-label="Tabs">
          <button
            id="tab-write"
            onClick={() => setActiveTab('write')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap ${
              activeTab === 'write'
                ? 'bg-linear-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-xs'
                : 'text-amber-900/80 hover:text-amber-950 hover:bg-amber-100/70 font-semibold'
            }`}
          >
            <BookHeart className="w-3.5 h-3.5" />
            Write Today
          </button>

          <button
            id="tab-timeline"
            onClick={() => setActiveTab('timeline')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'bg-linear-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-xs'
                : 'text-amber-900/80 hover:text-amber-950 hover:bg-amber-100/70 font-semibold'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Timeline & Seals ({entryCount})
          </button>

          <button
            id="tab-map"
            onClick={() => setActiveTab('map')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap ${
              activeTab === 'map'
                ? 'bg-linear-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-xs'
                : 'text-amber-900/80 hover:text-amber-950 hover:bg-amber-100/70 font-semibold'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Geotagged Mood Map
          </button>

          <button
            id="tab-patterns"
            onClick={() => setActiveTab('patterns')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap ${
              activeTab === 'patterns'
                ? 'bg-linear-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-xs'
                : 'text-amber-900/80 hover:text-amber-950 hover:bg-amber-100/70 font-semibold'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Location & Mood Patterns
          </button>
        </nav>
      </div>
    </header>
  );
};

import React from 'react';
import { ActivePage, UserProfile, NotificationItem } from '../types';
import { Bell, Moon, Sun, BookOpen, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  userProfile: UserProfile;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenPricing: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  userProfile,
  notifications,
  onOpenNotifications,
  onOpenProfile,
  onOpenPricing,
  isDarkMode: propIsDarkMode,
  onToggleDarkMode: propOnToggleDarkMode,
}) => {
  const themeContext = useTheme();
  const isDark = propIsDarkMode !== undefined ? propIsDarkMode : themeContext.isDarkMode;
  const toggleTheme = propOnToggleDarkMode || themeContext.toggleDarkMode;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-left group min-w-0 cursor-pointer"
            aria-label="StudyFlow Home"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-emerald-700 transition-colors shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white truncate">
              StudyFlow
            </span>
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-300">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`transition-colors hover:text-neutral-900 dark:hover:text-white ${
              activePage === 'dashboard'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : ''
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('timetable')}
            className={`transition-colors hover:text-neutral-900 dark:hover:text-white ${
              activePage === 'timetable'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : ''
            }`}
          >
            Timetable
          </button>
          <button
            onClick={() => onNavigate('create-plan')}
            className={`transition-colors hover:text-neutral-900 dark:hover:text-white ${
              activePage === 'create-plan'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : ''
            }`}
          >
            Create Plan
          </button>
          <button
            onClick={() => onNavigate('progress')}
            className={`transition-colors hover:text-neutral-900 dark:hover:text-white ${
              activePage === 'progress'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : ''
            }`}
          >
            Progress
          </button>
          <button
            onClick={() => onNavigate('practice')}
            className={`transition-colors hover:text-neutral-900 dark:hover:text-white ${
              activePage === 'practice'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : ''
            }`}
          >
            Practice Scores
          </button>
          <button
            onClick={() => onNavigate('pricing')}
            className={`transition-colors hover:text-neutral-900 dark:hover:text-white ${
              activePage === 'pricing'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : ''
            }`}
          >
            Pricing
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions + functional controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            )}
          </button>

          {/* Notifications button with unread count */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 sm:p-2.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Study Reminders & Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900" />
            )}
          </button>

          {/* Upgrade / Tier badge button */}
          {userProfile.tier === 'free' ? (
            <button
              onClick={onOpenPricing}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/80 transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Go Premium</span>
            </button>
          ) : (
            <span className="hidden sm:inline-block text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 px-2 py-1">
              PRO
            </span>
          )}

          {/* Student Profile Avatar */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1 pl-1.5 sm:pl-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors"
            title="Student Profile & Settings"
            aria-label="Student Profile"
          >
            <span className="hidden lg:inline text-xs font-medium text-neutral-700 dark:text-neutral-200 max-w-[100px] truncate">
              {userProfile.name.split(' ')[0]}
            </span>
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-7 h-7 rounded-full object-cover bg-neutral-200 dark:bg-neutral-700 shrink-0"
            />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center px-2 py-1.5 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-900/70 overflow-x-auto gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 justify-start sm:justify-around">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`px-3 py-1 rounded-md shrink-0 transition-colors ${activePage === 'dashboard' ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold' : 'hover:text-neutral-900 dark:hover:text-white'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onNavigate('timetable')}
          className={`px-3 py-1 rounded-md shrink-0 transition-colors ${activePage === 'timetable' ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold' : 'hover:text-neutral-900 dark:hover:text-white'}`}
        >
          Timetable
        </button>
        <button
          onClick={() => onNavigate('create-plan')}
          className={`px-3 py-1 rounded-md shrink-0 transition-colors ${activePage === 'create-plan' ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold' : 'hover:text-neutral-900 dark:hover:text-white'}`}
        >
          Create Plan
        </button>
        <button
          onClick={() => onNavigate('progress')}
          className={`px-3 py-1 rounded-md shrink-0 transition-colors ${activePage === 'progress' ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold' : 'hover:text-neutral-900 dark:hover:text-white'}`}
        >
          Progress
        </button>
        <button
          onClick={() => onNavigate('practice')}
          className={`px-3 py-1 rounded-md shrink-0 transition-colors ${activePage === 'practice' ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold' : 'hover:text-neutral-900 dark:hover:text-white'}`}
        >
          Scores
        </button>
        <button
          onClick={() => onNavigate('pricing')}
          className={`px-3 py-1 rounded-md shrink-0 transition-colors ${activePage === 'pricing' ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold' : 'hover:text-neutral-900 dark:hover:text-white'}`}
        >
          Pricing
        </button>
      </div>
    </header>
  );
};

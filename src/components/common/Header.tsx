import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CrackScoreGauge } from './CrackScoreGauge';
import { StreakFlame } from './StreakFlame';
import { NotificationDropdown } from './NotificationDropdown';
import {
  Search,
  Mic,
  Moon,
  Sun,
  Bell,
  Sparkles,
  BookOpen,
  ChevronDown,
  Zap,
  Menu,
} from 'lucide-react';

export const Header: React.FC<{ onOpenMobileMenu?: () => void }> = ({ onOpenMobileMenu }) => {
  const {
    user,
    theme,
    toggleTheme,
    crackScore,
    subjects,
    activeSubject,
    setActiveSubject,
    setGlobalSearchOpen,
    setVoiceAssistantOpen,
    notifications,
    toggleCrackMode,
    setActiveTab,
  } = useApp();

  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 dark:bg-[#161922]/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 flex items-center justify-between gap-4 transition-colors duration-150">
      {/* Left: Mobile hamburger & Greeting / Subject Selector */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
        >
          <Menu size={20} />
        </button>

        {/* Mobile brand text */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-lg flex items-center justify-center font-bold text-sm">
            CS
          </div>
          <span className="font-bold text-sm text-gray-900 dark:text-white font-heading">
            CrackSkull
          </span>
        </div>

        {/* Desktop Active Subject Selector */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setSubjectDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-50 dark:bg-[#1A1D27] border border-gray-200 dark:border-gray-700/80 hover:border-gray-400 dark:hover:border-gray-600 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-all shadow-xs"
          >
            <BookOpen size={14} className="text-gray-500 dark:text-gray-400" />
            <span className="max-w-[200px] truncate">
              {activeSubject?.name || 'All Subjects'}
            </span>
            <ChevronDown size={13} className="text-gray-400" />
          </button>

          {subjectDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#1A1D27] border border-gray-200 dark:border-gray-700 shadow-xl p-2 z-50 space-y-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase px-3 py-1.5 tracking-wider">
                Select Active Subject
              </div>
              {subjects.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setActiveSubject(sub);
                    setSubjectDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                    activeSubject?.id === sub.id
                      ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800/80 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-semibold">{sub.name}</div>
                    <div className="text-[10px] opacity-70 font-mono">{sub.code} • Exam: {sub.examDate || 'TBD'}</div>
                  </div>
                  <span className={`text-xs font-mono font-bold ${activeSubject?.id === sub.id ? 'opacity-90' : 'text-blue-600 dark:text-blue-400'}`}>
                    {sub.masteryPercentage}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Search trigger */}
      <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-auto">
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-full bg-gray-50 dark:bg-[#1A1D27] border border-gray-200 dark:border-gray-700/80 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-600 transition-all shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-gray-400" />
            <span>Search topics, notes, questions...</span>
          </div>
          <kbd className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded font-mono text-gray-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Quick actions, Crack Score, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Crack Mode quick badge */}
        <button
          onClick={toggleCrackMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            user.isCrackModeActive
              ? 'bg-orange-500 text-white shadow-xs'
              : 'bg-gray-50 dark:bg-[#1A1D27] border border-gray-200 dark:border-gray-700/80 text-gray-700 dark:text-gray-300 hover:border-orange-400'
          }`}
          title="Toggle High-Yield Crack Mode"
        >
          <Zap size={13} className={user.isCrackModeActive ? 'fill-white' : 'text-orange-500'} />
          <span className="hidden sm:inline">
            {user.isCrackModeActive ? 'CRACK MODE ON' : 'CRACK MODE'}
          </span>
        </button>

        {/* Compact Crack Score dial */}
        <div onClick={() => setActiveTab('dashboard')} className="cursor-pointer">
          <CrackScoreGauge crackScore={crackScore} compact />
        </div>

        {/* Streak Flame */}
        <div className="hidden sm:block">
          <StreakFlame streakDays={user.streakDays} size="sm" />
        </div>

        {/* Voice Assistant Mic Button */}
        <button
          onClick={() => setVoiceAssistantOpen(true)}
          className="p-2 rounded-full bg-gray-50 dark:bg-[#1A1D27] border border-gray-200 dark:border-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-xs"
          title="Multilingual Voice AI Assistant"
        >
          <Mic size={15} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifDropdownOpen(prev => !prev)}
            className="relative p-2 rounded-full bg-gray-50 dark:bg-[#1A1D27] border border-gray-200 dark:border-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shadow-xs"
            title="Notifications"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-gray-900" />
            )}
          </button>

          {notifDropdownOpen && (
            <NotificationDropdown onClose={() => setNotifDropdownOpen(false)} />
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-50 dark:bg-[#1A1D27] border border-gray-200 dark:border-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shadow-xs"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-gray-600" />}
        </button>

        {/* Profile Avatar */}
        <button
          onClick={() => setActiveTab('profile')}
          className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold hover:opacity-85 transition-opacity shadow-xs"
          title="Student Profile"
        >
          {user.name.slice(0, 2).toUpperCase()}
        </button>
      </div>
    </header>
  );
};

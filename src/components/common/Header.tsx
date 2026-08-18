import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CrackScoreGauge } from './CrackScoreGauge';
import { StreakFlame } from './StreakFlame';
import { NotificationDropdown } from './NotificationDropdown';
import { getNavigationItem } from './navigationConfig';
import {
  Bell,
  BookOpen,
  ChevronDown,
  Download,
  Menu,
  Mic,
  Moon,
  Search,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

export const Header: React.FC<{ onOpenMobileMenu?: () => void }> = ({ onOpenMobileMenu }) => {
  const {
    user,
    theme,
    toggleTheme,
    crackScore,
    subjects,
    activeSubject,
    setActiveSubject,
    activeTab,
    setGlobalSearchOpen,
    setVoiceAssistantOpen,
    notifications,
    toggleCrackMode,
    setActiveTab,
  } = useApp();

  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const { installApp, isStandalone, showIosHelp, setShowIosHelp } = useInstallPrompt();

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const activeItem = getNavigationItem(activeTab);

  return (
    <header className="app-header sticky top-0 z-20 flex min-h-16 max-w-full items-center justify-between gap-2 overflow-visible px-2.5 py-2 sm:px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="icon-button lg:hidden"
          title="Open navigation"
        >
          <Menu size={20} />
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex min-w-0 items-center gap-2 lg:hidden"
          title="CrackSkull AI"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gray-950 text-sm font-black text-white dark:bg-white dark:text-gray-950">
            CS
          </div>
          <span className="truncate font-heading text-sm font-black text-gray-950 dark:text-white">
            CrackSkull
          </span>
        </button>

        <div className="hidden min-w-0 lg:block">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--app-text-subtle)]">
            <Sparkles size={13} className="text-teal-600 dark:text-teal-300" />
            Active workspace
          </div>
          <div className="mt-0.5 flex min-w-0 items-center gap-2">
            <span className="text-[var(--app-text-subtle)]">{activeItem.icon}</span>
            <span className="truncate font-heading text-sm font-black text-[var(--app-text)]">
              {activeItem.label}
            </span>
            <span className="hidden max-w-[22rem] truncate text-xs font-medium text-[var(--app-text-muted)] xl:block">
              {activeItem.subtitle}
            </span>
          </div>
        </div>

        <div className="relative hidden md:block">
          <button
            onClick={() => setSubjectDropdownOpen(prev => !prev)}
            className="secondary-action px-3 py-2 text-xs"
          >
            <BookOpen size={14} className="text-teal-700 dark:text-teal-300" />
            <span className="max-w-[12rem] truncate">
              {activeSubject?.name || 'All Subjects'}
            </span>
            <ChevronDown size={13} className="text-[var(--app-text-subtle)]" />
          </button>

          {subjectDropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-2 shadow-2xl">
              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--app-text-subtle)]">
                Select active subject
              </div>
              {subjects.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setActiveSubject(sub);
                    setSubjectDropdownOpen(false);
                  }}
                  className={`command-row mb-1 last:mb-0 ${
                    activeSubject?.id === sub.id ? 'border-gray-950 dark:border-white' : ''
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-black">{sub.name}</span>
                    <span className="block truncate font-mono text-[10px] text-[var(--app-text-subtle)]">
                      {sub.code} | Exam: {sub.examDate || 'TBD'}
                    </span>
                  </span>
                  <span className="font-mono text-xs font-black text-teal-700 dark:text-teal-300">
                    {sub.masteryPercentage}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="hidden flex-1 items-center justify-center px-4 md:flex">
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="toolbar-button w-full max-w-xl justify-between rounded-xl px-3.5 py-2 text-xs"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Search size={15} />
            <span className="truncate">Search notes, commands, quizzes, and topics</span>
          </span>
          <kbd className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--app-text-subtle)]">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          onClick={toggleCrackMode}
          className={`hidden items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition-colors min-[390px]:flex ${
            user.isCrackModeActive
              ? 'bg-orange-500 text-white'
              : 'border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text)] hover:border-orange-300'
          }`}
          title="Toggle Crack Mode"
        >
          <Zap size={14} className={user.isCrackModeActive ? 'fill-white' : 'text-orange-500'} />
          <span className="hidden sm:inline">{user.isCrackModeActive ? 'Sprint On' : 'Crack Mode'}</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className="hidden min-[430px]:block"
          title="Open dashboard"
        >
          <CrackScoreGauge crackScore={crackScore} compact />
        </button>

        <div className="hidden sm:block">
          <StreakFlame streakDays={user.streakDays} size="sm" />
        </div>

        {!isStandalone && (
          <button
            onClick={installApp}
            className="icon-button"
            title="Install app"
          >
            <Download size={15} />
          </button>
        )}

        <button
          onClick={() => setVoiceAssistantOpen(true)}
          className="icon-button"
          title="Voice assistant"
        >
          <Mic size={15} />
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifDropdownOpen(prev => !prev)}
            className="icon-button relative"
            title="Notifications"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-gray-950" />
            )}
          </button>

          {notifDropdownOpen && (
            <NotificationDropdown onClose={() => setNotifDropdownOpen(false)} />
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="icon-button"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className="grid h-9 w-9 place-items-center rounded-xl bg-gray-950 text-xs font-black text-white shadow-sm transition-opacity hover:opacity-85 dark:bg-white dark:text-gray-950"
          title="Student profile"
        >
          {user.name.slice(0, 2).toUpperCase()}
        </button>
      </div>

      {showIosHelp && (
        <div className="ios-install-panel p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-black">Install on iPhone</div>
              <div className="mt-1 text-xs leading-relaxed text-slate-300">
                Open this site in Safari, tap Share, then choose Add to Home Screen.
              </div>
            </div>
            <button
              onClick={() => setShowIosHelp(false)}
              className="rounded-lg bg-white/10 px-2 py-1 text-xs font-bold text-white"
            >
              Close
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-slate-200">
            <div className="rounded-xl bg-white/10 p-2">Safari</div>
            <div className="rounded-xl bg-white/10 p-2">Share</div>
            <div className="rounded-xl bg-white/10 p-2">Add</div>
          </div>
        </div>
      )}
    </header>
  );
};

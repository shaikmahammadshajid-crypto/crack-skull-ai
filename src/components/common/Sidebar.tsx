import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import { StreakFlame } from './StreakFlame';
import {
  LayoutDashboard,
  Bot,
  CalendarCheck,
  Radar,
  FileText,
  HelpCircle,
  Mic,
  Layers,
  Clock,
  BookOpen,
  BarChart3,
  Calendar,
  Network,
  User,
  Shield,
  Zap,
  Search,
  Settings,
  Calculator,
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<{ collapsed?: boolean; onToggleCollapse?: () => void }> = () => {
  const {
    activeTab,
    setActiveTab,
    user,
    toggleCrackMode,
    setGlobalSearchOpen,
    setVoiceAssistantOpen,
    setSettingsOpen,
    setAdminOpen,
  } = useApp();

  const mainNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Home Assistant', icon: <LayoutDashboard size={19} /> },
    { id: 'ai-tutor', label: 'AI Agents Copilot', icon: <Bot size={19} />, badge: '13 Modes', badgeColor: 'bg-purple-500/20 text-purple-300' },
    { id: 'math-solver', label: 'Math Solver', icon: <Calculator size={19} />, badge: 'Stepwise', badgeColor: 'bg-cyan-500/20 text-cyan-300' },
    { id: 'study-plan', label: 'Adaptive Study Plan', icon: <CalendarCheck size={19} /> },
    { id: 'exam-radar', label: 'Exam Radar', icon: <Radar size={19} />, badge: 'AI PYQ', badgeColor: 'bg-pink-500/20 text-pink-300' },
    { id: 'document-ai', label: 'PDF Learning Studio', icon: <FileText size={19} /> },
    { id: 'quiz', label: 'AI Quiz & Mock Test', icon: <HelpCircle size={19} /> },
    { id: 'viva', label: 'AI Viva Simulator', icon: <Mic size={19} />, badge: 'Oral', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
    { id: 'flashcards', label: 'Spaced Flashcards', icon: <Layers size={19} /> },
    { id: 'focus-timer', label: 'Focus Pomodoro', icon: <Clock size={19} /> },
    { id: 'knowledge-map', label: 'Knowledge Map', icon: <Network size={19} /> },
    { id: 'library', label: 'Digital Library', icon: <BookOpen size={19} /> },
    { id: 'analytics', label: 'Academic Analytics', icon: <BarChart3 size={19} /> },
    { id: 'calendar', label: 'Exam Calendar', icon: <Calendar size={19} /> },
    { id: 'profile', label: 'Student Profile', icon: <User size={19} /> },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-white dark:bg-[#161922] border-r border-gray-200 dark:border-gray-800 sticky top-0 left-0 z-30 select-none transition-colors duration-150">
      {/* Brand Header */}
      <div className="p-4 px-5 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 text-left group"
        >
          {/* Clean Minimal Brand Mark */}
          <div className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center font-bold text-xl transition-transform group-hover:scale-105 shadow-sm">
            CS
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight font-heading">
                CrackSkull
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-mono">
                AI
              </span>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-400 font-medium tracking-tight">
              Exam Copilot
            </p>
          </div>
        </button>
      </div>

      {/* Quick Search & Voice Bar */}
      <div className="px-3.5 pt-3.5 pb-1.5 flex items-center gap-2">
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-gray-700/80 text-xs text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-600 transition-colors shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-gray-400" />
            <span className="font-normal">Search anything...</span>
          </div>
          <kbd className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded font-mono text-gray-400">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={() => setVoiceAssistantOpen(true)}
          className="p-2 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          title="Voice AI Assistant"
        >
          <Mic size={15} />
        </button>
      </div>

      {/* Signature CRACK MODE Toggle Banner */}
      <div className="px-3.5 py-2">
        <div
          onClick={toggleCrackMode}
          className={`cursor-pointer rounded-2xl p-3 border transition-all duration-200 ${
            user.isCrackModeActive
              ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50 shadow-xs'
              : 'bg-gray-50 dark:bg-[#1A1D27] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap
                size={15}
                className={user.isCrackModeActive ? 'text-orange-500 fill-orange-500' : 'text-gray-400'}
              />
              <span className="text-xs font-bold text-gray-900 dark:text-white tracking-tight">
                Crack Mode
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                user.isCrackModeActive
                  ? 'bg-orange-500 text-white font-mono'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {user.isCrackModeActive ? 'ACTIVE ⚡' : 'OFF'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
            {user.isCrackModeActive
              ? 'Targeting top 90%+ exam probability topics.'
              : '3-day high-yield emergency sprint revision.'}
          </p>
        </div>
      </div>

      {/* Navigation Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        <div className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-400 uppercase px-3 py-1.5">
          Academic Navigation
        </div>
        {mainNavItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                isActive
                  ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-white dark:text-black' : 'text-gray-400 dark:text-gray-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-black/10 dark:text-black'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom User & Settings Footer */}
      <div className="p-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-[#13161F] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold shadow-xs">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[100px]">
                {user.name}
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-400 font-mono">
                Lvl {user.level} Scholar
              </div>
            </div>
          </div>
          <StreakFlame streakDays={user.streakDays} size="sm" />
        </div>

        <div className="flex items-center justify-between pt-1 gap-1 border-t border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Settings size={13} />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setAdminOpen(true)}
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Shield size={13} />
            <span>Admin</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

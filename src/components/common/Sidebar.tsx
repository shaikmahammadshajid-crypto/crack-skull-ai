import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import { StreakFlame } from './StreakFlame';
import { navigationGroups, navigationItems } from './navigationConfig';
import {
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';

const navBadges: Partial<Record<NavigationTab, string>> = {
  'ai-tutor': '13',
  'math-solver': 'Steps',
  'exam-radar': 'PYQ',
  viva: 'Oral',
};

export const Sidebar: React.FC<{ collapsed?: boolean; onToggleCollapse?: () => void }> = ({
  collapsed = false,
  onToggleCollapse,
}) => {
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

  return (
    <aside
      className={`app-sidebar hidden lg:flex h-screen flex-col sticky top-0 left-0 z-30 select-none transition-[width,background-color,border-color] duration-200 ${
        collapsed ? 'w-[5.25rem]' : 'w-72'
      }`}
    >
      <div className={`flex items-center border-b border-[var(--app-border)] ${collapsed ? 'justify-center p-3' : 'justify-between p-4'}`}>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`group flex min-w-0 items-center text-left ${collapsed ? 'justify-center' : 'gap-3'}`}
          title="CrackSkull AI"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-950 text-sm font-black text-white shadow-sm transition-transform group-hover:scale-105 dark:bg-white dark:text-gray-950">
            CS
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-heading text-base font-black text-gray-950 dark:text-white">
                  CrackSkull
                </span>
                <span className="rounded-full bg-teal-50 px-1.5 py-0.5 font-mono text-[10px] font-black text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">
                  AI
                </span>
              </div>
              <p className="truncate text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                Exam preparation cockpit
              </p>
            </div>
          )}
        </button>

        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="icon-button"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      <div className={`border-b border-[var(--app-border)] ${collapsed ? 'space-y-2 p-3' : 'space-y-2.5 p-3.5'}`}>
        {collapsed ? (
          <>
            <button
              onClick={() => setGlobalSearchOpen(true)}
              className="icon-button mx-auto"
              title="Command search"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => setVoiceAssistantOpen(true)}
              className="icon-button mx-auto"
              title="Voice assistant"
            >
              <Mic size={16} />
            </button>
            <button
              onClick={onToggleCollapse}
              className="icon-button mx-auto"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGlobalSearchOpen(true)}
              className="toolbar-button flex-1 justify-between rounded-xl px-3 py-2 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Search size={14} />
                <span className="truncate font-semibold">Search or run command</span>
              </span>
              <kbd className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--app-text-subtle)]">
                Ctrl K
              </kbd>
            </button>
            <button
              onClick={() => setVoiceAssistantOpen(true)}
              className="icon-button"
              title="Voice assistant"
            >
              <Mic size={16} />
            </button>
          </div>
        )}

        <button
          onClick={toggleCrackMode}
          className={`w-full border transition-colors ${
            collapsed
              ? `grid h-11 place-items-center rounded-xl ${
                  user.isCrackModeActive
                    ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-200'
                    : 'border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
                }`
              : `rounded-xl p-3 text-left ${
                  user.isCrackModeActive
                    ? 'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-100'
                    : 'border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text)] hover:border-[var(--app-border-strong)]'
                }`
          }`}
          title="Toggle Crack Mode"
        >
          {collapsed ? (
            <Zap size={17} className={user.isCrackModeActive ? 'fill-orange-500 text-orange-500' : ''} />
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-black">
                  <Zap size={15} className={user.isCrackModeActive ? 'fill-orange-500 text-orange-500' : 'text-orange-500'} />
                  Crack Mode
                </span>
                <span className={`status-pill ${user.isCrackModeActive ? 'border-orange-300 bg-orange-500 text-white dark:border-orange-500 dark:bg-orange-500' : ''}`}>
                  {user.isCrackModeActive ? 'Active' : 'Off'}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-4 text-[var(--app-text-muted)]">
                {user.isCrackModeActive
                  ? 'Prioritizing high-yield topics and PYQ practice.'
                  : 'Switch to a 3-day emergency revision sprint.'}
              </p>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {navigationGroups.map(group => {
          const items = navigationItems.filter(item => item.group === group);
          if (!items.length) return null;

          return (
            <div key={group} className="mb-4 last:mb-0">
              {!collapsed && (
                <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--app-text-subtle)]">
                  {group}
                </div>
              )}

              <div className="space-y-1">
                {items.map(item => {
                  const isActive = activeTab === item.id;
                  const badge = navBadges[item.id];

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`group flex w-full items-center gap-2 rounded-xl text-left text-xs transition-colors ${
                        collapsed
                          ? `h-11 justify-center px-0 ${isActive ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950' : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]'}`
                          : `justify-between px-3 py-2.5 ${isActive ? 'bg-gray-950 text-white shadow-sm dark:bg-white dark:text-gray-950' : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]'}`
                      }`}
                      title={`${item.label}: ${item.subtitle}`}
                    >
                      <span className={`flex min-w-0 items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
                        <span className={isActive ? 'text-current' : 'text-[var(--app-text-subtle)] group-hover:text-current'}>
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <span className="min-w-0">
                            <span className="block truncate font-bold">{item.label}</span>
                            <span className={`block truncate text-[10px] font-medium ${isActive ? 'text-white/70 dark:text-gray-950/60' : 'text-[var(--app-text-subtle)]'}`}>
                              {item.subtitle}
                            </span>
                          </span>
                        )}
                      </span>

                      {!collapsed && badge && (
                        <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-black ${isActive ? 'bg-white/15 text-white dark:bg-black/10 dark:text-gray-950' : 'bg-[var(--app-surface)] text-[var(--app-text-subtle)]'}`}>
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className={`border-t border-[var(--app-border)] bg-[var(--app-surface-muted)] ${collapsed ? 'p-3' : 'p-3.5'}`}>
        {collapsed ? (
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className="grid h-10 w-10 place-items-center rounded-xl bg-gray-950 text-xs font-black text-white dark:bg-white dark:text-gray-950"
              title={user.name}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </button>
            <button onClick={() => setSettingsOpen(true)} className="icon-button mx-auto" title="Settings">
              <Settings size={15} />
            </button>
            <button onClick={() => setAdminOpen(true)} className="icon-button mx-auto" title="Admin">
              <Shield size={15} />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setActiveTab('profile')}
                className="flex min-w-0 items-center gap-2.5 text-left"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gray-950 text-xs font-black text-white dark:bg-white dark:text-gray-950">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-black text-[var(--app-text)]">{user.name}</div>
                  <div className="truncate font-mono text-[10px] text-[var(--app-text-subtle)]">
                    Level {user.level} scholar
                  </div>
                </div>
              </button>
              <StreakFlame streakDays={user.streakDays} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-[var(--app-border)] pt-3">
              <button
                onClick={() => setSettingsOpen(true)}
                className="secondary-action px-3 py-2 text-[11px]"
              >
                <Settings size={13} />
                Settings
              </button>
              <button
                onClick={() => setAdminOpen(true)}
                className="secondary-action px-3 py-2 text-[11px]"
              >
                <Shield size={13} />
                Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

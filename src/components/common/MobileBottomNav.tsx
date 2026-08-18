import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import { Mic } from 'lucide-react';
import { navigationItems } from './navigationConfig';

const mobileTabs: NavigationTab[] = ['dashboard', 'ai-tutor', 'math-solver', 'study-plan', 'library'];

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setVoiceAssistantOpen } = useApp();
  const navItems = navigationItems.filter(item => mobileTabs.includes(item.id));

  return (
    <nav className="app-header fixed bottom-0 left-0 right-0 z-40 max-w-full overflow-hidden border-t border-[var(--app-border)] px-1.5 py-1.5 pb-safe lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-6 items-center gap-1">
        {navItems.map(item => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex min-w-0 flex-col items-center justify-center rounded-xl px-1 py-1 transition-colors ${
                isActive
                  ? 'text-gray-950 dark:text-white'
                  : 'text-[var(--app-text-subtle)] hover:text-[var(--app-text)]'
              }`}
              title={item.label}
            >
              <div className={`grid h-7 w-7 place-items-center rounded-lg ${isActive ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950' : ''}`}>
                {item.icon}
              </div>
              <span className="mt-0.5 max-w-full truncate text-[9px] font-bold tracking-tight min-[380px]:text-[10px]">
                {item.shortLabel}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setVoiceAssistantOpen(true)}
          className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-gray-950 text-white shadow-sm active:scale-95 dark:bg-white dark:text-gray-950"
          title="Voice assistant"
        >
          <Mic size={16} />
        </button>
      </div>
    </nav>
  );
};

import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import {
  LayoutDashboard,
  Bot,
  CalendarCheck,
  BookOpen,
  User,
  Mic,
  Download,
} from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setVoiceAssistantOpen } = useApp();
  const { installApp, isStandalone, showIosHelp, setShowIosHelp } = useInstallPrompt();

  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Home', icon: <LayoutDashboard size={20} /> },
    { id: 'ai-tutor' as NavigationTab, label: 'AI Agents', icon: <Bot size={20} /> },
    { id: 'study-plan' as NavigationTab, label: 'Study', icon: <CalendarCheck size={20} /> },
    { id: 'library' as NavigationTab, label: 'Library', icon: <BookOpen size={20} /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#161922]/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-1.5 py-1.5 pb-safe transition-colors duration-150 max-w-full overflow-hidden">
      <div className="grid grid-cols-6 items-center gap-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors ${
                isActive
                  ? 'text-black dark:text-white font-bold'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="relative">
                {item.icon}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black dark:bg-white rounded-full" />
                )}
              </div>
              <span className="max-w-full truncate text-[9px] min-[380px]:text-[10px] mt-0.5 tracking-tight font-medium">{item.label}</span>
            </button>
          );
        })}

        {!isStandalone && (
          <button
            onClick={installApp}
            className="min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title="Install app"
          >
            <Download size={20} />
            <span className="max-w-full truncate text-[9px] min-[380px]:text-[10px] mt-0.5 tracking-tight font-medium">Install</span>
          </button>
        )}

        {/* Floating Voice AI trigger button */}
        <button
          onClick={() => setVoiceAssistantOpen(true)}
          className="mx-auto flex items-center justify-center w-9 h-9 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-sm active:scale-95 transition-transform"
          title="Voice AI"
        >
          <Mic size={16} />
        </button>
      </div>
      {showIosHelp && (
        <div className="ios-install-panel p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-black">Install on iPhone</div>
              <div className="mt-1 text-xs leading-relaxed text-slate-300">
                Use Safari, tap Share, then tap Add to Home Screen.
              </div>
            </div>
            <button
              onClick={() => setShowIosHelp(false)}
              className="rounded-lg bg-white/10 px-2 py-1 text-xs font-bold text-white"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-slate-200">
            <div className="rounded-xl bg-white/10 p-2">Safari</div>
            <div className="rounded-xl bg-white/10 p-2">Share</div>
            <div className="rounded-xl bg-white/10 p-2">Add</div>
          </div>
        </div>
      )}
    </nav>
  );
};

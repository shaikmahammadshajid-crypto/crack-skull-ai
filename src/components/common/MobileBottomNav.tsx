import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import {
  LayoutDashboard,
  Bot,
  CalendarCheck,
  BookOpen,
  User,
  Mic,
  Zap,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setVoiceAssistantOpen, user } = useApp();

  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Home', icon: <LayoutDashboard size={20} /> },
    { id: 'ai-tutor' as NavigationTab, label: 'AI Agents', icon: <Bot size={20} /> },
    { id: 'study-plan' as NavigationTab, label: 'Study', icon: <CalendarCheck size={20} /> },
    { id: 'library' as NavigationTab, label: 'Library', icon: <BookOpen size={20} /> },
    { id: 'profile' as NavigationTab, label: 'Profile', icon: <User size={20} /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#161922]/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-2 py-1.5 pb-safe transition-colors duration-150">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
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
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.label}</span>
            </button>
          );
        })}

        {/* Floating Voice AI trigger button */}
        <button
          onClick={() => setVoiceAssistantOpen(true)}
          className="flex flex-col items-center justify-center p-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-sm active:scale-95 transition-transform"
          title="Voice AI"
        >
          <Mic size={16} />
        </button>
      </div>
    </nav>
  );
};

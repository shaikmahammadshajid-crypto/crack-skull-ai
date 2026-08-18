import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { VoiceAssistantModal } from './components/common/VoiceAssistantModal';
import { AIExplainModal } from './components/common/AIExplainModal';
import { SettingsModal } from './components/common/SettingsModal';
import { AdminDashboardModal } from './components/admin/AdminDashboardModal';
import { LoginView } from './components/auth/LoginView';
import { navigationGroups, navigationItems } from './components/common/navigationConfig';

import { CommandDashboard } from './components/dashboard/CommandDashboard';
import { AITutorView } from './components/ai/AITutorView';
import { MathSolverView } from './components/math/MathSolverView';
import { StudyPlanView } from './components/study/StudyPlanView';
import { ExamRadarView } from './components/exam/ExamRadarView';
import { DocumentStudioView } from './components/documents/DocumentStudioView';
import { QuizView } from './components/quiz/QuizView';
import { VivaSimulatorView } from './components/viva/VivaSimulatorView';
import { FlashcardsView } from './components/flashcards/FlashcardsView';
import { FocusTimerView } from './components/focus/FocusTimerView';
import { KnowledgeMapView } from './components/knowledge/KnowledgeMapView';
import { DigitalLibraryView } from './components/library/DigitalLibraryView';
import { AcademicAnalyticsView } from './components/analytics/AcademicAnalyticsView';
import { ExamCalendarView } from './components/calendar/ExamCalendarView';
import { StudentProfileView } from './components/profile/StudentProfileView';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, isAuthenticated } = useApp();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CommandDashboard />;
      case 'ai-tutor':
        return <AITutorView />;
      case 'math-solver':
        return <MathSolverView />;
      case 'study-plan':
        return <StudyPlanView />;
      case 'exam-radar':
        return <ExamRadarView />;
      case 'document-ai':
        return <DocumentStudioView />;
      case 'quiz':
        return <QuizView />;
      case 'viva':
        return <VivaSimulatorView />;
      case 'flashcards':
        return <FlashcardsView />;
      case 'focus-timer':
        return <FocusTimerView />;
      case 'knowledge-map':
        return <KnowledgeMapView />;
      case 'library':
        return <DigitalLibraryView />;
      case 'analytics':
        return <AcademicAnalyticsView />;
      case 'calendar':
        return <ExamCalendarView />;
      case 'profile':
        return <StudentProfileView />;
      default:
        return <CommandDashboard />;
    }
  };

  return (
    <div className="app-shell flex min-h-screen max-w-[100vw] overflow-x-hidden font-sans selection:bg-gray-950 selection:text-white transition-colors duration-150">
      {/* Desktop Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
      />

      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-gray-950/45 backdrop-blur-sm lg:hidden animate-in fade-in"
          aria-label="Close navigation menu"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="app-sidebar flex h-full w-[min(21rem,88vw)] flex-col shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-[var(--app-border)] p-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-950 text-sm font-black text-white dark:bg-white dark:text-gray-950">
                  CS
                </div>
                <div className="min-w-0">
                  <span className="font-heading text-sm font-black text-[var(--app-text)]">
                    CrackSkull AI
                  </span>
                  <p className="truncate text-[11px] font-medium text-[var(--app-text-muted)]">Exam preparation cockpit</p>
                </div>
              </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {navigationGroups.map(group => (
                <div key={group} className="space-y-1">
                  <div className="px-3 text-[10px] font-black uppercase tracking-widest text-[var(--app-text-subtle)]">
                    {group}
                  </div>
                  {navigationItems.filter(item => item.group === group).map(item => (
                    <button
                      key={`${group}_${item.label}`}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileDrawerOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs transition-colors ${
                        activeTab === item.id
                          ? 'bg-gray-950 font-black text-white shadow-sm dark:bg-white dark:text-gray-950'
                          : 'font-bold text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]'
                      }`}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="min-w-0 text-left">
                        <span className="block truncate">{item.label}</span>
                        <span className={`block truncate text-[10px] ${activeTab === item.id ? 'text-white/70 dark:text-gray-950/60' : 'text-[var(--app-text-subtle)]'}`}>
                          {item.subtitle}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="secondary-action m-3 py-2.5 text-xs"
            >
              Close menu
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        <Header onOpenMobileMenu={() => setMobileDrawerOpen(true)} />

        <main className="app-main flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6">
          {renderActiveView()}
        </main>

        {/* Mobile Bottom Dock Bar */}
        <MobileBottomNav />
      </div>

      {/* Global Modals & Voice / Search Overlays */}
      <GlobalSearchModal />
      <VoiceAssistantModal />
      <AIExplainModal />
      <SettingsModal />
      <AdminDashboardModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

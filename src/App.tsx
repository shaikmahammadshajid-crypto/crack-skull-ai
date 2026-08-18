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
    <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden bg-[#F8F9FA] dark:bg-[#0F1117] text-[#1A1A1A] dark:text-gray-100 font-sans selection:bg-gray-900 selection:text-white transition-colors duration-150">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 dark:bg-black/70 backdrop-blur-xs lg:hidden animate-in fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-[min(18rem,88vw)] h-full bg-white dark:bg-[#161922] border-r border-gray-200 dark:border-gray-800 p-5 flex flex-col justify-between shadow-2xl"
          >
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="w-9 h-9 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center font-bold text-lg">
                  CS
                </div>
                <div>
                  <span className="font-bold text-sm text-gray-900 dark:text-white font-heading">
                    CrackSkull AI
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Exam Preparation Copilot</p>
                </div>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[70vh] pr-1">
                {[
                  { id: 'dashboard', label: 'Home Assistant' },
                  { id: 'ai-tutor', label: 'Multilingual AI Agents' },
                  { id: 'math-solver', label: 'Math Solver' },
                  { id: 'study-plan', label: 'Adaptive Study Plan' },
                  { id: 'exam-radar', label: 'Exam Radar (PYQ)' },
                  { id: 'document-ai', label: 'PDF Learning Studio' },
                  { id: 'quiz', label: 'AI Mock Quiz' },
                  { id: 'viva', label: 'AI Viva Simulator' },
                  { id: 'flashcards', label: 'Spaced Flashcards' },
                  { id: 'focus-timer', label: 'Focus Timer' },
                  { id: 'knowledge-map', label: 'Knowledge Map' },
                  { id: 'library', label: 'Digital Library' },
                  { id: 'analytics', label: 'Academic Analytics' },
                  { id: 'calendar', label: 'Exam Calendar' },
                  { id: 'profile', label: 'Student Profile' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      activeTab === item.id
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="w-full py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Close Menu
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        <Header onOpenMobileMenu={() => setMobileDrawerOpen(true)} />

        <main className="flex-1 w-full max-w-full p-3 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden bg-[#F8F9FA] dark:bg-[#0F1117]">
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

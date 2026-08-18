import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  Subject,
  DocumentItem,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  Flashcard,
  StudyPlan,
  CalendarEvent,
  KnowledgeNode,
  LibraryResource,
  NotificationItem,
  CrackScoreBreakdown,
  VivaSession,
} from '../types';
import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';

export type NavigationTab =
  | 'dashboard'
  | 'ai-tutor'
  | 'math-solver'
  | 'study-plan'
  | 'exam-radar'
  | 'document-ai'
  | 'quiz'
  | 'viva'
  | 'flashcards'
  | 'focus-timer'
  | 'library'
  | 'analytics'
  | 'calendar'
  | 'knowledge-map'
  | 'profile'
  | 'admin';

interface ExplainModalPayload {
  isOpen: boolean;
  selectedText: string;
  contextSubject?: string;
  sourceDocTitle?: string;
}

interface AppContextType {
  // Navigation & View
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Auth & Onboarding
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  login: (updates: Partial<UserProfile>, rememberDevice: boolean) => void;
  logout: () => void;
  onboardingComplete: boolean;
  setOnboardingComplete: (val: boolean) => void;

  // Core Data
  user: UserProfile;
  updateUser: (user: Partial<UserProfile>) => void;
  crackScore: CrackScoreBreakdown;
  refreshCrackScore: () => void;

  // Subjects
  subjects: Subject[];
  activeSubject: Subject | null;
  setActiveSubject: (subject: Subject | null) => void;
  addSubject: (subject: Subject) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;

  // Documents & PDF
  documents: DocumentItem[];
  addDocument: (doc: DocumentItem) => void;
  deleteDocument: (id: string) => void;
  toggleBookmarkDocument: (id: string) => void;
  selectedDocForReader: DocumentItem | null;
  openDocumentReader: (doc: DocumentItem) => void;
  closeDocumentReader: () => void;

  // Study Plan & Crack Mode
  studyPlan: StudyPlan;
  toggleStudyTask: (taskId: string) => void;
  toggleCrackMode: () => void;
  regenerateStudyPlan: () => Promise<void>;

  // Quizzes & Mock Exams
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  addQuiz: (quiz: Quiz) => void;
  saveQuizAttempt: (attempt: QuizAttempt) => void;
  activeQuiz: Quiz | null;
  startQuiz: (quiz: Quiz) => void;
  finishActiveQuiz: () => void;

  // Flashcards
  flashcards: Flashcard[];
  updateFlashcard: (id: string, isMastered: boolean, difficulty?: 'easy' | 'medium' | 'hard') => void;
  addFlashcard: (card: Flashcard) => void;

  // Viva Sessions
  vivaSessions: VivaSession[];
  saveVivaSession: (session: VivaSession) => void;

  // Knowledge Map
  knowledgeNodes: KnowledgeNode[];
  updateKnowledgeNode: (id: string, status: 'strong' | 'moderate' | 'weak' | 'critical', percentage: number) => void;

  // Calendar
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: CalendarEvent) => void;
  deleteCalendarEvent: (id: string) => void;

  // Library
  libraryResources: LibraryResource[];
  toggleBookmarkResource: (id: string) => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Modals & Assistant
  explainModal: ExplainModalPayload;
  openExplainModal: (text: string, subject?: string, docTitle?: string) => void;
  closeExplainModal: () => void;
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
  voiceAssistantOpen: boolean;
  setVoiceAssistantOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  adminOpen: boolean;
  setAdminOpen: (open: boolean) => void;

  // Utilities
  triggerConfetti: () => void;
  addXp: (amount: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function normalizeQuizQuestion(raw: any, index: number, fallbackTopic: string, fallbackDifficulty: QuizQuestion['difficulty']): QuizQuestion {
  const options = Array.isArray(raw?.options) && raw.options.length >= 2
    ? raw.options.map((option: any) => String(option))
    : ['Review the core definition', 'Skip the topic', 'Memorize without understanding', 'Ignore examples'];

  const correctIndex = Number.isInteger(raw?.correctIndex)
    ? raw.correctIndex
    : Number.isInteger(raw?.correctOptionIndex)
      ? raw.correctOptionIndex
      : 0;

  return {
    id: String(raw?.id || `q_${index + 1}`),
    type: raw?.type || 'mcq',
    question: String(raw?.question || raw?.questionText || raw?.prompt || `Question ${index + 1}: Explain ${fallbackTopic}.`),
    options,
    correctIndex: Math.max(0, Math.min(options.length - 1, correctIndex)),
    correctAnswerText: raw?.correctAnswerText,
    explanation: String(raw?.explanation || 'Review the concept explanation and compare it with the correct option.'),
    topic: String(raw?.topic || raw?.topicTag || fallbackTopic),
    difficulty: raw?.difficulty || fallbackDifficulty,
    marks: Number(raw?.marks || 2),
  };
}

function normalizeQuiz(quiz: Quiz): Quiz {
  const fallbackTopic = quiz.topic || quiz.title || 'General Practice';
  const fallbackDifficulty = quiz.difficulty || 'medium';
  return {
    ...quiz,
    title: quiz.title || `${fallbackTopic} Practice Quiz`,
    topic: fallbackTopic,
    questions: (quiz.questions || []).map((question, index) =>
      normalizeQuizQuestion(question, index, fallbackTopic, fallbackDifficulty)
    ),
  };
}

function normalizeStudyPlan(rawPlan: any, fallbackPlan: StudyPlan, dailyHours: number, isCrackMode: boolean): StudyPlan {
  const todayTasks = (rawPlan?.todayMission?.tasks || rawPlan?.todayTasks || fallbackPlan.todayTasks).map((task: any, index: number) => ({
    id: String(task?.id || `task_${Date.now()}_${index}`),
    subject: String(task?.subject || rawPlan?.targetExam || fallbackPlan.targetExam || 'General'),
    topic: String(task?.topic || task?.title || `Study block ${index + 1}`),
    durationMinutes: Number(task?.durationMinutes || task?.minutes || 30),
    type: task?.type || 'concept_revision',
    difficulty: task?.difficulty || (index === 0 ? 'High' : 'Medium'),
    reason: String(task?.reason || 'Scheduled by the adaptive planner based on exam priority and weak topics.'),
    isCompleted: Boolean(task?.isCompleted),
  }));

  const weeklyRoadmap = (rawPlan?.weeklyRoadmap || fallbackPlan.weeklyRoadmap).map((week: any, index: number) => ({
    day: String(week?.day || week?.dayRange || `Day ${index + 1}`),
    focus: String(week?.focus || week?.focusTheme || week?.title || 'Revision and practice'),
    hours: Number(week?.hours || week?.estimatedHours || dailyHours),
  }));

  return {
    id: `plan_${Date.now()}`,
    modeName: rawPlan?.modeName || (isCrackMode ? 'Crack Mode Sprint Plan' : 'Adaptive Mastery Plan'),
    targetExam: rawPlan?.targetExam || fallbackPlan.targetExam || 'Semester Final',
    daysRemaining: Number(rawPlan?.daysRemaining || fallbackPlan.daysRemaining || (isCrackMode ? 3 : 12)),
    dailyHours,
    isCrackMode,
    todayTasks,
    weeklyRoadmap,
    crackTip: rawPlan?.crackTip || fallbackPlan.crackTip,
    updatedAt: new Date().toISOString(),
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => storageService.getTheme());

  // Auth
  const [isAuthenticated, setIsAuthenticatedState] = useState<boolean>(() => storageService.getAuthState());
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(true);

  // Core Data loaded from storage
  const [user, setUserState] = useState<UserProfile>(() => storageService.getUser());
  const [subjects, setSubjects] = useState<Subject[]>(() => storageService.getSubjects());
  const [activeSubject, setActiveSubject] = useState<Subject | null>(() => storageService.getSubjects()[0] || null);
  const [documents, setDocuments] = useState<DocumentItem[]>(() => storageService.getDocuments());
  const [studyPlan, setStudyPlan] = useState<StudyPlan>(() => storageService.getStudyPlan());
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => storageService.getQuizzes().map(normalizeQuiz));
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => storageService.getQuizAttempts());
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => storageService.getFlashcards());
  const [vivaSessions, setVivaSessions] = useState<VivaSession[]>(() => storageService.getVivaSessions());
  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>(() => storageService.getKnowledgeNodes());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => storageService.getCalendarEvents());
  const [libraryResources, setLibraryResources] = useState<LibraryResource[]>(() => storageService.getLibraryResources());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => storageService.getNotifications());

  // Crack Score
  const [crackScore, setCrackScore] = useState<CrackScoreBreakdown>(() => storageService.calculateCrackScore());

  // Active Interactive Overlays
  const [selectedDocForReader, setSelectedDocForReader] = useState<DocumentItem | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const [explainModal, setExplainModal] = useState<ExplainModalPayload>({
    isOpen: false,
    selectedText: '',
  });

  // Confetti helper
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899'],
      });
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Theme synchronization with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      storageService.saveTheme(next);
      return next;
    });
  }, []);

  // Recalculate Crack Score
  const refreshCrackScore = useCallback(() => {
    const score = storageService.calculateCrackScore();
    setCrackScore(score);
  }, []);

  // Update user
  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setUserState(prev => {
      const updated = { ...prev, ...updates };
      storageService.saveUser(updated);
      return updated;
    });
    refreshCrackScore();
  }, [refreshCrackScore]);

  const setIsAuthenticated = useCallback((val: boolean) => {
    setIsAuthenticatedState(val);
    if (!val) {
      storageService.clearAuthState();
    }
  }, []);

  const login = useCallback((updates: Partial<UserProfile>, rememberDevice: boolean) => {
    setUserState(prev => {
      const updated = {
        ...prev,
        ...updates,
        id: prev.id || `user_${Date.now()}`,
        createdAt: prev.createdAt || new Date().toISOString(),
      };
      storageService.saveUser(updated);
      return updated;
    });
    storageService.saveAuthState(rememberDevice);
    setIsAuthenticatedState(true);
    setOnboardingComplete(true);
  }, []);

  const logout = useCallback(() => {
    storageService.clearAuthState();
    setIsAuthenticatedState(false);
    setVoiceAssistantOpen(false);
    setGlobalSearchOpen(false);
    setSettingsOpen(false);
    setAdminOpen(false);
    setActiveTab('dashboard');
  }, []);

  // Add XP and level up
  const addXp = useCallback((amount: number) => {
    setUserState(prev => {
      const newXp = prev.xp + amount;
      const newLevel = Math.floor(newXp / 600) + 1;
      const updated = { ...prev, xp: newXp, level: newLevel };
      storageService.saveUser(updated);
      return updated;
    });
    refreshCrackScore();
  }, [refreshCrackScore]);

  // Subjects operations
  const addSubject = useCallback((subject: Subject) => {
    setSubjects(prev => {
      const updated = [subject, ...prev];
      storageService.saveSubjects(updated);
      return updated;
    });
    refreshCrackScore();
  }, [refreshCrackScore]);

  const updateSubject = useCallback((id: string, updates: Partial<Subject>) => {
    setSubjects(prev => {
      const updated = prev.map(s => (s.id === id ? { ...s, ...updates } : s));
      storageService.saveSubjects(updated);
      return updated;
    });
    refreshCrackScore();
  }, [refreshCrackScore]);

  // Document operations
  const addDocument = useCallback((doc: DocumentItem) => {
    setDocuments(prev => {
      const updated = [doc, ...prev];
      storageService.saveDocuments(updated);
      return updated;
    });
    addXp(50);
    refreshCrackScore();
  }, [addXp, refreshCrackScore]);

  const deleteDocument = useCallback((id: string) => {
    setDocuments(prev => {
      const updated = prev.filter(d => d.id !== id);
      storageService.saveDocuments(updated);
      return updated;
    });
    refreshCrackScore();
  }, [refreshCrackScore]);

  const toggleBookmarkDocument = useCallback((id: string) => {
    setDocuments(prev => {
      const updated = prev.map(d => (d.id === id ? { ...d, isBookmarked: !d.isBookmarked } : d));
      storageService.saveDocuments(updated);
      return updated;
    });
  }, []);

  const openDocumentReader = useCallback((doc: DocumentItem) => {
    setSelectedDocForReader(doc);
  }, []);

  const closeDocumentReader = useCallback(() => {
    setSelectedDocForReader(null);
  }, []);

  // Study Plan operations
  const toggleStudyTask = useCallback((taskId: string) => {
    setStudyPlan(prev => {
      const updatedTasks = prev.todayTasks.map(t =>
        t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
      );
      const isCompletedNow = updatedTasks.find(t => t.id === taskId)?.isCompleted;
      if (isCompletedNow) {
        triggerConfetti();
        addXp(40);
      }
      const updatedPlan = { ...prev, todayTasks: updatedTasks };
      storageService.saveStudyPlan(updatedPlan);
      return updatedPlan;
    });
    refreshCrackScore();
  }, [triggerConfetti, addXp, refreshCrackScore]);

  const toggleCrackMode = useCallback(() => {
    const nextState = !user.isCrackModeActive;
    updateUser({ isCrackModeActive: nextState });
    setStudyPlan(prev => {
      const updatedPlan = {
        ...prev,
        isCrackMode: nextState,
        modeName: nextState ? '⚡ CRACK MODE (High-Yield Intensive)' : '🎯 Adaptive Mastery Roadmap',
        daysRemaining: nextState ? 3 : 12,
        crackTip: nextState
          ? '⚡ High-Yield Crack Mode Active! Focus on 90%+ probability question types and rapid revision.'
          : '🎯 Space your learning: revise yesterday’s flashcards for 10 minutes before starting new topics.',
      };
      storageService.saveStudyPlan(updatedPlan);
      return updatedPlan;
    });
    if (nextState) {
      triggerConfetti();
    }
  }, [user.isCrackModeActive, updateUser, triggerConfetti]);

  const regenerateStudyPlan = useCallback(async () => {
    const weakList = subjects.flatMap(s => s.weakTopics);
    const newPlan = await aiService.generateStudyPlan({
      subjects,
      examDaysLeft: user.isCrackModeActive ? 3 : 12,
      dailyHours: user.dailyHours,
      isCrackMode: user.isCrackModeActive,
      weakTopics: weakList,
    });
    if (newPlan) {
      const planObj = normalizeStudyPlan(newPlan, studyPlan, user.dailyHours, user.isCrackModeActive);
      setStudyPlan(planObj);
      storageService.saveStudyPlan(planObj);
      triggerConfetti();
    }
  }, [subjects, user.isCrackModeActive, user.dailyHours, studyPlan, triggerConfetti]);

  // Quiz operations
  const addQuiz = useCallback((quiz: Quiz) => {
    const normalizedQuiz = normalizeQuiz(quiz);
    setQuizzes(prev => {
      const updated = [normalizedQuiz, ...prev];
      storageService.saveQuizzes(updated);
      return updated;
    });
  }, []);

  const saveQuizAttempt = useCallback((attempt: QuizAttempt) => {
    setQuizAttempts(prev => {
      const updated = [attempt, ...prev];
      storageService.saveQuizAttempts(updated);
      return updated;
    });
    addXp(100);

    // Adaptive reinforcement: if score < 70%, add weak topics to knowledge map
    if (attempt.accuracyPercentage < 70 && attempt.weakTopicsIdentified.length > 0) {
      setKnowledgeNodes(prev => {
        const updated = prev.map(kn => {
          if (attempt.weakTopicsIdentified.some(wt => kn.topic.toLowerCase().includes(wt.toLowerCase()))) {
            return { ...kn, masteryStatus: 'critical' as const, masteryPercentage: Math.max(25, kn.masteryPercentage - 15) };
          }
          return kn;
        });
        storageService.saveKnowledgeNodes(updated);
        return updated;
      });
    }

    refreshCrackScore();
    triggerConfetti();
  }, [addXp, refreshCrackScore, triggerConfetti]);

  const startQuiz = useCallback((quiz: Quiz) => {
    setActiveQuiz(normalizeQuiz(quiz));
  }, []);

  const finishActiveQuiz = useCallback(() => {
    setActiveQuiz(null);
  }, []);

  // Flashcards
  const updateFlashcard = useCallback((id: string, isMastered: boolean, difficulty?: 'easy' | 'medium' | 'hard') => {
    setFlashcards(prev => {
      const updated = prev.map(fc => {
        if (fc.id === id) {
          return {
            ...fc,
            isMastered,
            difficulty: difficulty || fc.difficulty,
            reviewCount: fc.reviewCount + 1,
            lastReviewed: new Date().toISOString(),
          };
        }
        return fc;
      });
      storageService.saveFlashcards(updated);
      return updated;
    });
    addXp(15);
    refreshCrackScore();
  }, [addXp, refreshCrackScore]);

  const addFlashcard = useCallback((card: Flashcard) => {
    setFlashcards(prev => {
      const updated = [card, ...prev];
      storageService.saveFlashcards(updated);
      return updated;
    });
    addXp(20);
    refreshCrackScore();
  }, [addXp, refreshCrackScore]);

  // Viva Sessions
  const saveVivaSession = useCallback((session: VivaSession) => {
    setVivaSessions(prev => {
      const updated = [session, ...prev];
      storageService.saveVivaSessions(updated);
      return updated;
    });
    addXp(120);
    refreshCrackScore();
    triggerConfetti();
  }, [addXp, refreshCrackScore, triggerConfetti]);

  // Knowledge Nodes
  const updateKnowledgeNode = useCallback((id: string, status: 'strong' | 'moderate' | 'weak' | 'critical', percentage: number) => {
    setKnowledgeNodes(prev => {
      const updated = prev.map(kn => (kn.id === id ? { ...kn, masteryStatus: status, masteryPercentage: percentage } : kn));
      storageService.saveKnowledgeNodes(updated);
      return updated;
    });
    refreshCrackScore();
  }, [refreshCrackScore]);

  // Calendar
  const addCalendarEvent = useCallback((event: CalendarEvent) => {
    setCalendarEvents(prev => {
      const updated = [...prev, event];
      storageService.saveCalendarEvents(updated);
      return updated;
    });
  }, []);

  const deleteCalendarEvent = useCallback((id: string) => {
    setCalendarEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      storageService.saveCalendarEvents(updated);
      return updated;
    });
  }, []);

  // Library
  const toggleBookmarkResource = useCallback((id: string) => {
    setLibraryResources(prev => {
      const updated = prev.map(res => (res.id === id ? { ...res, isBookmarked: !res.isBookmarked } : res));
      storageService.saveLibraryResources(updated);
      return updated;
    });
  }, []);

  // Notifications
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => (n.id === id ? { ...n, isRead: true } : n));
      storageService.saveNotifications(updated);
      return updated;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    storageService.saveNotifications([]);
  }, []);

  // AI Explain Anywhere Modal
  const openExplainModal = useCallback((text: string, subject?: string, docTitle?: string) => {
    setExplainModal({
      isOpen: true,
      selectedText: text,
      contextSubject: subject,
      sourceDocTitle: docTitle,
    });
  }, []);

  const closeExplainModal = useCallback(() => {
    setExplainModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theme,
        toggleTheme,
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout,
        onboardingComplete,
        setOnboardingComplete,
        user,
        updateUser,
        crackScore,
        refreshCrackScore,
        subjects,
        activeSubject,
        setActiveSubject,
        addSubject,
        updateSubject,
        documents,
        addDocument,
        deleteDocument,
        toggleBookmarkDocument,
        selectedDocForReader,
        openDocumentReader,
        closeDocumentReader,
        studyPlan,
        toggleStudyTask,
        toggleCrackMode,
        regenerateStudyPlan,
        quizzes,
        quizAttempts,
        addQuiz,
        saveQuizAttempt,
        activeQuiz,
        startQuiz,
        finishActiveQuiz,
        flashcards,
        updateFlashcard,
        addFlashcard,
        vivaSessions,
        saveVivaSession,
        knowledgeNodes,
        updateKnowledgeNode,
        calendarEvents,
        addCalendarEvent,
        deleteCalendarEvent,
        libraryResources,
        toggleBookmarkResource,
        notifications,
        markNotificationRead,
        clearAllNotifications,
        explainModal,
        openExplainModal,
        closeExplainModal,
        globalSearchOpen,
        setGlobalSearchOpen,
        voiceAssistantOpen,
        setVoiceAssistantOpen,
        settingsOpen,
        setSettingsOpen,
        adminOpen,
        setAdminOpen,
        triggerConfetti,
        addXp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

import {
  UserProfile,
  Subject,
  DocumentItem,
  ChatSession,
  Quiz,
  QuizAttempt,
  Flashcard,
  StudyPlan,
  CalendarEvent,
  KnowledgeNode,
  LibraryResource,
  NotificationItem,
  CrackScoreBreakdown,
  VivaSession,
  StudySession,
} from '../types';
import {
  DEMO_USER,
  DEMO_SUBJECTS,
  DEMO_DOCUMENTS,
  DEMO_STUDY_PLAN,
  DEMO_FLASHCARDS,
  DEMO_QUIZZES,
  DEMO_QUIZ_ATTEMPTS,
  DEMO_KNOWLEDGE_NODES,
  DEMO_CALENDAR_EVENTS,
  DEMO_LIBRARY_RESOURCES,
  DEMO_NOTIFICATIONS,
  DEMO_VIVA_SESSION,
} from './demoData';

const KEYS = {
  AUTH: 'crack_skull_auth',
  USER: 'crack_skull_user',
  SUBJECTS: 'crack_skull_subjects',
  DOCUMENTS: 'crack_skull_documents',
  CHATS: 'crack_skull_chats',
  QUIZZES: 'crack_skull_quizzes',
  ATTEMPTS: 'crack_skull_attempts',
  FLASHCARDS: 'crack_skull_flashcards',
  STUDY_PLAN: 'crack_skull_study_plan',
  STUDY_SESSIONS: 'crack_skull_study_sessions',
  KNOWLEDGE_NODES: 'crack_skull_knowledge_nodes',
  CALENDAR: 'crack_skull_calendar',
  LIBRARY: 'crack_skull_library',
  NOTIFICATIONS: 'crack_skull_notifications',
  VIVA_SESSIONS: 'crack_skull_viva_sessions',
  THEME: 'crack_skull_theme',
};

export const storageService = {
  // Auth session
  getAuthState(): boolean {
    try {
      const remembered = localStorage.getItem(KEYS.AUTH) === 'remembered';
      const sessionActive = sessionStorage.getItem(KEYS.AUTH) === 'session';
      return remembered || sessionActive;
    } catch {
      return false;
    }
  },

  saveAuthState(rememberDevice: boolean) {
    try {
      if (rememberDevice) {
        localStorage.setItem(KEYS.AUTH, 'remembered');
        sessionStorage.removeItem(KEYS.AUTH);
      } else {
        sessionStorage.setItem(KEYS.AUTH, 'session');
        localStorage.removeItem(KEYS.AUTH);
      }
    } catch (e) {
      console.error(e);
    }
  },

  clearAuthState() {
    try {
      localStorage.removeItem(KEYS.AUTH);
      sessionStorage.removeItem(KEYS.AUTH);
    } catch (e) {
      console.error(e);
    }
  },

  getTheme(): 'dark' | 'light' {
    try {
      const stored = localStorage.getItem(KEYS.THEME);
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  },

  saveTheme(theme: 'dark' | 'light') {
    try {
      localStorage.setItem(KEYS.THEME, theme);
    } catch (e) {
      console.error(e);
    }
  },

  // User Profile
  getUser(): UserProfile {
    try {
      const data = localStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : DEMO_USER;
    } catch {
      return DEMO_USER;
    }
  },

  saveUser(user: UserProfile) {
    try {
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  },

  // Subjects
  getSubjects(): Subject[] {
    try {
      const data = localStorage.getItem(KEYS.SUBJECTS);
      return data ? JSON.parse(data) : DEMO_SUBJECTS;
    } catch {
      return DEMO_SUBJECTS;
    }
  },

  saveSubjects(subjects: Subject[]) {
    try {
      localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
    } catch (e) {
      console.error(e);
    }
  },

  // Documents
  getDocuments(): DocumentItem[] {
    try {
      const data = localStorage.getItem(KEYS.DOCUMENTS);
      return data ? JSON.parse(data) : DEMO_DOCUMENTS;
    } catch {
      return DEMO_DOCUMENTS;
    }
  },

  saveDocuments(docs: DocumentItem[]) {
    try {
      localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
    } catch (e) {
      console.error(e);
    }
  },

  // Chat Sessions
  getChats(): ChatSession[] {
    try {
      const data = localStorage.getItem(KEYS.CHATS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveChats(chats: ChatSession[]) {
    try {
      localStorage.setItem(KEYS.CHATS, JSON.stringify(chats));
    } catch (e) {
      console.error(e);
    }
  },

  // Quizzes & Attempts
  getQuizzes(): Quiz[] {
    try {
      const data = localStorage.getItem(KEYS.QUIZZES);
      return data ? JSON.parse(data) : DEMO_QUIZZES;
    } catch {
      return DEMO_QUIZZES;
    }
  },

  saveQuizzes(quizzes: Quiz[]) {
    try {
      localStorage.setItem(KEYS.QUIZZES, JSON.stringify(quizzes));
    } catch (e) {
      console.error(e);
    }
  },

  getQuizAttempts(): QuizAttempt[] {
    try {
      const data = localStorage.getItem(KEYS.ATTEMPTS);
      return data ? JSON.parse(data) : DEMO_QUIZ_ATTEMPTS;
    } catch {
      return DEMO_QUIZ_ATTEMPTS;
    }
  },

  saveQuizAttempts(attempts: QuizAttempt[]) {
    try {
      localStorage.setItem(KEYS.ATTEMPTS, JSON.stringify(attempts));
    } catch (e) {
      console.error(e);
    }
  },

  // Flashcards
  getFlashcards(): Flashcard[] {
    try {
      const data = localStorage.getItem(KEYS.FLASHCARDS);
      return data ? JSON.parse(data) : DEMO_FLASHCARDS;
    } catch {
      return DEMO_FLASHCARDS;
    }
  },

  saveFlashcards(flashcards: Flashcard[]) {
    try {
      localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(flashcards));
    } catch (e) {
      console.error(e);
    }
  },

  // Study Plan
  getStudyPlan(): StudyPlan {
    try {
      const data = localStorage.getItem(KEYS.STUDY_PLAN);
      return data ? JSON.parse(data) : DEMO_STUDY_PLAN;
    } catch {
      return DEMO_STUDY_PLAN;
    }
  },

  saveStudyPlan(plan: StudyPlan) {
    try {
      localStorage.setItem(KEYS.STUDY_PLAN, JSON.stringify(plan));
    } catch (e) {
      console.error(e);
    }
  },

  // Study Sessions (Focus timer logs)
  getStudySessions(): StudySession[] {
    try {
      const data = localStorage.getItem(KEYS.STUDY_SESSIONS);
      return data ? JSON.parse(data) : [
        { id: 'ss1', date: '2026-08-15', subject: 'DBMS', topic: 'Normalization', durationMinutes: 50, focusScore: 5, type: 'pomodoro' },
        { id: 'ss2', date: '2026-08-14', subject: 'Operating Systems', topic: 'Paging', durationMinutes: 45, focusScore: 4, type: 'pomodoro' },
        { id: 'ss3', date: '2026-08-13', subject: 'DBMS', topic: 'SQL Queries', durationMinutes: 60, focusScore: 5, type: 'revision' },
      ];
    } catch {
      return [];
    }
  },

  saveStudySessions(sessions: StudySession[]) {
    try {
      localStorage.setItem(KEYS.STUDY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error(e);
    }
  },

  // Knowledge Nodes
  getKnowledgeNodes(): KnowledgeNode[] {
    try {
      const data = localStorage.getItem(KEYS.KNOWLEDGE_NODES);
      return data ? JSON.parse(data) : DEMO_KNOWLEDGE_NODES;
    } catch {
      return DEMO_KNOWLEDGE_NODES;
    }
  },

  saveKnowledgeNodes(nodes: KnowledgeNode[]) {
    try {
      localStorage.setItem(KEYS.KNOWLEDGE_NODES, JSON.stringify(nodes));
    } catch (e) {
      console.error(e);
    }
  },

  // Calendar
  getCalendarEvents(): CalendarEvent[] {
    try {
      const data = localStorage.getItem(KEYS.CALENDAR);
      return data ? JSON.parse(data) : DEMO_CALENDAR_EVENTS;
    } catch {
      return DEMO_CALENDAR_EVENTS;
    }
  },

  saveCalendarEvents(events: CalendarEvent[]) {
    try {
      localStorage.setItem(KEYS.CALENDAR, JSON.stringify(events));
    } catch (e) {
      console.error(e);
    }
  },

  // Library Resources
  getLibraryResources(): LibraryResource[] {
    try {
      const data = localStorage.getItem(KEYS.LIBRARY);
      if (!data) return DEMO_LIBRARY_RESOURCES;

      const savedResources = JSON.parse(data) as LibraryResource[];
      const savedIds = new Set(savedResources.map(resource => resource.id));
      const newBuiltInResources = DEMO_LIBRARY_RESOURCES.filter(resource => !savedIds.has(resource.id));
      return [...savedResources, ...newBuiltInResources];
    } catch {
      return DEMO_LIBRARY_RESOURCES;
    }
  },

  saveLibraryResources(resources: LibraryResource[]) {
    try {
      localStorage.setItem(KEYS.LIBRARY, JSON.stringify(resources));
    } catch (e) {
      console.error(e);
    }
  },

  // Viva Sessions
  getVivaSessions(): VivaSession[] {
    try {
      const data = localStorage.getItem(KEYS.VIVA_SESSIONS);
      return data ? JSON.parse(data) : [DEMO_VIVA_SESSION];
    } catch {
      return [DEMO_VIVA_SESSION];
    }
  },

  saveVivaSessions(sessions: VivaSession[]) {
    try {
      localStorage.setItem(KEYS.VIVA_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error(e);
    }
  },

  // Notifications
  getNotifications(): NotificationItem[] {
    try {
      const data = localStorage.getItem(KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : DEMO_NOTIFICATIONS;
    } catch {
      return DEMO_NOTIFICATIONS;
    }
  },

  saveNotifications(notifications: NotificationItem[]) {
    try {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  },

  // Dynamic Signature Calculation: CRACK SCORE
  calculateCrackScore(): CrackScoreBreakdown {
    const subjects = this.getSubjects();
    const attempts = this.getQuizAttempts();
    const flashcards = this.getFlashcards();
    const user = this.getUser();
    const vivaSessions = this.getVivaSessions();
    const docs = this.getDocuments();

    // 1. Syllabus Coverage (avg)
    const syllabusCoverage = Math.round(
      subjects.reduce((acc, s) => acc + (s.syllabusCoverage || 70), 0) / (subjects.length || 1)
    );

    // 2. Quiz Accuracy (avg of recent attempts)
    let quizAccuracy = 75;
    if (attempts.length > 0) {
      quizAccuracy = Math.round(
        attempts.slice(0, 5).reduce((acc, a) => acc + a.accuracyPercentage, 0) / Math.min(5, attempts.length)
      );
    }

    // 3. Revision Rate (% of flashcards mastered + task completions)
    const masteredFc = flashcards.filter(f => f.isMastered).length;
    const revisionRate = Math.round(
      flashcards.length > 0 ? (masteredFc / flashcards.length) * 100 : 70
    );

    // 4. Consistency factor (streak based)
    const streakBonus = Math.min(100, (user.streakDays || 1) * 10);
    const consistency = Math.min(100, Math.round(streakBonus * 0.5 + 45));

    // 5. Viva Readiness
    let vivaReadiness = 80;
    if (vivaSessions.length > 0 && vivaSessions[0].overallReport) {
      vivaReadiness = vivaSessions[0].overallReport.score || 80;
    }

    // 6. Past Paper / Exam Radar Prep
    const pyqCount = docs.filter(d => d.type === 'pyq').length;
    const pastPaperPrep = Math.min(100, pyqCount >= 1 ? 85 : 55);

    // Overall Weighted Score
    // Syllabus: 25%, Quiz: 25%, Revision: 15%, Consistency: 15%, Viva: 10%, Past Paper: 10%
    const overallScore = Math.round(
      syllabusCoverage * 0.25 +
      quizAccuracy * 0.25 +
      revisionRate * 0.15 +
      consistency * 0.15 +
      vivaReadiness * 0.10 +
      pastPaperPrep * 0.10
    );

    let statusLabel = 'Getting Started';
    let tip = 'Complete today’s mission tasks to boost your score!';
    if (overallScore >= 85) {
      statusLabel = 'Top Rank Ready 🚀';
      tip = 'You are in the top 5% exam readiness tier. Keep sharpening weak topics!';
    } else if (overallScore >= 75) {
      statusLabel = 'Exam Ready ⚡';
      tip = 'Strong foundation. Drill on Section B 10-mark proofs to lock full marks.';
    } else if (overallScore >= 60) {
      statusLabel = 'Moderate Confidence 📈';
      tip = 'Focus 45 mins on Transactions and BCNF to jump over 80%.';
    } else {
      statusLabel = 'Crack Mode Recommended ⚠️';
      tip = 'Switch to Crack Mode to prioritize high-yield 90%+ probability questions.';
    }

    return {
      overallScore,
      syllabusCoverage,
      quizAccuracy,
      revisionRate,
      consistency,
      vivaReadiness,
      pastPaperPrep,
      statusLabel,
      tip,
    };
  },

  // Reset to clean demo state
  resetToDemo() {
    localStorage.clear();
  },
};

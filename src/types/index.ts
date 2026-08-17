export type LearningStyle = 'visual' | 'reading' | 'practice' | 'interactive' | 'mixed';
export type StudyGoal = 'pass' | 'score_high' | 'rank' | 'understand_concepts' | 'competitive_exams' | 'placements' | 'interview_prep';
export type ChatMode =
  | 'tutor'
  | 'math'
  | 'exam'
  | 'beginner'
  | 'coding'
  | 'document'
  | 'viva'
  | 'revision'
  | 'planner'
  | 'doubt-solver'
  | 'pyq'
  | 'interview'
  | 'wellness';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  degree: string;
  college: string;
  branch: string;
  semester: string;
  studyGoal: StudyGoal;
  dailyHours: number;
  learningStyle: LearningStyle;
  streakDays: number;
  totalStudyHours: number;
  academicScore: number;
  level: number;
  xp: number;
  isCrackModeActive: boolean;
  crackModeExamName?: string;
  crackModeDaysRemaining?: number;
  isAdmin?: boolean;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  semester: string;
  examDate?: string;
  masteryPercentage: number;
  syllabusCoverage: number;
  color: string;
  icon: string;
  units: {
    unitNumber: number;
    title: string;
    topics: string[];
    isCompleted?: boolean;
  }[];
  weakTopics: string[];
  strongTopics: string[];
}

export interface DocumentChunk {
  id: string;
  pageNumber: number;
  text: string;
  summary?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  type: 'pdf' | 'notes' | 'pyq' | 'syllabus' | 'textbook';
  fileSize: string;
  pageCount: number;
  uploadDate: string;
  uploadedAt?: string;
  extractedTextPreview?: string;
  rawContent?: string;
  summary?: string;
  keyFormulas?: { term: string; definition: string; importance: string }[];
  coreConcepts?: { name: string; description: string; pageReference: string }[];
  keyConcepts?: string[];
  predictedExamQuestions?: { question: string; marks: number; frequencyProb: string }[];
  tags: string[];
  isAnalyzed: boolean;
  isBookmarked?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  mode?: ChatMode;
  citations?: { page: number; docTitle: string; snippet: string }[];
  suggestedFollowUps?: string[];
  isVoiceInput?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  mode: ChatMode;
  subjectId?: string;
  subjectName?: string;
  messages: ChatMessage[];
  lastUpdated: string;
  isPinned?: boolean;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'coding';
  question: string;
  options?: string[];
  correctIndex?: number;
  correctAnswerText?: string;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  marks: number;
}

export interface Quiz {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  durationMinutes: number;
  questions: QuizQuestion[];
  isMockExam?: boolean;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  subjectName: string;
  score: number;
  totalMarks: number;
  accuracyPercentage: number;
  userAnswers: Record<string, number | string>;
  timeSpentSeconds: number;
  weakTopicsIdentified: string[];
  strongTopicsIdentified: string[];
  completedAt: string;
}

export interface VivaQuestion {
  id: string;
  question: string;
  expectedConcept?: string;
  difficulty?: string;
  studentAnswer?: string;
  score?: number;
  feedback?: string;
}

export interface VivaReport {
  score: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
  idealAnswer?: string;
  conceptBreakdown?: { concept: string; score: number }[];
}

export interface VivaSession {
  id: string;
  type: 'university' | 'project' | 'technical';
  subjectName: string;
  topicOrProjectTitle: string;
  questions: VivaQuestion[];
  overallReport?: VivaReport;
  completedAt?: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reviewCount: number;
  lastReviewed?: string;
  nextReviewDate?: string;
  isMastered: boolean;
}

export interface StudyTask {
  id: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  type: 'concept_revision' | 'practice_quiz' | 'flashcards' | 'mock_exam' | 'pyq_analysis';
  difficulty: 'Easy' | 'Medium' | 'High';
  reason: string;
  isCompleted: boolean;
}

export interface StudyPlan {
  id: string;
  modeName: string;
  targetExam: string;
  daysRemaining: number;
  dailyHours: number;
  isCrackMode: boolean;
  todayTasks: StudyTask[];
  weeklyRoadmap: { day: string; focus: string; hours: number }[];
  crackTip: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  date: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  focusScore: number; // 1 to 5
  type: 'pomodoro' | 'revision' | 'quiz' | 'reading';
}

export interface CalendarEvent {
  id: string;
  title: string;
  subject?: string;
  subjectName?: string;
  date: string;
  time?: string;
  type: 'exam' | 'assignment' | 'study_session' | 'viva' | 'deadline' | 'quiz' | 'submission' | 'study_block';
  priority: 'high' | 'medium' | 'low';
  countdownDays?: number;
  notes?: string;
}

export interface KnowledgeNode {
  id: string;
  subject: string;
  unit: string;
  topic: string;
  masteryStatus: 'strong' | 'moderate' | 'weak' | 'critical';
  masteryPercentage: number;
  lastTestedScore?: number;
  recommendedAction: string;
}

export interface ExamPriorityTopic {
  topic: string;
  priorityScore: number;
  frequency: string;
  marksWeightage: string;
  typicalQuestionType: string;
  strategicReason: string;
}

export interface ExamRadarData {
  subject: string;
  confidenceScore: number;
  topPriorityTopics: ExamPriorityTopic[];
  unitDistribution: { unit: string; percentage: number }[];
  highProbabilityQuestions: string[];
  expertAdvice: string;
}

export interface LibraryResource {
  id: string;
  title: string;
  author: string;
  category: string;
  subject: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  pages: number;
  fileFormat: string;
  description: string;
  tags: string[];
  license: string;
  sourceUrl?: string;
  coverGradient: string;
  isBookmarked?: boolean;
}

export interface CrackScoreBreakdown {
  overallScore: number;
  syllabusCoverage: number;
  quizAccuracy: number;
  revisionRate: number;
  consistency: number;
  vivaReadiness: number;
  pastPaperPrep: number;
  statusLabel: string;
  tip: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'exam_alert' | 'streak' | 'weak_topic' | 'quiz_ready' | 'daily_mission';
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

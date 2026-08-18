import React from 'react';
import {
  BarChart3,
  BookOpen,
  Bot,
  Calculator,
  Calendar,
  CalendarCheck,
  Clock,
  FileText,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Mic,
  Network,
  Radar,
  User,
} from 'lucide-react';
import { NavigationTab } from '../../context/AppContext';

export type NavigationGroup = 'Workspace' | 'Study' | 'Practice' | 'Tools' | 'Account';

export type NavigationItem = {
  id: NavigationTab;
  label: string;
  shortLabel: string;
  subtitle: string;
  group: NavigationGroup;
  icon: React.ReactNode;
  keywords: string[];
};

export const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Home Assistant',
    shortLabel: 'Home',
    subtitle: 'Study command center',
    group: 'Workspace',
    icon: <LayoutDashboard size={18} />,
    keywords: ['home', 'dashboard', 'command', 'assistant'],
  },
  {
    id: 'ai-tutor',
    label: 'AI Agents Copilot',
    shortLabel: 'AI',
    subtitle: 'Tutor, doubt solver, PYQ, planner, viva, coding',
    group: 'Workspace',
    icon: <Bot size={18} />,
    keywords: ['ai', 'tutor', 'chat', 'agents', 'doubt', 'pyq', 'planner'],
  },
  {
    id: 'math-solver',
    label: 'Math Solver',
    shortLabel: 'Math',
    subtitle: 'Engineering math and equation workspace',
    group: 'Workspace',
    icon: <Calculator size={18} />,
    keywords: ['math', 'solver', 'equation', 'calculus', 'engineering'],
  },
  {
    id: 'study-plan',
    label: 'Adaptive Study Plan',
    shortLabel: 'Plan',
    subtitle: 'Daily plan, roadmap, priorities',
    group: 'Study',
    icon: <CalendarCheck size={18} />,
    keywords: ['study', 'plan', 'roadmap', 'schedule'],
  },
  {
    id: 'focus-timer',
    label: 'Focus Pomodoro',
    shortLabel: 'Focus',
    subtitle: 'Timer and study sessions',
    group: 'Study',
    icon: <Clock size={18} />,
    keywords: ['focus', 'timer', 'pomodoro', 'session'],
  },
  {
    id: 'knowledge-map',
    label: 'Knowledge Map',
    shortLabel: 'Map',
    subtitle: 'Strong, weak, and critical topics',
    group: 'Study',
    icon: <Network size={18} />,
    keywords: ['knowledge', 'map', 'topics', 'weak'],
  },
  {
    id: 'library',
    label: 'Digital Library',
    shortLabel: 'Library',
    subtitle: 'Books, references, resources',
    group: 'Study',
    icon: <BookOpen size={18} />,
    keywords: ['library', 'books', 'resources', 'digital'],
  },
  {
    id: 'exam-radar',
    label: 'Exam Radar',
    shortLabel: 'Radar',
    subtitle: 'PYQ trends and predicted questions',
    group: 'Practice',
    icon: <Radar size={18} />,
    keywords: ['exam', 'radar', 'pyq', 'prediction'],
  },
  {
    id: 'quiz',
    label: 'AI Quiz & Mock Test',
    shortLabel: 'Quiz',
    subtitle: 'Practice, mock tests, review',
    group: 'Practice',
    icon: <HelpCircle size={18} />,
    keywords: ['quiz', 'mock', 'test', 'practice'],
  },
  {
    id: 'viva',
    label: 'AI Viva Simulator',
    shortLabel: 'Viva',
    subtitle: 'Oral exam and interview practice',
    group: 'Practice',
    icon: <Mic size={18} />,
    keywords: ['viva', 'oral', 'interview', 'voice'],
  },
  {
    id: 'flashcards',
    label: 'Spaced Flashcards',
    shortLabel: 'Cards',
    subtitle: 'Review and memory practice',
    group: 'Practice',
    icon: <Layers size={18} />,
    keywords: ['flashcards', 'spaced', 'review', 'memory'],
  },
  {
    id: 'document-ai',
    label: 'PDF & Document Studio',
    shortLabel: 'PDF',
    subtitle: 'Upload, read, explain, quiz',
    group: 'Tools',
    icon: <FileText size={18} />,
    keywords: ['pdf', 'document', 'upload', 'notes', 'document studio', 'reader'],
  },
  {
    id: 'calendar',
    label: 'Exam Calendar',
    shortLabel: 'Calendar',
    subtitle: 'Exams and milestones',
    group: 'Tools',
    icon: <Calendar size={18} />,
    keywords: ['calendar', 'exam', 'date', 'deadline'],
  },
  {
    id: 'analytics',
    label: 'Academic Analytics',
    shortLabel: 'Analytics',
    subtitle: 'Charts, progress, weak areas',
    group: 'Tools',
    icon: <BarChart3 size={18} />,
    keywords: ['analytics', 'charts', 'progress', 'performance'],
  },
  {
    id: 'profile',
    label: 'Student Profile',
    shortLabel: 'Profile',
    subtitle: 'Account and study preferences',
    group: 'Account',
    icon: <User size={18} />,
    keywords: ['profile', 'student', 'account'],
  },
];

export const navigationGroups: NavigationGroup[] = ['Workspace', 'Study', 'Practice', 'Tools', 'Account'];

export const getNavigationItem = (tab: NavigationTab): NavigationItem =>
  navigationItems.find(item => item.id === tab) || navigationItems[0];

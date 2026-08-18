import type { NavigationTab } from '../context/AppContext';
import type { ChatMode } from '../types';

export type CommandAction =
  | 'navigate'
  | 'theme'
  | 'crack-mode'
  | 'study-plan'
  | 'voice'
  | 'search'
  | 'answer';

export interface ParsedAppCommand {
  action: CommandAction;
  label: string;
  targetTab?: NavigationTab;
  theme?: 'dark' | 'light';
  chatMode?: ChatMode;
  shouldAskAi?: boolean;
  acknowledgement: string;
}

const navigationPatterns: Array<{
  tab: NavigationTab;
  label: string;
  mode?: ChatMode;
  patterns: RegExp[];
}> = [
  {
    tab: 'dashboard',
    label: 'Home',
    patterns: [/\b(home|dashboard|command center|main page)\b/i],
  },
  {
    tab: 'math-solver',
    label: 'Math Solver',
    mode: 'math',
    patterns: [/\b(math|mathematics|solve|calculate|equation|integral|derivative|matrix|probability|statistics|limit|differential)\b/i],
  },
  {
    tab: 'ai-tutor',
    label: 'AI Tutor',
    mode: 'tutor',
    patterns: [/\b(ai tutor|ai agent|tutor|explain|teach|doubt|concept)\b/i],
  },
  {
    tab: 'quiz',
    label: 'Quiz',
    patterns: [/\b(quiz|mock test|test me|practice test|mcq)\b/i],
  },
  {
    tab: 'study-plan',
    label: 'Study Plan',
    mode: 'planner',
    patterns: [/\b(study plan|plan|schedule|roadmap|today mission|revision plan)\b/i],
  },
  {
    tab: 'exam-radar',
    label: 'Exam Radar',
    mode: 'pyq',
    patterns: [/\b(exam radar|pyq|previous year|important questions|high yield|prediction)\b/i],
  },
  {
    tab: 'document-ai',
    label: 'PDF Learning Studio',
    mode: 'document',
    patterns: [/\b(pdf|document|notes|upload|reader|pptx|slides)\b/i],
  },
  {
    tab: 'viva',
    label: 'Viva Simulator',
    mode: 'viva',
    patterns: [/\b(viva|oral|examiner)\b/i],
  },
  {
    tab: 'flashcards',
    label: 'Flashcards',
    patterns: [/\b(flashcard|flash card|spaced repetition|revise cards)\b/i],
  },
  {
    tab: 'focus-timer',
    label: 'Focus Timer',
    patterns: [/\b(focus|pomodoro|timer|deep work)\b/i],
  },
  {
    tab: 'knowledge-map',
    label: 'Knowledge Map',
    patterns: [/\b(knowledge map|weak topic|mastery|learning map)\b/i],
  },
  {
    tab: 'library',
    label: 'Digital Library',
    patterns: [/\b(library|book|textbook|resources)\b/i],
  },
  {
    tab: 'analytics',
    label: 'Analytics',
    patterns: [/\b(analytics|progress|report|score|performance)\b/i],
  },
  {
    tab: 'calendar',
    label: 'Calendar',
    patterns: [/\b(calendar|exam date|deadline|event)\b/i],
  },
  {
    tab: 'profile',
    label: 'Profile',
    patterns: [/\b(profile|account|student profile|settings about me)\b/i],
  },
];

export function parseAppCommand(input: string): ParsedAppCommand | null {
  const text = input.trim();
  if (!text) return null;

  if (/\b(dark|night)\s+(mode|theme)\b|\bswitch\s+to\s+dark\b|\bturn\s+on\s+dark\b/i.test(text)) {
    return {
      action: 'theme',
      label: 'Dark theme',
      theme: 'dark',
      acknowledgement: 'Switching the whole app to dark theme.',
    };
  }

  if (/\b(light|day)\s+(mode|theme)\b|\bswitch\s+to\s+light\b|\bturn\s+on\s+light\b/i.test(text)) {
    return {
      action: 'theme',
      label: 'Light theme',
      theme: 'light',
      acknowledgement: 'Switching the whole app to light theme.',
    };
  }

  if (/\b(open|start|launch)\s+(voice|mic|microphone)|\bvoice assistant\b|\btalk to ai\b/i.test(text)) {
    return {
      action: 'voice',
      label: 'Voice Assistant',
      acknowledgement: 'Opening the multilingual voice assistant.',
    };
  }

  if (/\b(search|find|look for)\b/i.test(text)) {
    return {
      action: 'search',
      label: 'Global Search',
      acknowledgement: 'Opening global search.',
    };
  }

  if (/\b(crack mode|emergency sprint|high yield sprint)\b/i.test(text)) {
    return {
      action: 'crack-mode',
      label: 'Crack Mode',
      acknowledgement: 'Toggling Crack Mode and prioritizing high-yield revision.',
    };
  }

  if (/\b(regenerate|generate|make|create|update)\s+(my\s+)?(study\s+)?(plan|roadmap|schedule)\b/i.test(text)) {
    return {
      action: 'study-plan',
      label: 'Study Plan',
      targetTab: 'study-plan',
      chatMode: 'planner',
      shouldAskAi: true,
      acknowledgement: 'Creating a fresh study plan and opening the roadmap.',
    };
  }

  const explicitNavigation = /\b(open|go to|show|launch|take me to|switch to|start)\b/i.test(text);
  for (const item of navigationPatterns) {
    if (item.patterns.some(pattern => pattern.test(text))) {
      const isMathProblem = item.tab === 'math-solver' && looksLikeMathQuestion(text);
      const shouldAskAi = isMathProblem || (!explicitNavigation && Boolean(item.mode));
      return {
        action: explicitNavigation ? 'navigate' : shouldAskAi ? 'answer' : 'navigate',
        label: item.label,
        targetTab: item.tab,
        chatMode: item.mode,
        shouldAskAi,
        acknowledgement: explicitNavigation
          ? `Opening ${item.label}.`
          : shouldAskAi
            ? `Using ${item.label} for this request.`
            : `Opening ${item.label}.`,
      };
    }
  }

  return {
    action: 'answer',
    label: 'AI Tutor',
    targetTab: 'ai-tutor',
    chatMode: inferChatMode(text),
    shouldAskAi: true,
    acknowledgement: 'I will answer this with the best academic agent.',
  };
}

export function inferChatMode(input: string): ChatMode {
  if (looksLikeMathQuestion(input)) return 'math';
  if (/\b(code|program|algorithm|react|node|python|java|c\+\+|complexity|bug)\b/i.test(input)) return 'coding';
  if (/\b(viva|oral|examiner)\b/i.test(input)) return 'viva';
  if (/\b(pyq|previous year|important questions|marks)\b/i.test(input)) return 'pyq';
  if (/\b(plan|schedule|roadmap|timetable)\b/i.test(input)) return 'planner';
  if (/\b(stress|focus|sleep|anxiety|burnout)\b/i.test(input)) return 'wellness';
  if (/\b(exam|10\s*mark|5\s*mark|answer format)\b/i.test(input)) return 'exam';
  return 'tutor';
}

export function looksLikeMathQuestion(input: string): boolean {
  return /(?:\b(solve|calculate|evaluate|differentiate|integrate|derive|prove|simplify|factor|limit|matrix|determinant|probability|statistics|trigonometry|calculus|equation|root|logarithm)\b|[∫√Σπ∞≈≤≥]|[a-z]\s*\^\s*\d|[=+\-*/]\s*\d)/i.test(input);
}

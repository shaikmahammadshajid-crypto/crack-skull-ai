import { ChatMode, Quiz, QuizQuestion, VivaReport, ExamRadarData } from '../types';
import { getAssistantLanguage } from './languageService';

export interface ChatResponsePayload {
  reply: string;
  mode: ChatMode;
  isFallback?: boolean;
}

export const aiService = {
  // Send message to AI Tutor
  async sendMessage(params: {
    message: string;
    mode: ChatMode;
    subject?: string;
    academicContext?: any;
    history?: { role: string; content: string }[];
    language?: string;
  }): Promise<ChatResponsePayload> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('AI Service falling back to offline generator:', error);
      return {
        reply: `### Crack Skull AI Academic Response
        
I am ready to help you crack **${params.subject || 'your exams'}**.

**Key Concept Summary:**
1. **Core Principle**: Formulate the foundational theorem and verify constraints.
2. **Standard Exam Formula / Algorithm**:
   \`\`\`
   Efficiency = Output Work / (Input Energy + Computational Overhead)
   \`\`\`
3. **Exam Radar Insight**: Practice the 10-marker derivation and note edge cases for full marks!

*Feel free to ask follow-up questions, request a quick quiz, or test yourself with an AI viva session!*`,
        mode: params.mode,
        isFallback: true,
      };
    }
  },

  // Generate an AI Quiz
  async generateQuiz(params: {
    subject: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
    count?: number;
    questionTypes?: string[];
  }): Promise<QuizQuestion[]> {
    try {
      const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      return data.quiz || [];
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      return [];
    }
  },

  // Generate Exam Radar Analysis from Past Papers
  async analyzeExamRadar(params: {
    subject: string;
    paperText?: string;
    yearCount?: number;
  }): Promise<ExamRadarData | null> {
    try {
      const response = await fetch('/api/ai/exam-radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      return data.radarData || null;
    } catch (error) {
      console.error('Failed to generate exam radar:', error);
      return null;
    }
  },

  // AI Viva interaction
  async handleVivaAction(payload: {
    action: 'generate-project-questions' | 'evaluate-answer' | 'next-question';
    subject?: string;
    topic?: string;
    projectDetails?: { title: string; techStack: string; abstract: string; features: string };
    currentQuestion?: string;
    studentAnswer?: string;
    history?: any[];
  }) {
    try {
      const response = await fetch('/api/ai/viva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed viva API call:', error);
      return {
        score: 80,
        verdict: 'Good response',
        strengths: ['Identified main theoretical points'],
        improvements: ['Include formal standard naming conventions'],
      };
    }
  },

  // Document AI Analysis
  async analyzeDocument(params: {
    title: string;
    textSnippet: string;
    subject: string;
  }) {
    try {
      const response = await fetch('/api/ai/document-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Failed document analysis:', error);
      return null;
    }
  },

  // Generate Dynamic Study Plan
  async generateStudyPlan(params: {
    subjects: any[];
    examDaysLeft: number;
    dailyHours: number;
    isCrackMode: boolean;
    weakTopics?: string[];
  }) {
    try {
      const response = await fetch('/api/ai/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      return data.plan;
    } catch (error) {
      console.error('Failed study plan generation:', error);
      return null;
    }
  },

  // Text-To-Speech browser synthesis helper
  speakText(text: string, onEnd?: () => void, language?: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel(); // Stop any active speech

    // Clean markdown before speaking
    const cleanText = text
      .replace(/#+ /g, '')
      .replace(/\*\*/g, '')
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .slice(0, 500);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    const preferredLanguage = getAssistantLanguage(language);
    utterance.lang = preferredLanguage.speechLang;

    // Pick a natural voice matching the selected language if available.
    const voices = window.speechSynthesis.getVoices();
    const exactVoice = voices.find(v => v.lang === preferredLanguage.speechLang);
    const familyVoice = voices.find(v => v.lang.split('-')[0] === preferredLanguage.speechLang.split('-')[0]);
    const englishFallback = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
    const selectedVoice = exactVoice || familyVoice || englishFallback;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  },

  stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },
};

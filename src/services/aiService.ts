import { ChatMode, Quiz, QuizQuestion, VivaReport, ExamRadarData } from '../types';
import { getAssistantLanguage } from './languageService';

export interface ChatResponsePayload {
  reply: string;
  mode: ChatMode;
  isFallback?: boolean;
  provider?: 'nvidia' | 'gemini' | 'offline' | string;
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
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null);
      if (data?.reply) {
        return data;
      }
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      throw new Error('Server returned an empty AI response');
    } catch (error) {
      console.warn('AI Service falling back to offline generator:', error);
      return {
        reply: buildClientFallbackReply(params.message, params.mode, params.subject),
        mode: params.mode,
        isFallback: true,
        provider: 'offline',
      };
    } finally {
      window.clearTimeout(timeout);
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

function buildClientFallbackReply(message: string, mode: ChatMode, subject = 'General academics'): string {
  const topic = message.trim() || subject;
  const mathReply = buildOfflineMathReply(topic);
  if (mathReply) return mathReply;

  const isMath = /(solve|derive|calculate|prove|equation|integral|derivative|matrix|probability|statistics|formula|theorem|limit|sum)/i.test(topic);

  if (isMath) {
    return `### ${topic}

I could not reach the AI server, so here is the best offline answer format to use for this mathematical question.

#### 1. Given / Required
- Write the known values, assumptions, and constraints.
- Identify exactly what must be found or proved.

#### 2. Formula or Theorem
- Select the relevant formula, theorem, identity, or rule.
- Define every symbol before substitution.

#### 3. Step-by-Step Solution
1. Substitute the known values.
2. Simplify one transformation at a time.
3. Check signs, units, domains, and edge cases.
4. Box the final answer.

#### 4. Exam Tip
For full marks, show intermediate steps. Do not jump directly from formula to final answer.`;
  }

  return `### ${topic}

I could not reach the AI server, so here is a structured offline academic answer.

#### 1. Direct Definition
${topic} should be answered with a precise definition first, then the working principle or explanation.

#### 2. University Answer Structure
1. Definition
2. Core principle or working steps
3. Diagram/table or formula if applicable
4. Real-world or subject-specific example
5. Advantages, limitations, and applications
6. Common mistakes and exam keywords

#### 3. Model Answer Skeleton
A strong answer for **${topic}** explains what it is, why it is needed, how it works, and where it is applied. Add one clear example and end with limitations or important exam keywords.

#### 4. To Get an Exact ChatGPT-Style Answer
Start the app server and configure an AI key such as \`GEMINI_API_KEY\` or \`NVIDIA_API_KEY\`.`;
}

function buildOfflineMathReply(message: string): string | null {
  const definiteIntegral = message.match(/integrat(?:e|ion|al)?\s+(?:of\s+)?x\^?(\d+)\s+from\s+(-?\d+(?:\.\d+)?)\s+to\s+(-?\d+(?:\.\d+)?)/i);
  if (definiteIntegral) {
    const power = Number(definiteIntegral[1]);
    const lower = Number(definiteIntegral[2]);
    const upper = Number(definiteIntegral[3]);
    const newPower = power + 1;
    const upperValue = Math.pow(upper, newPower);
    const lowerValue = Math.pow(lower, newPower);
    const result = (upperValue - lowerValue) / newPower;

    return `### Definite Integral: ∫ x^${power} dx from ${lower} to ${upper}

#### Formula
\`\`\`text
∫ x^n dx = x^(n+1) / (n+1)
\`\`\`

#### Steps
\`\`\`text
∫[${lower} to ${upper}] x^${power} dx
= [x^${newPower} / ${newPower}] from ${lower} to ${upper}
= (${upper}^${newPower} / ${newPower}) - (${lower}^${newPower} / ${newPower})
= (${upperValue} / ${newPower}) - (${lowerValue} / ${newPower})
= ${formatNumber(result)}
\`\`\`

#### Final Answer
**Answer: ${formatNumber(result)}**`;
  }

  const derivative = message.match(/(?:differentiate|derivative\s+of|derive)\s+(?:of\s+)?x\^?(\d+)/i);
  if (derivative) {
    const power = Number(derivative[1]);
    return `### Derivative of x^${power}

#### Formula
\`\`\`text
d/dx(x^n) = n x^(n-1)
\`\`\`

#### Steps
\`\`\`text
d/dx(x^${power})
= ${power}x^(${power} - 1)
= ${power}x^${power - 1}
\`\`\`

#### Final Answer
**Answer: ${power}x^${power - 1}**`;
  }

  return null;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/\.?0+$/, '');
}

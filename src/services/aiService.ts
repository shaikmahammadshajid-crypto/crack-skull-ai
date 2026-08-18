import { ChatMode, QuizQuestion, ExamRadarData } from '../types';
import { getAssistantLanguage } from './languageService';

export interface ChatAttachmentPayload {
  name: string;
  type: string;
  kind: 'image' | 'document';
  text?: string;
  dataUrl?: string;
}

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
    attachments?: ChatAttachmentPayload[];
    allowFallback?: boolean;
  }): Promise<ChatResponsePayload> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45000);
    const allowFallback = params.allowFallback !== false;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || `Server returned ${response.status}`);
      }
      if (data?.reply) {
        if (data.isFallback && !allowFallback) {
          throw new Error('Live AI provider is unavailable.');
        }
        return data;
      }
      throw new Error('Server returned an empty AI response');
    } catch (error) {
      if (!allowFallback) {
        throw error;
      }
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
      return buildClientQuizFallback(params.subject, params.topic, params.difficulty, params.count || 5);
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
    const cleanText = sanitizeTextForSpeech(text).slice(0, 900);

    const preferredLanguage = getAssistantLanguage(language);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = preferredLanguage.speechLang.startsWith('en') ? 1.02 : 0.94;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    utterance.lang = preferredLanguage.speechLang;

    // Pick a natural voice matching the selected language if available.
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = selectSpeechVoice(voices, preferredLanguage.speechLang);
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

function sanitizeTextForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' Code block omitted. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/[*_~>#]/g, '')
    .replace(/={2,}/g, ' equals ')
    .replace(/-{3,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function selectSpeechVoice(voices: SpeechSynthesisVoice[], speechLang: string): SpeechSynthesisVoice | undefined {
  const langFamily = speechLang.split('-')[0];
  const qualityRank = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.toLowerCase();
    let score = 0;
    if (voice.lang === speechLang) score += 50;
    if (voice.lang.split('-')[0] === langFamily) score += 30;
    if (/natural|neural|premium|enhanced|google|microsoft|apple|samantha|lekha|veena|rishi/i.test(name)) score += 12;
    if (voice.localService) score += 3;
    if (/compact|basic|default/i.test(name)) score -= 5;
    return score;
  };

  return voices
    .filter(voice => voice.lang === speechLang || voice.lang.split('-')[0] === langFamily || voice.lang.startsWith('en'))
    .sort((a, b) => qualityRank(b) - qualityRank(a))[0];
}

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
  const quadratic = solveSimpleQuadratic(message);
  if (quadratic) {
    return `### Quadratic Equation: ${quadratic.display}

#### Given
\`\`\`text
${quadratic.display}
\`\`\`

#### Formula
\`\`\`text
For ax^2 + bx + c = 0:
x = (-b ± √(b^2 - 4ac)) / 2a
\`\`\`

#### Steps
\`\`\`text
a = ${quadratic.a}, b = ${quadratic.b}, c = ${quadratic.c}
D = b^2 - 4ac
D = (${quadratic.b})^2 - 4(${quadratic.a})(${quadratic.c})
D = ${quadratic.discriminant}
${quadratic.steps}
\`\`\`

#### Final Answer
**Answer: ${quadratic.answer}**`;
  }

  const definiteIntegral = message.match(/(?:integral|integrate|integration)\s+(?:of\s+)?x(?:\^|\*\*)?(\d+)\s+from\s+(-?\d+(?:\.\d+)?)\s+to\s+(-?\d+(?:\.\d+)?)/i);
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

  const derivativeExpression = extractDerivativeExpression(message);
  const derivativeTerms = derivativeExpression ? differentiatePolynomial(derivativeExpression) : null;
  if (derivativeExpression && derivativeTerms) {
    const steps = derivativeTerms.steps.map(step => `- ${step}`).join('\n');

    return `### Derivative of ${derivativeTerms.expression}

#### Given
\`\`\`text
d/dx(${derivativeTerms.expression})
\`\`\`

#### Formula
\`\`\`text
d/dx(x^n) = n x^(n-1)
d/dx(a + b) = d/dx(a) + d/dx(b)
\`\`\`

#### Steps
${steps}

#### Final Answer
**Answer: ${derivativeTerms.result}**`;
  }

  return null;
}

function solveSimpleQuadratic(message: string): {
  display: string;
  a: number;
  b: number;
  c: number;
  discriminant: number;
  steps: string;
  answer: string;
} | null {
  const compact = message.replace(/\s+/g, '').replace(/\*\*/g, '^');
  const match = compact.match(/([+-]?(?:\d+(?:\.\d+)?)?)x\^2([+-](?:\d+(?:\.\d+)?)?)x([+-]\d+(?:\.\d+)?)=0/i);
  if (!match) return null;

  const parseCoeff = (value: string) => {
    if (!value || value === '+') return 1;
    if (value === '-') return -1;
    return Number(value);
  };

  const a = parseCoeff(match[1]);
  const b = parseCoeff(match[2]);
  const c = Number(match[3]);
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c) || a === 0) return null;

  const discriminant = b * b - 4 * a * c;
  const display = `${formatPolynomialTerm(a, 2)} ${b < 0 ? '-' : '+'} ${formatPolynomialTerm(Math.abs(b), 1)} ${c < 0 ? '-' : '+'} ${formatNumber(Math.abs(c))} = 0`;
  if (discriminant < 0) {
    const real = formatNumber(-b / (2 * a));
    const imaginary = formatNumber(Math.sqrt(Math.abs(discriminant)) / (2 * a));
    return {
      display,
      a,
      b,
      c,
      discriminant,
      steps: `Since D < 0, roots are complex.\nx = ${real} ± ${imaginary}i`,
      answer: `x = ${real} ± ${imaginary}i`,
    };
  }

  const sqrtD = Math.sqrt(discriminant);
  const root1 = (-b + sqrtD) / (2 * a);
  const root2 = (-b - sqrtD) / (2 * a);

  return {
    display,
    a,
    b,
    c,
    discriminant,
    steps: `x = (-(${b}) ± √${discriminant}) / (2(${a}))\nx = (${formatNumber(-b)} ± ${formatNumber(sqrtD)}) / ${formatNumber(2 * a)}\nx1 = ${formatNumber(root1)}\nx2 = ${formatNumber(root2)}`,
    answer: root1 === root2 ? `x = ${formatNumber(root1)}` : `x = ${formatNumber(root1)}, ${formatNumber(root2)}`,
  };
}

function buildClientQuizFallback(subject: string, topic: string, difficulty: 'easy' | 'medium' | 'hard' | 'adaptive', count: number): QuizQuestion[] {
  const cleanTopic = topic || subject || 'Core Concepts';
  const isOop = /(oops|oop|object oriented|object-oriented|class|inheritance|polymorphism|encapsulation)/i.test(cleanTopic);
  const questions: QuizQuestion[] = isOop
    ? [
      {
        id: 'client_oop_1',
        type: 'mcq',
        question: 'Which OOP principle hides internal data and exposes controlled access through methods?',
        options: ['Encapsulation', 'Inheritance', 'Polymorphism', 'Compilation'],
        correctIndex: 0,
        explanation: 'Encapsulation protects object state by binding data with methods and limiting direct access.',
        topic: cleanTopic,
        difficulty,
        marks: 2,
      },
      {
        id: 'client_oop_2',
        type: 'mcq',
        question: 'Which OOP feature lets one interface behave differently for different object types?',
        options: ['Polymorphism', 'Indexing', 'Normalization', 'Deadlock'],
        correctIndex: 0,
        explanation: 'Polymorphism enables different implementations to be invoked through a common interface.',
        topic: cleanTopic,
        difficulty,
        marks: 2,
      },
    ]
    : [
      {
        id: 'client_gen_1',
        type: 'mcq',
        question: `What is the strongest first step when answering "${cleanTopic}" in an exam?`,
        options: ['Write a precise definition', 'Skip to the conclusion', 'Avoid examples', 'Write unrelated points'],
        correctIndex: 0,
        explanation: 'A precise definition anchors the answer and earns direct theory marks.',
        topic: cleanTopic,
        difficulty,
        marks: 2,
      },
      {
        id: 'client_gen_2',
        type: 'mcq',
        question: `Which structure gives a complete answer on "${cleanTopic}"?`,
        options: ['Definition, principle, steps, example, applications, limitations', 'Only a heading', 'Only a diagram', 'Only keywords'],
        correctIndex: 0,
        explanation: 'Complete university answers combine concept clarity, method, and application.',
        topic: cleanTopic,
        difficulty,
        marks: 2,
      },
    ];

  while (questions.length < count) {
    questions.push({
      ...questions[questions.length % 2],
      id: `client_fallback_${questions.length + 1}`,
      question: `Practice ${questions.length + 1}: ${questions[questions.length % 2].question}`,
    });
  }

  return questions.slice(0, count);
}

function extractDerivativeExpression(message: string): string | null {
  const match = message.match(/(?:differentiate|derivative\s+of|derive|d\/dx|find\s+the\s+derivative\s+of|solve\s+derivative\s+of)\s*(?:of\s+)?(.+)$/i);
  if (!match?.[1]) return null;
  const expression = match[1]
    .replace(/\s+(and|then)\s+(explain|show|give|tell)\b[\s\S]*$/i, '')
    .replace(/\s+with\s+respect\s+to\s+x\b[\s\S]*$/i, '')
    .replace(/[?.!]+$/g, '')
    .trim();
  return expression || null;
}

function differentiatePolynomial(expression: string): { expression: string; result: string; steps: string[] } | null {
  const compact = expression.replace(/\s+/g, '');
  if (!/^[+\-]?(?:\d*\.?\d*)?x(?:\^-?\d+)?(?:[+\-](?:(?:\d*\.?\d*)?x(?:\^-?\d+)?|\d+(?:\.\d+)?))*$/i.test(compact)) {
    return null;
  }

  const terms = compact.match(/[+\-]?[^+\-]+/g) || [];
  const derivedTerms: string[] = [];
  const steps: string[] = [];
  const formattedTerms: string[] = [];

  for (const term of terms) {
    const parsed = parsePolynomialTerm(term);
    if (!parsed) return null;
    const formatted = formatPolynomialTerm(parsed.coefficient, parsed.power);
    const derivative = formatPolynomialTerm(parsed.coefficient * parsed.power, parsed.power - 1);
    formattedTerms.push(formatted);
    if (derivative !== '0') {
      derivedTerms.push(derivative);
    }
    steps.push(`d/dx(${formatted}) = ${derivative}`);
  }

  return {
    expression: formattedTerms.join(' + ').replace(/\+ -/g, '- '),
    result: derivedTerms.length ? derivedTerms.join(' + ').replace(/\+ -/g, '- ') : '0',
    steps,
  };
}

function parsePolynomialTerm(term: string): { coefficient: number; power: number } | null {
  if (!term.includes('x')) {
    const constant = Number(term);
    return Number.isFinite(constant) ? { coefficient: constant, power: 0 } : null;
  }

  const match = term.match(/^([+\-]?\d*\.?\d*)?x(?:\^([+\-]?\d+))?$/i);
  if (!match) return null;
  const rawCoefficient = match[1];
  const coefficient = rawCoefficient === '' || rawCoefficient === undefined || rawCoefficient === '+'
    ? 1
    : rawCoefficient === '-'
      ? -1
      : Number(rawCoefficient);
  const power = match[2] === undefined ? 1 : Number(match[2]);
  if (!Number.isFinite(coefficient) || !Number.isFinite(power)) return null;
  return { coefficient, power };
}

function formatPolynomialTerm(coefficient: number, power: number): string {
  if (coefficient === 0) return '0';
  if (power === 0) return formatNumber(coefficient);

  const absCoeff = Math.abs(coefficient);
  const sign = coefficient < 0 ? '-' : '';
  const coeffText = absCoeff === 1 ? '' : formatNumber(absCoeff);
  const powerText = power === 1 ? 'x' : `x^${power}`;
  return `${sign}${coeffText}${powerText}`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/\.?0+$/, '');
}

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { findTopicKnowledge } from './src/services/academicKnowledge';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct';
const NVIDIA_TIMEOUT_MS = Number(process.env.NVIDIA_TIMEOUT_MS) || 35000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function callNvidiaChat(params: {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string | null> {
  const apiKey = process.env.NVIDIA_API_KEY || process.env.NVIDIA_INFERENCE_API_KEY || process.env.Vide_Coders;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NVIDIA_TIMEOUT_MS);

  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          ...(params.system ? [{ role: 'system', content: params.system }] : []),
          { role: 'user', content: params.prompt },
        ],
        temperature: params.temperature ?? 0.25,
        top_p: 0.9,
        max_tokens: params.maxTokens ?? 2200,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.warn(`NVIDIA API returned ${response.status}: ${errorText.slice(0, 300)}`);
      return null;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || null;
  } catch (error) {
    console.warn('NVIDIA API unavailable, falling back:', error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonFromText<T = any>(text: string | null | undefined, fallback: T): T {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1]);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'Crack Skull AI',
    version: '1.0.0',
    aiProvider: process.env.NVIDIA_API_KEY || process.env.NVIDIA_INFERENCE_API_KEY || process.env.Vide_Coders ? 'nvidia' : process.env.GEMINI_API_KEY ? 'gemini' : 'offline',
    hasNvidiaKey: !!(process.env.NVIDIA_API_KEY || process.env.NVIDIA_INFERENCE_API_KEY || process.env.Vide_Coders),
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

const languageNames: Record<string, string> = {
  auto: 'the same language as the student, auto-detected from their message',
  'en-US': 'English',
  'hi-IN': 'Hindi',
  'te-IN': 'Telugu',
  'ta-IN': 'Tamil',
  'kn-IN': 'Kannada',
  'ml-IN': 'Malayalam',
  'bn-IN': 'Bengali',
  'mr-IN': 'Marathi',
  'gu-IN': 'Gujarati',
  'ur-IN': 'Urdu',
  'es-ES': 'Spanish',
  'fr-FR': 'French',
  'ar-SA': 'Arabic',
};

// AI Chatbot endpoint with multilingual responses and specialized academic agents.
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, mode, subject, academicContext, history, language = 'auto' } = req.body;
    const ai = getGeminiClient();
    const responseLanguage = languageNames[language] || languageNames.auto;
    const multilingualRule = `Always answer in ${responseLanguage}. Preserve technical terms in English when they are standard exam or programming vocabulary, and add simple local-language explanations beside them when useful.`;

    const universityAnswerContract = `University answer quality contract:
- First identify the exact topic and answer that topic directly. Do not give a generic template.
- Use the syllabus/exam style: definition, principle, steps/derivation, diagram/table when useful, example, applications, limitations, common mistakes, and 2/5/10-mark answer cues.
- For mathematical questions, solve the actual problem. Show every transformation step, name the theorem/formula used, define symbols, verify constraints, and box the final answer.
- For theory questions, write like a high-scoring university answer: short intro, structured explanation, labeled subheadings, keywords, example, and conclusion.
- Cover any department if asked: engineering, science, medicine, pharmacy, nursing, law, commerce, management, humanities, mathematics, education, agriculture, competitive exams, placements, and practical projects.
- If the prompt is ambiguous, state the most likely interpretation and answer it; ask at most one clarifying question at the end.
- Never return only a study template when the student asks for an answer. If a complete numeric answer is not possible because data is missing, solve the symbolic/general case and say exactly what value is needed.
- For factual uncertainty, say what must be verified instead of inventing details.`;

    const systemInstructions: Record<string, string> = {
      tutor: `You are Crack Skull AI Tutor - an elite, encouraging, and razor-sharp academic tutor for university students.
Explain concepts step-by-step with intuitive analogies, structured points, visual ASCII or Markdown tables, and concrete examples. Focus on building deep conceptual understanding. Subject context: ${subject || 'General Engineering/Science'}.
${universityAnswerContract}
${multilingualRule}`,
      exam: `You are Crack Skull AI Exam Mode Copilot.
Provide concise, high-scoring exam-oriented answers structured with:
1. Definition & Core Formula
2. Key Points / Working Principle (with bullet points)
3. Step-by-step mechanism or diagram representation in text/code
4. Common exam trap/pitfall to avoid to get full marks.
Subject context: ${subject || 'Academic Preparation'}.
${universityAnswerContract}
${multilingualRule}`,
      beginner: `You are Crack Skull AI in 'Explain Like I'm 5 / Beginner Mode'.
Break down complex academic theories using everyday metaphors, zero confusing jargon, and intuitive real-world comparisons.
${universityAnswerContract}
${multilingualRule}`,
      coding: `You are Crack Skull AI Coding Mentor.
Provide clean, idiomatic code with line-by-line breakdown, time/space complexity analysis (Big O), edge cases, and testing suggestions.
${universityAnswerContract}
${multilingualRule}`,
      document: `You are Crack Skull AI Document Q&A Specialist.
Answer questions strictly based on the provided document excerpts. Cite page numbers or sections whenever available. If information is not in the text, clearly state that rather than hallucinating.
${universityAnswerContract}
${multilingualRule}`,
      viva: `You are a strict yet fair University Viva Examiner.
Ask probing technical questions, evaluate the student's answer, point out missing technical keywords, provide the ideal answer after evaluation, and teach the student from mistakes.
${universityAnswerContract}
${multilingualRule}`,
      revision: `You are Crack Skull AI Rapid Revision Coach.
Provide ultra-fast bulleted flash summaries, key formula cheat-sheets, and 3 critical memory retention anchors for last-minute review.
${universityAnswerContract}
${multilingualRule}`,
      planner: `You are Crack Skull AI Study Strategy Agent.
Create practical study timetables, break goals into time-boxed tasks, prioritize weak topics, and explain why each session matters.
${universityAnswerContract}
${multilingualRule}`,
      'doubt-solver': `You are Crack Skull AI Doubt Solver.
Diagnose exactly where the student is confused, ask one clarifying question only if required, then resolve the doubt with a minimal example and a check-your-understanding question.
${universityAnswerContract}
${multilingualRule}`,
      pyq: `You are Crack Skull AI Previous-Year Question Agent.
Predict exam angles, convert topics into likely 2-mark/5-mark/10-mark questions, and provide model answer skeletons with marking keywords.
${universityAnswerContract}
${multilingualRule}`,
      interview: `You are Crack Skull AI Placement Interview Agent.
Prepare the student for technical interviews with concise answers, follow-up questions, code traces, projects discussion, and recruiter-ready phrasing.
${universityAnswerContract}
${multilingualRule}`,
      wellness: `You are Crack Skull AI Study Wellness Agent.
Help students manage exam stress with short, practical routines, focus resets, sleep-aware planning, and non-medical wellbeing guidance. Encourage professional help for severe distress.
${universityAnswerContract}
${multilingualRule}`,
    };

    const chosenSystemInstruction = systemInstructions[mode] || systemInstructions.tutor;
    const prompt = `Student context: ${academicContext ? JSON.stringify(academicContext) : 'University Student'}
Subject: ${subject || 'General'}
Mode: ${mode || 'tutor'}
Response language: ${responseLanguage}

Previous history summary: ${Array.isArray(history) ? history.slice(-4).map((h: { role: string; content: string }) => `${h.role}: ${h.content}`).join('\n') : 'None'}

Student question/prompt: ${message}

Provide a comprehensive, ChatGPT-style Markdown response with clear headers, short paragraphs, bold keywords, code blocks, equations, worked steps, or tables where appropriate. Avoid vague filler and answer the student's exact question first.`;

    const nvidiaReply = await callNvidiaChat({
      system: chosenSystemInstruction,
      prompt,
      temperature: 0.2,
      maxTokens: 2600,
    });

    if (nvidiaReply) {
      return res.json({ reply: enhanceAcademicReply(nvidiaReply, message, subject), mode, isFallback: false, provider: 'nvidia' });
    }

    if (!ai) {
      return res.json({
        reply: generateOfflineAiReply(message, mode, subject, responseLanguage),
        mode,
        isFallback: true,
        provider: 'offline',
      });
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: chosenSystemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'Unable to generate response. Please try again.';
    res.json({ reply: enhanceAcademicReply(reply, message, subject), mode, isFallback: false, provider: 'gemini' });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    res.status(500).json({
      error: error.message || 'Internal AI Error',
      reply: generateOfflineAiReply(req.body.message || '', req.body.mode || 'tutor', req.body.subject, languageNames[req.body.language] || languageNames.auto),
      isFallback: true,
    });
  }
});

// AI Quiz Generator Endpoint
app.post('/api/ai/quiz', async (req, res) => {
  try {
    const { subject, topic, difficulty, count = 5, questionTypes = ['mcq'] } = req.body;
    const ai = getGeminiClient();

    const prompt = `Generate an exam-grade quiz for subject: "${subject}", topic: "${topic}".
Difficulty: ${difficulty} (easy, medium, hard, adaptive).
Number of questions: ${count}.
Question types included: ${questionTypes.join(', ')}.

Respond ONLY with a valid JSON array of objects with the following schema:
[
  {
    "id": "q1",
    "type": "mcq",
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed explanation of why this answer is correct and others are incorrect.",
    "topic": "${topic}",
    "difficulty": "${difficulty}",
    "marks": 2
  }
]`;

    const nvidiaQuizText = await callNvidiaChat({
      system: 'You generate strict valid JSON only. No markdown. No explanation outside JSON.',
      prompt,
      temperature: 0.2,
      maxTokens: 2600,
    });
    if (nvidiaQuizText) {
      return res.json({ quiz: parseJsonFromText(nvidiaQuizText, generateOfflineQuiz(subject, topic, difficulty, count)), isFallback: false, provider: 'nvidia' });
    }

    if (!ai) {
      return res.json({
        quiz: generateOfflineQuiz(subject, topic, difficulty, count),
        isFallback: true,
        provider: 'offline',
      });
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5,
      },
    });

    let quizData = [];
    try {
      quizData = JSON.parse(response.text || '[]');
    } catch {
      quizData = generateOfflineQuiz(subject, topic, difficulty, count);
    }

    res.json({ quiz: quizData, isFallback: false, provider: 'gemini' });
  } catch (error: any) {
    console.error('Quiz API Error:', error);
    res.json({
      quiz: generateOfflineQuiz(req.body.subject, req.body.topic, req.body.difficulty, req.body.count || 5),
      isFallback: true,
    });
  }
});

// AI Exam Radar & Past Paper Analyzer Endpoint
app.post('/api/ai/exam-radar', async (req, res) => {
  try {
    const { subject, paperText, yearCount = 5 } = req.body;
    const ai = getGeminiClient();

    const prompt = `Analyze historical university exam papers for subject: "${subject}".
Context / Paper sample text: "${paperText ? paperText.slice(0, 3000) : 'Standard University Semester Exam pattern'}".

Extract priority topics, recurring frequency probability, marks distribution, and strategic preparation advice.
Return ONLY valid JSON matching this schema:
{
  "subject": "${subject}",
  "confidenceScore": 94,
  "topPriorityTopics": [
    {
      "topic": "Topic name",
      "priorityScore": 92,
      "frequency": "High (Seen in 4 of last 5 years)",
      "marksWeightage": "15-20 Marks",
      "typicalQuestionType": "Long derivation / 10-marker / Case study",
      "strategicReason": "Foundational unit concept recurring in Part B compulsory questions."
    }
  ],
  "unitDistribution": [
    { "unit": "Unit 1: Fundamentals", "percentage": 25 },
    { "unit": "Unit 2: Core Mechanisms", "percentage": 30 },
    { "unit": "Unit 3: Advanced Optimization", "percentage": 25 },
    { "unit": "Unit 4: Case Studies & Applications", "percentage": 20 }
  ],
  "highProbabilityQuestions": [
    "Explain concept X with neat architectural diagram and state its 4 ACID properties.",
    "Differentiate between Approach A and Approach B with complexity trade-offs."
  ],
  "expertAdvice": "Focus 60% of your initial study time on Unit 2 & 3 as they account for over 50 marks."
}`;

    const nvidiaRadarText = await callNvidiaChat({
      system: 'You are an exam-paper analysis engine. Return strict valid JSON only.',
      prompt,
      temperature: 0.15,
      maxTokens: 2600,
    });
    if (nvidiaRadarText) {
      return res.json({ radarData: parseJsonFromText(nvidiaRadarText, generateOfflineExamRadar(subject)), isFallback: false, provider: 'nvidia' });
    }

    if (!ai) {
      return res.json({
        radarData: generateOfflineExamRadar(subject),
        isFallback: true,
        provider: 'offline',
      });
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    let radarData;
    try {
      radarData = JSON.parse(response.text || '{}');
    } catch {
      radarData = generateOfflineExamRadar(subject);
    }

    res.json({ radarData, isFallback: false, provider: 'gemini' });
  } catch (error: any) {
    console.error('Exam Radar API Error:', error);
    res.json({
      radarData: generateOfflineExamRadar(req.body.subject || 'DBMS'),
      isFallback: true,
    });
  }
});

// AI Viva Simulator Endpoint
app.post('/api/ai/viva', async (req, res) => {
  try {
    const { action, subject, topic, projectDetails, currentQuestion, studentAnswer, history = [] } = req.body;
    const ai = getGeminiClient();

    if (action === 'generate-project-questions') {
      const prompt = `You are a senior University Project Viva Examiner panel.
Project Title: ${projectDetails.title}
Tech Stack: ${projectDetails.techStack}
Abstract: ${projectDetails.abstract}
Key Features: ${projectDetails.features}

Generate 6 tough, insightful, practical viva questions that professors ask students to test if they actually built the project or used a template.
Respond ONLY with JSON:
{
  "questions": [
    {
      "id": "v1",
      "question": "Why did you choose PostgreSQL over MongoDB for your relational data schema?",
      "expectedConcept": "ACID compliance, relational integrity, complex join performance",
      "difficulty": "Hard"
    }
  ]
}`;

      const nvidiaProjectText = await callNvidiaChat({
        system: 'Return strict valid JSON only for university project viva questions.',
        prompt,
        temperature: 0.25,
        maxTokens: 2200,
      });
      if (nvidiaProjectText) {
        return res.json({ ...parseJsonFromText(nvidiaProjectText, { questions: [] }), provider: 'nvidia' });
      }

      if (!ai) {
        return res.json({ ...generateOfflineVivaResponse(action, subject, topic, currentQuestion, studentAnswer, history), provider: 'offline' });
      }

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      return res.json(JSON.parse(response.text || '{"questions":[]}'));
    }

    if (action === 'evaluate-answer') {
      const prompt = `Evaluate the student's answer in a university viva session.
Subject: ${subject}
Topic: ${topic}
Question: "${currentQuestion}"
Student's Answer: "${studentAnswer}"

Provide a constructive evaluation and rate out of 100. You must teach the student by showing what was missing and the correct ideal answer.
Respond ONLY in JSON format:
{
  "score": 85,
  "verdict": "Strong / Good / Needs Improvement / Weak",
  "strengths": ["Clear definition", "Mentioned key principles"],
  "improvements": ["Missing technical term X", "Could provide a 1-sentence example"],
  "missingKeywords": ["keyword 1", "keyword 2"],
  "mistakeAnalysis": "Explain exactly what was wrong or incomplete in the student's answer.",
  "idealAnswer": "Here is the ideal 3-sentence high-scoring examiner response...",
  "microLesson": "Short lesson the student should remember next time.",
  "followUpQuestion": "Next viva question to test deeper comprehension"
}`;

      const nvidiaEvalText = await callNvidiaChat({
        system: 'You are a strict university viva examiner. Return strict valid JSON only.',
        prompt,
        temperature: 0.1,
        maxTokens: 2200,
      });
      if (nvidiaEvalText) {
        const rawEvaluation = parseJsonFromText(nvidiaEvalText, generateOfflineVivaResponse(action, subject, topic, currentQuestion, studentAnswer, history));
        return res.json({ ...normalizeVivaEvaluation(rawEvaluation, subject, topic, currentQuestion, studentAnswer, history), provider: 'nvidia' });
      }

      if (!ai) {
        return res.json({ ...generateOfflineVivaResponse(action, subject, topic, currentQuestion, studentAnswer, history), provider: 'offline' });
      }

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      return res.json(JSON.parse(response.text || '{}'));
    }

    // Default next question
    const prompt = `Subject: ${subject}, Topic: ${topic}.
Previous conversation: ${JSON.stringify(history.slice(-3))}
Generate the next probing viva question that a college examiner would ask. It must be specific to the topic and different from previous questions.
Respond ONLY in JSON:
{
  "question": "Question text",
  "expectedKeypoints": ["point 1", "point 2"],
  "difficulty": "Medium"
}`;

    const nvidiaQuestionText = await callNvidiaChat({
      system: 'You generate strict valid JSON only for university viva questions.',
      prompt,
      temperature: 0.35,
      maxTokens: 1000,
    });
    if (nvidiaQuestionText) {
      return res.json({ ...parseJsonFromText(nvidiaQuestionText, generateOfflineVivaResponse(action, subject, topic, currentQuestion, studentAnswer, history)), provider: 'nvidia' });
    }

    if (!ai) {
      return res.json({ ...generateOfflineVivaResponse(action, subject, topic, currentQuestion, studentAnswer, history), provider: 'offline' });
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Viva API Error:', error);
    res.json(generateOfflineVivaResponse(req.body.action, req.body.subject, req.body.topic, req.body.currentQuestion, req.body.studentAnswer, req.body.history || []));
  }
});

// Document AI & PDF Analyzer Endpoint
app.post('/api/ai/document-analyze', async (req, res) => {
  try {
    const { title, textSnippet, subject } = req.body;
    const ai = getGeminiClient();

    const prompt = `Analyze this academic document/notes/PDF titled "${title}" for subject "${subject}".
Content preview: "${(textSnippet || '').slice(0, 4000)}"

Generate structured learning insights and study package.
Respond ONLY with JSON:
{
  "summary": "2-3 paragraph executive academic summary of the core concepts in this document.",
  "keyFormulasDefinitions": [
    { "term": "Term/Formula Name", "definition": "Formal definition & mathematical notation", "importance": "High" }
  ],
  "coreConcepts": [
    { "name": "Concept Name", "description": "Crisp summary", "pageReference": "Pages 12-14" }
  ],
  "predictedExamQuestions": [
    { "question": "Predicted university exam question", "marks": 10, "frequencyProb": "88%" }
  ],
  "flashcards": [
    { "front": "What are the 4 ACID properties in DBMS?", "back": "Atomicity (all or nothing), Consistency (preserves invariants), Isolation (concurrent execution serializability), Durability (committed changes persist)." }
  ],
  "quickQuiz": [
    {
      "question": "Sample verification question",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Why A is correct"
    }
  ]
}`;

    const nvidiaDocText = await callNvidiaChat({
      system: 'You are an academic document analysis engine. Return strict valid JSON only.',
      prompt,
      temperature: 0.15,
      maxTokens: 3000,
    });
    if (nvidiaDocText) {
      return res.json({
        analysis: parseJsonFromText(nvidiaDocText, generateOfflineDocAnalysis(title, subject)),
        isFallback: false,
        provider: 'nvidia',
      });
    }

    if (!ai) {
      return res.json({
        analysis: generateOfflineDocAnalysis(title, subject),
        isFallback: true,
        provider: 'offline',
      });
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    res.json({
      analysis: JSON.parse(response.text || '{}'),
      isFallback: false,
      provider: 'gemini',
    });
  } catch (error: any) {
    console.error('Document Analyze API Error:', error);
    res.json({
      analysis: generateOfflineDocAnalysis(req.body.title || 'Document', req.body.subject || 'General'),
      isFallback: true,
    });
  }
});

// AI Study Planner & Crack Mode Generator
app.post('/api/ai/study-plan', async (req, res) => {
  try {
    const { subjects, examDaysLeft, dailyHours, isCrackMode, weakTopics = [] } = req.body;
    const ai = getGeminiClient();

    const prompt = `Create an optimized academic study plan.
Subjects: ${JSON.stringify(subjects)}
Days until major exam: ${examDaysLeft}
Available daily study hours: ${dailyHours}
Mode: ${isCrackMode ? 'CRACK MODE (Intensive high-yield crash preparation)' : 'Standard Adaptive Learning'}
Student's weak topics: ${JSON.stringify(weakTopics)}

Respond ONLY with valid JSON:
{
  "modeName": "${isCrackMode ? 'Crack Mode Crash Course' : 'Adaptive Mastery Plan'}",
  "targetExam": "${subjects[0]?.name || 'Semester Final'}",
  "daysRemaining": ${examDaysLeft},
  "todayMission": {
    "title": "Today's High-Yield Mission",
    "totalEstimatedMinutes": 105,
    "tasks": [
      {
        "id": "t1",
        "subject": "DBMS",
        "topic": "Transactions & Concurrency Control",
        "durationMinutes": 45,
        "type": "concept_revision",
        "difficulty": "High",
        "reason": "Flagged as weak area from recent quiz."
      },
      {
        "id": "t2",
        "subject": "DBMS",
        "topic": "SQL Complex Joins & Subqueries",
        "durationMinutes": 30,
        "type": "practice_quiz",
        "difficulty": "Medium",
        "reason": "High frequency in previous 5 years papers."
      },
      {
        "id": "t3",
        "subject": "DBMS",
        "topic": "20 Flashcards Drill",
        "durationMinutes": 15,
        "type": "flashcards",
        "difficulty": "Easy",
        "reason": "Spaced repetition retention reminder."
      }
    ]
  },
  "weeklyRoadmap": [
    { "day": "Day 1", "focus": "Core Algorithms & Concurrency", "hours": ${dailyHours} },
    { "day": "Day 2", "focus": "Normalization & Schema Design", "hours": ${dailyHours} },
    { "day": "Day 3", "focus": "Full Mock Exam Simulation & Review", "hours": ${dailyHours} }
  ],
  "crackTip": "Spend your first 30 minutes solving 10-mark long questions before taking MCQs."
}`;

    const nvidiaPlanText = await callNvidiaChat({
      system: 'You are an academic planning engine. Return strict valid JSON only.',
      prompt,
      temperature: 0.2,
      maxTokens: 2600,
    });
    if (nvidiaPlanText) {
      return res.json({
        plan: parseJsonFromText(nvidiaPlanText, generateOfflineStudyPlan(subjects, examDaysLeft, dailyHours, isCrackMode, weakTopics)),
        isFallback: false,
        provider: 'nvidia',
      });
    }

    if (!ai) {
      return res.json({
        plan: generateOfflineStudyPlan(subjects, examDaysLeft, dailyHours, isCrackMode, weakTopics),
        isFallback: true,
        provider: 'offline',
      });
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    res.json({
      plan: JSON.parse(response.text || '{}'),
      isFallback: false,
      provider: 'gemini',
    });
  } catch (error: any) {
    console.error('Study Plan API Error:', error);
    res.json({
      plan: generateOfflineStudyPlan(req.body.subjects, req.body.examDaysLeft, req.body.dailyHours, req.body.isCrackMode, req.body.weakTopics),
      isFallback: true,
    });
  }
});

// Fallback Helper Data Generators
function generateOfflineAiReply(message: string, mode: string, subject?: string, responseLanguage = 'English'): string {
  const languageNote = responseLanguage === languageNames.auto
    ? 'I will mirror the language you use in your question when the online AI model is available.'
    : `Preferred response language: ${responseLanguage}. Offline answers are limited, but the configured live AI assistant will fully respond in this language.`;

  const cleanMsg = message.toLowerCase();
  const topic = extractTopic(message, subject);
  const modeTitle = String(mode || 'tutor').replace(/-/g, ' ');
  const knowledge = findTopicKnowledge(message, subject);
  const offlineMathReply = generateOfflineMathReply(message, subject, languageNote);
  if (offlineMathReply) return offlineMathReply;

  if (cleanMsg.includes('binary search') || cleanMsg.includes('search algorithm')) {
    return `### Binary Search Algorithm

${languageNote}

**Binary Search** is an efficient divide-and-conquer algorithm for finding an element in a **sorted array** with a time complexity of **$O(\\log N)$**.

---

#### 📌 Core Mechanism
1. Compare target with the **middle element**:
   \`\`\`
   mid = low + (high - low) / 2;
   \`\`\`
2. If \`target == arr[mid]\`, return index \`mid\`.
3. If \`target < arr[mid]\`, search left half: \`high = mid - 1\`.
4. If \`target > arr[mid]\`, search right half: \`low = mid + 1\`.
5. Repeat until \`low > high\`.

---

#### 💻 Implementation (TypeScript/C++)
\`\`\`typescript
function binarySearch(arr: number[], target: number): number {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1; // Not found
}
\`\`\`

---

#### Exam Radar Tips:
* **Pre-condition**: Array MUST be sorted (Common 2-mark viva trick question!).
* **Space Complexity**: Iterative is **$O(1)$**, Recursive is **$O(\\log N)$** due to call stack.
* **Overflow Prevention**: Always use \`low + (high - low) / 2\` instead of \`(low + high) / 2\` in languages like Java/C++.`;
  }

  if (cleanMsg.includes('acid') || cleanMsg.includes('transaction')) {
    return `${languageNote}

### ACID Properties in DBMS

**Atomicity**: A transaction is all-or-nothing. If one step fails, the whole transaction rolls back.

**Consistency**: A transaction must move the database from one valid state to another valid state without breaking constraints.

**Isolation**: Concurrent transactions should behave as if they ran one after another.

**Durability**: Once committed, data survives crashes using logs or stable storage.

**Exam answer structure**:
1. Define ACID.
2. Explain each property in 2-3 lines.
3. Use a bank transfer example.
4. Mention rollback, commit, concurrency, and recovery keywords.

**Real-life example**: When A sends money to B, debit and credit must both happen. If the app crashes after debit but before credit, Atomicity rolls back the debit.`;
  }

  if (cleanMsg.includes('normalization') || cleanMsg.includes('bcnf') || cleanMsg.includes('3nf')) {
    return `${languageNote}

### Database Normalization

Normalization organizes tables to reduce duplicate data and avoid update, insert, and delete anomalies.

| Form | Main Rule | Exam Focus |
|------|-----------|------------|
| 1NF | Atomic values only | No repeating groups |
| 2NF | No partial dependency | Applies when key is composite |
| 3NF | No transitive dependency | Non-key should not depend on non-key |
| BCNF | Every determinant is a superkey | Stronger than 3NF |

**How to solve exam problems**:
1. List functional dependencies.
2. Find candidate keys using closure.
3. Check each normal form rule.
4. Decompose only when a dependency violates the target normal form.`;
  }

  if (cleanMsg.includes('2pl') || cleanMsg.includes('two phase locking') || cleanMsg.includes('serializable')) {
    return `${languageNote}

### Two-Phase Locking (2PL)

2PL is a concurrency-control protocol that guarantees conflict serializability.

**Phases**:
1. Growing phase: transaction can acquire locks but cannot release locks.
2. Shrinking phase: transaction can release locks but cannot acquire new locks.

**Strict 2PL** holds exclusive locks until commit/abort, preventing cascading rollbacks.

**Common viva question**: Does 2PL prevent deadlock? No. It guarantees serializability, but deadlocks can still occur.`;
  }

  if (cleanMsg.includes('deadlock')) {
    return `${languageNote}

### Deadlock

A deadlock happens when processes wait forever because each process holds a resource needed by another process.

**Four necessary conditions**:
1. Mutual exclusion
2. Hold and wait
3. No preemption
4. Circular wait

**Handling methods**: prevention, avoidance using Banker algorithm, detection and recovery.

**Exam tip**: For Banker algorithm, always show Available, Need, Allocation, and the safe sequence.`;
  }

  if (String(mode).includes('planner') || cleanMsg.includes('plan') || cleanMsg.includes('schedule')) {
    const planTopic = subject || topic;
    return `${languageNote}

### 2-Hour Study Plan for ${planTopic}

| Time | Task | Output |
|------|------|--------|
| 0-25 min | Learn core theory of ${planTopic} | 1-page notes |
| 25-30 min | Break | Reset focus |
| 30-55 min | Solve 3 examples/PYQs | Mark weak points |
| 55-65 min | Break | No phone scrolling |
| 65-95 min | Make flashcards/formulas | 10 recall cards |
| 95-115 min | Quick quiz | Check accuracy |
| 115-120 min | Final recap | List next doubts |

Start with the weakest subtopic first. Do not read passively for the full two hours.`;
  }

  if (String(mode).includes('pyq') || cleanMsg.includes('previous') || cleanMsg.includes('question')) {
    return `${languageNote}

### Likely PYQ Angles for ${topic}

**2-mark questions**:
- Define ${topic}.
- State two advantages and two limitations.

**5-mark questions**:
- Explain ${topic} with a neat example.
- Differentiate ${topic} from the related alternative.

**10-mark questions**:
- Explain the full working of ${topic}, draw the diagram/table if applicable, and discuss edge cases.

**Answer skeleton**: Definition -> diagram/table -> steps -> example -> exam keyword conclusion.`;
  }

  if (String(mode).includes('viva') || cleanMsg.includes('viva')) {
    return `${languageNote}

### Viva Practice: ${topic}

1. What is ${topic} in one sentence?
2. Why is it needed in real systems?
3. What is one limitation or failure case?
4. Can you give a practical example?
5. How would you compare it with a related concept?

Answer each in 20-40 seconds. Use exact technical keywords first, then examples.`;
  }

  const examTable = knowledge.keypoints.map((point, index) => `| ${index + 1} | ${point} |`).join('\n');
  const keywords = knowledge.examKeywords.map(keyword => `\`${keyword}\``).join(', ');
  const mistakes = knowledge.commonMistakes.map(item => `- ${item}`).join('\n');
  const viva = knowledge.vivaQuestions.map((question, index) => `${index + 1}. ${question}`).join('\n');

  return `### ${knowledge.title}

${languageNote}

**Mode:** ${modeTitle}
**Subject:** ${subject || 'General academics'}

#### 1. Exact Definition
${knowledge.definition}

#### 2. University Answer Points
| No. | Point |
|-----|-------|
${examTable}

#### 3. High-Scoring Model Answer
${knowledge.idealAnswer}

#### 4. Must-Use Exam Keywords
${keywords}

#### 5. Common Mistakes to Avoid
${mistakes}

#### 6. Viva Practice Questions
${viva}

Live AI is not configured or reachable on this deployment right now, so this is the improved offline academic fallback. Add \`NVIDIA_API_KEY\`, \`Vide_Coders\`, or \`GEMINI_API_KEY\` in your environment to enable full exact AI responses.`;
}

function enhanceAcademicReply(reply: string, message: string, subject?: string): string {
  const knowledge = findTopicKnowledge(message, subject);
  if (!knowledge.examKeywords.length || reply.includes('Verified University Checklist')) {
    return reply;
  }

  const checklist = `\n\n---\n\n### Verified University Checklist\n\n**Exact topic:** ${knowledge.title}\n\n**Must-use exam keywords:** ${knowledge.examKeywords.map(keyword => `\`${keyword}\``).join(', ')}\n\n**High-scoring model point:** ${knowledge.idealAnswer}\n\n**Common mistakes to avoid:**\n${knowledge.commonMistakes.map(item => `- ${item}`).join('\n')}`;

  return `${reply}${checklist}`;
}

function generateOfflineMathReply(message: string, subject = 'Mathematics', languageNote: string): string | null {
  const definiteIntegral = message.match(/integrat(?:e|ion|al)?\s+(?:of\s+)?x\^?(\d+)\s+from\s+(-?\d+(?:\.\d+)?)\s+to\s+(-?\d+(?:\.\d+)?)/i);
  if (definiteIntegral) {
    const power = Number(definiteIntegral[1]);
    const lower = Number(definiteIntegral[2]);
    const upper = Number(definiteIntegral[3]);
    const newPower = power + 1;
    const coefficient = 1 / newPower;
    const upperValue = Math.pow(upper, newPower);
    const lowerValue = Math.pow(lower, newPower);
    const result = coefficient * (upperValue - lowerValue);

    return `### Definite Integral: ∫ x^${power} dx from ${lower} to ${upper}

${languageNote}

#### 1. Given
Evaluate:

\`\`\`text
∫[${lower} to ${upper}] x^${power} dx
\`\`\`

#### 2. Formula Used
Power rule of integration:

\`\`\`text
∫ x^n dx = x^(n+1) / (n+1), where n ≠ -1
\`\`\`

Here, **n = ${power}**, so:

\`\`\`text
∫ x^${power} dx = x^${newPower} / ${newPower}
\`\`\`

#### 3. Step-by-Step Solution
\`\`\`text
∫[${lower} to ${upper}] x^${power} dx
= [x^${newPower} / ${newPower}] from ${lower} to ${upper}
= (${upper}^${newPower} / ${newPower}) - (${lower}^${newPower} / ${newPower})
= (${upperValue} / ${newPower}) - (${lowerValue} / ${newPower})
= ${formatNumber(result)}
\`\`\`

#### 4. Final Answer

**Answer: ${formatNumber(result)}**

#### 5. Exam Note
Mention the **power rule**, write the substitution of upper and lower limits clearly, and do not forget the subtraction order: **upper limit value - lower limit value**.`;
  }

  const derivative = message.match(/(?:differentiate|derivative\s+of|derive)\s+(?:of\s+)?x\^?(\d+)/i);
  if (derivative) {
    const power = Number(derivative[1]);
    const newPower = power - 1;

    return `### Derivative of x^${power}

${languageNote}

#### 1. Formula Used
Power rule of differentiation:

\`\`\`text
d/dx(x^n) = n x^(n-1)
\`\`\`

#### 2. Step-by-Step Solution
\`\`\`text
d/dx(x^${power})
= ${power}x^(${power} - 1)
= ${power}x^${newPower}
\`\`\`

#### 3. Final Answer

**Answer: ${power}x^${newPower}**`;
  }

  return null;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/\.?0+$/, '');
}

function extractTopic(message: string, subject?: string): string {
  const cleaned = message
    .replace(/^(explain|what is|define|describe|give|make|create|tell me|how to|please)\s+/i, '')
    .replace(/\?+$/g, '')
    .trim();
  return cleaned || subject || 'the selected topic';
}

function generateOfflineQuiz(subject = 'DBMS', topic = 'Transactions & ACID', difficulty = 'Medium', count = 5) {
  const questions = [
    {
      id: 'q1',
      type: 'mcq',
      question: 'Which property of ACID guarantees that all operations within a transaction are completed successfully or none are applied?',
      options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
      correctIndex: 0,
      explanation: 'Atomicity follows the "all-or-nothing" rule. If any statement fails, the entire transaction is rolled back.',
      topic,
      difficulty,
      marks: 2,
    },
    {
      id: 'q2',
      type: 'mcq',
      question: 'In database systems, what is a "Dirty Read"?',
      options: [
        'A transaction reads uncommitted data written by another concurrent transaction',
        'A transaction reads deleted table rows',
        'A query executed on a non-indexed column',
        'A transaction that cannot acquire an exclusive lock',
      ],
      correctIndex: 0,
      explanation: 'A dirty read occurs when Transaction A reads data modified by Transaction B before Transaction B commits. If B rolls back, A holds invalid data.',
      topic,
      difficulty,
      marks: 2,
    },
    {
      id: 'q3',
      type: 'mcq',
      question: 'Which Normal Form eliminates Transitive Functional Dependencies (X → Y and Y → Z)?',
      options: ['1NF (First Normal Form)', '2NF (Second Normal Form)', '3NF (Third Normal Form)', 'BCNF (Boyce-Codd Normal Form)'],
      correctIndex: 2,
      explanation: 'Third Normal Form (3NF) requires a relation to be in 2NF and have no transitive dependencies of non-prime attributes on candidate keys.',
      topic: 'Normalization',
      difficulty: 'Medium',
      marks: 2,
    },
    {
      id: 'q4',
      type: 'mcq',
      question: 'What is the primary objective of the Two-Phase Locking (2PL) protocol?',
      options: [
        'To prevent deadlocks completely',
        'To guarantee serializability in concurrent execution',
        'To compress database index pages',
        'To increase query execution parallel throughput indefinitely',
      ],
      correctIndex: 1,
      explanation: '2PL ensures conflict serializability by having a growing phase (locks acquired) and a shrinking phase (locks released).',
      topic: 'Concurrency Control',
      difficulty: 'Hard',
      marks: 3,
    },
    {
      id: 'q5',
      type: 'mcq',
      question: 'Which SQL clause is executed FIRST in the standard logical query processing order?',
      options: ['SELECT', 'WHERE', 'FROM', 'HAVING'],
      correctIndex: 2,
      explanation: 'Logical query processing starts with FROM (and JOIN), followed by WHERE, GROUP BY, HAVING, SELECT, DISTINCT, and ORDER BY.',
      topic: 'SQL Mastery',
      difficulty: 'Medium',
      marks: 2,
    },
  ];

  return questions.slice(0, count);
}

function generateOfflineExamRadar(subject = 'DBMS') {
  return {
    subject,
    confidenceScore: 94,
    topPriorityTopics: [
      {
        topic: 'SQL Joins, Subqueries & Aggregations',
        priorityScore: 92,
        frequency: 'High (Present in 5 of last 5 years)',
        marksWeightage: '16–20 Marks',
        typicalQuestionType: 'Practical query writing + Query tree optimization',
        strategicReason: 'Appears as compulsory Section B questions every year with high scoring potential.',
      },
      {
        topic: 'Normalization (1NF, 2NF, 3NF, BCNF)',
        priorityScore: 86,
        frequency: 'High (Present in 4 of last 5 years)',
        marksWeightage: '12–16 Marks',
        typicalQuestionType: 'Decomposition proof & Lossless join verification',
        strategicReason: 'Core theoretical pillar; examiners evaluate step-by-step dependency closure calculation.',
      },
      {
        topic: 'Transactions, ACID & Concurrency Control',
        priorityScore: 78,
        frequency: 'Medium-High (3 of last 5 years)',
        marksWeightage: '10–14 Marks',
        typicalQuestionType: 'Schedule conflict serializability testing & 2PL',
        strategicReason: 'High discriminator topic where students often lose marks on dirty reads and phantom rows.',
      },
      {
        topic: 'B+ Trees & Indexing Mechanisms',
        priorityScore: 68,
        frequency: 'Medium (3 of last 5 years)',
        marksWeightage: '8–10 Marks',
        typicalQuestionType: 'Insertion/Deletion trace in B+ Tree of order p',
        strategicReason: 'Predictable structural question. Easy to score 10/10 if insertion splitting algorithm is memorized.',
      },
      {
        topic: 'ER Modeling & Relational Schema Mapping',
        priorityScore: 54,
        frequency: 'Regular (2 of last 5 years)',
        marksWeightage: '6–10 Marks',
        typicalQuestionType: 'ER diagram drawing for Hospital/University system',
        strategicReason: 'Standard opening question in Part A/B.',
      },
    ],
    unitDistribution: [
      { unit: 'Unit 1: ER Model & Relational Algebra', percentage: 20 },
      { unit: 'Unit 2: SQL & Schema Design', percentage: 28 },
      { unit: 'Unit 3: Normalization & Functional Dependencies', percentage: 24 },
      { unit: 'Unit 4: Transaction & Concurrency', percentage: 18 },
      { unit: 'Unit 5: Storage & Indexing', percentage: 10 },
    ],
    highProbabilityQuestions: [
      'Explain ACID properties with real-world banking transaction example (8 Marks).',
      'Test whether the given concurrent schedule S is Conflict Serializable or not (6 Marks).',
      'Given a relation R(A,B,C,D,E) with FDs, find candidate keys and determine highest normal form (10 Marks).',
      'Differentiate between Dense and Sparse Indexing with neat diagrams (5 Marks).',
    ],
    expertAdvice: 'Prioritize SQL query writing and 3NF/BCNF decomposition proofs. Mastering these two units guarantees at least 45% of total exam score.',
  };
}

function generateOfflineVivaResponse(action: string, subject = 'DBMS', topic = 'Transactions', currentQuestion?: string, studentAnswer?: string, history: any[] = []) {
  const knowledge = findTopicKnowledge(topic || currentQuestion || subject, subject);

  if (action === 'generate-project-questions') {
    return {
      questions: [
        {
          id: 'v1',
          question: 'What database architecture did you use, and how did you prevent SQL injection or unauthenticated mutation?',
          expectedConcept: 'Parameterized queries, ORM safety, JWT authentication middleware, Firestore security rules',
          difficulty: 'Medium',
        },
        {
          id: 'v2',
          question: 'How does your system handle offline fallback or when external AI API latency exceeds 5 seconds?',
          expectedConcept: 'Circuit breakers, cached responses, client-side fallback engine, optimistic UI updates',
          difficulty: 'Hard',
        },
        {
          id: 'v3',
          question: 'Explain your database normalization level and where you deliberately chose denormalization for performance.',
          expectedConcept: 'Read optimization, query joins reduction, document embeddings storage',
          difficulty: 'Hard',
        },
      ],
    };
  }

  if (action === 'evaluate-answer') {
    const answer = (studentAnswer || '').toLowerCase();
    const requiredKeywords = getRequiredVivaKeywords(currentQuestion || topic, knowledge.examKeywords);
    const synonymHits = getConceptSynonymHits(answer, knowledge.examKeywords);
    const matchedKeywords = Array.from(new Set([
      ...requiredKeywords.filter(keyword => answer.includes(keyword.toLowerCase())),
      ...synonymHits,
    ].filter(keyword => requiredKeywords.includes(keyword))));
    const missingKeywords = requiredKeywords.filter(keyword => !matchedKeywords.includes(keyword)).slice(0, 5);
    const wordCount = (studentAnswer || '').trim().split(/\s+/).filter(Boolean).length;
    const keywordScore = Math.min(35, matchedKeywords.length * 12);
    const depthScore = Math.min(25, Math.floor(wordCount / 2));
    const exampleScore = /(example|real|bank|case|scenario|application|diagram|formula|because)/i.test(studentAnswer || '') ? 15 : 0;
    const rawScore = Math.max(35, Math.min(95, 25 + keywordScore + depthScore + exampleScore));
    const score = missingKeywords.length === 0 && matchedKeywords.length > 0 ? Math.max(72, rawScore) : rawScore;

    return {
      score,
      verdict: score >= 80 ? 'Strong' : score >= 65 ? 'Good but incomplete' : score >= 50 ? 'Needs Improvement' : 'Weak',
      strengths: matchedKeywords.length
        ? [`Used relevant keyword(s): ${matchedKeywords.slice(0, 3).join(', ')}`, 'Attempted the core concept']
        : ['Attempted an answer'],
      improvements: [
        missingKeywords.length ? `Add missing keyword(s): ${missingKeywords.join(', ')}` : 'Add a stronger example, edge case, or limitation',
        'Organize the answer as definition -> explanation -> example -> limitation',
      ],
      missingKeywords,
      mistakeAnalysis: missingKeywords.length
        ? `Your answer is incomplete because it does not clearly mention ${missingKeywords.join(', ')} for this exact question. In viva, missing standard terms reduces marks even when the general idea is correct.`
        : 'Your answer covers the exact core concept. Improve marks by adding a concrete example, edge case, and one limitation.',
      idealAnswer: knowledge.idealAnswer,
      microLesson: `Remember: ${knowledge.definition}`,
      followUpQuestion: knowledge.vivaQuestions[Math.min(knowledge.vivaQuestions.length - 1, Math.max(0, matchedKeywords.length % knowledge.vivaQuestions.length))],
    };
  }

  const historyCount = Array.isArray(history) ? history.length : 0;
  const questionIndex = Math.abs(((topic || subject || '').length + historyCount) % knowledge.vivaQuestions.length);
  return {
    question: knowledge.vivaQuestions[questionIndex],
    expectedKeypoints: knowledge.examKeywords.slice(0, 4),
    idealAnswer: knowledge.idealAnswer,
    difficulty: 'Medium',
  };
}

function normalizeVivaEvaluation(raw: any, subject = 'DBMS', topic = 'Transactions', currentQuestion?: string, studentAnswer?: string, history: any[] = []) {
  const trusted = generateOfflineVivaResponse('evaluate-answer', subject, topic, currentQuestion, studentAnswer, history);
  const rawMissing = Array.isArray(raw?.missingKeywords) ? raw.missingKeywords : [];
  const trustedMissing = Array.isArray((trusted as any).missingKeywords) ? (trusted as any).missingKeywords : [];

  return {
    ...raw,
    score: Math.round(((Number(raw?.score) || (trusted as any).score || 70) + ((trusted as any).score || 70)) / 2),
    verdict: raw?.verdict || (trusted as any).verdict,
    strengths: Array.isArray(raw?.strengths) && raw.strengths.length ? raw.strengths : (trusted as any).strengths,
    improvements: trustedMissing.length ? (trusted as any).improvements : [
      'Add a stronger example, edge case, or limitation',
      'Organize the answer as definition -> explanation -> example -> limitation',
    ],
    missingKeywords: trustedMissing,
    mistakeAnalysis: trustedMissing.length
      ? (trusted as any).mistakeAnalysis
      : 'Your answer covers the exact core concept. Improve marks by adding a concrete example, edge case, and one limitation.',
    idealAnswer: (trusted as any).idealAnswer || raw?.idealAnswer,
    microLesson: (trusted as any).microLesson || raw?.microLesson,
    followUpQuestion: raw?.followUpQuestion || (trusted as any).followUpQuestion,
    modelNotes: rawMissing.length && rawMissing.join('|') !== trustedMissing.join('|')
      ? 'AI review was normalized against the exact viva question to remove unrelated missing-keyword penalties.'
      : undefined,
  };
}

function getRequiredVivaKeywords(questionOrTopic: string, fallback: string[]): string[] {
  const text = questionOrTopic.toLowerCase();
  if (text.includes('atomicity')) return ['Atomicity', 'rollback'];
  if (text.includes('consistency')) return ['Consistency'];
  if (text.includes('isolation')) return ['Isolation', 'concurrency'];
  if (text.includes('durability')) return ['Durability', 'commit'];
  if (text.includes('candidate')) return ['candidate key', 'closure'];
  if (text.includes('bcnf')) return ['superkey', 'functional dependency'];
  if (text.includes('lossless')) return ['lossless decomposition', 'functional dependency'];
  if (text.includes('safe state')) return ['safe state'];
  if (text.includes('deadlock')) return ['mutual exclusion', 'hold and wait', 'no preemption', 'circular wait'];
  return fallback.slice(0, 6);
}

function getConceptSynonymHits(answer: string, keywords: string[]): string[] {
  const synonyms: Record<string, RegExp[]> = {
    Atomicity: [/all\s*or\s*nothing/i, /whole transaction/i],
    Consistency: [/valid state/i, /constraints?/i, /integrity/i],
    Isolation: [/one after another/i, /serial/i, /concurrent/i, /interfere/i],
    Durability: [/survive/i, /persist/i, /permanent/i, /after crash/i],
    commit: [/saved/i, /final/i],
    rollback: [/undo/i, /revert/i, /fail/i],
    'candidate key': [/uniquely identif/i, /minimal superkey/i],
    closure: [/attribute closure/i],
    superkey: [/uniquely identif/i],
    'safe state': [/safe sequence/i],
  };

  return keywords.filter(keyword => synonyms[keyword]?.some(pattern => pattern.test(answer)));
}

function generateOfflineDocAnalysis(title: string, subject = 'DBMS') {
  return {
    summary: `Comprehensive academic study guide on "${title}" for ${subject}. Covers foundational definitions, mathematical constraints, and standard university examination patterns. Key focus areas include structural mechanics, algorithmic proofs, and performance trade-offs.`,
    keyFormulasDefinitions: [
      { term: 'Functional Dependency (X → Y)', definition: 'A constraint between two sets of attributes in a relation such that whenever two tuples agree on X, they must agree on Y.', importance: 'Critical' },
      { term: 'Lossless-Join Decomposition', definition: 'Decomposition of R into R1 and R2 is lossless if (R1 ∩ R2) → R1 or (R1 ∩ R2) → R2.', importance: 'High' },
      { term: 'ACID Guarantee', definition: 'Set of properties that guarantee database transactions are processed reliably.', importance: 'Critical' },
    ],
    coreConcepts: [
      { name: 'Schema Normalization', description: 'Process of organizing data in a database to reduce redundancy and improve data integrity.', pageReference: 'Section 3.2, Pages 14–18' },
      { name: 'Serializability Graphs (Precedence Graphs)', description: 'Directed graph used to test conflict serializability of concurrent execution schedules.', pageReference: 'Section 5.1, Pages 32–36' },
      { name: 'Indexing B+ Trees', description: 'Self-balancing tree data structure that maintains sorted data and allows searches, sequential access, insertions, and deletions in logarithmic time.', pageReference: 'Section 7.4, Pages 48–52' },
    ],
    predictedExamQuestions: [
      { question: 'Define BCNF. How does it differ from 3NF? Prove with an example.', marks: 10, frequencyProb: '92%' },
      { question: 'Explain Write-Ahead Logging (WAL) and the ARIES recovery algorithm.', marks: 8, frequencyProb: '84%' },
      { question: 'Write SQL queries to find second highest salary and perform self-join.', marks: 6, frequencyProb: '89%' },
    ],
    flashcards: [
      { front: 'What is a Candidate Key?', back: 'A minimal superkey with no redundant attributes that uniquely identifies each tuple in a relation.' },
      { front: 'What causes Phantom Read anomaly?', back: 'When Transaction A re-executes a range query and discovers new rows inserted by Transaction B that committed in the meantime.' },
      { front: 'What is 1NF requirement?', back: 'Every column must contain atomic (indivisible) values and each record must be unique.' },
    ],
    quickQuiz: [
      {
        question: 'Which of the following is NOT an anomaly solved by database normalization?',
        options: ['Insertion anomaly', 'Deletion anomaly', 'Network latency anomaly', 'Update anomaly'],
        correctIndex: 2,
        explanation: 'Normalization solves Update, Insertion, and Deletion anomalies. Network latency is an infrastructure factor.',
      },
    ],
  };
}

function generateOfflineStudyPlan(subjects: any[], examDaysLeft = 12, dailyHours = 3, isCrackMode = false, weakTopics: string[] = []) {
  return {
    modeName: isCrackMode ? '⚡ CRACK MODE (High-Yield Intensive)' : '🎯 Adaptive Mastery Roadmap',
    targetExam: subjects?.[0]?.name || 'Database Management Systems (DBMS)',
    daysRemaining: examDaysLeft,
    todayMission: {
      title: isCrackMode ? '⚡ Day 1 High-Yield Sprint' : "Today's Academic Mission",
      totalEstimatedMinutes: isCrackMode ? 180 : 105,
      tasks: [
        {
          id: 't1',
          subject: 'DBMS',
          topic: 'Normalization & BCNF Decomposition Proofs',
          durationMinutes: 45,
          type: 'concept_revision',
          difficulty: 'High',
          reason: 'Identified as top 92% priority topic in Exam Radar.',
        },
        {
          id: 't2',
          subject: 'DBMS',
          topic: 'Transactions & Conflict Serializability Schedules',
          durationMinutes: 40,
          type: 'practice_quiz',
          difficulty: 'Medium',
          reason: 'Weak area flagged from recent diagnostic quiz attempt.',
        },
        {
          id: 't3',
          subject: 'DBMS',
          topic: '15 Rapid Spaced Repetition Flashcards',
          durationMinutes: 20,
          type: 'flashcards',
          difficulty: 'Easy',
          reason: 'Daily memory retention maintenance.',
        },
      ],
    },
    weeklyRoadmap: [
      { day: 'Day 1', focus: 'High-Weightage Unit 2 & Unit 3 (Normalization + SQL)', hours: dailyHours },
      { day: 'Day 2', focus: 'Transactions, Concurrency, and Recovery (ACID + 2PL)', hours: dailyHours },
      { day: 'Day 3', focus: 'B+ Tree Indexing & Past 3 Years Exam Question Paper Drill', hours: dailyHours },
      { day: 'Day 4', focus: 'Simulated 3-Hour AI Mock Exam + Weak Topic Retest', hours: dailyHours },
    ],
    crackTip: isCrackMode
      ? '⚡ In Crack Mode, skip low-probability theoretical history and drill directly on the top 5 high-frequency questions.'
      : '🎯 Space your learning: revise yesterday’s flashcards for 10 minutes before starting new topics.',
  };
}

// Vite middleware or Static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ Crack Skull AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'Crack Skull AI',
    version: '1.0.0',
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

    if (!ai) {
      return res.json({
        reply: generateOfflineAiReply(message, mode, subject, responseLanguage),
        mode,
        isFallback: true,
      });
    }

    const systemInstructions: Record<string, string> = {
      tutor: `You are Crack Skull AI Tutor - an elite, encouraging, and razor-sharp academic tutor for university students.
Explain concepts step-by-step with intuitive analogies, structured points, visual ASCII or Markdown tables, and concrete examples. Focus on building deep conceptual understanding. Subject context: ${subject || 'General Engineering/Science'}.
${multilingualRule}`,
      exam: `You are Crack Skull AI Exam Mode Copilot.
Provide concise, high-scoring exam-oriented answers structured with:
1. Definition & Core Formula
2. Key Points / Working Principle (with bullet points)
3. Step-by-step mechanism or diagram representation in text/code
4. Common exam trap/pitfall to avoid to get full marks.
Subject context: ${subject || 'Academic Preparation'}.
${multilingualRule}`,
      beginner: `You are Crack Skull AI in 'Explain Like I'm 5 / Beginner Mode'.
Break down complex academic theories using everyday metaphors, zero confusing jargon, and intuitive real-world comparisons.
${multilingualRule}`,
      coding: `You are Crack Skull AI Coding Mentor.
Provide clean, idiomatic code with line-by-line breakdown, time/space complexity analysis (Big O), edge cases, and testing suggestions.
${multilingualRule}`,
      document: `You are Crack Skull AI Document Q&A Specialist.
Answer questions strictly based on the provided document excerpts. Cite page numbers or sections whenever available. If information is not in the text, clearly state that rather than hallucinating.
${multilingualRule}`,
      viva: `You are a strict yet fair University Viva Examiner.
Ask probing technical questions, evaluate the student's answer, point out missing technical keywords, and rate their technical depth.
${multilingualRule}`,
      revision: `You are Crack Skull AI Rapid Revision Coach.
Provide ultra-fast bulleted flash summaries, key formula cheat-sheets, and 3 critical memory retention anchors for last-minute review.
${multilingualRule}`,
      planner: `You are Crack Skull AI Study Strategy Agent.
Create practical study timetables, break goals into time-boxed tasks, prioritize weak topics, and explain why each session matters.
${multilingualRule}`,
      'doubt-solver': `You are Crack Skull AI Doubt Solver.
Diagnose exactly where the student is confused, ask one clarifying question only if required, then resolve the doubt with a minimal example and a check-your-understanding question.
${multilingualRule}`,
      pyq: `You are Crack Skull AI Previous-Year Question Agent.
Predict exam angles, convert topics into likely 2-mark/5-mark/10-mark questions, and provide model answer skeletons with marking keywords.
${multilingualRule}`,
      interview: `You are Crack Skull AI Placement Interview Agent.
Prepare the student for technical interviews with concise answers, follow-up questions, code traces, projects discussion, and recruiter-ready phrasing.
${multilingualRule}`,
      wellness: `You are Crack Skull AI Study Wellness Agent.
Help students manage exam stress with short, practical routines, focus resets, sleep-aware planning, and non-medical wellbeing guidance. Encourage professional help for severe distress.
${multilingualRule}`,
    };

    const chosenSystemInstruction = systemInstructions[mode] || systemInstructions.tutor;
    const prompt = `Student context: ${academicContext ? JSON.stringify(academicContext) : 'University Student'}
Subject: ${subject || 'General'}
Mode: ${mode || 'tutor'}
Response language: ${responseLanguage}

Previous history summary: ${Array.isArray(history) ? history.slice(-4).map((h: { role: string; content: string }) => `${h.role}: ${h.content}`).join('\n') : 'None'}

Student question/prompt: ${message}

Provide a comprehensive, beautifully formatted Markdown response with clear headers, bold emphasis, code blocks or tables where appropriate.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: chosenSystemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'Unable to generate response. Please try again.';
    res.json({ reply, mode, isFallback: false });
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

    if (!ai) {
      return res.json({
        quiz: generateOfflineQuiz(subject, topic, difficulty, count),
        isFallback: true,
      });
    }

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
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

    res.json({ quiz: quizData, isFallback: false });
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

    if (!ai) {
      return res.json({
        radarData: generateOfflineExamRadar(subject),
        isFallback: true,
      });
    }

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
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

    res.json({ radarData, isFallback: false });
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

    if (!ai) {
      return res.json(generateOfflineVivaResponse(action, subject, topic, currentQuestion, studentAnswer));
    }

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

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
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

Provide a constructive evaluation and rate out of 100.
Respond ONLY in JSON format:
{
  "score": 85,
  "verdict": "Strong / Good / Needs Improvement / Weak",
  "strengths": ["Clear definition", "Mentioned key principles"],
  "improvements": ["Missing technical term X", "Could provide a 1-sentence example"],
  "idealAnswer": "Here is the ideal 3-sentence high-scoring examiner response...",
  "followUpQuestion": "Next viva question to test deeper comprehension"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      return res.json(JSON.parse(response.text || '{}'));
    }

    // Default next question
    const prompt = `Subject: ${subject}, Topic: ${topic}.
Previous conversation: ${JSON.stringify(history.slice(-3))}
Generate the next probing viva question that a college examiner would ask.
Respond ONLY in JSON:
{
  "question": "Question text",
  "expectedKeypoints": ["point 1", "point 2"],
  "difficulty": "Medium"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Viva API Error:', error);
    res.json(generateOfflineVivaResponse(req.body.action, req.body.subject, req.body.topic, req.body.currentQuestion, req.body.studentAnswer));
  }
});

// Document AI & PDF Analyzer Endpoint
app.post('/api/ai/document-analyze', async (req, res) => {
  try {
    const { title, textSnippet, subject } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        analysis: generateOfflineDocAnalysis(title, subject),
        isFallback: true,
      });
    }

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    res.json({
      analysis: JSON.parse(response.text || '{}'),
      isFallback: false,
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

    if (!ai) {
      return res.json({
        plan: generateOfflineStudyPlan(subjects, examDaysLeft, dailyHours, isCrackMode, weakTopics),
        isFallback: true,
      });
    }

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    res.json({
      plan: JSON.parse(response.text || '{}'),
      isFallback: false,
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
    : `Preferred response language: ${responseLanguage}. Offline answers are limited, but the online Gemini assistant will fully respond in this language.`;

  const cleanMsg = message.toLowerCase();
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

  return `### Crack Skull AI Insights for: "${message.slice(0, 60)}"

${languageNote}

Here is the strategic academic breakdown for **${subject || 'Computer Science & Engineering'}**:

#### 1. Core Definition & Principle
* The fundamental concept revolves around optimizing computation and ensuring mathematical consistency.
* Understanding this topic is critical for both university semester examinations (typically worth **8–12 marks**) and technical job interviews.

#### 2. Key Takeaways & Architecture
* **Component A**: Handles state initialization and boundary conditions.
* **Component B**: Manages the iterative transition logic with minimal runtime overhead.
* **Invariant**: Guarantees that at every iteration step, the system integrity remains preserved.

#### 3. Strategic Exam Preparation Checklist
* ✅ Master the formal definition and standard diagram representation.
* ✅ Memorize the primary time and space complexities.
* ✅ Practice at least 2 numerical or code tracing examples from previous question papers.

*Would you like me to generate a 5-question quick quiz or run a simulated Viva on this topic?*`;
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

function generateOfflineVivaResponse(action: string, subject = 'DBMS', topic = 'Transactions', currentQuestion?: string, studentAnswer?: string) {
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
    const wordCount = (studentAnswer || '').trim().split(/\s+/).length;
    const isGood = wordCount > 8;
    return {
      score: isGood ? 84 : 58,
      verdict: isGood ? 'Good conceptual response' : 'Needs more technical depth',
      strengths: ['Addressed the core question', 'Understands the high-level concept'],
      improvements: ['Include exact standard terminology', 'Give a 1-sentence real-world edge case'],
      idealAnswer: `An ideal university viva answer clearly states the formal definition, cites the primary invariant, and gives a 1-line mathematical or architectural example.`,
      followUpQuestion: `How would this mechanism behave if a system crash occurs immediately after write buffer flush?`,
    };
  }

  return {
    question: `Explain the fundamental difference between Pessimistic Locking and Optimistic Concurrency Control in ${subject}.`,
    expectedKeypoints: ['Lock overhead vs validation phase', 'Read-heavy vs write-heavy workloads', 'Rollback rate'],
    difficulty: 'Medium',
  };
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

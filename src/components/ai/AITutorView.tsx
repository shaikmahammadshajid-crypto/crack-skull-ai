import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import { ChatMessage, ChatMode } from '../../types';
import { AssistantLanguageCode, assistantLanguages, getAssistantLanguage } from '../../services/languageService';
import { extractTextFromFile, extractTextFromPptx, formatFileSize, isPptxFile } from '../../services/pdfService';
import { MarkdownAnswer } from '../common/MarkdownAnswer';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  HelpCircle,
  Layers,
  Mic,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  FileCode,
  GraduationCap,
  Volume2,
  FileText,
  Zap,
  Download,
  Languages,
  CalendarCheck,
  Target,
  Briefcase,
  HeartPulse,
  Calculator,
  Paperclip,
  FileUp,
  Presentation,
  X,
} from 'lucide-react';

type AssistantAttachment = {
  id: string;
  name: string;
  type: string;
  kind: 'image' | 'document';
  sizeLabel: string;
  text?: string;
  dataUrl?: string;
  previewUrl?: string;
  status: 'ready' | 'processing' | 'error';
  error?: string;
};

const WELCOME_MESSAGE_ID = 'm_welcome';

type ModeUiCopy = {
  label: string;
  buildWelcome: (subject: string) => string;
  suggestions: string[];
};

const CHAT_MODE_COPY: Record<ChatMode, ModeUiCopy> = {
  tutor: {
    label: 'Tutor',
    buildWelcome: subject => `### Tutor
Ask a topic from **${subject}**.

I will explain it step by step, add an example, and finish with a quick practice check.`,
    suggestions: [
      'Explain ACID properties with a real-world banking example',
      'Break down normalization from 1NF to BCNF',
      'Explain deadlock prevention vs avoidance',
      'Teach me transactions and schedules from basics',
    ],
  },
  math: {
    label: 'Math Solver',
    buildWelcome: subject => `### Math Solver
Send a formula, equation, word problem, matrix, probability question, or uploaded question image from **${subject}**.

I will solve it cleanly with steps, checks, and a final answer.`,
    suggestions: [
      'Solve x^2 - 5x + 6 = 0 step by step',
      'Evaluate the integral of x^3 from 0 to 2',
      'Find the inverse of a 2x2 matrix and verify it',
      'Explain Bayes theorem with a solved exam example',
      'Solve this uploaded math question and show every step',
    ],
  },
  exam: {
    label: 'Exam Mode',
    buildWelcome: subject => `### Exam Mode
Ask for a university-style answer from **${subject}**.

I will format it for marks: definition, key points, diagram cues, example, and a strong closing line.`,
    suggestions: [
      'Give a 10-mark answer on Banker deadlock avoidance algorithm',
      'Write a 5-mark answer on two-phase locking',
      'Create a high-scoring answer for serializability',
      'Give an exam-ready note on indexing in DBMS',
    ],
  },
  beginner: {
    label: 'Beginner',
    buildWelcome: subject => `### Beginner
Ask any difficult idea from **${subject}**.

I will start from the basics, avoid heavy jargon, and build up with a simple example.`,
    suggestions: [
      'Explain database transactions like I am new to DBMS',
      'Explain normalization with a simple table example',
      'Explain indexing using a library shelf example',
      'Explain deadlock with a daily-life example',
    ],
  },
  coding: {
    label: 'Coding',
    buildWelcome: subject => `### Coding
Send a program, algorithm, error, or coding question related to **${subject}**.

I will explain the approach, write clean code, and point out edge cases.`,
    suggestions: [
      'Write binary search in C++ with edge cases',
      'Explain time complexity of merge sort',
      'Debug this SQL query',
      'Write a queue implementation and explain it',
    ],
  },
  document: {
    label: 'Document',
    buildWelcome: subject => `### Document
Upload a PDF, PPTX, notes image, or paste text for **${subject}**.

I will extract the important concepts, make exam notes, and suggest likely questions.`,
    suggestions: [
      'Summarize this uploaded PDF into exam notes',
      'Extract important questions from these slides',
      'Make flashcard points from this document',
      'Find weak topics from this uploaded material',
    ],
  },
  viva: {
    label: 'Viva Mode',
    buildWelcome: subject => `### Viva Mode
Tell me the topic or project area for **${subject}**.

I will ask viva questions one by one and give feedback after your answers.`,
    suggestions: [
      'Ask me viva questions on database transactions',
      'Run a viva on normalization',
      'Ask project viva questions for my DBMS mini project',
      'Test me on SQL joins and indexes',
    ],
  },
  revision: {
    label: 'Revision',
    buildWelcome: subject => `### Revision
Tell me what you need to revise in **${subject}**.

I will turn it into compact notes, must-remember points, and quick recall questions.`,
    suggestions: [
      'Revise ACID properties in 5 minutes',
      'Make quick revision notes for concurrency control',
      'Give me last-minute DBMS formulas and definitions',
      'Create a checklist for transaction management',
    ],
  },
  planner: {
    label: 'Planner',
    buildWelcome: subject => `### Planner
Tell me your exam date, available hours, and weak topics for **${subject}**.

I will create a time-boxed plan with what to study, practice, and revise each day.`,
    suggestions: [
      'Create a 3-day revision plan for my weakest DBMS topics',
      'Plan today for 2 hours of DBMS revision',
      'Make a one-week study plan before my exam',
      'Prioritize topics using scoring probability',
    ],
  },
  'doubt-solver': {
    label: 'Doubt Solver',
    buildWelcome: subject => `### Doubt Solver
Send the exact line, question, screenshot, or PDF page that is confusing in **${subject}**.

I will identify the missing concept first, then clear it with a short explanation and one check question.`,
    suggestions: [
      'I do not understand two-phase locking',
      'Why does this schedule cause a conflict?',
      'Explain this normalization step I am stuck on',
      'What exactly is the difference between BCNF and 3NF?',
    ],
  },
  pyq: {
    label: 'PYQ Agent',
    buildWelcome: subject => `### PYQ Agent
Ask for likely questions, repeated patterns, or upload previous papers for **${subject}**.

I will group important topics, estimate exam probability, and draft answer skeletons.`,
    suggestions: [
      'Predict likely DBMS questions for this exam',
      'Analyze these previous year questions',
      'List repeated topics from DBMS PYQs',
      'Create answer skeletons for high-probability questions',
    ],
  },
  interview: {
    label: 'Interview',
    buildWelcome: subject => `### Interview
Tell me your target role, tech stack, or topic from **${subject}**.

I will ask interview questions, evaluate your answers, and tighten your explanations.`,
    suggestions: [
      'Ask me 5 placement interview questions on React and Node.js',
      'Run a DBMS interview round',
      'Ask SQL interview questions with feedback',
      'Prepare me for operating system interview basics',
    ],
  },
  wellness: {
    label: 'Wellness',
    buildWelcome: subject => `### Wellness
Tell me what is blocking your focus while studying **${subject}**.

I will suggest a short reset, a realistic next task, and a low-pressure study rhythm.`,
    suggestions: [
      'I feel stuck and cannot start studying',
      'Give me a 10-minute focus reset',
      'Make a calm plan for exam stress',
      'Help me recover after wasting study time',
    ],
  },
};

function createWelcomeMessage(mode: ChatMode, subjectName?: string): ChatMessage {
  const subject = subjectName || 'your current subject';
  const copy = CHAT_MODE_COPY[mode];

  return {
    id: WELCOME_MESSAGE_ID,
    role: 'assistant',
    content: copy.buildWelcome(subject),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    mode,
  };
}

export const AITutorView: React.FC = () => {
  const {
    user,
    activeSubject,
    addFlashcard,
    startQuiz,
    openExplainModal,
    triggerConfetti,
  } = useApp();

  const [mode, setMode] = useState<ChatMode>('tutor');
  const [language, setLanguage] = useState<AssistantLanguageCode>('auto');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<AssistantAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage('tutor', activeSubject?.name)]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0]?.id === WELCOME_MESSAGE_ID) {
        return [createWelcomeMessage(mode, activeSubject?.name)];
      }

      return prev;
    });
  }, [mode, activeSubject?.name]);

  const handleSend = async (customPrompt?: string) => {
    const text = customPrompt || inputMessage;
    const readyAttachments = attachments.filter(file => file.status === 'ready');
    if ((!text.trim() && readyAttachments.length === 0) || isLoading) return;

    const attachmentSummary = readyAttachments.length
      ? `\n\nAttached files:\n${readyAttachments.map(file => `- ${file.name} (${file.kind}, ${file.sizeLabel})`).join('\n')}`
      : '';
    const messageText = `${text.trim() || 'Solve or explain the attached academic material.'}${attachmentSummary}`;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const historySummary = messages.slice(-4).map(m => ({ role: m.role, content: m.content }));
      const response = await aiService.sendMessage({
        message: text.trim() || 'Solve or explain the attached academic material.',
        mode,
        subject: activeSubject?.name || 'Academic Preparation',
        academicContext: {
          degree: user.degree,
          semester: user.semester,
          goal: user.studyGoal,
        },
        history: historySummary,
        language,
        attachments: readyAttachments.map(file => ({
          name: file.name,
          type: file.type,
          kind: file.kind,
          text: file.text,
          dataUrl: file.dataUrl,
        })),
      });

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
      const errorMsg: ChatMessage = {
        id: `ai_err_${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Failed to connect to AI server. Please verify your connection or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setAttachmentError('');

    for (const file of files) {
      const lowerName = file.name.toLowerCase();
      const isImage = /^image\/(png|jpe?g)$/.test(file.type) || /\.(png|jpe?g|jpng)$/.test(lowerName);
      const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
      const isPptx = isPptxFile(file);

      if (!isImage && !isPdf && !isPptx) {
        setAttachmentError('Upload only JPG, JPEG, JPNG, PNG, PDF, or PPTX files.');
        continue;
      }

      if (file.size > 12 * 1024 * 1024) {
        setAttachmentError(`${file.name} is too large. Keep each file under 12 MB.`);
        continue;
      }

      const id = `att_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const baseAttachment: AssistantAttachment = {
        id,
        name: file.name,
        type: file.type || (isPptx ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' : 'application/octet-stream'),
        kind: isImage ? 'image' : 'document',
        sizeLabel: formatFileSize(file.size),
        status: 'processing',
      };

      setAttachments(prev => [...prev, baseAttachment]);

      try {
        if (isImage) {
          const dataUrl = await readFileAsDataUrl(file);
          setAttachments(prev => prev.map(item => item.id === id ? {
            ...item,
            dataUrl,
            previewUrl: dataUrl,
            status: 'ready',
          } : item));
          continue;
        }

        if (isPdf) {
          const extracted = await extractTextFromFile(file);
          setAttachments(prev => prev.map(item => item.id === id ? {
            ...item,
            text: `PDF extracted text from ${file.name} (${extracted.pageCount} pages):\n${extracted.text.slice(0, 12000)}`,
            status: 'ready',
          } : item));
          continue;
        }

        const extracted = await extractTextFromPptx(file);
        setAttachments(prev => prev.map(item => item.id === id ? {
          ...item,
          text: `PPTX extracted text from ${file.name} (${extracted.slideCount} slides):\n${extracted.text.slice(0, 12000) || 'No selectable slide text was found.'}`,
          status: 'ready',
        } : item));
      } catch (error: any) {
        setAttachments(prev => prev.map(item => item.id === id ? {
          ...item,
          status: 'error',
          error: error?.message || 'Could not read this file.',
        } : item));
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(item => item.id !== id));
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speakMessage = (id: string, text: string) => {
    if (speakingId === id) {
      aiService.stopSpeaking();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      aiService.speakText(text, () => {
        setSpeakingId(null);
      }, language);
    }
  };

  const handleCreateFlashcard = (text: string) => {
    addFlashcard({
      id: `fc_chat_${Date.now()}`,
      deckId: 'deck_chat',
      subjectId: activeSubject?.id || 'sub_gen',
      subjectName: activeSubject?.name || 'General',
      topic: 'AI Tutor Concept',
      front: text.slice(0, 100).replace(/#/g, '').trim(),
      back: text.slice(0, 300),
      difficulty: 'medium',
      reviewCount: 0,
      isMastered: false,
    });
    triggerConfetti();
    alert('Flashcard added to your deck! Check the Spaced Flashcards tab.');
  };

  const handleGenerateQuizFromMessage = async (text: string) => {
    const questions = await aiService.generateQuiz({
      subject: activeSubject?.name || 'General',
      topic: text.slice(0, 50),
      difficulty: 'medium',
      count: 3,
    });
    if (questions && questions.length > 0) {
      startQuiz({
        id: `quiz_${Date.now()}`,
        title: `AI Tutor Quiz: ${text.slice(0, 30)}`,
        subjectId: activeSubject?.id || 'sub_gen',
        subjectName: activeSubject?.name || 'General',
        topic: text.slice(0, 50),
        difficulty: 'medium',
        durationMinutes: 5,
        questions,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const exportChat = () => {
    const transcript = messages
      .map(m => `[${m.timestamp}] ${m.role.toUpperCase()} (${m.mode || 'tutor'}):\n${m.content}\n\n`)
      .join('---\n\n');
    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crack_skull_ai_chat_${Date.now()}.md`;
    a.click();
  };

  const currentLanguage = getAssistantLanguage(language);
  const currentModeCopy = CHAT_MODE_COPY[mode];
  const promptSuggestions = currentModeCopy.suggestions;

  return (
    <div className="surface-card mx-auto flex h-[calc(100vh-7rem)] max-w-7xl flex-col overflow-hidden">
      {/* 1. Top Bar: Modes & Chat Tools */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--app-border)] bg-[var(--app-surface)] p-3.5">
        {/* Mode Selector */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5">
          <ModeTab
            label="Tutor"
            active={mode === 'tutor'}
            onClick={() => setMode('tutor')}
            icon={<Bot size={14} />}
          />
          <ModeTab
            label="Math Solver"
            active={mode === 'math'}
            onClick={() => setMode('math')}
            icon={<Calculator size={14} className="text-cyan-300" />}
          />
          <ModeTab
            label="Exam Mode"
            active={mode === 'exam'}
            onClick={() => setMode('exam')}
            icon={<Zap size={14} className="text-orange-400" />}
          />
          <ModeTab
            label="Doubt Solver"
            active={mode === 'doubt-solver'}
            onClick={() => setMode('doubt-solver')}
            icon={<HelpCircle size={14} className="text-sky-400" />}
          />
          <ModeTab
            label="PYQ Agent"
            active={mode === 'pyq'}
            onClick={() => setMode('pyq')}
            icon={<Target size={14} className="text-rose-400" />}
          />
          <ModeTab
            label="Planner"
            active={mode === 'planner'}
            onClick={() => setMode('planner')}
            icon={<CalendarCheck size={14} className="text-lime-400" />}
          />
          <ModeTab
            label="Beginner (ELI5)"
            active={mode === 'beginner'}
            onClick={() => setMode('beginner')}
            icon={<Sparkles size={14} className="text-cyan-400" />}
          />
          <ModeTab
            label="Coding"
            active={mode === 'coding'}
            onClick={() => setMode('coding')}
            icon={<FileCode size={14} className="text-emerald-400" />}
          />
          <ModeTab
            label="Document"
            active={mode === 'document'}
            onClick={() => setMode('document')}
            icon={<FileText size={14} className="text-purple-400" />}
          />
          <ModeTab
            label="Viva Mode"
            active={mode === 'viva'}
            onClick={() => setMode('viva')}
            icon={<Mic size={14} className="text-pink-400" />}
          />
          <ModeTab
            label="Revision"
            active={mode === 'revision'}
            onClick={() => setMode('revision')}
            icon={<BookOpen size={14} className="text-amber-400" />}
          />
          <ModeTab
            label="Interview"
            active={mode === 'interview'}
            onClick={() => setMode('interview')}
            icon={<Briefcase size={14} className="text-blue-400" />}
          />
          <ModeTab
            label="Wellness"
            active={mode === 'wellness'}
            onClick={() => setMode('wellness')}
            icon={<HeartPulse size={14} className="text-emerald-400" />}
          />
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5">
          <label className="secondary-action px-2 py-1.5 text-xs">
            <Languages size={14} className="text-cyan-600 dark:text-cyan-300" />
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as AssistantLanguageCode)}
              className="bg-transparent text-xs font-semibold outline-none max-w-[150px]"
              title="Assistant language"
            >
              {assistantLanguages.map(item => (
                <option key={item.code} value={item.code} className="bg-white dark:bg-slate-950 text-gray-950 dark:text-slate-100">
                  {item.label} - {item.nativeLabel}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={exportChat}
            className="secondary-action px-2 py-1.5 text-xs"
            title="Export Conversation"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setMessages([createWelcomeMessage(mode, activeSubject?.name)])}
            className="icon-button icon-button-sm hover:text-rose-500"
            title="Clear Chat"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* 2. Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-3xl rounded-xl p-4 text-xs leading-relaxed sm:p-5 sm:text-sm ${
                msg.role === 'user'
                  ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950'
                  : 'surface-muted text-[var(--app-text)]'
              }`}
            >
              {/* Message Role & Mode Tag */}
              <div className={`flex items-center justify-between gap-4 mb-2 pb-1.5 border-b text-[11px] font-mono ${
                msg.role === 'user'
                  ? 'border-white/10 text-white/70 dark:border-black/10 dark:text-black/60'
                  : 'border-[var(--app-border)] text-[var(--app-text-muted)]'
              }`}>
                <span className="font-bold flex items-center gap-1">
                  {msg.role === 'user' ? 'You' : 'CrackSkull AI'}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Markdown Content */}
              <MarkdownAnswer content={msg.content} />

              {/* AI Message Action Buttons */}
              {msg.role === 'assistant' && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[var(--app-border)] pt-2.5 text-xs">
                  <button
                    onClick={() => copyText(msg.id, msg.content)}
                    className="secondary-action px-2 py-1.5 text-xs"
                    title="Copy Answer"
                  >
                    {copiedId === msg.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => speakMessage(msg.id, msg.content)}
                    className="secondary-action px-2 py-1.5 text-xs hover:text-cyan-600 dark:hover:text-cyan-300"
                    title="Read Aloud"
                  >
                    <Volume2 size={13} className={speakingId === msg.id ? 'text-cyan-500 animate-pulse' : ''} />
                    <span>{speakingId === msg.id ? 'Stop Voice' : 'Listen'}</span>
                  </button>

                  <button
                    onClick={() => handleCreateFlashcard(msg.content)}
                    className="secondary-action px-2 py-1.5 text-xs hover:text-amber-600 dark:hover:text-amber-300"
                    title="Save to Flashcards"
                  >
                    <Layers size={13} />
                    <span>Flashcard</span>
                  </button>

                  <button
                    onClick={() => handleGenerateQuizFromMessage(msg.content)}
                    className="secondary-action px-2 py-1.5 text-xs hover:text-pink-600 dark:hover:text-pink-300"
                    title="Quiz on this topic"
                  >
                    <HelpCircle size={13} />
                    <span>Quiz Me</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex w-fit items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs text-teal-700 animate-pulse dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200">
            <Sparkles size={16} />
            <span>Formulating {currentLanguage.label.toLowerCase()} response with {currentModeCopy.label}...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Prompt Suggestions Pill Bar */}
      {messages.length <= 2 && (
        <div className="flex items-center gap-2 overflow-x-auto border-t border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-2">
          <span className="whitespace-nowrap text-[10px] font-black uppercase text-[var(--app-text-subtle)]">
            Suggested:
          </span>
          {promptSuggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="secondary-action whitespace-nowrap px-2.5 py-1 text-[11px]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* 4. Bottom Input Bar */}
      <div className="border-t border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-4">
        {(attachments.length > 0 || attachmentError) && (
          <div className="mb-3 space-y-2">
            {attachmentError && (
                <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200">
                {attachmentError}
              </div>
            )}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map(file => (
                  <div
                    key={file.id}
                    className="surface-muted flex max-w-full items-center gap-2 px-2.5 py-2 text-xs text-[var(--app-text)]"
                  >
                    {file.previewUrl ? (
                      <img src={file.previewUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                    ) : file.name.toLowerCase().endsWith('.pptx') ? (
                      <Presentation size={18} className="text-orange-500 dark:text-orange-300" />
                    ) : (
                      <FileUp size={18} className="text-cyan-600 dark:text-cyan-300" />
                    )}
                    <div className="min-w-0">
                      <div className="max-w-[180px] truncate font-bold">{file.name}</div>
                      <div className={`text-[10px] ${file.status === 'error' ? 'text-rose-500 dark:text-rose-300' : 'text-gray-500 dark:text-slate-500'}`}>
                        {file.status === 'processing' ? 'Reading...' : file.status === 'error' ? file.error : file.sizeLabel}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(file.id)}
                      className="rounded-md p-1 text-[var(--app-text-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]"
                      title="Remove attachment"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.jpng,.png,.pdf,.pptx,image/jpeg,image/png,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={event => handleFilesSelected(event.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="icon-button icon-button-lg"
            title="Upload photo, PDF, or PPTX"
          >
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            placeholder={mode === 'math' ? `Type a math problem or upload a question photo/PDF/PPTX...` : `Ask in ${currentModeCopy.label} using ${currentLanguage.label}...`}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            className="form-control flex-1 px-4 py-3 text-xs sm:text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || (!inputMessage.trim() && !attachments.some(file => file.status === 'ready')) || attachments.some(file => file.status === 'processing')}
            className="primary-action h-12 w-12 disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

const ModeTab: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}> = ({ label, active, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors items-center gap-1.5 ${
      active
        ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950'
        : 'border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

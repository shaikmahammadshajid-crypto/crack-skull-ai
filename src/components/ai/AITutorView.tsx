import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import { ChatMessage, ChatMode } from '../../types';
import { AssistantLanguageCode, assistantLanguages, getAssistantLanguage } from '../../services/languageService';
import { extractTextFromFile, extractTextFromPptx, formatFileSize, isPptxFile } from '../../services/pdfService';
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm_welcome',
      role: 'assistant',
      content: `### 👋 Welcome to Crack Skull AI Tutor!
I am your dedicated academic copilot for **${activeSubject?.name || 'your university semester exams'}**.

Select a specialized mode from the top bar:
* **Tutor Mode**: Deep step-by-step conceptual breakdowns & diagrams
* **Math Solver**: Solves equations, calculus, matrices, probability, statistics, and word problems step by step
* **Exam Mode**: High-scoring, concise, 10-mark structured answers
* **Doubt Solver**: Finds the exact confusion and clears it fast
* **PYQ Agent**: Predicts likely exam questions and answer skeletons
* **Interview Agent**: Placement and technical interview coaching
* **Study Planner**: Time-boxed plans for weak topics and exams
* **Wellness Agent**: Focus resets and practical exam-stress routines

You can also select Auto Detect, Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali, Marathi, Urdu, Spanish, French, Arabic, and more for multilingual text and voice output.

What topic would you like to master today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: 'tutor',
    },
  ]);

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

  const basePromptSuggestions = [
    'Explain ACID properties with real-world banking example',
    'Derive BCNF decomposition step-by-step for R(A,B,C,D)',
    'Explain Two-Phase Locking (2PL) and draw precedence graph',
    'What is Binary Search time complexity and edge cases in C++?',
    'Give a 10-mark model answer on Banker Deadlock Avoidance algorithm',
    'Create a 3-day revision plan for my weakest DBMS topics',
    'Ask me 5 placement interview questions on React and Node.js',
  ];
  const mathPromptSuggestions = [
    'Solve x^2 - 5x + 6 = 0 step-by-step',
    'Evaluate integral of x^3 from 0 to 2',
    'Solve a matrix inverse problem and verify the answer',
    'Explain Bayes theorem with a solved exam-style example',
    'Solve this uploaded math question and show every step',
  ];
  const promptSuggestions = mode === 'math' ? mathPromptSuggestions : basePromptSuggestions;

  const currentLanguage = getAssistantLanguage(language);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-6xl mx-auto rounded-3xl bg-[#0E1322] border border-slate-800 shadow-2xl overflow-hidden">
      {/* 1. Top Bar: Modes & Chat Tools */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 flex-wrap">
        {/* Mode Selector */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-hidden py-0.5">
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
          <label className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs">
            <Languages size={14} className="text-cyan-300" />
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as AssistantLanguageCode)}
              className="bg-transparent text-xs font-semibold outline-none max-w-[150px]"
              title="Assistant language"
            >
              {assistantLanguages.map(item => (
                <option key={item.code} value={item.code} className="bg-slate-950 text-slate-100">
                  {item.label} - {item.nativeLabel}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={exportChat}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
            title="Export Conversation"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setMessages([messages[0]])}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs transition-colors"
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
              className={`max-w-3xl rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed shadow-lg ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-bl-none'
              }`}
            >
              {/* Message Role & Mode Tag */}
              <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/10 text-[11px] font-mono text-slate-400">
                <span className="font-bold flex items-center gap-1 text-purple-300">
                  {msg.role === 'user' ? 'You' : '💀 Crack Skull AI'}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Markdown Content */}
              <MarkdownAnswer content={msg.content} />

              {/* AI Message Action Buttons */}
              {msg.role === 'assistant' && (
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center gap-1.5 flex-wrap text-xs">
                  <button
                    onClick={() => copyText(msg.id, msg.content)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-850 text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                    title="Copy Answer"
                  >
                    {copiedId === msg.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => speakMessage(msg.id, msg.content)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-850 text-slate-300 hover:text-purple-300 flex items-center gap-1 transition-colors"
                    title="Read Aloud"
                  >
                    <Volume2 size={13} className={speakingId === msg.id ? 'text-purple-400 animate-pulse' : ''} />
                    <span>{speakingId === msg.id ? 'Stop Voice' : 'Listen'}</span>
                  </button>

                  <button
                    onClick={() => handleCreateFlashcard(msg.content)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-950/60 text-slate-300 hover:text-amber-300 flex items-center gap-1 transition-colors"
                    title="Save to Flashcards"
                  >
                    <Layers size={13} />
                    <span>Flashcard</span>
                  </button>

                  <button
                    onClick={() => handleGenerateQuizFromMessage(msg.content)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-pink-950/60 text-slate-300 hover:text-pink-300 flex items-center gap-1 transition-colors"
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
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 w-fit text-xs text-purple-400 animate-pulse">
            <Sparkles size={16} />
            <span>Formulating {currentLanguage.label.toLowerCase()} response with the selected AI agent...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Prompt Suggestions Pill Bar */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/40 flex flex-wrap items-center gap-2 overflow-x-hidden">
          <span className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
            Suggested:
          </span>
          {promptSuggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 whitespace-nowrap transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* 4. Bottom Input Bar */}
      <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/90">
        {(attachments.length > 0 || attachmentError) && (
          <div className="mb-3 space-y-2">
            {attachmentError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
                {attachmentError}
              </div>
            )}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map(file => (
                  <div
                    key={file.id}
                    className="flex max-w-full items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-2.5 py-2 text-xs text-slate-200"
                  >
                    {file.previewUrl ? (
                      <img src={file.previewUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                    ) : file.name.toLowerCase().endsWith('.pptx') ? (
                      <Presentation size={18} className="text-orange-300" />
                    ) : (
                      <FileUp size={18} className="text-purple-300" />
                    )}
                    <div className="min-w-0">
                      <div className="max-w-[180px] truncate font-bold">{file.name}</div>
                      <div className={`text-[10px] ${file.status === 'error' ? 'text-rose-300' : 'text-slate-500'}`}>
                        {file.status === 'processing' ? 'Reading...' : file.status === 'error' ? file.error : file.sizeLabel}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(file.id)}
                      className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
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
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/50 transition-colors"
            title="Upload photo, PDF, or PPTX"
          >
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            placeholder={mode === 'math' ? `Type a math problem or upload a question photo/PDF/PPTX...` : `Ask in ${mode.toUpperCase()} mode using ${currentLanguage.label}...`}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={isLoading || (!inputMessage.trim() && !attachments.some(file => file.status === 'ready')) || attachments.some(file => file.status === 'processing')}
            className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 transition-all shadow-md shadow-purple-600/30 flex items-center justify-center"
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
    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
      active
        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MarkdownAnswer: React.FC<{ content: string }> = ({ content }) => {
  const rendered = useMemo(() => renderMarkdownBlocks(content), [content]);
  return <div className="ai-markdown font-sans">{rendered}</div>;
};

function renderMarkdownBlocks(content: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let index = 0;

  const collectList = (ordered: boolean) => {
    const items: string[] = [];
    while (index < lines.length) {
      const line = lines[index];
      const match = ordered ? line.match(/^\s*\d+\.\s+(.*)$/) : line.match(/^\s*[-*]\s+(.*)$/);
      if (!match) break;
      items.push(match[1]);
      index += 1;
    }
    const ListTag = ordered ? 'ol' : 'ul';
    nodes.push(
      <ListTag key={`list_${index}`} className={ordered ? 'list-decimal' : 'list-disc'}>
        {items.map((item, itemIndex) => (
          <li key={`${item}_${itemIndex}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ListTag>
    );
  };

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const language = trimmed.replace(/```/, '').trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      nodes.push(
        <pre key={`code_${index}`} className="ai-code-block">
          {language && <span className="ai-code-language">{language}</span>}
          <code>{code.join('\n')}</code>
        </pre>
      );
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      nodes.push(<hr key={`hr_${index}`} />);
      index += 1;
      continue;
    }

    if (/^\|(.+\|)+$/.test(trimmed) && index + 1 < lines.length && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[index + 1].trim())) {
      const headerCells = splitTableRow(trimmed);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && /^\|(.+\|)+$/.test(lines[index].trim())) {
        rows.push(splitTableRow(lines[index].trim()));
        index += 1;
      }
      nodes.push(
        <div key={`table_${index}`} className="ai-table-wrap">
          <table>
            <thead>
              <tr>
                {headerCells.map((cell, cellIndex) => (
                  <th key={`${cell}_${cellIndex}`}>{renderInlineMarkdown(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row_${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${cell}_${cellIndex}`}>{renderInlineMarkdown(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = Math.min(heading[1].length, 4);
      const HeadingTag = `h${level}` as React.ElementType;
      nodes.push(<HeadingTag key={`heading_${index}`}>{renderInlineMarkdown(heading[2])}</HeadingTag>);
      index += 1;
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      collectList(true);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      collectList(false);
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('```') &&
      !/^#{1,4}\s+/.test(lines[index].trim()) &&
      !/^\s*(?:[-*]|\d+\.)\s+/.test(lines[index]) &&
      !/^\|(.+\|)+$/.test(lines[index].trim()) &&
      !/^---+$/.test(lines[index].trim())
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    nodes.push(<p key={`p_${index}`}>{renderInlineMarkdown(paragraphLines.join(' '))}</p>);
  }

  return nodes;
}

function splitTableRow(row: string): string[] {
  return row.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`')) {
      nodes.push(<code key={`code_${match.index}`}>{token.slice(1, -1)}</code>);
    } else {
      nodes.push(<strong key={`strong_${match.index}`}>{token.slice(2, -2)}</strong>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

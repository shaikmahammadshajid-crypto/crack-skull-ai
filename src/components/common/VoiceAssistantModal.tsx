import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import { AssistantLanguageCode, assistantLanguages, getAssistantLanguage } from '../../services/languageService';
import { ChatMode } from '../../types';
import {
  BookOpenCheck,
  Brain,
  CalendarCheck,
  FileQuestion,
  Languages,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

interface VoiceTurn {
  id: string;
  role: 'student' | 'assistant';
  text: string;
}

const agentOptions: { mode: ChatMode; label: string; helper: string }[] = [
  { mode: 'tutor', label: 'Tutor', helper: 'Explain a concept clearly' },
  { mode: 'doubt-solver', label: 'Doubt', helper: 'Fix one confusion' },
  { mode: 'exam', label: 'Exam', helper: 'Write scoring answers' },
  { mode: 'pyq', label: 'PYQ', helper: 'Predict likely questions' },
  { mode: 'planner', label: 'Plan', helper: 'Make study schedule' },
  { mode: 'viva', label: 'Viva', helper: 'Ask oral questions' },
];

const quickPrompts = [
  { label: 'Explain today topic', prompt: 'Explain the most important concept from my active subject for today with one example.' },
  { label: 'Make 2-hour plan', prompt: 'Create a practical 2-hour study plan for my active subject with breaks and revision.' },
  { label: 'Ask viva', prompt: 'Ask me five viva questions from my active subject, one by one.' },
  { label: 'Predict PYQ', prompt: 'Predict likely previous-year questions for my active subject and give answer skeletons.' },
];

export const VoiceAssistantModal: React.FC = () => {
  const {
    voiceAssistantOpen,
    setVoiceAssistantOpen,
    activeSubject,
    user,
    setActiveTab,
  } = useApp();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<AssistantLanguageCode>('auto');
  const [mode, setMode] = useState<ChatMode>('tutor');
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [audioWaves, setAudioWaves] = useState<number[]>([20, 30, 20, 40, 25, 35, 20, 30, 20, 25, 20, 30]);

  const recognitionRef = useRef<any>(null);
  const shouldSubmitOnEndRef = useRef(false);
  const lastFinalTranscriptRef = useRef('');
  const selectedLanguage = getAssistantLanguage(language);
  const speechSupported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const helperText = useMemo(() => {
    if (isListening) return `Listening in ${selectedLanguage.label}. Speak naturally.`;
    if (isSpeaking) return 'Reading the answer aloud. You can stop voice anytime.';
    if (isLoading) return 'Thinking through the best academic response.';
    return 'Ask by voice, type a question, or use a quick student command.';
  }, [isListening, isSpeaking, isLoading, selectedLanguage.label]);

  useEffect(() => {
    if (!speechSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage.speechLang;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
      lastFinalTranscriptRef.current = '';
    };

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      if (finalText.trim()) {
        lastFinalTranscriptRef.current = `${lastFinalTranscriptRef.current} ${finalText}`.trim();
        setTranscript(lastFinalTranscriptRef.current);
      }
      setInterimTranscript(interimText.trim());
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      setInterimTranscript('');
      shouldSubmitOnEndRef.current = false;
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      if (shouldSubmitOnEndRef.current && lastFinalTranscriptRef.current.trim()) {
        shouldSubmitOnEndRef.current = false;
        void handleAskAi(lastFinalTranscriptRef.current);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognitionRef.current = null;
    };
  }, [selectedLanguage.speechLang, speechSupported]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isListening || isSpeaking) {
      interval = setInterval(() => {
        setAudioWaves(Array.from({ length: 16 }, () => Math.floor(Math.random() * 76) + 18));
      }, 110);
    } else {
      setAudioWaves([20, 30, 20, 40, 25, 35, 20, 30, 20, 25, 20, 30, 20, 35, 22, 28]);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening, isSpeaking]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by this browser. Type your question in the box instead.');
      return;
    }

    if (isListening) {
      shouldSubmitOnEndRef.current = true;
      recognitionRef.current.stop();
      return;
    }

    setTranscript('');
    setInterimTranscript('');
    aiService.stopSpeaking();
    setIsSpeaking(false);
    shouldSubmitOnEndRef.current = false;

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.warn(error);
    }
  };

  const handleAskAi = async (textToAsk?: string) => {
    const question = (textToAsk || transcript).trim();
    if (!question || isLoading) return;

    if (isListening && recognitionRef.current) {
      shouldSubmitOnEndRef.current = false;
      recognitionRef.current.stop();
    }

    runLocalCommand(question);

    const studentTurn: VoiceTurn = {
      id: `student_${Date.now()}`,
      role: 'student',
      text: question,
    };

    setTurns(prev => [...prev.slice(-5), studentTurn]);
    setTranscript('');
    setInterimTranscript('');
    setIsLoading(true);

    try {
      const res = await aiService.sendMessage({
        message: question,
        mode,
        subject: activeSubject?.name || 'Academic Preparation',
        academicContext: {
          degree: user.degree,
          semester: user.semester,
          goal: user.studyGoal,
          activeSubject,
          crackMode: user.isCrackModeActive,
        },
        history: turns.slice(-4).map(turn => ({
          role: turn.role === 'student' ? 'user' : 'assistant',
          content: turn.text,
        })),
        language,
      });

      const assistantTurn: VoiceTurn = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        text: res.reply,
      };

      setTurns(prev => [...prev.slice(-5), assistantTurn]);
      setIsLoading(false);
      setIsSpeaking(true);
      aiService.speakText(res.reply, () => setIsSpeaking(false), language);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setTurns(prev => [
        ...prev.slice(-5),
        {
          id: `assistant_err_${Date.now()}`,
          role: 'assistant',
          text: 'Sorry, I had trouble processing that. Please try again or use typed input.',
        },
      ]);
    }
  };

  const runLocalCommand = (question: string) => {
    const clean = question.toLowerCase();
    if (clean.includes('open quiz') || clean.includes('start quiz')) {
      setActiveTab('quiz');
    }
    if (clean.includes('study plan') || clean.includes('today plan')) {
      setActiveTab('study-plan');
    }
    if (clean.includes('flashcard')) {
      setActiveTab('flashcards');
    }
    if (clean.includes('focus') || clean.includes('pomodoro')) {
      setActiveTab('focus-timer');
    }
  };

  const stopVoicePlayback = () => {
    aiService.stopSpeaking();
    setIsSpeaking(false);
  };

  const closeModal = () => {
    stopVoicePlayback();
    if (isListening && recognitionRef.current) {
      shouldSubmitOnEndRef.current = false;
      recognitionRef.current.stop();
    }
    setVoiceAssistantOpen(false);
  };

  if (!voiceAssistantOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl bg-white dark:bg-[#121722] border border-gray-200 dark:border-gray-800 shadow-2xl grid lg:grid-cols-[0.9fr_1.1fr]">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-950 dark:hover:text-white transition-colors"
          title="Close voice assistant"
        >
          <X size={18} />
        </button>

        <section className="p-5 sm:p-6 bg-[#F8FAFC] dark:bg-[#0F141F] border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60 text-xs font-bold">
            <Sparkles size={14} />
            CrackSkull Voice AI
          </div>

          <h3 className="mt-4 text-2xl font-black font-heading tracking-tight text-gray-950 dark:text-white">
            {isListening ? 'I am listening now' : isSpeaking ? 'Speaking the answer' : 'Ask like a real tutor'}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 leading-6">
            {helperText}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <label className="rounded-2xl bg-white dark:bg-[#171D2A] border border-gray-200 dark:border-gray-800 px-3 py-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <Languages size={12} />
                Language
              </span>
              <select
                value={language}
                onChange={event => {
                  if (isListening && recognitionRef.current) recognitionRef.current.stop();
                  setLanguage(event.target.value as AssistantLanguageCode);
                }}
                className="mt-1 w-full bg-transparent outline-none text-xs font-bold text-gray-900 dark:text-white"
              >
                {assistantLanguages.map(item => (
                  <option key={item.code} value={item.code} className="bg-white dark:bg-slate-950 text-gray-950 dark:text-white">
                    {item.label} - {item.nativeLabel}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-2xl bg-white dark:bg-[#171D2A] border border-gray-200 dark:border-gray-800 px-3 py-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <Brain size={12} />
                Agent
              </span>
              <select
                value={mode}
                onChange={event => setMode(event.target.value as ChatMode)}
                className="mt-1 w-full bg-transparent outline-none text-xs font-bold text-gray-900 dark:text-white"
              >
                {agentOptions.map(agent => (
                  <option key={agent.mode} value={agent.mode} className="bg-white dark:bg-slate-950 text-gray-950 dark:text-white">
                    {agent.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex items-center justify-center gap-1.5 h-24 px-4 rounded-3xl bg-white dark:bg-[#171D2A] border border-gray-200 dark:border-gray-800">
            {audioWaves.map((height, index) => (
              <div
                key={index}
                className={`w-2 rounded-full transition-all duration-150 ${
                  isListening
                    ? 'bg-cyan-500 shadow-sm shadow-cyan-500/40'
                    : isSpeaking
                      ? 'bg-purple-500 shadow-sm shadow-purple-500/40'
                      : 'bg-gray-200 dark:bg-slate-800'
                }`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl active:scale-95 transition-all ${
                isListening
                  ? 'bg-rose-600 shadow-rose-600/30 animate-pulse'
                  : 'bg-black dark:bg-white dark:text-black shadow-gray-900/20 hover:scale-105'
              }`}
              title={isListening ? 'Stop and ask AI' : 'Start speaking'}
            >
              {isListening ? <MicOff size={30} /> : <Mic size={30} />}
            </button>

            <button
              onClick={stopVoicePlayback}
              disabled={!isSpeaking}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-[#171D2A] border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-slate-400 disabled:opacity-40 hover:text-gray-950 dark:hover:text-white"
              title="Stop voice playback"
            >
              <Square size={18} className="mx-auto" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {agentOptions.slice(0, 4).map(agent => (
              <button
                key={agent.mode}
                onClick={() => setMode(agent.mode)}
                className={`text-left rounded-2xl border p-3 transition-colors ${
                  mode === agent.mode
                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                    : 'bg-white dark:bg-[#171D2A] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-black">{agent.label}</div>
                <div className="mt-1 text-[10px] opacity-70">{agent.helper}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="p-5 sm:p-6 flex flex-col min-h-[560px] max-h-[92vh]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pr-10">
            {quickPrompts.map((prompt, index) => {
              const icons = [BookOpenCheck, CalendarCheck, Mic, FileQuestion];
              const Icon = icons[index];
              return (
                <button
                  key={prompt.label}
                  onClick={() => handleAskAi(prompt.prompt)}
                  className="rounded-2xl bg-gray-50 dark:bg-[#171D2A] border border-gray-200 dark:border-gray-800 p-3 text-left hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
                >
                  <Icon size={16} className="text-purple-500 dark:text-purple-300" />
                  <div className="mt-2 text-[11px] font-black text-gray-900 dark:text-white">{prompt.label}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex-1 overflow-y-auto rounded-3xl bg-gray-50 dark:bg-[#0F141F] border border-gray-200 dark:border-gray-800 p-4 space-y-3">
            {turns.length === 0 && !transcript && !isLoading && (
              <div className="h-full min-h-52 flex flex-col items-center justify-center text-center text-gray-500 dark:text-slate-500">
                <Volume2 size={28} className="mb-3" />
                <p className="text-sm font-bold text-gray-700 dark:text-slate-300">Ready for a real study conversation</p>
                <p className="mt-1 text-xs max-w-xs">
                  Try: “Explain DBMS normalization in Telugu”, “Open quiz”, or “Make a revision plan for tomorrow”.
                </p>
              </div>
            )}

            {turns.map(turn => (
              <div key={turn.id} className={`flex ${turn.role === 'student' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-3 text-xs leading-5 whitespace-pre-wrap ${
                    turn.role === 'student'
                      ? 'bg-black dark:bg-white text-white dark:text-black rounded-br-md'
                      : 'bg-white dark:bg-[#171D2A] border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-slate-100 rounded-bl-md'
                  }`}
                >
                  {turn.text.length > 700 ? `${turn.text.slice(0, 700)}...` : turn.text}
                </div>
              </div>
            ))}

            {(transcript || interimTranscript) && (
              <div className="rounded-2xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/50 p-3 text-xs text-cyan-800 dark:text-cyan-200">
                <span className="font-black">Live transcript: </span>
                {transcript}
                {interimTranscript && <span className="opacity-60"> {interimTranscript}</span>}
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-2 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 p-3 text-xs font-bold text-purple-700 dark:text-purple-300 animate-pulse">
                <Sparkles size={14} />
                <span>Preparing a {selectedLanguage.label.toLowerCase()} answer with {agentOptions.find(agent => agent.mode === mode)?.label} Agent...</span>
              </div>
            )}
          </div>

          <form
            onSubmit={event => {
              event.preventDefault();
              handleAskAi();
            }}
            className="mt-4 flex items-center gap-2"
          >
            <input
              type="text"
              value={transcript}
              onChange={event => setTranscript(event.target.value)}
              placeholder={`Type or speak in ${selectedLanguage.label}...`}
              className="flex-1 rounded-2xl bg-gray-50 dark:bg-[#171D2A] border border-gray-200 dark:border-gray-800 px-4 py-3 text-sm outline-none text-gray-950 dark:text-white placeholder:text-gray-400 focus:border-purple-500"
            />
            <button
              type="button"
              onClick={isSpeaking ? stopVoicePlayback : toggleListening}
              className="p-3 rounded-2xl bg-gray-100 dark:bg-[#171D2A] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-slate-200 hover:border-cyan-400"
              title={isSpeaking ? 'Mute assistant' : 'Speak'}
            >
              {isSpeaking ? <VolumeX size={18} /> : <Mic size={18} />}
            </button>
            <button
              type="submit"
              disabled={isLoading || !transcript.trim()}
              className="p-3 rounded-2xl bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 transition-colors"
              title="Ask AI"
            >
              <Send size={18} />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

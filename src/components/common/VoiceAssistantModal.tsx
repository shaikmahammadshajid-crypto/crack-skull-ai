import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import { AssistantLanguageCode, assistantLanguages, getAssistantLanguage } from '../../services/languageService';
import { Mic, VolumeX, X, Sparkles, Send, Languages } from 'lucide-react';

export const VoiceAssistantModal: React.FC = () => {
  const { voiceAssistantOpen, setVoiceAssistantOpen, activeSubject, user } = useApp();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<AssistantLanguageCode>('auto');
  const [audioWaves, setAudioWaves] = useState<number[]>([30, 60, 45, 80, 50, 70, 40]);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = getAssistantLanguage(language).speechLang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const resultTranscript = event.results[current][0].transcript;
        setTranscript(resultTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  // Animate Equalizer
  useEffect(() => {
    let interval: any;
    if (isListening || isSpeaking) {
      interval = setInterval(() => {
        setAudioWaves(
          Array.from({ length: 12 }, () => Math.floor(Math.random() * 70) + 20)
        );
      }, 120);
    } else {
      setAudioWaves([20, 30, 20, 40, 25, 35, 20, 30, 20, 25, 20, 30]);
    }
    return () => clearInterval(interval);
  }, [isListening, isSpeaking]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your browser. You can type your question directly below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setAiReply('');
      aiService.stopSpeaking();
      setIsSpeaking(false);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleAskAi = async (textToAsk?: string) => {
    const question = textToAsk || transcript;
    if (!question.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setIsLoading(true);
    setAiReply('');

    try {
      const res = await aiService.sendMessage({
        message: question,
        mode: 'tutor',
        subject: activeSubject?.name || 'Academic Preparation',
        academicContext: {
          degree: user.degree,
          semester: user.semester,
          goal: user.studyGoal,
        },
        language,
      });

      setAiReply(res.reply);
      setIsLoading(false);
      setIsSpeaking(true);

      // Play synthesized voice
      aiService.speakText(res.reply, () => {
        setIsSpeaking(false);
      }, language);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      setAiReply('Sorry, I had trouble processing that. Please try again!');
    }
  };

  const stopVoicePlayback = () => {
    aiService.stopSpeaking();
    setIsSpeaking(false);
  };

  if (!voiceAssistantOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#13192B] to-[#0A0D18] border border-purple-500/30 p-6 shadow-2xl shadow-purple-500/20 text-center flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={() => {
            stopVoicePlayback();
            if (isListening && recognitionRef.current) {
              recognitionRef.current.stop();
            }
            setVoiceAssistantOpen(false);
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-purple-500 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold mb-4">
          <Sparkles size={14} className="text-purple-400" />
          <span>Crack Skull Voice Assistant</span>
        </div>

        <h3 className="text-xl font-bold font-heading text-white tracking-tight mb-1">
          {isListening ? 'Listening to your question...' : isSpeaking ? 'Crack Skull AI Speaking...' : 'Ask your AI Tutor anything'}
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-5">
          <p className="text-xs text-slate-400 max-w-xs">
            Speak or type in your selected language.
          </p>
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs">
            <Languages size={13} className="text-cyan-300" />
            <select
              value={language}
              onChange={e => {
                if (isListening && recognitionRef.current) {
                  recognitionRef.current.stop();
                }
                setLanguage(e.target.value as AssistantLanguageCode);
              }}
              className="bg-transparent text-xs font-semibold outline-none max-w-[155px]"
              title="Speech recognition language"
            >
              {assistantLanguages.map(item => (
                <option key={item.code} value={item.code} className="bg-slate-950 text-slate-100">
                  {item.label} - {item.nativeLabel}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Dynamic Voice Visualizer Wave */}
        <div className="flex items-center justify-center gap-1.5 h-20 w-full px-8 my-2">
          {audioWaves.map((height, i) => (
            <div
              key={i}
              className={`w-2.5 rounded-full transition-all duration-150 ${
                isListening
                  ? 'bg-gradient-to-t from-cyan-500 to-blue-400 shadow-sm shadow-cyan-500/50'
                  : isSpeaking
                  ? 'bg-gradient-to-t from-purple-600 to-pink-500 shadow-sm shadow-purple-500/50'
                  : 'bg-slate-800'
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {/* Central Mic Button */}
        <div className="my-6">
          <button
            onClick={toggleListening}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white transition-all transform active:scale-95 shadow-xl ${
              isListening
                ? 'bg-gradient-to-r from-red-500 to-pink-600 shadow-red-500/40 animate-pulse scale-110'
                : 'bg-gradient-to-tr from-purple-600 to-cyan-500 shadow-purple-500/30 hover:scale-105'
            }`}
          >
            {isListening ? <Mic size={32} /> : <Mic size={32} />}
          </button>
        </div>

        {/* Live Transcript / Response Box */}
        <div className="w-full max-h-48 overflow-y-auto rounded-2xl bg-slate-950/80 border border-slate-800/90 p-4 text-left space-y-2 mb-4">
          {transcript && (
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-purple-400">You: </span>
              {transcript}
            </div>
          )}

          {isLoading && (
            <div className="text-xs text-purple-400 flex items-center gap-2 animate-pulse">
              <Sparkles size={14} />
              <span>Thinking & formulating academic response...</span>
            </div>
          )}

          {aiReply && (
            <div className="text-xs text-slate-200 space-y-1">
              <div className="font-semibold text-cyan-400 flex items-center justify-between">
                <span>Crack Skull AI:</span>
                {isSpeaking && (
                  <button
                    onClick={stopVoicePlayback}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <VolumeX size={12} />
                    <span>Mute</span>
                  </button>
                )}
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{aiReply.slice(0, 400)}...</p>
            </div>
          )}

          {!transcript && !aiReply && !isLoading && (
            <div className="text-xs text-slate-500 text-center py-2">
              Tap the microphone to speak in {getAssistantLanguage(language).label}, or use the input box below.
            </div>
          )}
        </div>

        {/* Fallback Text Input */}
        <div className="w-full flex items-center gap-2">
          <input
            type="text"
            placeholder="Or type your question here..."
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAskAi()}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => handleAskAi()}
            disabled={isLoading || !transcript.trim()}
            className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

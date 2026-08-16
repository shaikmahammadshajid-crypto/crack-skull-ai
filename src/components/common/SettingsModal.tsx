import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storageService';
import {
  Settings,
  X,
  Moon,
  Sun,
  Smartphone,
  Download,
  RotateCcw,
  Shield,
  Bell,
  Sparkles,
  Check,
  Zap,
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    settingsOpen,
    setSettingsOpen,
    theme,
    toggleTheme,
    user,
    updateUser,
    triggerConfetti,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'mobile' | 'data'>('general');
  const [degree, setDegree] = useState(user.degree);
  const [college, setCollege] = useState(user.college);
  const [dailyHours, setDailyHours] = useState(user.dailyHours);
  const [learningStyle, setLearningStyle] = useState(user.learningStyle);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!settingsOpen) return null;

  const handleSaveGeneral = () => {
    updateUser({
      degree,
      college,
      dailyHours: Number(dailyHours),
      learningStyle,
    });
    setSavedSuccess(true);
    triggerConfetti();
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportData = () => {
    const data = {
      user: storageService.getUser(),
      subjects: storageService.getSubjects(),
      documents: storageService.getDocuments(),
      quizzes: storageService.getQuizzes(),
      attempts: storageService.getQuizAttempts(),
      flashcards: storageService.getFlashcards(),
      studyPlan: storageService.getStudyPlan(),
      knowledgeNodes: storageService.getKnowledgeNodes(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crack_skull_study_data_${user.name.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all local study progress to default demo state?')) {
      storageService.resetToDemo();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold font-heading text-white">
                Application Settings
              </h3>
              <p className="text-[11px] text-slate-400">
                Crack Skull AI Configuration & Mobile Sync
              </p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 border-b border-slate-800 flex gap-4 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-purple-500 text-white'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            General & Academic
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-purple-500 text-white'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            AI Persona & Voice
          </button>
          <button
            onClick={() => setActiveTab('mobile')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'mobile'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <Smartphone size={14} />
            <span>iOS & Android App</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-purple-500 text-white'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Data & Backup
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div>
                  <div className="font-semibold text-white">Visual Appearance Theme</div>
                  <div className="text-slate-400 text-[11px]">
                    Current: {theme === 'dark' ? 'Dark Futuristic Cyber' : 'Light Clean Mode'}
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white hover:border-purple-500 transition-colors"
                >
                  {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                  <span>Toggle {theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Degree / Program
                  </label>
                  <input
                    type="text"
                    value={degree}
                    onChange={e => setDegree(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    University / College
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={e => setCollege(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Daily Study Target (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="14"
                    value={dailyHours}
                    onChange={e => setDailyHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Preferred Learning Style
                  </label>
                  <select
                    value={learningStyle}
                    onChange={e => setLearningStyle(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="interactive">Interactive / Problem Solving</option>
                    <option value="practice">Practice & PYQ Heavy</option>
                    <option value="visual">Visual & Conceptual Diagrams</option>
                    <option value="reading">Textbook & Thorough Reading</option>
                    <option value="mixed">Balanced Mixed Style</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {savedSuccess ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Check size={14} /> Profile updated successfully!
                  </span>
                ) : (
                  <span />
                )}
                <button
                  onClick={handleSaveGeneral}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md shadow-purple-600/30 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="font-semibold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400" />
                  <span>AI Academic Persona</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Crack Skull AI automatically adapts its pedagogical tone according to your active mode (Tutor, Exam, Viva Examiner, Coding Mentor, Beginner).
                </p>
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                    🎯 <strong className="text-white">Exam Mode:</strong> Concise, formula-first, high-scoring.
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                    👨‍🏫 <strong className="text-white">Tutor Mode:</strong> Step-by-step conceptual depth.
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                    🎓 <strong className="text-white">Viva Mode:</strong> Probing college oral examiner.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="font-semibold text-white">Voice Assistant Settings</div>
                <div className="text-slate-400 text-[11px]">
                  Configured with Web Speech Synthesis and high-accuracy speech recognition.
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    Speech-to-Text: Active
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                    Voice Synthesis: Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mobile' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/40 to-slate-950/40 border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone size={20} className="text-cyan-400" />
                  <span className="font-bold text-white text-sm">
                    Native iOS & Android Architecture
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Crack Skull AI is fully decoupled and architected for <strong>React Native + Expo</strong> cross-platform packaging. All API clients, Firestore models, local storage engines, and AI services are 100% portable.
                </p>
                <div className="p-3 rounded-xl bg-slate-950 font-mono text-[10px] text-slate-300 space-y-1 overflow-x-auto">
                  <div className="text-purple-400"># Native Mobile Quickstart:</div>
                  <div>npx create-expo-app crack-skull-mobile --template blank-typescript</div>
                  <div>npm install @react-native-async-storage/async-storage expo-speech lucide-react-native</div>
                  <div className="text-cyan-400">// Reuse /src/services/aiService.ts and /src/types/index.ts directly!</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Export Study Data</div>
                  <div className="text-slate-400 text-[11px]">
                    Download a full JSON backup of your notes, flashcards, and quiz attempts.
                  </div>
                </div>
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white hover:border-purple-500 transition-colors"
                >
                  <Download size={14} />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-red-300">Reset Demo Data</div>
                  <div className="text-slate-400 text-[11px]">
                    Reset all cached files, quiz attempts, and restore original Alex demo state.
                  </div>
                </div>
                <button
                  onClick={handleResetData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <RotateCcw size={14} />
                  <span>Reset All</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

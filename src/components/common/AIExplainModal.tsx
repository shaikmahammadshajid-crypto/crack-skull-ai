import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import {
  Sparkles,
  X,
  BookOpen,
  HelpCircle,
  Layers,
  Mic,
  FileQuestion,
  Copy,
  Check,
  Send,
} from 'lucide-react';

export const AIExplainModal: React.FC = () => {
  const {
    explainModal,
    closeExplainModal,
    addFlashcard,
    startQuiz,
    setActiveTab,
    triggerConfetti,
  } = useApp();

  const [activeAction, setActiveAction] = useState<'explain' | 'example' | 'quiz' | 'flashcard' | 'viva'>('explain');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedConcept = explainModal.selectedText;

  const handleAction = async (action: 'explain' | 'example' | 'quiz' | 'flashcard' | 'viva') => {
    setActiveAction(action);
    setIsLoading(true);
    setOutput('');

    try {
      if (action === 'explain') {
        const res = await aiService.sendMessage({
          message: `Explain this concept simply with intuitive analogies: "${selectedConcept}"`,
          mode: 'beginner',
          subject: explainModal.contextSubject,
        });
        setOutput(res.reply);
      } else if (action === 'example') {
        const res = await aiService.sendMessage({
          message: `Give concrete numerical, code, or real-world exam examples illustrating: "${selectedConcept}"`,
          mode: 'tutor',
          subject: explainModal.contextSubject,
        });
        setOutput(res.reply);
      } else if (action === 'flashcard') {
        const prompt = `Create a high-impact flashcard question & answer pair for: "${selectedConcept}"`;
        const res = await aiService.sendMessage({
          message: prompt,
          mode: 'revision',
          subject: explainModal.contextSubject,
        });
        setOutput(res.reply);

        // Also add to flashcard deck automatically
        addFlashcard({
          id: `fc_${Date.now()}`,
          deckId: 'deck_instant',
          subjectId: 'sub_active',
          subjectName: explainModal.contextSubject || 'General',
          topic: selectedConcept.slice(0, 30),
          front: `What is the core principle of ${selectedConcept.slice(0, 50)}?`,
          back: res.reply.slice(0, 250),
          difficulty: 'medium',
          reviewCount: 0,
          isMastered: false,
        });
        triggerConfetti();
      } else if (action === 'quiz') {
        const questions = await aiService.generateQuiz({
          subject: explainModal.contextSubject || 'Academic Preparation',
          topic: selectedConcept,
          difficulty: 'medium',
          count: 3,
        });
        if (questions && questions.length > 0) {
          startQuiz({
            id: `instant_quiz_${Date.now()}`,
            title: `Instant Quiz: ${selectedConcept.slice(0, 30)}`,
            subjectId: 'sub_active',
            subjectName: explainModal.contextSubject || 'General',
            topic: selectedConcept,
            difficulty: 'medium',
            durationMinutes: 5,
            questions,
            createdAt: new Date().toISOString(),
          });
          closeExplainModal();
          return;
        } else {
          setOutput('Generated quiz directly. Opening quiz mode...');
        }
      } else if (action === 'viva') {
        const vivaData = await aiService.handleVivaAction({
          action: 'next-question',
          subject: explainModal.contextSubject,
          topic: selectedConcept,
        });
        setOutput(`### 🎓 AI University Viva Examiner Question:\n\n**"${vivaData.question}"**\n\n*Expected Keypoints to mention:*\n${vivaData.expectedKeypoints?.map((k: string) => `- ${k}`).join('\n') || '- Clear formal definition'}`);
      }
    } catch (e) {
      console.error(e);
      setOutput('Failed to generate insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!explainModal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold font-heading text-white">
                AI Explain Anywhere
              </h3>
              <p className="text-[11px] text-slate-400">
                {explainModal.contextSubject ? `${explainModal.contextSubject} • ` : ''}
                {explainModal.sourceDocTitle || 'Instant Intelligence'}
              </p>
            </div>
          </div>

          <button
            onClick={closeExplainModal}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selected text snippet */}
        <div className="px-5 pt-3 pb-2 bg-slate-950/30 border-b border-slate-800/60">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Selected Concept / Term
          </div>
          <div className="text-xs font-semibold text-purple-200 line-clamp-2 bg-purple-950/20 p-2 rounded-xl border border-purple-500/20">
            "{selectedConcept}"
          </div>
        </div>

        {/* Action Pills */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => handleAction('explain')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeAction === 'explain'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen size={14} />
            <span>Explain Simple</span>
          </button>

          <button
            onClick={() => handleAction('example')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeAction === 'example'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Exam Example</span>
          </button>

          <button
            onClick={() => handleAction('quiz')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeAction === 'quiz'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <HelpCircle size={14} />
            <span>Generate Quiz</span>
          </button>

          <button
            onClick={() => handleAction('flashcard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeAction === 'flashcard'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>Add Flashcard</span>
          </button>

          <button
            onClick={() => handleAction('viva')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeAction === 'viva'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Mic size={14} />
            <span>Ask Viva Question</span>
          </button>
        </div>

        {/* AI Output Result Box */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-200 space-y-3 leading-relaxed">
          {isLoading ? (
            <div className="py-12 text-center space-y-2 animate-pulse text-purple-400">
              <Sparkles size={24} className="mx-auto" />
              <div>Generating personalized academic breakdown...</div>
            </div>
          ) : output ? (
            <div className="whitespace-pre-wrap">{output}</div>
          ) : (
            <div className="py-10 text-center text-slate-400">
              Select one of the actions above to generate instant explanation, flashcards, or practice quiz!
            </div>
          )}
        </div>

        {/* Footer */}
        {output && !isLoading && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied to clipboard' : 'Copy answer'}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ai-tutor');
                closeExplainModal();
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-950/40"
            >
              <span>Continue in AI Tutor →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

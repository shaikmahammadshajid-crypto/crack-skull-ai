import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Flashcard } from '../../types';
import {
  Layers,
  Sparkles,
  RotateCw,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Volume2,
  Trash2,
} from 'lucide-react';

export const FlashcardsView: React.FC = () => {
  const {
    flashcards,
    updateFlashcard,
    addFlashcard,
    activeSubject,
    triggerConfetti,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'unmastered' | 'mastered'>('all');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New card form
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newTopic, setNewTopic] = useState('Key Theory');

  const filteredCards = flashcards.filter(f => {
    if (activeTab === 'mastered') return f.isMastered;
    if (activeTab === 'unmastered') return !f.isMastered;
    return true;
  });

  const currentCard = filteredCards[currentIdx] || filteredCards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIdx(prev => (prev + 1) % filteredCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIdx(prev => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleMastery = (isMastered: boolean, diff: 'easy' | 'medium' | 'hard') => {
    if (!currentCard) return;
    updateFlashcard(currentCard.id, isMastered, diff);
    if (isMastered) triggerConfetti();
    handleNext();
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    addFlashcard({
      id: `fc_${Date.now()}`,
      deckId: 'deck_custom',
      subjectId: activeSubject?.id || 'sub_gen',
      subjectName: activeSubject?.name || 'General',
      topic: newTopic,
      front: newFront,
      back: newBack,
      difficulty: 'medium',
      reviewCount: 0,
      isMastered: false,
    });

    setNewFront('');
    setNewBack('');
    setIsAddModalOpen(false);
    triggerConfetti();
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900/60 border border-amber-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Layers size={22} />
            </div>
            <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">
              Spaced Repetition Flashcards
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Active recall & spaced revision algorithm to commit proofs, definitions, and code syntax to permanent memory.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/30 flex items-center gap-1.5 transition-all"
        >
          <Plus size={16} />
          <span>Add New Card</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentIdx(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              activeTab === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
            }`}
          >
            All Decks ({flashcards.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('unmastered');
              setCurrentIdx(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              activeTab === 'unmastered' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Needs Review ({flashcards.filter(f => !f.isMastered).length})
          </button>
          <button
            onClick={() => {
              setActiveTab('mastered');
              setCurrentIdx(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              activeTab === 'mastered' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Mastered ({flashcards.filter(f => f.isMastered).length})
          </button>
        </div>

        {filteredCards.length > 0 && (
          <span className="text-xs text-slate-400 font-mono">
            Card {currentIdx + 1} of {filteredCards.length}
          </span>
        )}
      </div>

      {/* 3D Flippable Interactive Flashcard */}
      {currentCard ? (
        <div className="space-y-6">
          <div
            onClick={() => setIsFlipped(prev => !prev)}
            className="cursor-pointer min-h-[280px] sm:min-h-[320px] rounded-3xl p-8 bg-gradient-to-b from-[#13192B] to-[#0A0D18] border border-amber-500/30 shadow-2xl flex flex-col justify-between select-none transition-all duration-300 hover:border-amber-400/60 relative group"
          >
            {/* Top Card Info */}
            <div className="flex items-center justify-between text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                {currentCard.topic}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {isFlipped ? 'Answer (Click to Flip Back)' : 'Question (Click to Reveal)'}
              </span>
            </div>

            {/* Central Content */}
            <div className="text-center py-6">
              <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed font-heading">
                {isFlipped ? currentCard.back : currentCard.front}
              </h3>
            </div>

            {/* Bottom Hint */}
            <div className="flex items-center justify-between text-slate-500 text-xs border-t border-slate-800/80 pt-3">
              <span>{currentCard.subjectName}</span>
              <span className="flex items-center gap-1 text-amber-400 group-hover:text-amber-300">
                <RotateCw size={13} />
                <span>Tap card to flip</span>
              </span>
            </div>
          </div>

          {/* Active Recall Response Controls */}
          {isFlipped && (
            <div className="grid grid-cols-3 gap-3 animate-in fade-in">
              <button
                onClick={() => handleMastery(false, 'hard')}
                className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/50 text-xs font-bold transition-colors"
              >
                🔴 Again (1 min)
              </button>
              <button
                onClick={() => handleMastery(true, 'medium')}
                className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 hover:bg-amber-900/50 text-xs font-bold transition-colors"
              >
                🟡 Good (1 day)
              </button>
              <button
                onClick={() => handleMastery(true, 'easy')}
                className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 text-xs font-bold transition-colors"
              >
                🟢 Easy (4 days)
              </button>
            </div>
          )}

          {/* Arrow Navigator */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-xs"
            >
              <ArrowLeft size={14} />
              <span>Previous</span>
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-xs"
            >
              <span>Next</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
          No flashcards in this category. Click "+ Add New Card" or highlight text in the PDF Studio to create one!
        </div>
      )}

      {/* Add Flashcard Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-heading">
              Create New Flashcard
            </h3>

            <form onSubmit={handleAddCard} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Topic Tag
                </label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Front (Prompt / Question / Theorem)
                </label>
                <textarea
                  rows={2}
                  value={newFront}
                  onChange={e => setNewFront(e.target.value)}
                  placeholder="e.g. State the condition for a relational schema to be in BCNF."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Back (Model Answer / Key Points)
                </label>
                <textarea
                  rows={3}
                  value={newBack}
                  onChange={e => setNewBack(e.target.value)}
                  placeholder="e.g. For every non-trivial FD X -> Y, X must be a superkey."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/30"
                >
                  Save Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

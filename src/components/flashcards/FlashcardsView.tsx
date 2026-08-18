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
    <div className="view-stack max-w-5xl space-y-5">
      {/* Header Banner */}
      <div className="view-hero flex flex-col items-start justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <Layers size={22} />
            </div>
            <h1 className="view-title text-2xl">
              Spaced Repetition Flashcards
            </h1>
          </div>
          <p className="view-copy text-xs sm:text-sm">
            Active recall & spaced revision algorithm to commit proofs, definitions, and code syntax to permanent memory.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="primary-action bg-amber-500 px-4 py-2.5 text-xs text-gray-950 hover:bg-amber-400 dark:bg-amber-400 dark:text-gray-950"
        >
          <Plus size={16} />
          <span>Add New Card</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="segmented-control">
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentIdx(0);
              setIsFlipped(false);
            }}
            className={`segmented-option ${
              activeTab === 'all' ? 'segmented-option-active' : ''
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
            className={`segmented-option ${
              activeTab === 'unmastered' ? 'segmented-option-active' : ''
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
            className={`segmented-option ${
              activeTab === 'mastered' ? 'segmented-option-active' : ''
            }`}
          >
            Mastered ({flashcards.filter(f => f.isMastered).length})
          </button>
        </div>

        {filteredCards.length > 0 && (
          <span className="font-mono text-xs text-[var(--app-text-muted)]">
            Card {currentIdx + 1} of {filteredCards.length}
          </span>
        )}
      </div>

      {/* 3D Flippable Interactive Flashcard */}
      {currentCard ? (
        <div className="space-y-6">
          <div
            onClick={() => setIsFlipped(prev => !prev)}
            className="surface-card-strong group relative flex min-h-[280px] cursor-pointer select-none flex-col justify-between p-6 transition-colors hover:border-amber-400 sm:min-h-[320px] sm:p-8"
          >
            {/* Top Card Info */}
            <div className="flex items-center justify-between text-xs">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-mono text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                {currentCard.topic}
              </span>
              <span className="font-mono text-[11px] text-[var(--app-text-muted)]">
                {isFlipped ? 'Answer (Click to Flip Back)' : 'Question (Click to Reveal)'}
              </span>
            </div>

            {/* Central Content */}
            <div className="text-center py-6">
              <h3 className="font-heading text-lg font-black leading-relaxed text-[var(--app-text)] sm:text-xl">
                {isFlipped ? currentCard.back : currentCard.front}
              </h3>
            </div>

            {/* Bottom Hint */}
            <div className="flex items-center justify-between border-t border-[var(--app-border)] pt-3 text-xs text-[var(--app-text-muted)]">
              <span>{currentCard.subjectName}</span>
              <span className="flex items-center gap-1 text-amber-700 group-hover:text-amber-800 dark:text-amber-300 dark:group-hover:text-amber-200">
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
                className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-black text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
              >
                Again (1 min)
              </button>
              <button
                onClick={() => handleMastery(true, 'medium')}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-black text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
              >
                Good (1 day)
              </button>
              <button
                onClick={() => handleMastery(true, 'easy')}
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-black text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
              >
                Easy (4 days)
              </button>
            </div>
          )}

          {/* Arrow Navigator */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrev}
              className="secondary-action px-4 py-2 text-xs"
            >
              <ArrowLeft size={14} />
              <span>Previous</span>
            </button>
            <button
              onClick={handleNext}
              className="secondary-action px-4 py-2 text-xs"
            >
              <span>Next</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="surface-muted p-12 text-center text-xs text-[var(--app-text-muted)]">
          No flashcards in this category. Click "+ Add New Card" or highlight text in the PDF Studio to create one!
        </div>
      )}

      {/* Add Flashcard Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
          <div className="surface-card-strong w-full max-w-lg space-y-4 p-6">
            <h3 className="font-heading text-base font-black text-[var(--app-text)]">
              Create New Flashcard
            </h3>

            <form onSubmit={handleAddCard} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-[var(--app-text-muted)]">
                  Topic Tag
                </label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  className="form-control w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[var(--app-text-muted)]">
                  Front (Prompt / Question / Theorem)
                </label>
                <textarea
                  rows={2}
                  value={newFront}
                  onChange={e => setNewFront(e.target.value)}
                  placeholder="e.g. State the condition for a relational schema to be in BCNF."
                  className="form-control w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[var(--app-text-muted)]">
                  Back (Model Answer / Key Points)
                </label>
                <textarea
                  rows={3}
                  value={newBack}
                  onChange={e => setNewBack(e.target.value)}
                  placeholder="e.g. For every non-trivial FD X -> Y, X must be a superkey."
                  className="form-control w-full px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="secondary-action px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-action bg-amber-500 px-5 py-2 text-gray-950 hover:bg-amber-400 dark:bg-amber-400 dark:text-gray-950"
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

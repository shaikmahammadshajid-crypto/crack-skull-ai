import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import { Quiz, QuizQuestion, QuizAttempt } from '../../types';
import {
  HelpCircle,
  Sparkles,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Trophy,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

export const QuizView: React.FC = () => {
  const {
    quizzes,
    addQuiz,
    quizAttempts,
    saveQuizAttempt,
    activeQuiz,
    startQuiz,
    finishActiveQuiz,
    subjects,
    activeSubject,
    triggerConfetti,
  } = useApp();

  // Generator form state
  const [topicInput, setTopicInput] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active quiz runner state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showExplanation, setShowExplanation] = useState<{ [key: number]: boolean }>({});
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attemptSummary, setAttemptSummary] = useState<QuizAttempt | null>(null);

  // Initialize timer on quiz start
  useEffect(() => {
    if (activeQuiz) {
      setCurrentQIndex(0);
      setSelectedAnswers({});
      setShowExplanation({});
      setIsSubmitted(false);
      setAttemptSummary(null);
      setSecondsRemaining(activeQuiz.durationMinutes * 60);
    }
  }, [activeQuiz]);

  // Countdown timer effect
  useEffect(() => {
    let interval: any;
    if (activeQuiz && !isSubmitted && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQuiz, isSubmitted, secondsRemaining]);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;

    setIsGenerating(true);
    try {
      const generatedQuestions = await aiService.generateQuiz({
        subject: activeSubject?.name || 'Computer Science',
        topic: topicInput,
        difficulty,
        count: Number(questionCount),
      });

      if (generatedQuestions && generatedQuestions.length > 0) {
        const newQuiz: Quiz = {
          id: `quiz_${Date.now()}`,
          title: `${topicInput} (${difficulty.toUpperCase()})`,
          subjectId: activeSubject?.id || 'sub_gen',
          subjectName: activeSubject?.name || 'General',
          topic: topicInput,
          difficulty,
          durationMinutes: Math.max(3, Math.ceil(questionCount * 1.5)),
          questions: generatedQuestions,
          createdAt: new Date().toISOString(),
        };

        addQuiz(newQuiz);
        startQuiz(newQuiz);
        setTopicInput('');
        triggerConfetti();
      }
    } catch (e) {
      console.error(e);
      alert('Error generating quiz. Please try again!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQIndex]: optionIndex,
    }));
    setShowExplanation(prev => ({
      ...prev,
      [currentQIndex]: true,
    }));
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz || isSubmitted) return;

    let correctCount = 0;
    const weakTopics: string[] = [];

    activeQuiz.questions.forEach((q, idx) => {
      const userChoice = selectedAnswers[idx];
      if (userChoice === q.correctIndex) {
        correctCount++;
      } else {
        weakTopics.push(q.topic || activeQuiz.topic);
      }
    });

    const accuracy = Math.round((correctCount / activeQuiz.questions.length) * 100);
    const scoreTotal = correctCount * 10;
    const timeSpent = activeQuiz.durationMinutes * 60 - secondsRemaining;

    const attempt: QuizAttempt = {
      id: `attempt_${Date.now()}`,
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      subjectName: activeQuiz.subjectName,
      score: scoreTotal,
      totalMarks: activeQuiz.questions.length * 10,
      accuracyPercentage: accuracy,
      userAnswers: selectedAnswers,
      completedAt: 'Just now',
      timeSpentSeconds: Math.max(10, timeSpent),
      weakTopicsIdentified: Array.from(new Set(weakTopics)),
      strongTopicsIdentified: [activeQuiz.topic],
    };

    setAttemptSummary(attempt);
    setIsSubmitted(true);
    saveQuizAttempt(attempt);
    triggerConfetti();
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 1. ACTIVE QUIZ RUNNER INTERFACE
  if (activeQuiz) {
    const currentQ = activeQuiz.questions[currentQIndex];
    const userSelected = selectedAnswers[currentQIndex];
    const isAnswered = userSelected !== undefined;

    return (
      <div className="view-stack max-w-5xl space-y-5">
        {/* Top Runner Header */}
        <div className="surface-card flex items-center justify-between gap-4 p-4">
          <div className="space-y-0.5">
            <h3 className="font-heading text-sm font-black text-[var(--app-text)]">
              {activeQuiz.title}
            </h3>
            <div className="font-mono text-[11px] text-[var(--app-text-muted)]">
              Question {currentQIndex + 1} of {activeQuiz.questions.length} • {activeQuiz.subjectName}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isSubmitted && (
              <div className="status-pill font-mono text-teal-700 dark:text-teal-300">
                <Clock size={14} className="animate-pulse text-teal-700 dark:text-teal-300" />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>
            )}

            <button
              onClick={finishActiveQuiz}
              className="secondary-action px-3 py-1.5 text-xs"
            >
              Exit Quiz
            </button>
          </div>
        </div>

        {/* Results Screen if submitted */}
        {isSubmitted && attemptSummary ? (
          <div className="surface-card-strong animate-in zoom-in-95 space-y-6 p-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Trophy size={40} className="animate-bounce" />
            </div>

            <div className="space-y-1">
              <h2 className="font-heading text-2xl font-black text-[var(--app-text)]">
                Quiz Completed!
              </h2>
              <p className="text-xs text-[var(--app-text-muted)]">
                Performance recorded and added to your Academic Crack Score.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="metric-tile">
                <div className="font-mono text-2xl font-black text-[var(--app-text)]">
                  {attemptSummary.accuracyPercentage}%
                </div>
                <div className="text-[10px] font-semibold uppercase text-[var(--app-text-subtle)]">Accuracy</div>
              </div>
              <div className="metric-tile">
                <div className="font-mono text-2xl font-black text-blue-700 dark:text-blue-300">
                  {attemptSummary.score}/{attemptSummary.totalMarks}
                </div>
                <div className="text-[10px] font-semibold uppercase text-[var(--app-text-subtle)]">Score</div>
              </div>
              <div className="metric-tile">
                <div className="font-mono text-2xl font-black text-teal-700 dark:text-teal-300">
                  +100
                </div>
                <div className="text-[10px] font-semibold uppercase text-[var(--app-text-subtle)]">XP Earned</div>
              </div>
            </div>

            {attemptSummary.weakTopicsIdentified.length > 0 && (
              <div className="surface-muted mx-auto max-w-lg space-y-1.5 border-amber-200 bg-amber-50 p-4 text-left text-xs dark:border-amber-500/30 dark:bg-amber-500/10">
                <div className="flex items-center gap-1.5 font-black text-amber-700 dark:text-amber-300">
                  <AlertCircle size={14} />
                  <span>Topics to Reinforce:</span>
                </div>
                <div className="text-[var(--app-text-muted)]">
                  {attemptSummary.weakTopicsIdentified.join(', ')}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedAnswers({});
                  setShowExplanation({});
                  setIsSubmitted(false);
                  setCurrentQIndex(0);
                  setSecondsRemaining(activeQuiz.durationMinutes * 60);
                }}
                className="secondary-action px-4 py-2 text-xs"
              >
                <RotateCcw size={14} />
                <span>Retry Quiz</span>
              </button>
              <button
                onClick={finishActiveQuiz}
                className="primary-action px-5 py-2 text-xs"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Active Question Card */
          <div className="surface-card space-y-6 p-5 sm:p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="status-pill font-mono text-teal-700 dark:text-teal-300">
                  Question {currentQIndex + 1}
                </span>
                <span className="font-mono text-xs text-[var(--app-text-muted)]">
                  {currentQ?.topic || activeQuiz.topic}
                </span>
              </div>

              <h2 className="text-base font-black leading-relaxed text-[var(--app-text)] sm:text-lg">
                {currentQ?.question}
              </h2>
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              {currentQ?.options.map((opt, optIdx) => {
                const isThisSelected = userSelected === optIdx;
                const isCorrect = optIdx === currentQ.correctIndex;

                let optionStyle = 'border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text)] hover:border-[var(--app-border-strong)]';
                if (isAnswered) {
                  if (isCorrect) {
                    optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-500/10 dark:text-emerald-100';
                  } else if (isThisSelected && !isCorrect) {
                    optionStyle = 'border-rose-500 bg-rose-50 text-rose-950 dark:bg-rose-500/10 dark:text-rose-100';
                  } else {
                    optionStyle = 'border-[var(--app-border)] bg-[var(--app-surface-muted)] opacity-55 text-[var(--app-text-muted)]';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`flex w-full items-center justify-between rounded-lg border p-4 text-left text-xs font-semibold transition-colors sm:text-sm ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] font-mono text-xs font-black text-[var(--app-text-muted)]">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {isAnswered && (
                      <div>
                        {isCorrect && <CheckCircle2 size={18} className="text-emerald-400" />}
                        {isThisSelected && !isCorrect && <XCircle size={18} className="text-rose-400" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Immediate Explanation Box */}
            {isAnswered && currentQ?.explanation && (
              <div className="surface-muted animate-in fade-in space-y-1 border-blue-200 bg-blue-50 p-4 text-xs dark:border-blue-500/30 dark:bg-blue-500/10">
                <div className="flex items-center gap-1.5 font-black text-blue-700 dark:text-blue-300">
                  <Sparkles size={14} />
                  <span>AI Examination Rationale:</span>
                </div>
                <p className="leading-relaxed text-[var(--app-text-muted)]">
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="flex items-center justify-between border-t border-[var(--app-border)] pt-4">
              <button
                onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQIndex === 0}
                className="secondary-action px-3.5 py-1.5 text-xs disabled:opacity-40"
              >
                <ArrowLeft size={14} />
                <span>Previous</span>
              </button>

              {currentQIndex < activeQuiz.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQIndex(prev => prev + 1)}
                  className="primary-action px-4 py-2 text-xs"
                >
                  <span>Next Question</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="primary-action bg-emerald-600 px-5 py-2 text-xs text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-white"
                >
                  Submit & Score Quiz
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. QUIZ DASHBOARD (Create AI Quiz + Recent Quizzes + Attempts)
  return (
    <div className="view-stack space-y-5">
      {/* Header Banner */}
      <div className="view-hero flex flex-col items-start justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              <HelpCircle size={22} />
            </div>
            <h1 className="view-title text-2xl">
              AI Quiz & Mock Test Studio
            </h1>
          </div>
          <p className="view-copy text-xs sm:text-sm">
            Generate customized, adaptive university mock quizzes on any concept, textbook chapter, or exam unit in seconds.
          </p>
        </div>
      </div>

      {/* AI Quiz Generator Form */}
      <div className="surface-card space-y-4 p-5 sm:p-6">
        <h3 className="flex items-center gap-2 font-heading text-sm font-black text-[var(--app-text)]">
          <Sparkles size={16} className="text-blue-700 dark:text-blue-300" />
          <span>Generate Instant Adaptive Quiz</span>
        </h3>

        <form onSubmit={handleGenerateQuiz} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <label className="mb-1 block text-[11px] font-bold text-[var(--app-text-muted)]">
              Topic or Chapter
            </label>
            <input
              type="text"
              placeholder="e.g. Normalization BCNF, ACID properties, Binary Search"
              value={topicInput}
              onChange={e => setTopicInput(e.target.value)}
              className="form-control w-full px-3.5 py-2 text-xs"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="mb-1 block text-[11px] font-bold text-[var(--app-text-muted)]">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as any)}
              className="form-control w-full px-3 py-2 text-xs"
            >
              <option value="easy">Easy (Concept definitions)</option>
              <option value="medium">Medium (University Standard)</option>
              <option value="hard">Hard (Tricky Proofs & PYQs)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-bold text-[var(--app-text-muted)]">
              Questions
            </label>
            <select
              value={questionCount}
              onChange={e => setQuestionCount(Number(e.target.value))}
              className="form-control w-full px-3 py-2 text-xs"
            >
              <option value={3}>3 Questions (Quick Sprint)</option>
              <option value={5}>5 Questions (Standard)</option>
              <option value={10}>10 Questions (Mock Exam)</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isGenerating || !topicInput.trim()}
              className="primary-action w-full py-2 text-xs disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>{isGenerating ? 'Synthesizing...' : 'Create Quiz'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Available Quiz Decks Grid */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-heading text-sm font-black text-[var(--app-text)]">
          <Play size={16} className="text-blue-700 dark:text-blue-300" />
          <span>Available Quizzes & Practice Papers ({quizzes.length})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map(quiz => (
            <div
              key={quiz.id}
              className="surface-card flex flex-col justify-between space-y-3 p-5 transition-colors hover:border-[var(--app-border-strong)]"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="status-pill font-mono">
                    {quiz.subjectName}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                      quiz.difficulty === 'hard'
                        ? 'bg-rose-500/20 text-rose-300'
                        : quiz.difficulty === 'medium'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {quiz.difficulty}
                  </span>
                </div>

                <h4 className="font-heading text-sm font-black text-[var(--app-text)]">
                  {quiz.title}
                </h4>
                <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--app-text-muted)]">
                  <span>{quiz.questions.length} Questions</span>
                  <span>•</span>
                  <span>{quiz.durationMinutes} Minutes</span>
                </div>
              </div>

              <button
                onClick={() => startQuiz(quiz)}
                className="primary-action w-full py-2 text-xs"
              >
                <Play size={13} />
                <span>Start Practice Quiz</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Top Runner Header */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white font-heading">
              {activeQuiz.title}
            </h3>
            <div className="text-[11px] text-slate-400 font-mono">
              Question {currentQIndex + 1} of {activeQuiz.questions.length} • {activeQuiz.subjectName}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isSubmitted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-purple-300">
                <Clock size={14} className="text-cyan-400 animate-pulse" />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>
            )}

            <button
              onClick={finishActiveQuiz}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white"
            >
              Exit Quiz
            </button>
          </div>
        </div>

        {/* Results Screen if submitted */}
        {isSubmitted && attemptSummary ? (
          <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-950/40 to-slate-900 border border-purple-500/30 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-300 shadow-xl shadow-purple-500/20">
              <Trophy size={40} className="animate-bounce" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold font-heading text-white">
                Quiz Completed!
              </h2>
              <p className="text-xs text-slate-300">
                Performance recorded and added to your Academic Crack Score.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-2xl font-extrabold font-mono text-white">
                  {attemptSummary.accuracyPercentage}%
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Accuracy</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-2xl font-extrabold font-mono text-purple-400">
                  {attemptSummary.score}/{attemptSummary.totalMarks}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Score</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-2xl font-extrabold font-mono text-cyan-400">
                  +100
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">XP Earned</div>
              </div>
            </div>

            {attemptSummary.weakTopicsIdentified.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-left max-w-lg mx-auto space-y-1.5">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  <span>Topics to Reinforce:</span>
                </div>
                <div className="text-slate-300">
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
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>Retry Quiz</span>
              </button>
              <button
                onClick={finishActiveQuiz}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 shadow-md shadow-purple-600/30"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Active Question Card */
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold font-mono text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-lg border border-purple-500/30">
                  Question {currentQIndex + 1}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentQ?.topic || activeQuiz.topic}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentQ?.question}
              </h2>
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              {currentQ?.options.map((opt, optIdx) => {
                const isThisSelected = userSelected === optIdx;
                const isCorrect = optIdx === currentQ.correctIndex;

                let optionStyle = 'bg-slate-950/60 border-slate-800 hover:border-purple-500/40 text-slate-200';
                if (isAnswered) {
                  if (isCorrect) {
                    optionStyle = 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm shadow-emerald-500/20';
                  } else if (isThisSelected && !isCorrect) {
                    optionStyle = 'bg-rose-950/40 border-rose-500 text-white';
                  } else {
                    optionStyle = 'bg-slate-950/30 border-slate-800/40 opacity-50 text-slate-400';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium flex items-center justify-between transition-all ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-xs text-slate-400 font-bold">
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
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs text-slate-200 space-y-1 animate-in fade-in">
                <div className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>AI Examination Rationale:</span>
                </div>
                <p className="leading-relaxed text-slate-300">
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQIndex === 0}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 disabled:opacity-40 flex items-center gap-1 hover:bg-slate-700"
              >
                <ArrowLeft size={14} />
                <span>Previous</span>
              </button>

              {currentQIndex < activeQuiz.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQIndex(prev => prev + 1)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-purple-600/30"
                >
                  <span>Next Question</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
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
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/50 via-pink-950/40 to-slate-900/60 border border-purple-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <HelpCircle size={22} />
            </div>
            <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">
              AI Quiz & Mock Test Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Generate customized, adaptive university mock quizzes on any concept, textbook chapter, or exam unit in seconds.
          </p>
        </div>
      </div>

      {/* AI Quiz Generator Form */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400" />
          <span>Generate Instant Adaptive Quiz</span>
        </h3>

        <form onSubmit={handleGenerateQuiz} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Topic or Chapter
            </label>
            <input
              type="text"
              placeholder="e.g. Normalization BCNF, ACID properties, Binary Search"
              value={topicInput}
              onChange={e => setTopicInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="easy">Easy (Concept definitions)</option>
              <option value="medium">Medium (University Standard)</option>
              <option value="hard">Hard (Tricky Proofs & PYQs)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Questions
            </label>
            <select
              value={questionCount}
              onChange={e => setQuestionCount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
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
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
            >
              <Sparkles size={14} />
              <span>{isGenerating ? 'Synthesizing...' : 'Create Quiz'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Available Quiz Decks Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
          <Play size={16} className="text-pink-400" />
          <span>Available Quizzes & Practice Papers ({quizzes.length})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map(quiz => (
            <div
              key={quiz.id}
              className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50">
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

                <h4 className="text-sm font-bold text-white font-heading">
                  {quiz.title}
                </h4>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                  <span>{quiz.questions.length} Questions</span>
                  <span>•</span>
                  <span>{quiz.durationMinutes} Minutes</span>
                </div>
              </div>

              <button
                onClick={() => startQuiz(quiz)}
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
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

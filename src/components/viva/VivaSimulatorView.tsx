import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import { VivaSession } from '../../types';
import {
  Mic,
  MicOff,
  Sparkles,
  Award,
  BookOpen,
  Volume2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Send,
  GraduationCap,
} from 'lucide-react';

export const VivaSimulatorView: React.FC = () => {
  const { activeSubject, user, saveVivaSession, triggerConfetti } = useApp();

  const [vivaType, setVivaType] = useState<'theory' | 'project'>('theory');
  const [topic, setTopic] = useState('Transactions, Normalization & SQL Locking');
  const [projectTitle, setProjectTitle] = useState('Distributed Key-Value Store with Raft Consensus');
  const [projectTechStack, setProjectTechStack] = useState('Go, gRPC, Docker, SQLite');

  const [sessionActive, setSessionActive] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [expectedKeywords, setExpectedKeywords] = useState<string[]>([]);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [lastEvaluation, setLastEvaluation] = useState<any | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setStudentAnswer(text);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const handleStartViva = async () => {
    setSessionActive(true);
    setQuestionCount(1);
    setHistory([]);
    setLastEvaluation(null);
    setFinalScore(null);
    setStudentAnswer('');
    setIsEvaluating(true);

    try {
      const vivaData = await aiService.handleVivaAction({
        action: 'next-question',
        subject: activeSubject?.name || 'Computer Science',
        topic: vivaType === 'theory' ? topic : projectTitle,
        projectDetails: vivaType === 'project' ? { title: projectTitle, techStack: projectTechStack, abstract: '', features: '' } : undefined,
      });

      setCurrentQuestion(vivaData.question || 'Explain the core principles of your subject topic.');
      setExpectedKeywords(vivaData.expectedKeypoints || ['Definition', 'Real-world example', 'Complexity']);

      // Speak examiner question
      aiService.speakText(vivaData.question);
    } catch (e) {
      console.error(e);
      setCurrentQuestion('Explain the ACID properties of database transactions.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not available on this browser. You can type your oral answer below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setStudentAnswer('');
      aiService.stopSpeaking();
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleEvaluateAndNext = async () => {
    if (!studentAnswer.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setIsEvaluating(true);
    try {
      const evaluation = await aiService.handleVivaAction({
        action: 'evaluate-answer',
        currentQuestion: currentQuestion,
        studentAnswer: studentAnswer,
        subject: activeSubject?.name,
        topic: vivaType === 'theory' ? topic : projectTitle,
      });

      const entry = {
        questionNumber: questionCount,
        question: currentQuestion,
        answer: studentAnswer,
        score: evaluation.scoreOutOf100 || evaluation.score || 80,
        feedback: evaluation.feedback || evaluation.verdict || 'Good articulation with clear technical keywords.',
        strengths: evaluation.strengths || ['Good clarity', 'Accurate definitions'],
        improvements: evaluation.improvements || ['Could mention edge cases'],
        missingKeywords: evaluation.missingKeywords || [],
        mistakeAnalysis: evaluation.mistakeAnalysis || 'Add more exact technical terms and a concrete example.',
        idealAnswer: evaluation.idealAnswer || 'A strong answer should define the concept, mention key terms, give one example, and state a limitation.',
        microLesson: evaluation.microLesson || 'Use definition, keywords, example, and limitation in every viva answer.',
      };

      const updatedHistory = [...history, entry];
      setHistory(updatedHistory);
      setLastEvaluation(entry);
      setStudentAnswer('');

      if (questionCount >= 4) {
        // End of Viva session
        const avgScore = Math.round(updatedHistory.reduce((acc, h) => acc + h.score, 0) / updatedHistory.length);
        setFinalScore(avgScore);

        saveVivaSession({
          id: `viva_${Date.now()}`,
          type: vivaType === 'theory' ? 'university' : 'project',
          subjectName: activeSubject?.name || 'Computer Science',
          topicOrProjectTitle: vivaType === 'theory' ? topic : projectTitle,
          questions: updatedHistory.map((h, idx) => ({
            id: `vq_${idx}`,
            question: h.question,
            studentAnswer: h.answer,
            score: h.score,
            feedback: h.feedback,
          })),
          overallReport: {
            score: avgScore,
            verdict: avgScore >= 75 ? 'Distinction / Strong Viva' : 'Satisfactory Defense',
            strengths: updatedHistory.flatMap(h => h.strengths).slice(0, 3),
            improvements: updatedHistory.flatMap(h => h.improvements).slice(0, 3),
          },
          completedAt: 'Just now',
        });

        triggerConfetti();
      } else {
        // Ask next question
        setQuestionCount(prev => prev + 1);
        const nextQData = await aiService.handleVivaAction({
          action: 'next-question',
          subject: activeSubject?.name,
          topic: vivaType === 'theory' ? topic : projectTitle,
          projectDetails: vivaType === 'project' ? { title: projectTitle, techStack: projectTechStack, abstract: '', features: '' } : undefined,
          history: updatedHistory.map(h => ({ q: h.question, a: h.answer })),
        });

        setCurrentQuestion(nextQData.question || 'Can you explain the trade-offs involved?');
        setExpectedKeywords(nextQData.expectedKeypoints || ['Trade-offs', 'Scalability']);
        aiService.speakText(nextQData.question);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="view-stack max-w-5xl space-y-5">
      {/* Header Banner */}
      <div className="view-hero flex flex-col items-start justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <GraduationCap size={22} />
            </div>
            <h1 className="view-title text-2xl">
              AI University Viva & Oral Simulator
            </h1>
          </div>
          <p className="view-copy text-xs sm:text-sm">
            Simulate realistic, rigorous university oral examinations. The AI Examiner speaks questions, listens to your answers, evaluates technical depth, and scores readiness.
          </p>
        </div>
      </div>

      {!sessionActive ? (
        /* Configuration Setup Screen */
        <div className="surface-card space-y-5 p-5 sm:p-6">
          <div className="segmented-control">
            <button
              onClick={() => setVivaType('theory')}
              className={`segmented-option ${
                vivaType === 'theory'
                  ? 'segmented-option-active'
                  : ''
              }`}
            >
              Course Theory Viva
            </button>
            <button
              onClick={() => setVivaType('project')}
              className={`segmented-option ${
                vivaType === 'project'
                  ? 'segmented-option-active'
                  : ''
              }`}
            >
              Capstone / Project Defense Viva
            </button>
          </div>

          {vivaType === 'theory' ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--app-text-muted)]">
                  Examination Subject & Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Transactions, Normalization, SQL Locking"
                  className="form-control w-full px-3.5 py-2.5 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--app-text-muted)]">
                  Project Title
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={e => setProjectTitle(e.target.value)}
                  placeholder="e.g. Cloud Native Microservices Platform"
                  className="form-control w-full px-3.5 py-2.5 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--app-text-muted)]">
                  Tech Stack & Architecture
                </label>
                <input
                  type="text"
                  value={projectTechStack}
                  onChange={e => setProjectTechStack(e.target.value)}
                  placeholder="e.g. React, Node.js, PostgreSQL, Docker, Redis"
                  className="form-control w-full px-3.5 py-2.5 text-xs"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleStartViva}
              className="primary-action bg-emerald-600 px-6 py-3 text-xs text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-white"
            >
              <Mic size={16} />
              <span>Enter Viva Examination Room</span>
            </button>
          </div>
        </div>
      ) : finalScore !== null ? (
        /* Final Viva Scorecard */
        <div className="surface-card-strong animate-in zoom-in-95 space-y-6 p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Trophy size={40} className="animate-bounce" />
          </div>

          <div className="space-y-1">
            <h2 className="font-heading text-2xl font-black text-[var(--app-text)]">
              Viva Examination Concluded
            </h2>
            <p className="text-xs text-[var(--app-text-muted)]">
              Evaluated by AI University Examination Board for {vivaType === 'theory' ? topic : projectTitle}
            </p>
          </div>

          <div className="metric-tile mx-auto max-w-xs">
            <div className="font-mono text-4xl font-black text-emerald-700 dark:text-emerald-300">
              {finalScore} / 100
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase text-[var(--app-text-subtle)]">
              Oral Defense Score
            </div>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto text-left">
            {history.map((h, i) => (
              <div key={i} className="surface-muted space-y-1.5 p-4 text-xs">
                <div className="flex items-center justify-between font-mono text-[var(--app-text-muted)]">
                  <span>Question {h.questionNumber}</span>
                  <span className="font-black text-emerald-700 dark:text-emerald-300">{h.score}/100</span>
                </div>
                <div className="font-semibold text-[var(--app-text)]">"{h.question}"</div>
                <div className="text-[11px] italic text-[var(--app-text-muted)]">Your Answer: "{h.answer}"</div>
                <div className="text-[11px] text-blue-700 dark:text-blue-300">Examiner Feedback: {h.feedback}</div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300">Ideal Answer: {h.idealAnswer}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setSessionActive(false)}
            className="primary-action bg-emerald-600 px-6 py-2.5 text-xs text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-white"
          >
            Start Another Viva
          </button>
        </div>
      ) : (
        /* Active Live Viva Room */
        <div className="surface-card space-y-6 p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 animate-ping rounded-full bg-red-500" />
              <span className="font-mono text-xs font-black uppercase text-[var(--app-text)]">
                Examiner Session Active • Question {questionCount} of 4
              </span>
            </div>
            <button
              onClick={() => setSessionActive(false)}
              className="secondary-action px-3 py-1 text-xs"
            >
              End Viva
            </button>
          </div>

          {/* Examiner Box */}
          <div className="surface-muted space-y-3 border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-heading text-xs font-black text-emerald-700 dark:text-emerald-300">
                <GraduationCap size={18} />
                <span>Prof. Examiner (AI Board):</span>
              </div>
              <button
                onClick={() => aiService.speakText(currentQuestion)}
                className="flex items-center gap-1 text-xs font-bold text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
              >
                <Volume2 size={14} />
                <span>Replay Voice</span>
              </button>
            </div>

            <h3 className="text-base font-black leading-relaxed text-[var(--app-text)] sm:text-lg">
              "{currentQuestion}"
            </h3>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--app-text-muted)]">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">Expected Keypoints:</span>
              {expectedKeywords.map((k, i) => (
                <span key={i} className="status-pill font-mono">
                  {k}
                </span>
              ))}
            </div>
          </div>

          {/* Student Answer Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--app-text-muted)]">
                Your Spoken or Typed Oral Answer:
              </label>
              <span className="font-mono text-[11px] text-[var(--app-text-muted)]">
                {isListening ? 'Listening to microphone...' : 'Type or speak'}
              </span>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                value={studentAnswer}
                onChange={e => setStudentAnswer(e.target.value)}
                placeholder="Click the microphone to speak your answer, or type it here in detail..."
                className="form-control w-full p-4 text-xs leading-relaxed sm:text-sm"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={toggleMic}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black transition-colors ${
                  isListening
                    ? 'primary-action animate-pulse bg-red-600 text-white hover:bg-red-500 dark:bg-red-600 dark:text-white'
                    : 'secondary-action'
                }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                <span>{isListening ? 'Stop Recording' : 'Speak Answer'}</span>
              </button>

              <button
                onClick={handleEvaluateAndNext}
                disabled={isEvaluating || !studentAnswer.trim()}
                className="primary-action bg-emerald-600 px-6 py-2.5 text-xs text-white hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-500 dark:text-white"
              >
                <Send size={14} />
                <span>{isEvaluating ? 'Examiner Grading...' : 'Submit to Examiner'}</span>
              </button>
            </div>
          </div>

          {lastEvaluation && (
            <div className="surface-muted space-y-4 border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={16} />
                  <span>Previous Answer Review</span>
                </div>
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white dark:bg-emerald-500">
                  {lastEvaluation.score}/100
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-3 text-xs">
                <div className="surface-card p-3">
                  <div className="flex items-center gap-1.5 font-black text-rose-700 dark:text-rose-300">
                    <AlertCircle size={14} />
                    Mistake Analysis
                  </div>
                  <p className="mt-2 leading-5 text-[var(--app-text-muted)]">{lastEvaluation.mistakeAnalysis}</p>
                </div>
                <div className="surface-card p-3">
                  <div className="font-black text-blue-700 dark:text-blue-300">Missing Keywords</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(lastEvaluation.missingKeywords?.length ? lastEvaluation.missingKeywords : ['No major keyword gap']).map((keyword: string) => (
                      <span key={keyword} className="status-pill font-mono text-[11px]">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="surface-card border-emerald-200 bg-emerald-50 p-3 text-xs dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <div className="font-black text-emerald-700 dark:text-emerald-300">Correct / Ideal Viva Answer</div>
                <p className="mt-2 leading-5 text-[var(--app-text)]">{lastEvaluation.idealAnswer}</p>
              </div>

              <div className="surface-card border-blue-200 bg-blue-50 p-3 text-xs dark:border-blue-500/30 dark:bg-blue-500/10">
                <div className="font-black text-blue-700 dark:text-blue-300">Micro Lesson</div>
                <p className="mt-2 leading-5 text-[var(--app-text)]">{lastEvaluation.microLesson}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

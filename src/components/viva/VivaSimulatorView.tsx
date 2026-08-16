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
      };

      const updatedHistory = [...history, entry];
      setHistory(updatedHistory);
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
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-purple-950/40 to-slate-900/60 border border-emerald-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <GraduationCap size={22} />
            </div>
            <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">
              AI University Viva & Oral Simulator
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Simulate realistic, rigorous university oral examinations. The AI Examiner speaks questions, listens to your answers, evaluates technical depth, and scores readiness.
          </p>
        </div>
      </div>

      {!sessionActive ? (
        /* Configuration Setup Screen */
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setVivaType('theory')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                vivaType === 'theory'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              🎓 Course Theory Viva
            </button>
            <button
              onClick={() => setVivaType('project')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                vivaType === 'project'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              💻 Capstone / Project Defense Viva
            </button>
          </div>

          {vivaType === 'theory' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Examination Subject & Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Transactions, Normalization, SQL Locking"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={e => setProjectTitle(e.target.value)}
                  placeholder="e.g. Cloud Native Microservices Platform"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tech Stack & Architecture
                </label>
                <input
                  type="text"
                  value={projectTechStack}
                  onChange={e => setProjectTechStack(e.target.value)}
                  placeholder="e.g. React, Node.js, PostgreSQL, Docker, Redis"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleStartViva}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
            >
              <Mic size={16} />
              <span>Enter Viva Examination Room</span>
            </button>
          </div>
        </div>
      ) : finalScore !== null ? (
        /* Final Viva Scorecard */
        <div className="p-8 rounded-3xl bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-500/30 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-300 shadow-xl shadow-emerald-500/20">
            <Trophy size={40} className="animate-bounce" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-heading text-white">
              Viva Examination Concluded
            </h2>
            <p className="text-xs text-slate-300">
              Evaluated by AI University Examination Board for {vivaType === 'theory' ? topic : projectTitle}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 max-w-xs mx-auto">
            <div className="text-4xl font-extrabold font-mono text-emerald-400">
              {finalScore} / 100
            </div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold mt-1">
              Oral Defense Score
            </div>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto text-left">
            {history.map((h, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-mono">
                  <span>Question {h.questionNumber}</span>
                  <span className="text-emerald-400 font-bold">{h.score}/100</span>
                </div>
                <div className="font-semibold text-white">"{h.question}"</div>
                <div className="text-slate-300 text-[11px] italic">Your Answer: "{h.answer}"</div>
                <div className="text-purple-300 text-[11px]">Examiner Feedback: {h.feedback}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setSessionActive(false)}
            className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs"
          >
            Start Another Viva
          </button>
        </div>
      ) : (
        /* Active Live Viva Room */
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold text-white font-mono uppercase">
                Examiner Session Active • Question {questionCount} of 4
              </span>
            </div>
            <button
              onClick={() => setSessionActive(false)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-800"
            >
              End Viva
            </button>
          </div>

          {/* Examiner Box */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/30 to-slate-950 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-heading">
                <GraduationCap size={18} />
                <span>Prof. Examiner (AI Board):</span>
              </div>
              <button
                onClick={() => aiService.speakText(currentQuestion)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <Volume2 size={14} />
                <span>Replay Voice</span>
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
              "{currentQuestion}"
            </h3>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-emerald-300">Expected Keypoints:</span>
              {expectedKeywords.map((k, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                  {k}
                </span>
              ))}
            </div>
          </div>

          {/* Student Answer Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Your Spoken or Typed Oral Answer:
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {isListening ? '🎙️ Listening to microphone...' : 'Type or speak'}
              </span>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                value={studentAnswer}
                onChange={e => setStudentAnswer(e.target.value)}
                placeholder="Click the microphone to speak your answer, or type it here in detail..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={toggleMic}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/40'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                <span>{isListening ? 'Stop Recording' : 'Speak Answer'}</span>
              </button>

              <button
                onClick={handleEvaluateAndNext}
                disabled={isEvaluating || !studentAnswer.trim()}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                <Send size={14} />
                <span>{isEvaluating ? 'Examiner Grading...' : 'Submit to Examiner'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

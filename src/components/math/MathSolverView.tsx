import React, { useMemo, useState } from 'react';
import {
  Calculator,
  Check,
  Copy,
  Languages,
  Lightbulb,
  Loader2,
  Send,
  Sigma,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import { AssistantLanguageCode, assistantLanguages, getAssistantLanguage } from '../../services/languageService';
import { MarkdownAnswer } from '../ai/AITutorView';

type ExplanationDepth = 'exam' | 'deep' | 'quick';

const exampleProblems = [
  'Solve x^2 - 5x + 6 = 0 and verify the roots.',
  'Evaluate the integral of x^3 from 0 to 2 with all steps.',
  'Find the derivative of 3x^4 - 5x^2 + 7x - 9.',
  'Explain Bayes theorem with one solved exam-style example.',
  'Solve a 3x3 matrix inverse problem and show verification.',
  'Solve a first-order differential equation using separation of variables.',
];

const depthLabels: Record<ExplanationDepth, string> = {
  exam: 'Exam Steps',
  deep: 'Detailed Teaching',
  quick: 'Final + Key Steps',
};

export const MathSolverView: React.FC = () => {
  const { activeSubject, user } = useApp();
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [language, setLanguage] = useState<AssistantLanguageCode>('auto');
  const [depth, setDepth] = useState<ExplanationDepth>('exam');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const selectedLanguage = getAssistantLanguage(language);

  const helperPrompt = useMemo(() => {
    if (depth === 'deep') {
      return 'Teach the solution slowly, explain why each step is valid, and include common mistakes.';
    }
    if (depth === 'quick') {
      return 'Give the final answer first, then only the essential steps needed to trust it.';
    }
    return 'Write it as a high-scoring exam solution with formulas, substitutions, verification, and boxed final answer.';
  }, [depth]);

  const solveProblem = async (customProblem?: string) => {
    const question = (customProblem || problem).trim();
    if (!question || isLoading) return;

    setProblem(question);
    setIsLoading(true);
    setSolution('');
    aiService.stopSpeaking();
    setIsSpeaking(false);

    try {
      const response = await aiService.sendMessage({
        message: `${question}\n\nMath answer style: ${helperPrompt}`,
        mode: 'math',
        subject: activeSubject?.name || 'Mathematics',
        academicContext: {
          degree: user.degree,
          semester: user.semester,
          goal: user.studyGoal,
          answerStyle: depthLabels[depth],
        },
        language,
      });
      setSolution(response.reply);
    } catch (error) {
      console.error(error);
      setSolution('Unable to solve right now. Please try again with a clearer problem statement.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    if (!solution) return;
    if (isSpeaking) {
      aiService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    aiService.speakText(solution, () => setIsSpeaking(false), language);
  };

  const copySolution = async () => {
    if (!solution) return;
    await navigator.clipboard.writeText(solution);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-20 lg:pb-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#161922] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-300">
              <Sigma size={14} />
              Dedicated Math Solver
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
              Solve high-end math with clear steps
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              Algebra, calculus, matrices, probability, statistics, differential equations, proofs, numerical methods, and exam word problems.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-[26rem]">
            <label className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-[#1A1D27]">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                <Languages size={12} />
                Language
              </span>
              <select
                value={language}
                onChange={event => setLanguage(event.target.value as AssistantLanguageCode)}
                className="mt-1 w-full bg-transparent text-xs font-bold text-gray-950 outline-none dark:text-white"
              >
                {assistantLanguages.map(item => (
                  <option key={item.code} value={item.code} className="bg-white text-gray-950 dark:bg-slate-950 dark:text-white">
                    {item.label} - {item.nativeLabel}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-[#1A1D27]">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                <Lightbulb size={12} />
                Answer Style
              </span>
              <select
                value={depth}
                onChange={event => setDepth(event.target.value as ExplanationDepth)}
                className="mt-1 w-full bg-transparent text-xs font-bold text-gray-950 outline-none dark:text-white"
              >
                {Object.entries(depthLabels).map(([value, label]) => (
                  <option key={value} value={value} className="bg-white text-gray-950 dark:bg-slate-950 dark:text-white">
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#161922] sm:p-5">
          <form
            onSubmit={event => {
              event.preventDefault();
              void solveProblem();
            }}
            className="space-y-4"
          >
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Problem
              </span>
              <textarea
                value={problem}
                onChange={event => setProblem(event.target.value)}
                placeholder={`Type any math problem. Example: ${exampleProblems[0]}`}
                className="mt-2 min-h-56 w-full resize-y rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-950 outline-none transition-colors placeholder:text-gray-400 focus:border-cyan-500 dark:border-gray-800 dark:bg-[#10141E] dark:text-white"
              />
            </label>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={isLoading || !problem.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-45 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                {isLoading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                Solve Problem
              </button>
              <button
                type="button"
                onClick={() => {
                  setProblem('');
                  setSolution('');
                  aiService.stopSpeaking();
                  setIsSpeaking(false);
                }}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-[#1A1D27]"
              >
                Clear
              </button>
            </div>
          </form>

          <div className="mt-5">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Try Examples
            </div>
            <div className="grid gap-2">
              {exampleProblems.map(item => (
                <button
                  key={item}
                  onClick={() => solveProblem(item)}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold leading-5 text-gray-700 transition-colors hover:border-cyan-300 hover:bg-cyan-50 dark:border-gray-800 dark:bg-[#1A1D27] dark:text-gray-300 dark:hover:border-cyan-800 dark:hover:bg-cyan-950/20"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#161922]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-cyan-50 p-2 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
                <Calculator size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-950 dark:text-white">Solution</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {selectedLanguage.label} output with voice playback
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copySolution}
                disabled={!solution}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-[#1A1D27]"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={toggleVoice}
                disabled={!solution}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-cyan-500 disabled:opacity-40"
              >
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                {isSpeaking ? 'Stop' : 'Voice'}
              </button>
            </div>
          </div>

          <div className="min-h-[32rem] overflow-y-auto p-4 sm:p-5">
            {isLoading && (
              <div className="flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-bold text-cyan-800 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-200">
                <Loader2 size={18} className="animate-spin" />
                Solving carefully with formulas, steps, and verification...
              </div>
            )}

            {!isLoading && solution && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#10141E]">
                <MarkdownAnswer content={solution} />
              </div>
            )}

            {!isLoading && !solution && (
              <div className="flex min-h-[28rem] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center dark:border-gray-800 dark:bg-[#10141E]">
                <Calculator size={34} className="text-gray-400" />
                <p className="mt-3 text-sm font-bold text-gray-800 dark:text-gray-200">
                  Your worked solution will appear here.
                </p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Ask for a quick result, a full exam answer, or a detailed teaching explanation.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

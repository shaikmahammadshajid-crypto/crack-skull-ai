import React from 'react';
import { CrackScoreBreakdown } from '../../types';
import { ShieldCheck, Zap, TrendingUp, Sparkles, BookOpen, HelpCircle } from 'lucide-react';

interface Props {
  crackScore: CrackScoreBreakdown;
  compact?: boolean;
  onOpenCrackMode?: () => void;
}

export const CrackScoreGauge: React.FC<Props> = ({
  crackScore,
  compact = false,
  onOpenCrackMode,
}) => {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (crackScore.overallScore / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 dark:text-emerald-400 stroke-emerald-500';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400 stroke-blue-600';
    if (score >= 55) return 'text-amber-600 dark:text-amber-400 stroke-amber-500';
    return 'text-rose-600 dark:text-rose-400 stroke-rose-500';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-[#1A1D27] border border-gray-200 dark:border-gray-700/80 shadow-xs">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="w-8 h-8 -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-gray-200 dark:stroke-gray-800"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              className={`${getScoreColor(crackScore.overallScore)} transition-all duration-1000 ease-out`}
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={2 * Math.PI * 40 - (crackScore.overallScore / 100) * (2 * Math.PI * 40)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className="absolute text-[11px] font-bold font-mono text-gray-900 dark:text-white">
            {crackScore.overallScore}
          </span>
        </div>
        <div className="text-left leading-tight hidden sm:block">
          <div className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-400 uppercase">
            Crack Score
          </div>
          <div className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate max-w-[110px]">
            {crackScore.statusLabel}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#161922] p-6 sm:p-7 border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-150">
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Gauge & Score */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
            {/* SVG Circular Progress */}
            <svg className="w-28 h-28 -rotate-90 transform" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="stroke-gray-100 dark:stroke-gray-800"
                strokeWidth="9"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                className={`${getScoreColor(crackScore.overallScore)} transition-all duration-1000 ease-out`}
                strokeWidth="9"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold font-mono text-gray-900 dark:text-white tracking-tight">
                {crackScore.overallScore}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-400 font-bold">
                / 100
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-fit">
              <Sparkles size={12} />
              <span>Crack Score Metric</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight font-heading">
              {crackScore.statusLabel}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
              {crackScore.tip}
            </p>
          </div>
        </div>

        {/* Right: Metrics Grid */}
        <div className="w-full md:w-auto grid grid-cols-3 sm:grid-cols-6 gap-2">
          <MetricPill
            label="Syllabus"
            value={`${crackScore.syllabusCoverage}%`}
            icon={<BookOpen size={14} className="text-blue-600 dark:text-blue-400" />}
          />
          <MetricPill
            label="Quiz Acc."
            value={`${crackScore.quizAccuracy}%`}
            icon={<HelpCircle size={14} className="text-gray-600 dark:text-gray-300" />}
          />
          <MetricPill
            label="Revision"
            value={`${crackScore.revisionRate}%`}
            icon={<TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />}
          />
          <MetricPill
            label="Streak"
            value={`${crackScore.consistency}%`}
            icon={<Zap size={14} className="text-amber-500" />}
          />
          <MetricPill
            label="Viva"
            value={`${crackScore.vivaReadiness}%`}
            icon={<ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400" />}
          />
          <MetricPill
            label="PYQ Prep"
            value={`${crackScore.pastPaperPrep}%`}
            icon={<Sparkles size={14} className="text-rose-500" />}
          />
        </div>
      </div>
    </div>
  );
};

const MetricPill: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 text-center hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
    <div className="mb-1">{icon}</div>
    <span className="text-sm font-bold font-mono text-gray-900 dark:text-white">{value}</span>
    <span className="text-[10px] text-gray-400 whitespace-nowrap font-medium">{label}</span>
  </div>
);

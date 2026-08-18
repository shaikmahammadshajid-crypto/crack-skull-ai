import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarCheck,
  Zap,
  Sparkles,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  Target,
  ArrowRight,
  TrendingUp,
  Calendar,
  Layers,
} from 'lucide-react';

export const StudyPlanView: React.FC = () => {
  const {
    studyPlan,
    toggleStudyTask,
    toggleCrackMode,
    regenerateStudyPlan,
    user,
    setActiveTab,
    triggerConfetti,
  } = useApp();

  const [regenerating, setRegenerating] = useState(false);

  const completedCount = studyPlan.todayTasks.filter(t => t.isCompleted).length;
  const totalTasks = studyPlan.todayTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await regenerateStudyPlan();
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="view-stack space-y-5">
      {/* 1. Header Banner */}
      <div className="view-hero flex flex-col items-start justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
              <CalendarCheck size={22} />
            </div>
            <h1 className="view-title text-2xl">
              {studyPlan.modeName}
            </h1>
          </div>
          <p className="view-copy text-xs sm:text-sm">
            Target Exam: <strong className="text-[var(--app-text)]">{studyPlan.targetExam}</strong> • {studyPlan.daysRemaining} Days Countdown • {user.dailyHours} hrs/day allocation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={toggleCrackMode}
            className={`px-4 py-2.5 text-xs ${
              user.isCrackModeActive
                ? 'primary-action bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-500 dark:text-white'
                : 'secondary-action hover:border-orange-300'
            }`}
          >
            <Zap size={16} className={user.isCrackModeActive ? 'fill-white' : 'text-orange-500'} />
            <span>{user.isCrackModeActive ? '3-Day Crack Mode' : 'Switch to Crack Sprint'}</span>
          </button>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="secondary-action px-4 py-2.5 text-xs disabled:opacity-50"
          >
            <RotateCcw size={14} className={regenerating ? 'animate-spin' : ''} />
            <span>{regenerating ? 'Optimizing...' : 'Regenerate Plan'}</span>
          </button>
        </div>
      </div>

      {/* 2. Today's Progress Meter */}
      <div className="surface-card space-y-3 p-5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 font-black text-[var(--app-text)]">
            <Target size={16} className="text-teal-700 dark:text-teal-300" />
            <span>Today's Completion Progress: {completedCount} of {totalTasks} Tasks</span>
          </span>
          <span className="font-mono font-black text-teal-700 dark:text-teal-300">{progressPercent}% Done</span>
        </div>

        {/* Progress Bar */}
        <div className="progress-track h-3 w-full p-0.5">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[var(--app-text-muted)]">
          <span>{studyPlan.crackTip}</span>
          <span className="font-mono text-[var(--app-text-subtle)]">Updated today</span>
        </div>
      </div>

      {/* 3. Today's Task Agenda List */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 font-heading text-sm font-black text-[var(--app-text)]">
          <Clock size={16} className="text-teal-700 dark:text-teal-300" />
          <span>Today's Time-Blocked Study Schedule</span>
        </h3>

        <div className="space-y-3">
          {studyPlan.todayTasks.map(task => (
            <div
              key={task.id}
              className={`border p-5 transition-colors ${
                task.isCompleted
                  ? 'surface-muted opacity-60'
                  : 'surface-card hover:border-[var(--app-border-strong)]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => toggleStudyTask(task.id)}
                    className="mt-0.5 text-[var(--app-text-subtle)] transition-colors hover:text-teal-700 dark:hover:text-teal-300"
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 size={22} className="text-emerald-400 fill-emerald-400/20" />
                    ) : (
                      <Circle size={22} />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-[var(--app-text)]">
                        {task.topic}
                      </span>
                      <span className="status-pill font-mono">
                        {task.subject}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          task.difficulty === 'High'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : task.difficulty === 'Medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {task.difficulty} Priority
                      </span>
                    </div>

                    <p className="view-copy text-xs">
                      {task.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-mono text-xs text-[var(--app-text-muted)]">
                    <Clock size={14} className="text-teal-700 dark:text-teal-300" />
                    {task.durationMinutes} mins
                  </span>

                  {!task.isCompleted && (
                    <button
                      onClick={() => {
                        if (task.type === 'practice_quiz') setActiveTab('quiz');
                        else if (task.type === 'flashcards') setActiveTab('flashcards');
                        else setActiveTab('ai-tutor');
                      }}
                      className="primary-action px-4 py-2 text-xs"
                    >
                      <Play size={13} />
                      <span>Start Session</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Weekly Milestone Roadmap */}
      <div className="surface-card space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-heading text-sm font-black text-[var(--app-text)]">
            <TrendingUp size={16} className="text-blue-600 dark:text-blue-300" />
            <span>Weekly Exam Sprint Roadmap</span>
          </h3>
          <span className="font-mono text-xs text-[var(--app-text-muted)]">
            {studyPlan.weeklyRoadmap.length} Stages Planned
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {studyPlan.weeklyRoadmap.map((week, idx) => (
            <div
              key={idx}
              className="surface-muted space-y-2 p-4 transition-colors hover:border-[var(--app-border-strong)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black uppercase text-teal-700 dark:text-teal-300">
                  {week.day}
                </span>
                <span className="status-pill font-mono">
                  {week.hours} hrs
                </span>
              </div>
              <h4 className="text-xs font-black text-[var(--app-text)]">
                {week.focus}
              </h4>
              <ul className="space-y-1 text-[11px] text-[var(--app-text-muted)]">
                {week.focus.split(/,|&|\+/).map((t, tIdx) => (
                  <li key={tIdx} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                    <span>{t.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

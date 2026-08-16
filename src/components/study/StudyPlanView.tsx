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
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/50 via-slate-900/60 to-slate-900/40 border border-purple-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <CalendarCheck size={22} />
            </div>
            <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">
              {studyPlan.modeName}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Target Exam: <strong className="text-white">{studyPlan.targetExam}</strong> • {studyPlan.daysRemaining} Days Countdown • {user.dailyHours} hrs/day allocation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleCrackMode}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-heading flex items-center gap-2 transition-all ${
              user.isCrackModeActive
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30 animate-pulse'
                : 'bg-slate-900 border border-orange-500/40 text-orange-400 hover:bg-orange-500/10'
            }`}
          >
            <Zap size={16} className={user.isCrackModeActive ? 'fill-white' : ''} />
            <span>{user.isCrackModeActive ? '⚡ 3-DAY CRACK MODE' : 'SWITCH TO CRACK SPRINT'}</span>
          </button>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-purple-500 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <RotateCcw size={14} className={regenerating ? 'animate-spin' : ''} />
            <span>{regenerating ? 'Optimizing...' : 'Regenerate Plan'}</span>
          </button>
        </div>
      </div>

      {/* 2. Today's Progress Meter */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-2">
            <Target size={16} className="text-purple-400" />
            <span>Today's Completion Progress: {completedCount} of {totalTasks} Tasks</span>
          </span>
          <span className="font-mono font-bold text-purple-400">{progressPercent}% Done</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 transition-all duration-500 shadow-sm shadow-purple-500/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <span>{studyPlan.crackTip}</span>
          <span className="font-mono text-slate-500">Updated today</span>
        </div>
      </div>

      {/* 3. Today's Task Agenda List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
          <Clock size={16} className="text-purple-400" />
          <span>Today's Time-Blocked Study Schedule</span>
        </h3>

        <div className="space-y-3">
          {studyPlan.todayTasks.map(task => (
            <div
              key={task.id}
              className={`p-5 rounded-3xl border transition-all ${
                task.isCompleted
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  : 'bg-slate-900/90 border-slate-800 hover:border-purple-500/40 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => toggleStudyTask(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-purple-400 transition-colors"
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 size={22} className="text-emerald-400 fill-emerald-400/20" />
                    ) : (
                      <Circle size={22} />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">
                        {task.topic}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800/50 font-mono">
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

                    <p className="text-xs text-slate-300">
                      {task.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Clock size={14} className="text-cyan-400" />
                    {task.durationMinutes} mins
                  </span>

                  {!task.isCompleted && (
                    <button
                      onClick={() => {
                        if (task.type === 'practice_quiz') setActiveTab('quiz');
                        else if (task.type === 'flashcards') setActiveTab('flashcards');
                        else setActiveTab('ai-tutor');
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
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
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-cyan-400" />
            <span>Weekly Exam Sprint Roadmap</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {studyPlan.weeklyRoadmap.length} Stages Planned
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {studyPlan.weeklyRoadmap.map((week, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 font-mono uppercase">
                  {week.dayRange}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {week.estimatedHours} hrs
                </span>
              </div>
              <h4 className="text-xs font-bold text-white">
                {week.focusTheme}
              </h4>
              <ul className="space-y-1 text-[11px] text-slate-400">
                {week.targetTopics.map((t, tIdx) => (
                  <li key={tIdx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>{t}</span>
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

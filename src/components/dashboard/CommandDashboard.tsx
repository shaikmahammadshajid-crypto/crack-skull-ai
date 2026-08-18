import React from 'react';
import { useApp } from '../../context/AppContext';
import { CrackScoreGauge } from '../common/CrackScoreGauge';
import { StreakFlame } from '../common/StreakFlame';
import { HomeCommandAssistant } from './HomeCommandAssistant';
import {
  Sparkles,
  Zap,
  Calculator,
  CalendarCheck,
  Radar,
  FileText,
  HelpCircle,
  Mic,
  Clock,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Play,
  TrendingUp,
  BrainCircuit,
} from 'lucide-react';

export const CommandDashboard: React.FC = () => {
  const {
    user,
    crackScore,
    studyPlan,
    toggleStudyTask,
    toggleCrackMode,
    subjects,
    activeSubject,
    setActiveTab,
    openDocumentReader,
    documents,
    quizzes,
    startQuiz,
    knowledgeNodes,
    triggerConfetti,
  } = useApp();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const primaryExam = subjects.find(s => s.examDate) || subjects[0];
  const weakNodes = knowledgeNodes.filter(k => k.masteryStatus === 'weak' || k.masteryStatus === 'critical');

  return (
    <div className="view-stack space-y-5 lg:pb-8">
      {/* 1. Header Greeting & Hero Status */}
      <div className="view-hero flex flex-col justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="view-title text-2xl sm:text-3xl">
              {getGreeting()}, {user.name.split(' ')[0]}
            </h1>
          </div>
          <p className="view-copy text-xs sm:text-sm">
            {user.degree} • {user.semester} • Target:{' '}
            <span className="font-bold uppercase text-teal-700 dark:text-teal-300">
              {user.studyGoal.replace('_', ' ')}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="metric-tile flex items-center gap-2.5 px-3.5 py-2 text-xs">
            <Clock size={15} className="text-teal-700 dark:text-teal-300" />
            <div>
              <div className="font-mono font-black text-[var(--app-text)]">{user.totalStudyHours} hrs</div>
              <div className="text-[10px] text-[var(--app-text-subtle)]">Total Study Time</div>
            </div>
          </div>

          <div className="metric-tile flex items-center gap-2 px-1 py-1 text-xs">
            <StreakFlame streakDays={user.streakDays} size="md" />
          </div>

          <button
            onClick={toggleCrackMode}
            className={`px-4 py-2.5 text-xs ${
              user.isCrackModeActive
                ? 'primary-action bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-500 dark:text-white dark:hover:bg-orange-600'
                : 'secondary-action hover:border-orange-300'
            }`}
          >
            <Zap size={14} className={user.isCrackModeActive ? 'fill-white' : 'text-orange-500'} />
            <span>{user.isCrackModeActive ? 'CRACK MODE: 3 DAYS' : 'ENABLE CRACK MODE'}</span>
          </button>
        </div>
      </div>

      <HomeCommandAssistant />

      {/* 2. Signature Feature: CRACK SCORE GAUGE */}
      <CrackScoreGauge crackScore={crackScore} onOpenCrackMode={toggleCrackMode} />

      {/* 3. High-Yield CRACK MODE Banner (when active) */}
      {user.isCrackModeActive && (
        <div className="surface-card-strong flex flex-col items-start justify-between gap-4 border-orange-200 bg-orange-50 p-5 dark:border-orange-500/30 dark:bg-orange-500/10 sm:p-6 md:flex-row md:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-orange-500 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                SPRINT ACTIVE
              </span>
              <span className="font-mono text-xs font-bold text-orange-800 dark:text-orange-300">
                {primaryExam.name} ({primaryExam.code})
              </span>
            </div>
            <h3 className="font-heading text-base font-black text-[var(--app-text)]">
              Targeting Top 90%+ Probability Exam Questions
            </h3>
            <p className="view-copy max-w-xl text-xs">
              Skipping low-yield theory. Quizzes, flashcards, and AI prompts are tuned to Section B 10-markers and solved PYQ derivations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('exam-radar')}
              className="primary-action bg-orange-600 px-4 py-2 text-xs text-white hover:bg-orange-700 dark:bg-orange-600 dark:text-white dark:hover:bg-orange-700"
            >
              <span>View Exam Radar</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Two-Column Grid: Today's Mission + Exam Radar & AI Advice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Mission (Adaptive Learning Agenda) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
                  <CalendarCheck size={18} />
                </div>
                <div>
                <h3 className="font-heading text-base font-black text-[var(--app-text)]">
                  Today's Mission
                </h3>
                <p className="text-[11px] text-[var(--app-text-subtle)]">
                  AI-Curated Agenda based on your weak topics & countdown
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('study-plan')}
              className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline dark:text-teal-300"
            >
              <span>Full Roadmap</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5">
            {studyPlan.todayTasks.map(task => (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all duration-150 ${
                  task.isCompleted
                    ? 'surface-muted opacity-60'
                    : 'surface-card hover:border-[var(--app-border-strong)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleStudyTask(task.id)}
                      className="mt-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-500/20" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-[var(--app-text)]">
                          {task.topic}
                        </span>
                        <span className="status-pill">
                          {task.subject}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            task.difficulty === 'High'
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                              : task.difficulty === 'Medium'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {task.difficulty}
                        </span>
                      </div>

                      <p className="view-copy text-[11px]">
                        {task.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="flex items-center gap-1 font-mono text-xs text-[var(--app-text-subtle)]">
                      <Clock size={12} />
                      {task.durationMinutes}m
                    </span>

                    {!task.isCompleted && (
                      <button
                        onClick={() => {
                          if (task.type === 'practice_quiz') setActiveTab('quiz');
                          else if (task.type === 'flashcards') setActiveTab('flashcards');
                          else setActiveTab('ai-tutor');
                        }}
                        className="icon-button h-8 w-8"
                        title="Start Task"
                      >
                        <Play size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Daily Mission Briefing Anchor */}
          <div className="surface-card flex items-center justify-between gap-3 border-teal-200 bg-teal-50 p-4 dark:border-teal-500/30 dark:bg-teal-500/10">
            <div className="flex items-center gap-3">
              <BrainCircuit size={18} className="flex-shrink-0 text-teal-700 dark:text-teal-300" />
              <div className="text-xs text-[var(--app-text-muted)]">
                <span className="font-black text-[var(--app-text)]">AI Strategy Tip: </span>
                {studyPlan.crackTip}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Exam Radar & Weak Topic Diagnostic */}
        <div className="lg:col-span-5 space-y-4">
          {/* Exam Radar Snapshot */}
          <div className="surface-card space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
                  <Radar size={18} />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-black text-[var(--app-text)]">
                    Exam Radar Prediction
                  </h3>
                  <p className="text-[10px] text-[var(--app-text-subtle)]">
                    High-yield topics analyzed from previous 5 years papers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('exam-radar')}
                className="text-xs font-bold text-teal-700 hover:underline dark:text-teal-300"
              >
                Explore →
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="surface-muted flex items-center justify-between p-3">
                <div>
                  <div className="text-xs font-black text-[var(--app-text)]">SQL Joins & Group By Queries</div>
                  <div className="font-mono text-[10px] text-[var(--app-text-subtle)]">16–20 Marks • Seen in 5 of 5 Years</div>
                </div>
                <span className="rounded-full bg-teal-50 px-2.5 py-0.5 font-mono text-xs font-black text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
                  92% Priority
                </span>
              </div>

              <div className="surface-muted flex items-center justify-between p-3">
                <div>
                  <div className="text-xs font-black text-[var(--app-text)]">Normalization (3NF / BCNF Proofs)</div>
                  <div className="font-mono text-[10px] text-[var(--app-text-subtle)]">12–16 Marks • Seen in 4 of 5 Years</div>
                </div>
                <span className="status-pill font-mono">
                  86% Priority
                </span>
              </div>

              <div className="surface-muted flex items-center justify-between p-3">
                <div>
                  <div className="text-xs font-black text-[var(--app-text)]">Transactions & 2PL Concurrency</div>
                  <div className="font-mono text-[10px] text-[var(--app-text-subtle)]">10–14 Marks • Critical Discriminator</div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full">
                  78% Priority
                </span>
              </div>
            </div>
          </div>

          {/* Weak Topic Alert & Knowledge Map Alert */}
          {weakNodes.length > 0 && (
            <div className="surface-card space-y-3 border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle size={17} />
                <span className="text-xs font-bold font-heading uppercase tracking-wide">
                  Weak Area Alert ({weakNodes.length})
                </span>
              </div>
              <p className="view-copy text-xs">
                Recent quiz performance indicates low confidence in <strong className="text-[var(--app-text)]">"{weakNodes[0].topic}"</strong> ({weakNodes[0].masteryPercentage}% mastery).
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('ai-tutor')}
                  className="primary-action px-3.5 py-1.5 text-xs"
                >
                  <Sparkles size={13} />
                  <span>Explain with AI</span>
                </button>
                <button
                  onClick={() => setActiveTab('knowledge-map')}
                  className="secondary-action px-3.5 py-1.5 text-xs"
                >
                  Knowledge Tree
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Quick Actions Bar */}
      <div className="space-y-3">
        <div className="font-heading text-xs font-black uppercase tracking-wider text-[var(--app-text-subtle)]">
          Quick Launch Command Center
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <QuickActionCard
            title="Ask AI Tutor"
            subtitle="13 Modes"
            icon={<Sparkles size={18} className="text-gray-700 dark:text-gray-300" />}
            onClick={() => setActiveTab('ai-tutor')}
          />
          <QuickActionCard
            title="Math Solver"
            subtitle="Step-by-step"
            icon={<Calculator size={18} className="text-gray-700 dark:text-gray-300" />}
            onClick={() => setActiveTab('math-solver')}
          />
          <QuickActionCard
            title="PDF Studio"
            subtitle="Upload & Chat"
            icon={<FileText size={18} className="text-gray-700 dark:text-gray-300" />}
            onClick={() => setActiveTab('document-ai')}
          />
          <QuickActionCard
            title="Exam Radar"
            subtitle="Analyze PYQs"
            icon={<Radar size={18} className="text-gray-700 dark:text-gray-300" />}
            onClick={() => setActiveTab('exam-radar')}
          />
          <QuickActionCard
            title="Generate Quiz"
            subtitle="Adaptive Testing"
            icon={<HelpCircle size={18} className="text-gray-700 dark:text-gray-300" />}
            onClick={() => setActiveTab('quiz')}
          />
          <QuickActionCard
            title="AI Viva Room"
            subtitle="Oral Examiner"
            icon={<Mic size={18} className="text-gray-700 dark:text-gray-300" />}
            onClick={() => setActiveTab('viva')}
          />
          <QuickActionCard
            title="Focus Mode"
            subtitle="Pomodoro Timer"
            icon={<Clock size={18} className="text-gray-700 dark:text-gray-300" />}
            onClick={() => setActiveTab('focus-timer')}
          />
          <QuickActionCard
            title="Open Library"
            subtitle="Open Textbooks"
            icon={<BookOpen size={18} className="text-gray-700 dark:text-gray-300" />}
            onClick={() => setActiveTab('library')}
          />
        </div>
      </div>

      {/* 6. Continue Learning: Recently Opened Documents */}
      <div className="surface-card space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
                  <FileText size={18} />
                </div>
            <h3 className="font-heading text-sm font-black text-[var(--app-text)]">
              Recently Uploaded Academic Notes & Books
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('document-ai')}
            className="text-xs font-bold text-teal-700 hover:underline dark:text-teal-300"
          >
            Upload New PDF →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {documents.map(doc => (
            <div
              key={doc.id}
              onClick={() => {
                openDocumentReader(doc);
                setActiveTab('document-ai');
              }}
              className="surface-muted cursor-pointer p-4 transition-colors hover:border-[var(--app-border-strong)]"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]">
                  <FileText size={16} />
                </div>
                <div className="truncate">
                  <div className="truncate text-xs font-black text-[var(--app-text)]">{doc.title}</div>
                  <div className="font-mono text-[10px] text-[var(--app-text-subtle)]">{doc.subjectName}</div>
                </div>
              </div>
              <p className="view-copy mb-3 line-clamp-2 text-[11px]">
                {doc.summary || 'Ready for semantic search and study pack generation.'}
              </p>
              <div className="flex items-center justify-between border-t border-[var(--app-border)] pt-2.5 font-mono text-[10px] text-[var(--app-text-subtle)]">
                <span>{doc.pageCount} Pages</span>
                <span className="font-bold text-teal-700 dark:text-teal-300">Open Reader →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const QuickActionCard: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ title, subtitle, icon, onClick }) => (
  <button
    onClick={onClick}
    className="surface-card group flex flex-col items-center p-3.5 text-center transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-muted)]"
  >
    <div className="mb-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-2 transition-colors group-hover:border-[var(--app-border-strong)]">
      {icon}
    </div>
    <span className="text-xs font-black text-[var(--app-text)]">
      {title}
    </span>
    <span className="mt-0.5 text-[10px] text-[var(--app-text-subtle)]">{subtitle}</span>
  </button>
);

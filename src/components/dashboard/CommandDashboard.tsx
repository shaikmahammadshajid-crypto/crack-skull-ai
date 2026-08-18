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
    <div className="space-y-6 pb-20 lg:pb-10 max-w-7xl mx-auto">
      {/* 1. Header Greeting & Hero Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#161922] p-6 sm:p-7 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-150">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-gray-900 dark:text-white tracking-tight">
              {getGreeting()}, {user.name.split(' ')[0]}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {user.degree} • {user.semester} • Target:{' '}
            <span className="text-blue-600 dark:text-blue-400 font-semibold uppercase">
              {user.studyGoal.replace('_', ' ')}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 text-xs">
            <Clock size={15} className="text-blue-600 dark:text-blue-400" />
            <div>
              <div className="font-bold text-gray-900 dark:text-white font-mono">{user.totalStudyHours} hrs</div>
              <div className="text-[10px] text-gray-400">Total Study Time</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1 py-1 rounded-xl bg-gray-50 dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 text-xs">
            <StreakFlame streakDays={user.streakDays} size="md" />
          </div>

          <button
            onClick={toggleCrackMode}
            className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-xs ${
              user.isCrackModeActive
                ? 'bg-orange-500 text-white'
                : 'bg-gray-50 dark:bg-[#1A1D27] border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 hover:border-orange-400'
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
        <div className="p-5 sm:p-6 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold font-mono uppercase tracking-wider">
                SPRINT ACTIVE
              </span>
              <span className="text-xs font-bold text-orange-800 dark:text-orange-300 font-mono">
                {primaryExam.name} ({primaryExam.code})
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-heading">
              Targeting Top 90%+ Probability Exam Questions
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
              Skipping low-yield theory. Quizzes, flashcards, and AI prompts are tuned to Section B 10-markers and solved PYQ derivations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('exam-radar')}
              className="px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
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
              <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                <CalendarCheck size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading text-gray-900 dark:text-white">
                  Today's Mission
                </h3>
                <p className="text-[11px] text-gray-400">
                  AI-Curated Agenda based on your weak topics & countdown
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('study-plan')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
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
                    ? 'bg-gray-50/50 dark:bg-[#141720] border-gray-100 dark:border-gray-800/60 opacity-60'
                    : 'bg-white dark:bg-[#161922] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-xs'
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
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {task.topic}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono font-medium">
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

                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                        {task.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
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
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
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
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BrainCircuit size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="text-xs text-gray-700 dark:text-gray-300">
                <span className="font-bold text-gray-900 dark:text-white">AI Strategy Tip: </span>
                {studyPlan.crackTip}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Exam Radar & Weak Topic Diagnostic */}
        <div className="lg:col-span-5 space-y-4">
          {/* Exam Radar Snapshot */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#161922] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4 transition-colors duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                  <Radar size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-gray-900 dark:text-white">
                    Exam Radar Prediction
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    High-yield topics analyzed from previous 5 years papers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('exam-radar')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Explore →
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">SQL Joins & Group By Queries</div>
                  <div className="text-[10px] text-gray-400 font-mono">16–20 Marks • Seen in 5 of 5 Years</div>
                </div>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full">
                  92% Priority
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">Normalization (3NF / BCNF Proofs)</div>
                  <div className="text-[10px] text-gray-400 font-mono">12–16 Marks • Seen in 4 of 5 Years</div>
                </div>
                <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 px-2.5 py-0.5 rounded-full">
                  86% Priority
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">Transactions & 2PL Concurrency</div>
                  <div className="text-[10px] text-gray-400 font-mono">10–14 Marks • Critical Discriminator</div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full">
                  78% Priority
                </span>
              </div>
            </div>
          </div>

          {/* Weak Topic Alert & Knowledge Map Alert */}
          {weakNodes.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle size={17} />
                <span className="text-xs font-bold font-heading uppercase tracking-wide">
                  Weak Area Alert ({weakNodes.length})
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Recent quiz performance indicates low confidence in <strong className="text-gray-900 dark:text-white">"{weakNodes[0].topic}"</strong> ({weakNodes[0].masteryPercentage}% mastery).
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('ai-tutor')}
                  className="px-3.5 py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs"
                >
                  <Sparkles size={13} />
                  <span>Explain with AI</span>
                </button>
                <button
                  onClick={() => setActiveTab('knowledge-map')}
                  className="px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs hover:text-black dark:hover:text-white font-medium shadow-xs"
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
        <div className="text-xs font-bold font-heading text-gray-400 uppercase tracking-wider">
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
      <div className="p-6 rounded-2xl bg-white dark:bg-[#161922] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4 transition-colors duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              <FileText size={18} />
            </div>
            <h3 className="text-sm font-bold font-heading text-gray-900 dark:text-white">
              Recently Uploaded Academic Notes & Books
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('document-ai')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
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
              className="p-4 rounded-xl bg-gray-50 dark:bg-[#1A1D27] border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 cursor-pointer transition-colors shadow-xs"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  <FileText size={16} />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{doc.title}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{doc.subjectName}</div>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
                {doc.summary || 'Ready for semantic search and study pack generation.'}
              </p>
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono border-t border-gray-200 dark:border-gray-800/80 pt-2.5">
                <span>{doc.pageCount} Pages</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Open Reader →</span>
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
    className="flex flex-col items-center text-center p-3.5 rounded-xl bg-white dark:bg-[#161922] border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#1A1D27] transition-all shadow-xs group"
  >
    <div className="p-2 rounded-lg bg-gray-50 dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 group-hover:border-gray-300 dark:group-hover:border-gray-700 transition-colors mb-2">
      {icon}
    </div>
    <span className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors">
      {title}
    </span>
    <span className="text-[10px] text-gray-400 mt-0.5">{subtitle}</span>
  </button>
);

import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  Award,
  Zap,
  Clock,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

export const AcademicAnalyticsView: React.FC = () => {
  const { crackScore, user, subjects, quizAttempts } = useApp();

  const trendData = [
    { day: 'Mon', score: 62, studyHours: 2.5 },
    { day: 'Tue', score: 68, studyHours: 3.0 },
    { day: 'Wed', score: 71, studyHours: 4.2 },
    { day: 'Thu', score: 75, studyHours: 3.8 },
    { day: 'Fri', score: 80, studyHours: 5.0 },
    { day: 'Sat', score: 84, studyHours: 5.5 },
    { day: 'Sun', score: crackScore.overallScore, studyHours: user.dailyHours },
  ];

  const radarData = subjects.map(s => ({
    subject: s.name.split(' ')[0],
    mastery: s.masteryPercentage,
    fullMark: 100,
  }));

  const quizDistributionData = [
    { name: 'DBMS', accuracy: 88 },
    { name: 'OS', accuracy: 72 },
    { name: 'Networks', accuracy: 80 },
    { name: 'Algorithms', accuracy: 65 },
  ];

  return (
    <div className="view-stack space-y-5">
      {/* Header Banner */}
      <div className="view-hero flex flex-col items-start justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              <BarChart3 size={22} />
            </div>
            <h1 className="view-title text-2xl">
              Academic & Crack Score Analytics
            </h1>
          </div>
          <p className="view-copy text-xs sm:text-sm">
            Real-time telemetry measuring syllabus velocity, quiz accuracy, and predicted examination marks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="metric-tile text-center">
            <div className="font-mono text-xl font-black text-[var(--app-text)]">
              {crackScore.overallScore} / 100
            </div>
            <div className="text-[10px] font-semibold uppercase text-[var(--app-text-subtle)]">Live Crack Score</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="metric-tile space-y-1">
          <div className="flex items-center justify-between text-[var(--app-text-muted)]">
            <span className="text-xs">Syllabus Velocity</span>
            <BookOpen size={16} className="text-blue-700 dark:text-blue-300" />
          </div>
          <div className="font-mono text-2xl font-black text-[var(--app-text)]">
            {crackScore.syllabusCoverage}%
          </div>
          <div className="text-[10px] text-emerald-400">+12% this week</div>
        </div>

        <div className="metric-tile space-y-1">
          <div className="flex items-center justify-between text-[var(--app-text-muted)]">
            <span className="text-xs">Quiz Accuracy</span>
            <HelpCircle size={16} className="text-cyan-400" />
          </div>
          <div className="font-mono text-2xl font-black text-[var(--app-text)]">
            {crackScore.quizAccuracy}%
          </div>
          <div className="text-[10px] text-cyan-400">{quizAttempts.length} Tests Completed</div>
        </div>

        <div className="metric-tile space-y-1">
          <div className="flex items-center justify-between text-[var(--app-text-muted)]">
            <span className="text-xs">Study Streak</span>
            <Zap size={16} className="text-amber-400" />
          </div>
          <div className="font-mono text-2xl font-black text-[var(--app-text)]">
            {user.streakDays} Days
          </div>
          <div className="text-[10px] text-amber-500">Active streak</div>
        </div>

        <div className="metric-tile space-y-1">
          <div className="flex items-center justify-between text-[var(--app-text-muted)]">
            <span className="text-xs">Scholar Level</span>
            <Award size={16} className="text-pink-400" />
          </div>
          <div className="font-mono text-2xl font-black text-[var(--app-text)]">
            Level {user.level}
          </div>
          <div className="text-[10px] text-pink-400">{user.xp} Total XP</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crack Score Growth Curve */}
        <div className="surface-card space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-heading text-sm font-black text-[var(--app-text)]">
              <TrendingUp size={16} className="text-blue-700 dark:text-blue-300" />
              <span>Crack Score Progression (7 Days)</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} domain={[50, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Mastery Radar */}
        <div className="surface-card space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-heading text-sm font-black text-[var(--app-text)]">
              <Award size={16} className="text-cyan-400" />
              <span>Subject Competency Radar</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={11} />
                <PolarRadiusAxis stroke="#64748B" angle={30} domain={[0, 100]} />
                <Radar name="Mastery" dataKey="mastery" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.4} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

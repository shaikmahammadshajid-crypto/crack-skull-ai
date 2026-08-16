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
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/50 via-indigo-950/40 to-slate-900/60 border border-purple-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <BarChart3 size={22} />
            </div>
            <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">
              Academic & Crack Score Analytics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Real-time telemetry measuring syllabus velocity, quiz accuracy, and predicted examination marks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-xl font-extrabold font-mono text-white">
              {crackScore.overallScore} / 100
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Live Crack Score</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Syllabus Velocity</span>
            <BookOpen size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {crackScore.syllabusCoverage}%
          </div>
          <div className="text-[10px] text-emerald-400">+12% this week</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Quiz Accuracy</span>
            <HelpCircle size={16} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {crackScore.quizAccuracy}%
          </div>
          <div className="text-[10px] text-cyan-400">{quizAttempts.length} Tests Completed</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Study Streak</span>
            <Zap size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {user.streakDays} Days
          </div>
          <div className="text-[10px] text-amber-400">On Fire 🔥</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">Scholar Level</span>
            <Award size={16} className="text-pink-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            Level {user.level}
          </div>
          <div className="text-[10px] text-pink-400">{user.xp} Total XP</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crack Score Growth Curve */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm font-heading">
              <TrendingUp size={16} className="text-purple-400" />
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
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm font-heading">
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

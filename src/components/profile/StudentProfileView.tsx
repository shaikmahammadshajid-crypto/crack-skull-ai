import React from 'react';
import { useApp } from '../../context/AppContext';
import { StreakFlame } from '../common/StreakFlame';
import {
  User,
  Award,
  BookOpen,
  GraduationCap,
  Clock,
  Zap,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';

export const StudentProfileView: React.FC = () => {
  const { user, crackScore, subjects, quizAttempts, setSettingsOpen } = useApp();

  const xpForNextLevel = user.level * 600;
  const currentLevelXp = user.xp % 600;
  const levelProgress = Math.min(100, Math.round((currentLevelXp / 600) * 100));

  const badges = [
    { title: '7-Day Streak Warrior', desc: 'Maintained 7 consecutive active study days', unlocked: true, icon: '🔥' },
    { title: 'PYQ Conqueror', desc: 'Analyzed 5-year past paper predictions', unlocked: true, icon: '🎯' },
    { title: 'Oral Viva Ace', desc: 'Scored 85%+ in University AI Viva Examiner', unlocked: true, icon: '🎓' },
    { title: 'Flashcard Master', desc: 'Mastered 30+ spaced recall cards', unlocked: true, icon: '⚡' },
    { title: 'Midnight Scholar', desc: 'Completed a 50-minute deep flow block', unlocked: true, icon: '🌙' },
    { title: 'Crack Score Master', desc: 'Reached 80+ academic exam readiness score', unlocked: crackScore.overallScore >= 80, icon: '💀' },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Profile Card Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/50 via-slate-900/80 to-slate-900/60 border border-purple-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-400 p-1 shadow-xl shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[20px] flex items-center justify-center text-2xl font-extrabold text-white">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-extrabold font-heading text-white">
                {user.name}
              </h1>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Level {user.level} Scholar
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {user.degree} • {user.semester} • {user.college}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              Academic Target: {user.studyGoal.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StreakFlame streakDays={user.streakDays} size="lg" />
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white border border-slate-700"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Level & XP Progression Bar */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold text-white">
            <Sparkles size={16} className="text-purple-400" />
            <span>Scholar XP Progress (Level {user.level} → Level {user.level + 1})</span>
          </div>
          <span className="font-mono text-purple-400 font-bold">
            {currentLevelXp} / 600 XP ({levelProgress}%)
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${levelProgress}%` }}
          />
        </div>
      </div>

      {/* Badges Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
          <Trophy size={16} className="text-amber-400" />
          <span>Earned Academic Mastery Badges</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((b, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border transition-all ${
                b.unlocked
                  ? 'bg-slate-900/80 border-purple-500/30'
                  : 'bg-slate-950/40 border-slate-800/40 opacity-40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{b.icon}</div>
                <div>
                  <h4 className="text-xs font-bold text-white">{b.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{b.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

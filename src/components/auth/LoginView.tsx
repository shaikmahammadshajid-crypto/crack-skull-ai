import React, { useMemo, useState } from 'react';
import { Brain, CheckCircle2, Eye, EyeOff, Languages, LockKeyhole, Mic, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { assistantLanguages } from '../../services/languageService';

export const LoginView: React.FC = () => {
  const { user, login } = useApp();
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [degree, setDegree] = useState(user.degree || 'B.Tech Computer Science');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const languagePreview = useMemo(
    () => assistantLanguages.filter(language => language.code !== 'auto').slice(0, 8),
    []
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError('Enter your name to create your study profile.');
      return;
    }

    if (!cleanEmail.includes('@')) {
      setError('Enter a valid email address for this device profile.');
      return;
    }

    if (pin.trim().length > 0 && pin.trim().length < 4) {
      setError('Study PIN must be at least 4 digits, or leave it empty for quick login.');
      return;
    }

    login(
      {
        name: cleanName,
        email: cleanEmail,
        degree: degree.trim() || user.degree,
      },
      rememberDevice
    );
  };

  return (
    <main className="min-h-screen bg-[#F7F8FB] dark:bg-[#0F1117] text-gray-950 dark:text-white flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-[1.05fr_0.95fr] bg-white dark:bg-[#161922] border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden rounded-3xl">
        <section className="p-6 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151923]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-lg">
              CS
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading tracking-tight">CrackSkull AI</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Personal exam preparation workspace</p>
            </div>
          </div>

          <div className="mt-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-xs font-bold">
              <ShieldCheck size={14} />
              Remember this device enabled
            </div>
            <h2 className="mt-5 text-3xl sm:text-4xl font-black font-heading tracking-tight leading-tight">
              Continue your study plan from the same device.
            </h2>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-6">
              Your subjects, flashcards, quiz attempts, voice settings, and Crack Score stay saved locally in this browser. Sign in once and keep preparing without losing your progress.
            </p>
          </div>

          <div className="mt-8 grid sm:grid-cols-3 gap-3">
            <FeatureTile icon={<Brain size={18} />} title="12 AI Agents" text="Tutor, PYQ, viva, coding, planner, revision." />
            <FeatureTile icon={<Mic size={18} />} title="Voice Tutor" text="Speak questions and hear AI replies." />
            <FeatureTile icon={<Languages size={18} />} title="Multilingual" text="Indian and global language support." />
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-gray-50 dark:bg-[#1C2130] border border-gray-200 dark:border-gray-800">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Supported Languages</div>
            <div className="flex flex-wrap gap-2">
              {languagePreview.map(language => (
                <span key={language.code} className="px-2.5 py-1 rounded-full bg-white dark:bg-[#111520] border border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                  {language.nativeLabel}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10 bg-[#FAFBFC] dark:bg-[#111520]">
          <div className="mb-7">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
              <Sparkles size={15} />
              Student Login
            </div>
            <h2 className="mt-2 text-2xl font-black font-heading tracking-tight">Open your dashboard</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This is a local learning profile, not a paid account system.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Full Name</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl bg-white dark:bg-[#181D29] border border-gray-200 dark:border-gray-800 px-3.5 py-3">
                <UserRound size={17} className="text-gray-400" />
                <input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="Shaik Mahammad Shajid"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Email</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl bg-white dark:bg-[#181D29] border border-gray-200 dark:border-gray-800 px-3.5 py-3">
                <CheckCircle2 size={17} className="text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="student@example.com"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Degree / Course</span>
              <input
                value={degree}
                onChange={event => setDegree(event.target.value)}
                className="mt-1.5 w-full rounded-2xl bg-white dark:bg-[#181D29] border border-gray-200 dark:border-gray-800 px-3.5 py-3 text-sm outline-none"
                placeholder="B.Tech CSE Data Science"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Optional Study PIN</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl bg-white dark:bg-[#181D29] border border-gray-200 dark:border-gray-800 px-3.5 py-3">
                <LockKeyhole size={17} className="text-gray-400" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="Optional local PIN"
                />
                <button type="button" onClick={() => setShowPin(prev => !prev)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
                  {showPin ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-[#181D29] border border-gray-200 dark:border-gray-800 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={event => setRememberDevice(event.target.checked)}
                className="mt-1 h-4 w-4 accent-black dark:accent-white"
              />
              <span>
                <span className="block text-sm font-bold">Remember this device</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 leading-5">
                  Keep me signed in on this browser. Turn this off on shared computers.
                </span>
              </span>
            </label>

            {error && (
              <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-black dark:bg-white text-white dark:text-black py-3.5 text-sm font-black shadow-lg hover:opacity-90 active:scale-[0.99] transition"
            >
              Enter CrackSkull AI
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

const FeatureTile: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
  <div className="rounded-2xl bg-gray-50 dark:bg-[#1C2130] border border-gray-200 dark:border-gray-800 p-4">
    <div className="w-9 h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
      {icon}
    </div>
    <div className="mt-3 text-sm font-bold">{title}</div>
    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-5">{text}</p>
  </div>
);

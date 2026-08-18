import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Play,
  RotateCcw,
  Volume2,
  CheckCircle2,
  ShieldAlert,
  Lock,
  EyeOff,
} from 'lucide-react';

export const FocusTimerView: React.FC = () => {
  const { activeSubject, subjects, addXp, triggerConfetti } = useApp();

  const [mode, setMode] = useState<'study25' | 'deep50' | 'shortBreak' | 'longBreak'>('study25');
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(3);
  const [ambientSound, setAmbientSound] = useState<'none' | 'lofi' | 'binaural' | 'rain'>('none');
  const [selectedSubjectId, setSelectedSubjectId] = useState(activeSubject?.id || subjects[0]?.id);
  const [focusLocked, setFocusLocked] = useState(false);
  const [distractionCount, setDistractionCount] = useState(0);
  const [lastDistraction, setLastDistraction] = useState('');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Set initial time based on mode
  useEffect(() => {
    if (focusLocked) return;
    setIsActive(false);
    if (mode === 'study25') setSecondsRemaining(25 * 60);
    else if (mode === 'deep50') setSecondsRemaining(50 * 60);
    else if (mode === 'shortBreak') setSecondsRemaining(5 * 60);
    else if (mode === 'longBreak') setSecondsRemaining(15 * 60);
  }, [mode, focusLocked]);

  // Timer tick
  useEffect(() => {
    let interval: any;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining]);

  useEffect(() => {
    if (!focusLocked) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setDistractionCount(prev => prev + 1);
        setLastDistraction('Tab switch detected. Stay inside the focus room until the timer ends.');
      }
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = 'Your focus session is still running.';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [focusLocked]);

  const handleSessionComplete = () => {
    setIsActive(false);
    setFocusLocked(false);
    stopSynthAudio();
    document.exitFullscreen?.().catch(() => undefined);
    if (mode === 'study25' || mode === 'deep50') {
      setCompletedSessions(prev => prev + 1);
      addXp(mode === 'deep50' ? 80 : 40);
      triggerConfetti();
      alert(`Focus Session Completed. Distractions detected: ${distractionCount}. Take a 5-minute restorative break.`);
    }
  };

  const toggleTimer = () => {
    if (isActive && focusLocked) return;

    setIsActive(true);
    if (mode === 'study25' || mode === 'deep50') {
      setFocusLocked(true);
      setDistractionCount(0);
      setLastDistraction('');
      document.documentElement.requestFullscreen?.().catch(() => undefined);
    }

    if (ambientSound !== 'none') {
      startSynthAudio(ambientSound);
    }
  };

  const handleReset = () => {
    if (focusLocked && !window.confirm('This will end the locked focus session early and count as a distraction. Continue?')) {
      return;
    }
    if (focusLocked) {
      setDistractionCount(prev => prev + 1);
      setLastDistraction('Focus session ended early.');
    }
    setIsActive(false);
    setFocusLocked(false);
    stopSynthAudio();
    document.exitFullscreen?.().catch(() => undefined);
    if (mode === 'study25') setSecondsRemaining(25 * 60);
    else if (mode === 'deep50') setSecondsRemaining(50 * 60);
    else if (mode === 'shortBreak') setSecondsRemaining(5 * 60);
    else if (mode === 'longBreak') setSecondsRemaining(15 * 60);
  };

  // Web Audio Synthesizer for Ambient Alpha Waves
  const startSynthAudio = (type: 'lofi' | 'binaural' | 'rain') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.04;

      if (type === 'binaural') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(216, ctx.currentTime); // Alpha focus frequency
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      oscillatorRef.current = osc;
    } catch (e) {
      console.warn(e);
    }
  };

  const stopSynthAudio = () => {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalTime = mode === 'study25' ? 25 * 60 : mode === 'deep50' ? 50 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60;
  const progressPercent = Math.round(((totalTime - secondsRemaining) / totalTime) * 100);
  const selectedSubject = subjects.find(subject => subject.id === selectedSubjectId) || activeSubject || subjects[0];

  return (
    <div className="view-stack max-w-5xl space-y-5">
      {/* Header Banner */}
      <div className="view-hero flex flex-col items-start justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
              <Clock size={22} />
            </div>
            <h1 className="view-title text-2xl">
              Focus & Pomodoro Flow
            </h1>
          </div>
          <p className="view-copy text-xs sm:text-sm">
            Eliminate distractions with timed deep study blocks, binaural focus beats, and automatic XP logging.
          </p>
        </div>

        <div className="metric-tile flex items-center gap-2 px-3.5 py-2 text-xs">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span className="font-mono font-black text-[var(--app-text)]">{completedSessions} Sessions Completed Today</span>
        </div>
      </div>

      {/* Focus Lock Status */}
      <div className={`surface-card flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center ${
        focusLocked ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-500/40 dark:bg-cyan-500/10' : ''
      }`}>
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
            {focusLocked ? <Lock size={18} /> : <EyeOff size={18} />}
          </div>
          <div>
            <div className="text-sm font-black text-[var(--app-text)]">
              {focusLocked ? 'Distraction Blocker Active' : 'Strict Focus Room Ready'}
            </div>
            <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">
              {focusLocked
                ? 'Pause, reset, mode changes, tab switching, and page leaving are restricted until the timer ends.'
                : 'Start a study timer to enter fullscreen focus mode with tab-switch detection.'}
            </p>
          </div>
        </div>
        <div className="font-mono text-xs text-[var(--app-text-muted)]">
          Subject: <span className="font-black text-[var(--app-text)]">{selectedSubject?.name || 'General Study'}</span>
        </div>
      </div>

      {/* Main Timer Dial Card */}
      <div className="surface-card-strong flex flex-col items-center space-y-6 p-6 text-center sm:p-10">
        {/* Mode Selector Tabs */}
        <div className="segmented-control justify-center text-xs">
          <button
            onClick={() => !focusLocked && setMode('study25')}
            disabled={focusLocked}
            className={`segmented-option ${
              mode === 'study25' ? 'segmented-option-active' : ''
            } disabled:opacity-40`}
          >
            25m Pomodoro
          </button>
          <button
            onClick={() => !focusLocked && setMode('deep50')}
            disabled={focusLocked}
            className={`segmented-option ${
              mode === 'deep50' ? 'segmented-option-active' : ''
            } disabled:opacity-40`}
          >
            50m Deep Flow
          </button>
          <button
            onClick={() => !focusLocked && setMode('shortBreak')}
            disabled={focusLocked}
            className={`segmented-option ${
              mode === 'shortBreak' ? 'segmented-option-active' : ''
            } disabled:opacity-40`}
          >
            5m Break
          </button>
        </div>

        {/* Large Digital Clock Display */}
        <div className="relative w-[min(16rem,78vw)] h-[min(16rem,78vw)] sm:w-72 sm:h-72 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              className="stroke-gray-200 dark:stroke-slate-800"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              className="stroke-cyan-500 transition-all duration-1000 ease-linear dark:stroke-cyan-300"
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 - (progressPercent / 100) * (2 * Math.PI * 52)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
            <span className="font-mono text-4xl font-black tracking-tight text-[var(--app-text)] sm:text-5xl">
              {formatTime(secondsRemaining)}
            </span>
            <span className="font-heading text-[11px] font-black uppercase tracking-widest text-cyan-700 dark:text-cyan-300">
              {isActive ? 'FLOW IN PROGRESS' : 'READY TO FOCUS'}
            </span>
            {focusLocked && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-3 py-1 text-[10px] font-black text-cyan-800 dark:text-cyan-200">
                <ShieldAlert size={12} />
                LOCKED UNTIL COMPLETE
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTimer}
            disabled={isActive && focusLocked}
            className={`flex items-center gap-2 px-8 py-3.5 text-sm font-black transition-all active:scale-95 ${
              isActive
                ? 'secondary-action cursor-not-allowed opacity-60'
                : 'primary-action bg-cyan-600 text-white hover:bg-cyan-500 dark:bg-cyan-500 dark:text-white'
            }`}
          >
            {isActive ? <Lock size={18} /> : <Play size={18} />}
            <span>{isActive ? 'Focus Locked' : 'Start Focus Flow'}</span>
          </button>

          <button
            onClick={handleReset}
            className="icon-button icon-button-lg"
            title={focusLocked ? 'Emergency end focus session' : 'Reset Timer'}
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Ambient Synthesizer Sound Selector */}
        <div className="flex items-center gap-2 border-t border-[var(--app-border)] pt-4 text-xs text-[var(--app-text-muted)]">
          <Volume2 size={14} className="text-cyan-700 dark:text-cyan-300" />
          <span>Ambient Audio:</span>
          <select
            value={ambientSound}
            onChange={e => {
              const val = e.target.value as any;
              setAmbientSound(val);
              if (isActive) {
                if (val === 'none') stopSynthAudio();
                else startSynthAudio(val);
              }
            }}
            className="form-control px-2.5 py-1 text-xs"
          >
            <option value="none">Muted / Silence</option>
            <option value="binaural">Alpha Waves (216 Hz)</option>
            <option value="lofi">Lo-Fi Synth Pulse</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl text-left">
          <div className="metric-tile">
            <div className="text-[10px] font-black uppercase text-[var(--app-text-subtle)]">Distractions Detected</div>
            <div className="text-2xl font-black text-[var(--app-text)]">{distractionCount}</div>
          </div>
          <div className="metric-tile">
            <div className="text-[10px] font-black uppercase text-[var(--app-text-subtle)]">Last Warning</div>
            <div className="text-xs font-semibold text-amber-700 dark:text-amber-200">{lastDistraction || 'No distractions yet'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CalendarEvent } from '../../types';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export const ExamCalendarView: React.FC = () => {
  const { calendarEvents, addCalendarEvent, deleteCalendarEvent, subjects, triggerConfetti } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-05-15');
  const [newType, setNewType] = useState<'exam' | 'quiz' | 'submission' | 'study_block'>('exam');
  const [newSubject, setNewSubject] = useState(subjects[0]?.name || 'Database Management Systems');

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addCalendarEvent({
      id: `ev_${Date.now()}`,
      title: newTitle,
      subjectName: newSubject,
      date: newDate,
      time: '09:30 AM',
      type: newType,
      countdownDays: 14,
    });

    setNewTitle('');
    setIsAddModalOpen(false);
    triggerConfetti();
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/50 via-pink-950/40 to-slate-900/60 border border-purple-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Calendar size={22} />
            </div>
            <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">
              Exam & Milestone Calendar
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Track university examination dates, project submission deadlines, and weekly mock test schedules with live countdowns.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all"
        >
          <Plus size={16} />
          <span>Add Exam Date</span>
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {calendarEvents.map(event => (
          <div
            key={event.id}
            className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 text-center min-w-[64px]">
                <div className="text-xs font-mono font-bold uppercase">
                  {new Date(event.date).toLocaleDateString([], { month: 'short' })}
                </div>
                <div className="text-xl font-extrabold font-mono text-white">
                  {new Date(event.date).getDate() || 15}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white font-heading">
                    {event.title}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono">
                    {event.subjectName}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                      event.type === 'exam'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    {event.type}
                  </span>
                </div>

                <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                  <Clock size={13} />
                  <span>{event.time}</span>
                  <span>•</span>
                  <span>Date: {event.date}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 font-mono text-xs text-purple-300 font-bold">
                {event.countdownDays} Days Left
              </span>

              <button
                onClick={() => deleteCalendarEvent(event.id)}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-heading">
              Add Academic Calendar Milestone
            </h3>

            <form onSubmit={handleAddEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Event / Exam Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. End-Semester Final Examination"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md shadow-purple-600/30"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

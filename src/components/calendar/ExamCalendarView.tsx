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
  Filter,
  Target,
} from 'lucide-react';

export const ExamCalendarView: React.FC = () => {
  const { calendarEvents, addCalendarEvent, deleteCalendarEvent, subjects, triggerConfetti } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTime, setNewTime] = useState('09:30');
  const [newType, setNewType] = useState<CalendarEvent['type']>('exam');
  const [newPriority, setNewPriority] = useState<CalendarEvent['priority']>('high');
  const [newSubject, setNewSubject] = useState(subjects[0]?.name || 'Database Management Systems');
  const [filterType, setFilterType] = useState<'all' | CalendarEvent['type']>('all');

  const getEventSubject = (event: CalendarEvent) => event.subjectName || event.subject || 'General';

  const getCountdownDays = (date: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${date}T00:00:00`);
    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
  };

  const sortedEvents = [...calendarEvents]
    .filter(event => filterType === 'all' || event.type === filterType)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingEvents = calendarEvents.filter(event => getCountdownDays(event.date) >= 0);
  const nextEvent = [...upcomingEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const urgentCount = upcomingEvents.filter(event => getCountdownDays(event.date) <= 7).length;
  const examCount = calendarEvents.filter(event => event.type === 'exam').length;

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addCalendarEvent({
      id: `ev_${Date.now()}`,
      title: newTitle,
      subject: newSubject,
      subjectName: newSubject,
      date: newDate,
      time: newTime,
      type: newType,
      priority: newPriority,
    });

    setNewTitle('');
    setIsAddModalOpen(false);
    triggerConfetti();
  };

  return (
    <div className="view-stack max-w-5xl space-y-5">
      {/* Header Banner */}
      <div className="view-hero flex flex-col items-start justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              <Calendar size={22} />
            </div>
            <h1 className="view-title text-2xl">
              Exam & Milestone Calendar
            </h1>
          </div>
          <p className="view-copy text-xs sm:text-sm">
            Track university examination dates, project submission deadlines, and weekly mock test schedules with live countdowns.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="primary-action px-4 py-2.5 text-xs"
        >
          <Plus size={16} />
          <span>Add Exam Date</span>
        </button>
      </div>

      {/* Calendar Intelligence Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="metric-tile">
          <div className="text-[11px] font-black uppercase text-[var(--app-text-subtle)]">Next Milestone</div>
          <div className="mt-1 text-sm font-black text-[var(--app-text)]">{nextEvent?.title || 'No upcoming events'}</div>
          <div className="mt-1 font-mono text-xs text-rose-700 dark:text-rose-300">
            {nextEvent ? `${getCountdownDays(nextEvent.date)} days left • ${getEventSubject(nextEvent)}` : 'Add your next exam date'}
          </div>
        </div>
        <div className="metric-tile">
          <div className="text-[11px] font-black uppercase text-[var(--app-text-subtle)]">Urgent This Week</div>
          <div className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">{urgentCount}</div>
          <div className="mt-1 text-xs text-[var(--app-text-muted)]">events need preparation action</div>
        </div>
        <div className="metric-tile">
          <div className="text-[11px] font-black uppercase text-[var(--app-text-subtle)]">Exam Load</div>
          <div className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-300">{examCount}</div>
          <div className="mt-1 text-xs text-[var(--app-text-muted)]">exam events in the calendar</div>
        </div>
      </div>

      {/* Filters */}
      <div className="segmented-control overflow-x-auto">
        <span className="flex items-center gap-1 px-2 text-xs font-black text-[var(--app-text-muted)]">
          <Filter size={14} /> Filter:
        </span>
        {(['all', 'exam', 'assignment', 'viva', 'study_session', 'deadline', 'quiz'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`segmented-option whitespace-nowrap ${
              filterType === type ? 'segmented-option-active' : ''
            }`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {sortedEvents.map(event => {
          const countdown = getCountdownDays(event.date);
          const isPast = countdown < 0;
          const isUrgent = countdown >= 0 && countdown <= 7;
          return (
          <div
            key={event.id}
            className={`flex flex-col justify-between gap-4 border p-5 transition-colors sm:flex-row sm:items-center ${
              isPast
                ? 'surface-muted opacity-70'
                : isUrgent
                  ? 'surface-card border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10'
                  : 'surface-card hover:border-[var(--app-border-strong)]'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="min-w-[64px] rounded-lg bg-rose-50 p-3 text-center text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                <div className="font-mono text-xs font-black uppercase">
                  {new Date(event.date).toLocaleDateString([], { month: 'short' })}
                </div>
                <div className="font-mono text-xl font-black text-[var(--app-text)]">
                  {new Date(event.date).getDate() || 15}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading text-sm font-black text-[var(--app-text)]">
                    {event.title}
                  </span>
                  <span className="status-pill font-mono">
                    {getEventSubject(event)}
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

                <div className="flex items-center gap-2 font-mono text-xs text-[var(--app-text-muted)]">
                  <Clock size={13} />
                  <span>{event.time || 'All day'}</span>
                  <span>•</span>
                  <span>Date: {event.date}</span>
                  <span>•</span>
                  <span className={event.priority === 'high' ? 'text-rose-300' : event.priority === 'medium' ? 'text-amber-300' : 'text-emerald-300'}>
                    {event.priority} priority
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-black ${
                isPast
                  ? 'border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
                  : isUrgent
                    ? 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200'
                    : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
              }`}>
                {isPast ? `${Math.abs(countdown)} Days Ago` : countdown === 0 ? 'Today' : `${countdown} Days Left`}
              </span>

              <button
                onClick={() => deleteCalendarEvent(event.id)}
                className="icon-button text-[var(--app-text-subtle)] hover:text-rose-500"
                title="Delete event"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
          <div className="surface-card-strong w-full max-w-md space-y-4 p-6">
            <h3 className="font-heading text-base font-black text-[var(--app-text)]">
              Add Academic Calendar Milestone
            </h3>

            <form onSubmit={handleAddEvent} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-[var(--app-text-muted)]">
                  Event / Exam Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. End-Semester Final Examination"
                  className="form-control w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[var(--app-text-muted)]">
                  Subject
                </label>
                <select
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="form-control w-full px-3 py-2"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[var(--app-text-muted)]">
                  Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="form-control w-full px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-[var(--app-text-muted)]">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="form-control w-full px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-[var(--app-text-muted)]">
                    Type
                  </label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as CalendarEvent['type'])}
                    className="form-control w-full px-3 py-2"
                  >
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="viva">Viva</option>
                    <option value="study_session">Study Session</option>
                    <option value="deadline">Deadline</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[var(--app-text-muted)]">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value as CalendarEvent['priority'])}
                  className="form-control w-full px-3 py-2"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="secondary-action px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-action px-5 py-2"
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

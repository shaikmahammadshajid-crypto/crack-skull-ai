import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowRight,
  BookOpen,
  Bot,
  FileText,
  HelpCircle,
  Layers,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { navigationItems } from './navigationConfig';

export const GlobalSearchModal: React.FC = () => {
  const {
    globalSearchOpen,
    setGlobalSearchOpen,
    documents,
    quizzes,
    flashcards,
    libraryResources,
    knowledgeNodes,
    setActiveTab,
    openDocumentReader,
    openExplainModal,
    startQuiz,
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
      if (e.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  useEffect(() => {
    if (globalSearchOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [globalSearchOpen]);

  if (!globalSearchOpen) return null;

  const cleanQuery = query.toLowerCase().trim();
  const close = () => setGlobalSearchOpen(false);

  const matchedNavigation = cleanQuery
    ? navigationItems.filter(item =>
      [item.label, item.shortLabel, item.subtitle, ...item.keywords]
        .join(' ')
        .toLowerCase()
        .includes(cleanQuery)
    )
    : [];

  const matchedDocs = cleanQuery
    ? documents.filter(d =>
      d.title.toLowerCase().includes(cleanQuery) ||
      d.subjectName.toLowerCase().includes(cleanQuery) ||
      d.tags.some(t => t.toLowerCase().includes(cleanQuery))
    )
    : [];

  const matchedQuizzes = cleanQuery
    ? quizzes.filter(q =>
      q.title.toLowerCase().includes(cleanQuery) ||
      q.topic.toLowerCase().includes(cleanQuery) ||
      q.subjectName.toLowerCase().includes(cleanQuery)
    )
    : [];

  const matchedFlashcards = cleanQuery
    ? flashcards.filter(f =>
      f.front.toLowerCase().includes(cleanQuery) ||
      f.back.toLowerCase().includes(cleanQuery) ||
      f.topic.toLowerCase().includes(cleanQuery)
    )
    : [];

  const matchedKnowledge = cleanQuery
    ? knowledgeNodes.filter(k =>
      k.topic.toLowerCase().includes(cleanQuery) ||
      k.subject.toLowerCase().includes(cleanQuery)
    )
    : [];

  const matchedLibrary = cleanQuery
    ? libraryResources.filter(l =>
      l.title.toLowerCase().includes(cleanQuery) ||
      l.author.toLowerCase().includes(cleanQuery) ||
      l.tags.some(t => t.toLowerCase().includes(cleanQuery))
    )
    : [];

  const hasResults =
    matchedNavigation.length > 0 ||
    matchedDocs.length > 0 ||
    matchedQuizzes.length > 0 ||
    matchedFlashcards.length > 0 ||
    matchedKnowledge.length > 0 ||
    matchedLibrary.length > 0;

  const suggestedLaunchers = navigationItems.filter(item =>
    ['dashboard', 'ai-tutor', 'math-solver', 'study-plan', 'quiz', 'document-ai'].includes(item.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-gray-950/45 px-3 pt-12 backdrop-blur-sm animate-in fade-in duration-150 sm:px-4 sm:pt-16">
      <div className="surface-card-strong flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3.5">
          <Search size={18} className="text-[var(--app-text-subtle)]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands, topics, notes, quizzes, and books"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--app-text)] placeholder:text-[var(--app-text-subtle)] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="icon-button h-8 w-8"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
          <kbd className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-1 font-mono text-[10px] text-[var(--app-text-subtle)]">
            Esc
          </kbd>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {!query ? (
            <div className="space-y-5">
              <div className="surface-muted p-5 text-center">
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-gray-950 text-white dark:bg-white dark:text-gray-950">
                  <Sparkles size={20} />
                </div>
                <h4 className="mt-3 text-sm font-black text-[var(--app-text)]">Command search</h4>
                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[var(--app-text-muted)]">
                  Jump to any study workspace or search indexed PDFs, quizzes, flashcards, knowledge nodes, and library resources.
                </p>
              </div>

              <ResultSection title="Quick Launch">
                {suggestedLaunchers.map(item => (
                  <ResultRow
                    key={item.id}
                    icon={item.icon}
                    title={item.label}
                    meta={item.subtitle}
                    actionLabel="Open"
                    onClick={() => {
                      setActiveTab(item.id);
                      close();
                    }}
                  />
                ))}
              </ResultSection>
            </div>
          ) : !hasResults ? (
            <div className="surface-muted py-12 text-center">
              <Bot size={28} className="mx-auto text-[var(--app-text-subtle)]" />
              <p className="mt-3 text-sm font-black text-[var(--app-text)]">No matching command or content</p>
              <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                Try a destination like Math Solver, a topic like SQL, or a content type like flashcards.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {matchedNavigation.length > 0 && (
                <ResultSection title="App Commands">
                  {matchedNavigation.map(item => (
                    <ResultRow
                      key={item.id}
                      icon={item.icon}
                      title={item.label}
                      meta={item.subtitle}
                      actionLabel="Open"
                      onClick={() => {
                        setActiveTab(item.id);
                        close();
                      }}
                    />
                  ))}
                </ResultSection>
              )}

              {matchedKnowledge.length > 0 && (
                <ResultSection title={`Knowledge Topics (${matchedKnowledge.length})`}>
                  {matchedKnowledge.map(k => (
                    <ResultRow
                      key={k.id}
                      icon={<Sparkles size={16} />}
                      title={k.topic}
                      meta={`${k.subject} | ${k.unit}`}
                      actionLabel="Explain"
                      onClick={() => {
                        openExplainModal(k.topic, k.subject);
                        close();
                      }}
                    />
                  ))}
                </ResultSection>
              )}

              {matchedDocs.length > 0 && (
                <ResultSection title={`Documents (${matchedDocs.length})`}>
                  {matchedDocs.map(d => (
                    <ResultRow
                      key={d.id}
                      icon={<FileText size={16} />}
                      title={d.title}
                      meta={`${d.subjectName} | ${d.pageCount} pages | ${d.fileSize}`}
                      actionLabel="Read"
                      onClick={() => {
                        openDocumentReader(d);
                        setActiveTab('document-ai');
                        close();
                      }}
                    />
                  ))}
                </ResultSection>
              )}

              {matchedQuizzes.length > 0 && (
                <ResultSection title={`Quizzes (${matchedQuizzes.length})`}>
                  {matchedQuizzes.map(q => (
                    <ResultRow
                      key={q.id}
                      icon={<HelpCircle size={16} />}
                      title={q.title}
                      meta={`${q.subjectName} | ${q.questions.length} questions | ${q.durationMinutes}m`}
                      actionLabel="Start"
                      onClick={() => {
                        startQuiz(q);
                        close();
                      }}
                    />
                  ))}
                </ResultSection>
              )}

              {matchedFlashcards.length > 0 && (
                <ResultSection title={`Flashcards (${matchedFlashcards.length})`}>
                  {matchedFlashcards.map(f => (
                    <ResultRow
                      key={f.id}
                      icon={<Layers size={16} />}
                      title={f.front}
                      meta={f.topic}
                      actionLabel="Review"
                      onClick={() => {
                        setActiveTab('flashcards');
                        close();
                      }}
                    />
                  ))}
                </ResultSection>
              )}

              {matchedLibrary.length > 0 && (
                <ResultSection title={`Library (${matchedLibrary.length})`}>
                  {matchedLibrary.map(l => (
                    <ResultRow
                      key={l.id}
                      icon={<BookOpen size={16} />}
                      title={l.title}
                      meta={`${l.author} | ${l.license}`}
                      actionLabel="Open"
                      onClick={() => {
                        setActiveTab('library');
                        close();
                      }}
                    />
                  ))}
                </ResultSection>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ResultSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <div className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-[var(--app-text-subtle)]">
      {title}
    </div>
    <div className="space-y-1.5">{children}</div>
  </section>
);

const ResultRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  meta: string;
  actionLabel: string;
  onClick: () => void;
}> = ({ icon, title, meta, actionLabel, onClick }) => (
  <button onClick={onClick} className="command-row">
    <span className="flex min-w-0 items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-black">{title}</span>
        <span className="block truncate text-[11px] font-medium text-[var(--app-text-muted)]">{meta}</span>
      </span>
    </span>
    <span className="flex shrink-0 items-center gap-1 text-xs font-black text-teal-700 dark:text-teal-300">
      {actionLabel}
      <ArrowRight size={13} />
    </span>
  </button>
);

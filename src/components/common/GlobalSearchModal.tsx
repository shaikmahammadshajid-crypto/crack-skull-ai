import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X, FileText, HelpCircle, Layers, BookOpen, Bot, Sparkles, ArrowRight } from 'lucide-react';

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
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
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
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [globalSearchOpen]);

  if (!globalSearchOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const matchedDocs = documents.filter(
    d => d.title.toLowerCase().includes(cleanQuery) || d.subjectName.toLowerCase().includes(cleanQuery) || d.tags.some(t => t.toLowerCase().includes(cleanQuery))
  );

  const matchedQuizzes = quizzes.filter(
    q => q.title.toLowerCase().includes(cleanQuery) || q.topic.toLowerCase().includes(cleanQuery) || q.subjectName.toLowerCase().includes(cleanQuery)
  );

  const matchedFlashcards = flashcards.filter(
    f => f.front.toLowerCase().includes(cleanQuery) || f.back.toLowerCase().includes(cleanQuery) || f.topic.toLowerCase().includes(cleanQuery)
  );

  const matchedKnowledge = knowledgeNodes.filter(
    k => k.topic.toLowerCase().includes(cleanQuery) || k.subject.toLowerCase().includes(cleanQuery)
  );

  const matchedLibrary = libraryResources.filter(
    l => l.title.toLowerCase().includes(cleanQuery) || l.author.toLowerCase().includes(cleanQuery) || l.tags.some(t => t.toLowerCase().includes(cleanQuery))
  );

  const hasResults =
    matchedDocs.length > 0 ||
    matchedQuizzes.length > 0 ||
    matchedFlashcards.length > 0 ||
    matchedKnowledge.length > 0 ||
    matchedLibrary.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#161922] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh] transition-colors duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1A1D27]/50">
          <Search size={18} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a concept, question, formula, or exam topic..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white">
              <X size={16} />
            </button>
          )}
          <kbd className="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center mx-auto">
                <Sparkles size={20} />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Universal Academic Search</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Instantly search across your uploaded PDFs, previous question papers, flashcards, quizzes, and digital textbooks.
              </p>
            </div>
          ) : !hasResults ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No results found for "{query}". Try searching for "SQL", "ACID", "Normalization", or "Deadlocks".
            </div>
          ) : (
            <>
              {/* Knowledge Nodes */}
              {matchedKnowledge.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-2">
                    Knowledge Map Topics
                  </div>
                  <div className="space-y-1">
                    {matchedKnowledge.map(k => (
                      <div
                        key={k.id}
                        onClick={() => {
                          openExplainModal(k.topic, k.subject);
                          setGlobalSearchOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">{k.topic}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono">
                            {k.subject} • {k.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                          <span>AI Explain</span>
                          <ArrowRight size={13} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents & PDFs */}
              {matchedDocs.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-2">
                    Documents & PDFs ({matchedDocs.length})
                  </div>
                  <div className="space-y-1">
                    {matchedDocs.map(d => (
                      <div
                        key={d.id}
                        onClick={() => {
                          openDocumentReader(d);
                          setActiveTab('document-ai');
                          setGlobalSearchOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText size={16} className="text-gray-500 dark:text-gray-400" />
                          <div>
                            <div className="text-xs font-semibold text-gray-900 dark:text-white">{d.title}</div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {d.subjectName} • {d.pageCount} Pages • {d.fileSize}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Open Reader →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quizzes */}
              {matchedQuizzes.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-2">
                    Quizzes & Practice Tests ({matchedQuizzes.length})
                  </div>
                  <div className="space-y-1">
                    {matchedQuizzes.map(q => (
                      <div
                        key={q.id}
                        onClick={() => {
                          startQuiz(q);
                          setGlobalSearchOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <HelpCircle size={16} className="text-gray-500 dark:text-gray-400" />
                          <div>
                            <div className="text-xs font-semibold text-gray-900 dark:text-white">{q.title}</div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {q.subjectName} • {q.questions.length} Questions • {q.durationMinutes}m
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Start Quiz →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flashcards */}
              {matchedFlashcards.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-2">
                    Flashcards ({matchedFlashcards.length})
                  </div>
                  <div className="space-y-1">
                    {matchedFlashcards.map(f => (
                      <div
                        key={f.id}
                        onClick={() => {
                          setActiveTab('flashcards');
                          setGlobalSearchOpen(false);
                        }}
                        className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer transition-colors"
                      >
                        <div className="text-xs font-medium text-gray-900 dark:text-white mb-0.5">{f.front}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">{f.back}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Library */}
              {matchedLibrary.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-2">
                    Open Digital Library ({matchedLibrary.length})
                  </div>
                  <div className="space-y-1">
                    {matchedLibrary.map(l => (
                      <div
                        key={l.id}
                        onClick={() => {
                          setActiveTab('library');
                          setGlobalSearchOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <BookOpen size={16} className="text-gray-500 dark:text-gray-400" />
                          <div>
                            <div className="text-xs font-semibold text-gray-900 dark:text-white">{l.title}</div>
                            <div className="text-[10px] text-gray-400">{l.author} • {l.license}</div>
                          </div>
                        </div>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">View Resource →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

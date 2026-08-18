import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  Search,
  Bookmark,
  ExternalLink,
  Sparkles,
  Globe2,
  Loader2,
} from 'lucide-react';

interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  subject?: string[];
  edition_count?: number;
  cover_i?: number;
}

export const DigitalLibraryView: React.FC = () => {
  const { libraryResources, toggleBookmarkResource, openExplainModal, triggerConfetti } = useApp();

  const [activeCategory, setActiveCategory] = useState<'all' | 'textbook' | 'cheat_sheet' | 'notes' | 'pyq_archive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineBooks, setOnlineBooks] = useState<OpenLibraryBook[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineError, setOnlineError] = useState('');

  const filteredResources = libraryResources.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeCategory === 'all') return matchesSearch;
    if (activeCategory === 'textbook') return matchesSearch && /textbook|handbook|guide|reference/i.test(`${r.fileFormat} ${r.title} ${r.license}`);
    if (activeCategory === 'cheat_sheet') return matchesSearch && /formula|cheat|quick|summary|workbook|practice/i.test(`${r.fileFormat} ${r.title} ${r.tags.join(' ')}`);
    if (activeCategory === 'notes') return matchesSearch && /notes|course|lecture|tutorial|handbook/i.test(`${r.fileFormat} ${r.title} ${r.tags.join(' ')}`);
    if (activeCategory === 'pyq_archive') return matchesSearch && /pyq|previous|past paper|exam|question/i.test(`${r.fileFormat} ${r.title} ${r.description} ${r.tags.join(' ')}`);
    return matchesSearch;
  });

  const departmentCount = useMemo(
    () => new Set(libraryResources.map(resource => resource.subject)).size,
    [libraryResources]
  );

  const topicSuggestions = useMemo(
    () => ['DBMS normalization', 'operating system paging', 'data structures algorithms', 'machine learning', 'computer networks', 'software engineering'],
    []
  );

  const searchOpenLibrary = async (query = searchQuery) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setIsSearchingOnline(true);
    setOnlineError('');

    try {
      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(cleanQuery)}&limit=18&fields=key,title,author_name,first_publish_year,subject,edition_count,cover_i`);
      if (!response.ok) throw new Error(`Open Library returned ${response.status}`);
      const data = await response.json();
      setOnlineBooks(data.docs || []);
      triggerConfetti();
    } catch (error) {
      console.error(error);
      setOnlineError('Could not reach Open Library right now. Try again in a moment.');
    } finally {
      setIsSearchingOnline(false);
    }
  };

  return (
    <div className="view-stack space-y-5">
      {/* Header Banner */}
      <div className="view-hero flex flex-col items-start justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
              <BookOpen size={22} />
            </div>
            <h1 className="view-title text-2xl">
              Open Academic Digital Library
            </h1>
          </div>
          <p className="view-copy text-xs sm:text-sm">
            Search {libraryResources.length} in-app academic resources across {departmentCount} subjects plus Open Library's global book catalog for textbooks, topics, authors, and doubt-solving references.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="segmented-control overflow-x-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`segmented-option ${
              activeCategory === 'all' ? 'segmented-option-active' : ''
            }`}
          >
            In-App Library ({libraryResources.length})
          </button>
          <button
            onClick={() => setActiveCategory('textbook')}
            className={`segmented-option ${
              activeCategory === 'textbook' ? 'segmented-option-active' : ''
            }`}
          >
            Textbooks
          </button>
          <button
            onClick={() => setActiveCategory('cheat_sheet')}
            className={`segmented-option ${
              activeCategory === 'cheat_sheet' ? 'segmented-option-active' : ''
            }`}
          >
            Formula Cheat Sheets
          </button>
          <button
            onClick={() => setActiveCategory('pyq_archive')}
            className={`segmented-option ${
              activeCategory === 'pyq_archive' ? 'segmented-option-active' : ''
            }`}
          >
            PYQ Archives
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-[var(--app-text-subtle)]" />
          <input
            type="text"
            placeholder="Search local + online books, topics..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') searchOpenLibrary();
            }}
            className="form-control pl-8 pr-3 py-1.5 text-xs"
          />
        </div>
      </div>

      <div className="surface-card space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-[var(--app-text)]">
              <Globe2 size={17} className="text-teal-500" />
              Global Open Library Search
            </div>
            <p className="mt-1 text-xs text-[var(--app-text-muted)]">
              Search millions of public book records and use AI to convert book topics into study explanations.
            </p>
          </div>
          <button
            onClick={() => searchOpenLibrary()}
            disabled={isSearchingOnline || !searchQuery.trim()}
            className="primary-action bg-teal-600 px-4 py-2 text-xs text-white hover:bg-teal-500 disabled:opacity-50 dark:bg-teal-500 dark:text-white"
          >
            {isSearchingOnline ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            <span>Search Online</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {topicSuggestions.map(topic => (
            <button
              key={topic}
              onClick={() => {
                setSearchQuery(topic);
                searchOpenLibrary(topic);
              }}
              className="secondary-action rounded-full px-2.5 py-1 text-[11px] hover:border-teal-400"
            >
              {topic}
            </button>
          ))}
        </div>
        {onlineError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs font-semibold text-rose-300">
            {onlineError}
          </div>
        )}
      </div>

      {onlineBooks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[var(--app-text)]">Online Book Results ({onlineBooks.length})</h3>
            <button
              onClick={() => setOnlineBooks([])}
              className="text-xs font-semibold text-[var(--app-text-muted)] hover:text-[var(--app-text)]"
            >
              Clear results
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {onlineBooks.map(book => {
              const subjects = (book.subject || []).slice(0, 4);
              const openUrl = `https://openlibrary.org${book.key}`;
              return (
                <div key={book.key} className="surface-card space-y-4 p-5 transition-colors hover:border-teal-500/50">
                  <div className="flex items-start gap-3">
                    {book.cover_i ? (
                      <img
                        src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                        alt=""
                        className="w-14 h-20 rounded-xl object-cover bg-gray-100 dark:bg-slate-800"
                      />
                    ) : (
                      <div className="w-14 h-20 rounded-xl bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center text-teal-700 dark:text-teal-300">
                        <BookOpen size={22} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="line-clamp-2 text-sm font-black text-[var(--app-text)]">{book.title}</h4>
                      <p className="mt-1 text-[11px] text-[var(--app-text-muted)]">
                        {(book.author_name || ['Unknown author']).slice(0, 2).join(', ')}
                        {book.first_publish_year ? ` • ${book.first_publish_year}` : ''}
                      </p>
                      <p className="mt-1 text-[10px] font-mono text-gray-400">{book.edition_count || 1} editions</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.length ? subjects.map(subject => (
                      <span key={subject} className="status-pill">
                        {subject}
                      </span>
                    )) : (
                      <span className="status-pill">
                        General reference
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--app-border)] pt-2">
                    <a
                      href={openUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1"
                    >
                      Open Library <ExternalLink size={12} />
                    </a>
                    <button
                      onClick={() => openExplainModal(`Book: ${book.title}\nAuthor: ${(book.author_name || ['Unknown']).join(', ')}\nSubjects: ${subjects.join(', ') || 'General'}\nExplain how this book can help solve doubts for ${searchQuery || 'this topic'}.`, searchQuery || 'Digital Library')}
                      className="secondary-action px-3 py-1.5 text-xs"
                    >
                      Ask AI
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resource Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map(res => (
          <div
            key={res.id}
            className="surface-card flex flex-col justify-between space-y-4 p-5 transition-colors hover:border-teal-500/40"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <span className="status-pill font-mono">
                  {res.category.replace('_', ' ').toUpperCase()}
                </span>
                <button
                  onClick={() => toggleBookmarkResource(res.id)}
                  className={`rounded-md p-1.5 hover:bg-[var(--app-surface-muted)] ${
                    res.isBookmarked ? 'text-amber-500' : 'text-[var(--app-text-subtle)] hover:text-[var(--app-text)]'
                  }`}
                >
                  <Bookmark size={15} className={res.isBookmarked ? 'fill-amber-400' : ''} />
                </button>
              </div>

              <h4 className="font-heading text-sm font-black text-[var(--app-text)]">
                {res.title}
              </h4>
              <div className="font-mono text-[11px] text-[var(--app-text-muted)]">
                {res.author} • {res.license}
              </div>
              <p className="view-copy line-clamp-2 text-xs">
                {res.description}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--app-border)] pt-2">
              <div className="flex items-center gap-1">
                {res.tags.slice(0, 2).map((t, i) => (
                  <span key={i} className="status-pill px-1.5 py-0.5 font-mono text-[10px]">
                    #{t}
                  </span>
                ))}
              </div>

              <button
                onClick={() => openExplainModal(`${res.title}\n${res.description}\nTags: ${res.tags.join(', ')}`, res.subject)}
                className="secondary-action px-3 py-1.5 text-xs"
              >
                <span>Read & AI Query</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

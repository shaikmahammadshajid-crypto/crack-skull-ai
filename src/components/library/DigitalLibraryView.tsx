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
    return matchesSearch && r.category === activeCategory;
  });

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
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-950/40 via-purple-950/40 to-slate-900/60 border border-teal-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <BookOpen size={22} />
            </div>
            <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">
              Open Academic Digital Library
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-300">
            Search local academic resources plus Open Library's global book catalog for textbooks, topics, authors, and doubt-solving references.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              activeCategory === 'all' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
            }`}
          >
            All Resources ({libraryResources.length})
          </button>
          <button
            onClick={() => setActiveCategory('textbook')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              activeCategory === 'textbook' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Open Textbooks
          </button>
          <button
            onClick={() => setActiveCategory('cheat_sheet')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              activeCategory === 'cheat_sheet' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Formula Cheat Sheets
          </button>
          <button
            onClick={() => setActiveCategory('pyq_archive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              activeCategory === 'pyq_archive' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
            }`}
          >
            PYQ Archives
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search local + online books, topics..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') searchOpenLibrary();
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-gray-950 dark:text-white">
              <Globe2 size={17} className="text-teal-500" />
              Global Open Library Search
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Search millions of public book records and use AI to convert book topics into study explanations.
            </p>
          </div>
          <button
            onClick={() => searchOpenLibrary()}
            disabled={isSearchingOnline || !searchQuery.trim()}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-black hover:bg-teal-500 disabled:opacity-50 flex items-center justify-center gap-2"
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
              className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[11px] font-semibold text-gray-700 dark:text-slate-300 hover:border-teal-400"
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
            <h3 className="text-sm font-black text-gray-950 dark:text-white">Online Book Results ({onlineBooks.length})</h3>
            <button
              onClick={() => setOnlineBooks([])}
              className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            >
              Clear results
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {onlineBooks.map(book => {
              const subjects = (book.subject || []).slice(0, 4);
              const openUrl = `https://openlibrary.org${book.key}`;
              return (
                <div key={book.key} className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800 hover:border-teal-500/50 transition-all space-y-4">
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
                      <h4 className="text-sm font-black text-gray-950 dark:text-white line-clamp-2">{book.title}</h4>
                      <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                        {(book.author_name || ['Unknown author']).slice(0, 2).join(', ')}
                        {book.first_publish_year ? ` • ${book.first_publish_year}` : ''}
                      </p>
                      <p className="mt-1 text-[10px] font-mono text-gray-400">{book.edition_count || 1} editions</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.length ? subjects.map(subject => (
                      <span key={subject} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-950 text-[10px] text-gray-600 dark:text-slate-400">
                        {subject}
                      </span>
                    )) : (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-950 text-[10px] text-gray-600 dark:text-slate-400">
                        General reference
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
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
                      className="px-3 py-1.5 rounded-xl bg-teal-600/15 text-teal-700 dark:text-teal-300 hover:bg-teal-600 hover:text-white text-xs font-black"
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
            className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/40">
                  {res.category.replace('_', ' ').toUpperCase()}
                </span>
                <button
                  onClick={() => toggleBookmarkResource(res.id)}
                  className={`p-1.5 rounded-lg hover:bg-slate-800 ${
                    res.isBookmarked ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Bookmark size={15} className={res.isBookmarked ? 'fill-amber-400' : ''} />
                </button>
              </div>

              <h4 className="text-sm font-bold text-white font-heading">
                {res.title}
              </h4>
              <div className="text-[11px] text-slate-400 font-mono">
                {res.author} • {res.license}
              </div>
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {res.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {res.tags.slice(0, 2).map((t, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 font-mono">
                    #{t}
                  </span>
                ))}
              </div>

              <button
                onClick={() => openExplainModal(`${res.title}\n${res.description}\nTags: ${res.tags.join(', ')}`, res.subject)}
                className="px-3 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors"
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

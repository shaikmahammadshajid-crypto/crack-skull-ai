import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LibraryResource } from '../../types';
import {
  BookOpen,
  Search,
  Bookmark,
  ExternalLink,
  Sparkles,
  Download,
  FileText,
  HelpCircle,
} from 'lucide-react';

export const DigitalLibraryView: React.FC = () => {
  const { libraryResources, toggleBookmarkResource, openExplainModal, triggerConfetti } = useApp();

  const [activeCategory, setActiveCategory] = useState<'all' | 'textbook' | 'cheat_sheet' | 'notes' | 'pyq_archive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = libraryResources.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeCategory === 'all') return matchesSearch;
    return matchesSearch && r.category === activeCategory;
  });

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
          <p className="text-xs sm:text-sm text-slate-300">
            Open-source university textbooks, formula cheat sheets, and verified solved past papers curated for your semester.
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
            placeholder="Search books, authors, topics..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

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
                onClick={() => openExplainModal(res.title, res.subjectName)}
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

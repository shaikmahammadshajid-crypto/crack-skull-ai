import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import { extractConceptTags, extractTextFromFile, formatFileSize } from '../../services/pdfService';
import { DocumentItem } from '../../types';
import {
  FileText,
  Upload,
  Sparkles,
  Search,
  BookOpen,
  HelpCircle,
  Layers,
  Trash2,
  Bookmark,
  ExternalLink,
  ChevronRight,
  Maximize2,
  X,
  FileCode,
  FileCheck,
} from 'lucide-react';

export const DocumentStudioView: React.FC = () => {
  const {
    documents,
    addDocument,
    deleteDocument,
    toggleBookmarkDocument,
    selectedDocForReader,
    openDocumentReader,
    closeDocumentReader,
    openExplainModal,
    addFlashcard,
    startQuiz,
    activeSubject,
    triggerConfetti,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'books' | 'notes' | 'pyq'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedTitle, setUploadedTitle] = useState('');
  const [uploadedSubject, setUploadedSubject] = useState(activeSubject?.name || 'Database Management Systems');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [aiSidebarReply, setAiSidebarReply] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'books') return matchesSearch && d.type === 'textbook';
    if (activeTab === 'notes') return matchesSearch && d.type === 'notes';
    if (activeTab === 'pyq') return matchesSearch && d.type === 'pyq';
    return matchesSearch;
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Choose a PDF, TXT, or Markdown file first.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const extracted = await extractTextFromFile(selectedFile);
      const title = uploadedTitle.trim() || selectedFile.name;
      const rawText = extracted.text || `No selectable text was found in ${selectedFile.name}. This may be a scanned/image-only PDF.`;
      const keyConcepts = extractConceptTags(rawText, uploadedSubject);
      const analysis = rawText.length > 40
        ? await aiService.analyzeDocument({
          title,
          subject: uploadedSubject,
          textSnippet: rawText.slice(0, 6000),
        })
        : null;

      const newDoc: DocumentItem = {
        id: `doc_${Date.now()}`,
        title,
        subjectId: activeSubject?.id || 'sub_gen',
        subjectName: uploadedSubject,
        type: selectedFile.name.toLowerCase().includes('question') || selectedFile.name.toLowerCase().includes('pyq') ? 'pyq' : 'pdf',
        fileSize: formatFileSize(selectedFile.size),
        pageCount: extracted.pageCount,
        uploadDate: 'Just now',
        uploadedAt: 'Just now',
        summary: analysis?.summary || `Indexed ${title}. The document is ready for explanation, doubt solving, flashcards, and quiz generation from its extracted text.`,
        tags: keyConcepts,
        isBookmarked: false,
        isAnalyzed: true,
        extractedTextPreview: rawText.slice(0, 900),
        rawContent: rawText,
        keyConcepts,
        coreConcepts: analysis?.coreConcepts,
        keyFormulas: analysis?.keyFormulasDefinitions,
        predictedExamQuestions: analysis?.predictedExamQuestions,
      };

      addDocument(newDoc);
      setUploadedTitle('');
      setSelectedFile(null);
      triggerConfetti();
    } catch (error: any) {
      console.error(error);
      setUploadError(error.message || 'Unable to read this file. Try another PDF or a text-based document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection()?.toString().trim();
    if (selection && selection.length > 3) {
      setSelectedText(selection);
    }
  };

  const handleAiAction = async (action: 'explain' | 'quiz' | 'flashcard') => {
    const textToAnalyze = selectedText || selectedDocForReader?.rawContent?.slice(0, 2000) || selectedDocForReader?.extractedTextPreview || '';
    if (!textToAnalyze) return;

    setIsAiProcessing(true);
    setAiSidebarReply('');

    try {
      if (action === 'explain') {
        const res = await aiService.sendMessage({
          message: `Explain this passage in simple terms with exam tips:\n\n"${textToAnalyze}"`,
          mode: 'document',
          subject: selectedDocForReader?.subjectName,
        });
        setAiSidebarReply(res.reply);
      } else if (action === 'flashcard') {
        addFlashcard({
          id: `fc_doc_${Date.now()}`,
          deckId: 'deck_doc',
          subjectId: selectedDocForReader?.subjectId || 'sub_gen',
          subjectName: selectedDocForReader?.subjectName || 'General',
          topic: selectedDocForReader?.title.slice(0, 30) || 'PDF Concept',
          front: `What is the core takeaway of: ${textToAnalyze.slice(0, 80)}?`,
          back: textToAnalyze.slice(0, 250),
          difficulty: 'medium',
          reviewCount: 0,
          isMastered: false,
        });
        setAiSidebarReply('✅ Generated flashcard saved directly to your Spaced Flashcards deck!');
        triggerConfetti();
      } else if (action === 'quiz') {
        const questions = await aiService.generateQuiz({
          subject: selectedDocForReader?.subjectName || 'General',
          topic: selectedDocForReader?.title || 'PDF Unit',
          difficulty: 'medium',
          count: 3,
        });
        if (questions && questions.length > 0) {
          startQuiz({
            id: `doc_quiz_${Date.now()}`,
            title: `Quiz on ${selectedDocForReader?.title.slice(0, 30)}`,
            subjectId: selectedDocForReader?.subjectId || 'sub_gen',
            subjectName: selectedDocForReader?.subjectName || 'General',
            topic: selectedDocForReader?.title || 'PDF Unit',
            difficulty: 'medium',
            durationMinutes: 5,
            questions,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.error(e);
      setAiSidebarReply('Error analyzing document text. Please try again.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // 1. If a document is currently selected for the interactive reader:
  if (selectedDocForReader) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-7xl mx-auto rounded-3xl bg-[#0E1322] border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in">
        {/* Reader Top Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-heading truncate max-w-md">
                {selectedDocForReader.title}
              </h3>
              <div className="text-[11px] text-slate-400 font-mono">
                {selectedDocForReader.subjectName} • {selectedDocForReader.pageCount} Pages • {selectedDocForReader.fileSize}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAiAction('quiz')}
              className="px-3 py-1.5 rounded-xl bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white border border-pink-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <HelpCircle size={14} />
              <span>Generate Quiz</span>
            </button>
            <button
              onClick={closeDocumentReader}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Dual-Pane View: Document Content on Left, AI Copilot on Right */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Pane: Document Text Content */}
          <div
            className="lg:col-span-7 p-6 overflow-y-auto bg-[#0A0D18] border-r border-slate-800 select-text leading-relaxed text-sm text-slate-200 space-y-4"
            onMouseUp={handleTextSelection}
          >
            <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} />
                <span>Tip: Highlight any sentence to explain, generate flashcards, or create instant quiz questions!</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 font-mono text-xs whitespace-pre-wrap leading-relaxed">
              {selectedDocForReader.rawContent || `CHAPTER 1: ${selectedDocForReader.title}

1.1 Fundamental Theory & Mathematical Model
Every transactional system must adhere to the ACID properties:
1. Atomicity: All or nothing execution guarantee.
2. Consistency: State transitions preserve all relational integrity constraints.
3. Isolation: Concurrent execution produces the same outcome as a serial schedule.
4. Durability: Committed updates survive system crashes via Write-Ahead Logging (WAL).

1.2 Two-Phase Locking (2PL) Protocol
The Strict 2PL protocol guarantees conflict serializability and avoids cascading aborts by holding all exclusive locks until end-of-transaction (commit/abort).

1.3 Normalization
A relation schema R is in BCNF with respect to functional dependency set F if, for all dependencies X -> Y in F+, either:
- X -> Y is a trivial functional dependency, or
- X is a superkey for R.`}
            </div>
          </div>

          {/* Right Pane: AI PDF Copilot */}
          <div className="lg:col-span-5 p-5 overflow-y-auto bg-slate-950/60 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-heading">
                  <Sparkles size={16} />
                  <span>Document AI Copilot</span>
                </div>
                {selectedText && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Snippet Selected ({selectedText.length} chars)
                  </span>
                )}
              </div>

              {selectedText ? (
                <div className="p-3 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Selected Passage:
                  </div>
                  <p className="text-xs text-purple-200 line-clamp-3 italic">
                    "{selectedText}"
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleAiAction('explain')}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Sparkles size={12} />
                      <span>Explain</span>
                    </button>
                    <button
                      onClick={() => handleAiAction('flashcard')}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Layers size={12} />
                      <span>Make Flashcard</span>
                    </button>
                    <button
                      onClick={() => openExplainModal(selectedText, selectedDocForReader.subjectName, selectedDocForReader.title)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold"
                    >
                      Explain Anywhere →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2 text-center">
                  <BookOpen size={24} className="mx-auto text-purple-400" />
                  <p>Highlight any line from the left document, or use the quick actions below to study this document.</p>
                </div>
              )}

              {/* AI Response Output */}
              {isAiProcessing ? (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-purple-400 flex items-center gap-2 animate-pulse">
                  <Sparkles size={16} />
                  <span>AI Analyzing document context and generating breakdown...</span>
                </div>
              ) : aiSidebarReply ? (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {aiSidebarReply}
                </div>
              ) : null}
            </div>

            {/* Quick Document Summary Chips */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Key Topics Indexed in this PDF:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedDocForReader.keyConcepts || selectedDocForReader.tags || []).map((kc, i) => (
                  <span
                    key={i}
                    onClick={() => openExplainModal(kc, selectedDocForReader.subjectName, selectedDocForReader.title)}
                    className="cursor-pointer px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/20 text-purple-300 text-[11px] hover:border-purple-500 hover:bg-purple-900/40 transition-colors"
                  >
                    {kc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Default View: Document List & Upload Form
  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-purple-950/40 to-slate-900/60 border border-cyan-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <FileText size={22} />
            </div>
            <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">
              PDF & Notes Learning Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Upload course PDFs, lecture slides, and past papers. Crack Skull AI automatically indexes chapters, creates concept summaries, and generates practice questions.
          </p>
        </div>
      </div>

      {/* Upload Box */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
          <Upload size={16} className="text-cyan-400" />
          <span>Upload New Academic Document / Past Paper</span>
        </h3>

        <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <label className="flex items-center justify-center w-full h-full min-h-[42px] cursor-pointer rounded-xl border border-dashed border-cyan-700/60 bg-slate-950 px-3 py-2 text-xs text-cyan-200 hover:border-cyan-400">
              <input
                type="file"
                accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0] || null;
                  setSelectedFile(file);
                  if (file && !uploadedTitle.trim()) setUploadedTitle(file.name);
                }}
              />
              <span className="truncate">{selectedFile ? selectedFile.name : 'Choose PDF / TXT / MD'}</span>
            </label>
          </div>

          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="Document Title (e.g. Unit 3 - Transactions & Locking Notes.pdf)"
              value={uploadedTitle}
              onChange={e => setUploadedTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Subject (e.g. Database Management Systems)"
              value={uploadedSubject}
              onChange={e => setUploadedSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
            >
              <Upload size={14} />
              <span>{isUploading ? 'Indexing...' : 'Upload PDF'}</span>
            </button>
          </div>
          {uploadError && (
            <div className="sm:col-span-12 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs font-semibold text-rose-200">
              {uploadError}
            </div>
          )}
        </form>
      </div>

      {/* Documents Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab Filter */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-hidden">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                activeTab === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              All Documents ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                activeTab === 'notes' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Lecture Notes
            </button>
            <button
              onClick={() => setActiveTab('books')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                activeTab === 'books' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Reference Books
            </button>
            <button
              onClick={() => setActiveTab('pyq')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                activeTab === 'pyq' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Past Papers
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search uploaded files..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Document Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
                    <FileText size={20} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleBookmarkDocument(doc.id)}
                      className={`p-1.5 rounded-lg hover:bg-slate-800 ${
                        doc.isBookmarked ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Bookmark size={15} className={doc.isBookmarked ? 'fill-amber-400' : ''} />
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white font-heading line-clamp-1">
                  {doc.title}
                </h4>
                <div className="text-[11px] text-slate-400 font-mono">
                  {doc.subjectName} • {doc.pageCount} Pages • {doc.fileSize}
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {doc.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {doc.uploadedAt}
                </span>
                <button
                  onClick={() => openDocumentReader(doc)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Open Studio</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import { extractConceptTags, extractTextFromFile, formatFileSize } from '../../services/pdfService';
import { DocumentItem } from '../../types';
import { MarkdownAnswer } from '../common/MarkdownAnswer';
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
      <div className="surface-card mx-auto flex h-[calc(100vh-7rem)] max-w-7xl flex-col overflow-hidden animate-in fade-in">
        {/* Reader Top Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-[var(--app-border)] bg-[var(--app-surface)] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="max-w-md truncate font-heading text-sm font-black text-[var(--app-text)]">
                {selectedDocForReader.title}
              </h3>
              <div className="font-mono text-[11px] text-[var(--app-text-muted)]">
                {selectedDocForReader.subjectName} • {selectedDocForReader.pageCount} Pages • {selectedDocForReader.fileSize}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAiAction('quiz')}
              className="secondary-action px-3 py-1.5 text-xs"
            >
              <HelpCircle size={14} />
              <span>Generate Quiz</span>
            </button>
            <button
              onClick={closeDocumentReader}
              className="icon-button icon-button-sm"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Dual-Pane View: Document Content on Left, AI Copilot on Right */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Pane: Document Text Content */}
          <div
            className="space-y-4 overflow-y-auto border-r border-[var(--app-border)] bg-[var(--app-surface-muted)] p-5 text-sm leading-relaxed text-[var(--app-text)] select-text lg:col-span-7"
            onMouseUp={handleTextSelection}
          >
            <div className="surface-card flex items-center justify-between border-cyan-200 bg-cyan-50 p-3 text-xs text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200">
              <div className="flex items-center gap-2">
                <Sparkles size={14} />
                <span>Highlight text to explain, turn it into a flashcard, or generate quiz questions.</span>
              </div>
            </div>

            <div className="surface-card p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap">
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
          <div className="flex flex-col justify-between space-y-4 overflow-y-auto bg-[var(--app-surface)] p-5 lg:col-span-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-2">
                <div className="flex items-center gap-2 font-heading text-xs font-black text-teal-700 dark:text-teal-300">
                  <Sparkles size={16} />
                  <span>Document AI Copilot</span>
                </div>
                {selectedText && (
                  <span className="font-mono text-[10px] text-[var(--app-text-subtle)]">
                    Snippet Selected ({selectedText.length} chars)
                  </span>
                )}
              </div>

              {selectedText ? (
                <div className="surface-muted space-y-2 p-3">
                  <div className="text-[10px] font-black uppercase text-[var(--app-text-subtle)]">
                    Selected Passage:
                  </div>
                  <p className="line-clamp-3 text-xs italic text-[var(--app-text-muted)]">
                    "{selectedText}"
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleAiAction('explain')}
                      className="primary-action px-2.5 py-1 text-[11px]"
                    >
                      <Sparkles size={12} />
                      <span>Explain</span>
                    </button>
                    <button
                      onClick={() => handleAiAction('flashcard')}
                      className="primary-action bg-amber-600 px-2.5 py-1 text-[11px] text-white hover:bg-amber-500 dark:bg-amber-500 dark:text-white"
                    >
                      <Layers size={12} />
                      <span>Make Flashcard</span>
                    </button>
                    <button
                      onClick={() => openExplainModal(selectedText, selectedDocForReader.subjectName, selectedDocForReader.title)}
                      className="secondary-action px-2.5 py-1 text-[11px]"
                    >
                      Explain Anywhere →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="surface-muted space-y-2 p-4 text-center text-xs text-[var(--app-text-muted)]">
                  <BookOpen size={24} className="mx-auto text-teal-700 dark:text-teal-300" />
                  <p>Highlight any line from the left document, or use the quick actions below to study this document.</p>
                </div>
              )}

              {/* AI Response Output */}
              {isAiProcessing ? (
                <div className="surface-muted flex animate-pulse items-center gap-2 p-4 text-xs text-teal-700 dark:text-teal-300">
                  <Sparkles size={16} />
                  <span>AI Analyzing document context and generating breakdown...</span>
                </div>
              ) : aiSidebarReply ? (
                <div className="surface-muted p-4 text-xs leading-relaxed">
                  <MarkdownAnswer content={aiSidebarReply} />
                </div>
              ) : null}
            </div>

            {/* Quick Document Summary Chips */}
            <div className="surface-muted space-y-2 p-4">
              <div className="text-[10px] font-black uppercase text-[var(--app-text-subtle)]">
                Key Topics Indexed in this PDF:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedDocForReader.keyConcepts || selectedDocForReader.tags || []).map((kc, i) => (
                  <span
                    key={i}
                    onClick={() => openExplainModal(kc, selectedDocForReader.subjectName, selectedDocForReader.title)}
                    className="cursor-pointer rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 transition-colors hover:border-teal-400 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300"
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
    <div className="view-stack space-y-5">
      {/* Header Banner */}
      <div className="view-hero flex flex-col items-start justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
              <FileText size={22} />
            </div>
            <h1 className="view-title text-2xl">
              PDF & Notes Learning Studio
            </h1>
          </div>
          <p className="view-copy text-xs sm:text-sm">
            Upload course PDFs, lecture slides, and past papers. Crack Skull AI automatically indexes chapters, creates concept summaries, and generates practice questions.
          </p>
        </div>
      </div>

      {/* Upload Box */}
      <div className="surface-card space-y-4 p-5 sm:p-6">
        <h3 className="flex items-center gap-2 font-heading text-sm font-black text-[var(--app-text)]">
          <Upload size={16} className="text-cyan-700 dark:text-cyan-300" />
          <span>Upload New Academic Document / Past Paper</span>
        </h3>

        <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <label className="form-control flex h-full min-h-[42px] w-full cursor-pointer items-center justify-center border-dashed px-3 py-2 text-xs font-bold text-cyan-700 hover:border-cyan-400 dark:text-cyan-300">
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
              className="form-control w-full px-3.5 py-2.5 text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Subject (e.g. Database Management Systems)"
              value={uploadedSubject}
              onChange={e => setUploadedSubject(e.target.value)}
              className="form-control w-full px-3.5 py-2.5 text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="primary-action w-full py-2.5 text-xs disabled:opacity-50"
            >
              <Upload size={14} />
              <span>{isUploading ? 'Indexing...' : 'Upload PDF'}</span>
            </button>
          </div>
          {uploadError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 sm:col-span-12">
              {uploadError}
            </div>
          )}
        </form>
      </div>

      {/* Documents Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab Filter */}
          <div className="segmented-control overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`segmented-option ${
                activeTab === 'all' ? 'segmented-option-active' : ''
              }`}
            >
              All Documents ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`segmented-option ${
                activeTab === 'notes' ? 'segmented-option-active' : ''
              }`}
            >
              Lecture Notes
            </button>
            <button
              onClick={() => setActiveTab('books')}
              className={`segmented-option ${
                activeTab === 'books' ? 'segmented-option-active' : ''
              }`}
            >
              Reference Books
            </button>
            <button
              onClick={() => setActiveTab('pyq')}
              className={`segmented-option ${
                activeTab === 'pyq' ? 'segmented-option-active' : ''
              }`}
            >
              Past Papers
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[var(--app-text-subtle)]" />
            <input
              type="text"
              placeholder="Search uploaded files..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-control pl-8 pr-3 py-1.5 text-xs"
            />
          </div>
        </div>

        {/* Document Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="surface-card group flex flex-col justify-between space-y-3 p-5 transition-colors hover:border-[var(--app-border-strong)]"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="rounded-lg bg-cyan-50 p-2.5 text-cyan-700 transition-transform group-hover:scale-105 dark:bg-cyan-500/10 dark:text-cyan-300">
                    <FileText size={20} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleBookmarkDocument(doc.id)}
                      className={`rounded-md p-1.5 hover:bg-[var(--app-surface-muted)] ${
                        doc.isBookmarked ? 'text-amber-500' : 'text-[var(--app-text-subtle)] hover:text-[var(--app-text)]'
                      }`}
                    >
                      <Bookmark size={15} className={doc.isBookmarked ? 'fill-amber-400' : ''} />
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="rounded-md p-1.5 text-[var(--app-text-subtle)] hover:bg-[var(--app-surface-muted)] hover:text-rose-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h4 className="font-heading line-clamp-1 text-sm font-black text-[var(--app-text)]">
                  {doc.title}
                </h4>
                <div className="font-mono text-[11px] text-[var(--app-text-muted)]">
                  {doc.subjectName} • {doc.pageCount} Pages • {doc.fileSize}
                </div>
                <p className="view-copy line-clamp-2 text-xs">
                  {doc.summary}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--app-border)] pt-3">
                <span className="font-mono text-[10px] text-[var(--app-text-subtle)]">
                  {doc.uploadedAt}
                </span>
                <button
                  onClick={() => openDocumentReader(doc)}
                  className="secondary-action px-3 py-1.5 text-xs"
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

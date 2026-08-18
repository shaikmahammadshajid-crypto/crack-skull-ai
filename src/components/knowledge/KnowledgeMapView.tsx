import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KnowledgeNode } from '../../types';
import {
  Network,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';

export const KnowledgeMapView: React.FC = () => {
  const {
    knowledgeNodes,
    updateKnowledgeNode,
    subjects,
    activeSubject,
    openExplainModal,
    startQuiz,
    triggerConfetti,
  } = useApp();

  const [selectedSubject, setSelectedSubject] = useState(activeSubject?.name || subjects[0]?.name);
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'weak' | 'moderate' | 'strong'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNodes = knowledgeNodes.filter(node => {
    const matchesSub = node.subject.toLowerCase().includes(selectedSubject.toLowerCase());
    const matchesSearch = node.topic.toLowerCase().includes(searchQuery.toLowerCase()) || node.unit.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'all') return matchesSub && matchesSearch;
    return matchesSub && matchesSearch && node.masteryStatus === filterStatus;
  });

  const getStatusBadge = (status: KnowledgeNode['masteryStatus']) => {
    switch (status) {
      case 'strong':
        return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">Strong (85%+)</span>;
      case 'moderate':
        return <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-black text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">Moderate (60-84%)</span>;
      case 'weak':
        return <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">Weak Area (40-59%)</span>;
      case 'critical':
        return <span className="animate-pulse rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">Critical (&lt;40%)</span>;
    }
  };

  const handleImproveNode = (node: KnowledgeNode) => {
    openExplainModal(node.topic, node.subject);
  };

  const handleQuizNode = (node: KnowledgeNode) => {
    startQuiz({
      id: `km_quiz_${Date.now()}`,
      title: `Reinforce Mastery: ${node.topic}`,
      subjectId: 'sub_active',
      subjectName: node.subject,
      topic: node.topic,
      difficulty: 'medium',
      durationMinutes: 5,
      questions: [
        {
          id: 'qkm1',
          type: 'mcq',
          question: `Which of the following best characterizes ${node.topic}?`,
          options: [
            'Strict Serializability Guarantee',
            'Relational Functional Closure',
            'Canonical Decomposition Rule',
            'None of the above',
          ],
          correctIndex: 0,
          explanation: `Mastery explanation for ${node.topic}. Verified against course syllabus.`,
          topic: node.topic,
          difficulty: 'medium',
          marks: 2,
        },
      ],
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="view-stack space-y-5">
      {/* Header Banner */}
      <div className="view-hero flex flex-col items-start justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
              <Network size={22} />
            </div>
            <h1 className="view-title text-2xl">
              Syllabus Knowledge Map
            </h1>
          </div>
          <p className="view-copy text-xs sm:text-sm">
            Visual concept hierarchy showing your retention, mastery bottlenecks, and syllabus coverage across all course units.
          </p>
        </div>
      </div>

      {/* Filter and Subject Bar */}
      <div className="surface-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="segmented-control overflow-x-auto">
          {subjects.map(sub => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.name)}
              className={`segmented-option whitespace-nowrap ${
                selectedSubject === sub.name
                  ? 'segmented-option-active'
                  : ''
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[var(--app-text-subtle)]" />
            <input
              type="text"
              placeholder="Search topics or units"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-control w-full min-w-[12rem] py-1.5 pl-8 pr-3 text-xs"
            />
          </div>
          <button
            onClick={() => setFilterStatus('all')}
            className={`segmented-option ${
              filterStatus === 'all' ? 'segmented-option-active' : ''
            }`}
          >
            All Nodes
          </button>
          <button
            onClick={() => setFilterStatus('critical')}
            className={`segmented-option ${
              filterStatus === 'critical' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : ''
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilterStatus('strong')}
            className={`segmented-option ${
              filterStatus === 'strong' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : ''
            }`}
          >
            Strong
          </button>
        </div>
      </div>

      {/* Nodes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNodes.map(node => (
          <div
            key={node.id}
            className="surface-card flex flex-col justify-between space-y-4 p-5 transition-colors hover:border-[var(--app-border-strong)]"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="status-pill font-mono">
                  {node.unit}
                </span>
                {getStatusBadge(node.masteryStatus)}
              </div>

              <h4 className="font-heading text-sm font-black text-[var(--app-text)]">
                {node.topic}
              </h4>

              {/* Mastery Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[var(--app-text-muted)]">Mastery Level:</span>
                  <span className="font-black text-[var(--app-text)]">{node.masteryPercentage}%</span>
                </div>
                <div className="progress-track h-2 w-full">
                  <div
                    className={`h-full rounded-full transition-all ${
                      node.masteryPercentage >= 80
                        ? 'bg-emerald-500'
                        : node.masteryPercentage >= 60
                        ? 'bg-cyan-500'
                        : node.masteryPercentage >= 40
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${node.masteryPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick AI Reinforce Actions */}
            <div className="flex items-center justify-between gap-2 border-t border-[var(--app-border)] pt-2">
              <button
                onClick={() => handleImproveNode(node)}
                className="secondary-action flex-1 py-1.5 text-xs"
              >
                <Sparkles size={12} />
                <span>Explain Topic</span>
              </button>

              <button
                onClick={() => handleQuizNode(node)}
                className="primary-action px-3 py-1.5 text-xs"
              >
                <HelpCircle size={12} />
                <span>Quiz</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

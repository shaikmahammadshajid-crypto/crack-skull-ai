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
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Strong (85%+)</span>;
      case 'moderate':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Moderate (60-84%)</span>;
      case 'weak':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Weak Area (40-59%)</span>;
      case 'critical':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">Critical (&lt;40%)</span>;
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
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/50 via-cyan-950/40 to-slate-900/60 border border-purple-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Network size={22} />
            </div>
            <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">
              Syllabus Knowledge Map
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Visual concept hierarchy showing your retention, mastery bottlenecks, and syllabus coverage across all course units.
          </p>
        </div>
      </div>

      {/* Filter and Subject Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 overflow-x-hidden">
          {subjects.map(sub => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.name)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSubject === sub.name
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              filterStatus === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Nodes
          </button>
          <button
            onClick={() => setFilterStatus('critical')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              filterStatus === 'critical' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilterStatus('strong')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              filterStatus === 'strong' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-emerald-300'
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
            className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {node.unit}
                </span>
                {getStatusBadge(node.masteryStatus)}
              </div>

              <h4 className="text-sm font-bold text-white font-heading">
                {node.topic}
              </h4>

              {/* Mastery Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Mastery Level:</span>
                  <span className="text-white font-bold">{node.masteryPercentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
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
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => handleImproveNode(node)}
                className="flex-1 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <Sparkles size={12} />
                <span>Explain Topic</span>
              </button>

              <button
                onClick={() => handleQuizNode(node)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
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

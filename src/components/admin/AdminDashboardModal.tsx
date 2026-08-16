import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  X,
  Server,
  Activity,
  Cpu,
  Database,
  Plus,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';

export const AdminDashboardModal: React.FC = () => {
  const { adminOpen, setAdminOpen, subjects, addSubject, triggerConfetti } = useApp();

  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubSem, setNewSubSem] = useState('Semester 6');

  if (!adminOpen) return null;

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubCode.trim()) return;

    addSubject({
      id: `sub_${Date.now()}`,
      name: newSubName,
      code: newSubCode,
      semester: newSubSem,
      examDate: '2026-06-10',
      totalUnits: 5,
      completedUnits: 1,
      masteryPercentage: 50,
      color: 'purple',
      weakTopics: ['Unit 1 Core Theory'],
      highYieldTopics: ['Important 10-markers'],
      pyqProbability: 80,
    });

    setNewSubName('');
    setNewSubCode('');
    triggerConfetti();
    alert('Subject added to academic curriculum!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold font-heading text-white">
                Admin & University Telemetry Center
              </h3>
              <p className="text-[11px] text-slate-400">
                Curriculum Manager, AI Model Diagnostics & System Health
              </p>
            </div>
          </div>
          <button
            onClick={() => setAdminOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Health Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Gemini API Status</span>
                <Server size={14} className="text-emerald-400" />
              </div>
              <div className="text-sm font-bold text-emerald-400">Operational (100%)</div>
              <div className="text-[10px] text-slate-500 font-mono">Model: gemini-2.5-flash</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Inference Latency</span>
                <Activity size={14} className="text-cyan-400" />
              </div>
              <div className="text-sm font-bold text-white font-mono">312 ms avg</div>
              <div className="text-[10px] text-cyan-400 font-mono">Stream enabled</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Active Subjects</span>
                <BookOpen size={14} className="text-purple-400" />
              </div>
              <div className="text-sm font-bold text-white font-mono">{subjects.length} Courses</div>
              <div className="text-[10px] text-slate-500 font-mono">CS / Engineering</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Local Storage Cache</span>
                <Database size={14} className="text-pink-400" />
              </div>
              <div className="text-sm font-bold text-white font-mono">Active & Synced</div>
              <div className="text-[10px] text-pink-400 font-mono">IndexedDB / WebStorage</div>
            </div>
          </div>

          {/* Add Subject to Curriculum */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Plus size={16} className="text-purple-400" />
              <span>Add Course Subject to Curriculum</span>
            </h4>

            <form onSubmit={handleAddSubject} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="Subject Name (e.g. Artificial Intelligence)"
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Code (e.g. CS604)"
                  value={newSubCode}
                  onChange={e => setNewSubCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Semester"
                  value={newSubSem}
                  onChange={e => setNewSubSem(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors"
                >
                  Add Course
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

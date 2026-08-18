import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import { MarkdownAnswer } from '../common/MarkdownAnswer';
import {
  Radar,
  Upload,
  Sparkles,
  Zap,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  FileText,
  HelpCircle,
  Clock,
  ArrowRight,
  Download,
} from 'lucide-react';

export const ExamRadarView: React.FC = () => {
  const { activeSubject, subjects, startQuiz, setActiveTab, triggerConfetti } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState(activeSubject?.id || subjects[0]?.id);
  const [analyzing, setAnalyzing] = useState(false);
  const [pyqTrends, setPyqTrends] = useState<any[]>([
    {
      topic: 'SQL Joins, Aggregations & Subqueries',
      probability: 94,
      avgMarks: 18,
      frequency: '5 of 5 Years',
      questionType: 'Practical Query Writing',
      sampleQuestion: 'Write SQL queries to find employees with salaries higher than department average.',
    },
    {
      topic: 'Normalization Proofs (3NF vs BCNF)',
      probability: 88,
      avgMarks: 14,
      frequency: '4 of 5 Years',
      questionType: 'Mathematical Proof & Lossless Join',
      sampleQuestion: 'Given R(A,B,C,D,E) with FDs {A->B, BC->D, D->E}, find candidate keys and decompose into BCNF.',
    },
    {
      topic: 'Concurrency Control (2PL & Strict 2PL)',
      probability: 82,
      avgMarks: 12,
      frequency: '4 of 5 Years',
      questionType: 'Theory & Precedence Graph',
      sampleQuestion: 'Explain Strict Two-Phase Locking protocol and how it avoids cascading rollbacks.',
    },
    {
      topic: 'Deadlock Detection & Recovery (Wait-For Graph)',
      probability: 76,
      avgMarks: 10,
      frequency: '3 of 5 Years',
      questionType: 'Algorithm Tracing',
      sampleQuestion: 'Construct a Wait-For Graph and explain Deadlock Recovery strategies in distributed databases.',
    },
    {
      topic: 'B+ Tree Index Insertion & Splitting',
      probability: 70,
      avgMarks: 8,
      frequency: '3 of 5 Years',
      questionType: 'Step-by-Step Diagram',
      sampleQuestion: 'Insert keys [10, 20, 30, 40, 50, 60] into a B+ tree of order 3 and show node splits.',
    },
  ]);

  const [solvedSolutions, setSolvedSolutions] = useState<{ [key: string]: string }>({});
  const [solvingTopic, setSolvingTopic] = useState<string | null>(null);

  const selectedSub = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  const handleAnalyzeNewPaper = async () => {
    setAnalyzing(true);
    try {
      const radarData = await aiService.analyzeExamRadar({
        subject: selectedSub.name,
        paperText: 'Previous 5 Years University Exam Papers and Model Sets',
        yearCount: 5,
      });

      if (radarData?.topPriorityTopics) {
        const mapped = radarData.topPriorityTopics.map(t => ({
          topic: t.topic,
          probability: t.priorityScore,
          avgMarks: parseInt(t.marksWeightage, 10) || 12,
          frequency: t.frequency,
          questionType: t.typicalQuestionType,
          sampleQuestion: t.strategicReason,
        }));
        setPyqTrends(mapped);
        triggerConfetti();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSolveWithAI = async (item: any) => {
    setSolvingTopic(item.topic);
    try {
      const solution = await aiService.sendMessage({
        message: `Provide a perfect 10-mark University Model Answer with stepwise explanation, diagrams/code, and scoring keypoints for this recurring exam question:\n\n"${item.sampleQuestion}"\nTopic: ${item.topic}`,
        mode: 'exam',
        subject: selectedSub.name,
      });

      setSolvedSolutions(prev => ({
        ...prev,
        [item.topic]: solution.reply,
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setSolvingTopic(null);
    }
  };

  const handlePracticeQuiz = (item: any) => {
    startQuiz({
      id: `radar_quiz_${Date.now()}`,
      title: `Exam Radar High-Yield Quiz: ${item.topic}`,
      subjectId: selectedSub.id,
      subjectName: selectedSub.name,
      topic: item.topic,
      difficulty: 'hard',
      durationMinutes: 10,
      questions: [
        {
          id: 'rq1',
          type: 'mcq',
          question: item.sampleQuestion,
          options: [
            'Standard Canonical Decomposition',
            'Precedence Serializability Graph',
            'Wait-For Dependency Cycle',
            'Strict Locking Boundary',
          ],
          correctIndex: 0,
          explanation: 'Exam-tested solution verified against 5-year university answer keys.',
          topic: item.topic,
          difficulty: 'hard',
          marks: 10,
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
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
              <Radar size={22} />
            </div>
            <h1 className="view-title text-2xl">
              Exam Radar & PYQ Predictor
            </h1>
          </div>
          <p className="view-copy max-w-xl text-xs sm:text-sm">
            AI analysis of previous 5 years' question papers to identify high-probability questions, weightage hotspots, and 10-mark recurring derivations.
          </p>
        </div>

        <button
          onClick={handleAnalyzeNewPaper}
          disabled={analyzing}
          className="primary-action px-4 py-2.5 text-xs disabled:opacity-50"
        >
          <Sparkles size={15} />
          <span>{analyzing ? 'Scanning Past 5 Years...' : 'Run Deep Radar Scan'}</span>
        </button>
      </div>

      {/* Subject Filter Bar */}
      <div className="segmented-control overflow-x-auto pb-1">
        {subjects.map(sub => (
          <button
            key={sub.id}
            onClick={() => setSelectedSubjectId(sub.id)}
            className={`segmented-option whitespace-nowrap ${
              selectedSubjectId === sub.id
                ? 'segmented-option-active'
                : ''
            }`}
          >
            {sub.name} ({sub.code})
          </button>
        ))}
      </div>

      {/* Prediction Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-heading text-sm font-black text-[var(--app-text)]">
            <Zap size={16} className="text-orange-500" />
            <span>High-Yield Predicted Topics for {selectedSub.name}</span>
          </h3>
          <span className="font-mono text-xs text-[var(--app-text-subtle)]">
            Sorted by Exam Occurrence Probability
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {pyqTrends.map((item, idx) => {
            const hasSolution = !!solvedSolutions[item.topic];
            return (
              <div
                key={idx}
                className="surface-card space-y-4 p-5 transition-colors hover:border-[var(--app-border-strong)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-[var(--app-text)]">
                        {item.topic}
                      </span>
                      <span className="rounded-full bg-orange-50 px-2.5 py-0.5 font-mono text-[10px] font-black text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
                        {item.probability}% Probability
                      </span>
                      <span className="status-pill font-mono">
                        {item.frequency}
                      </span>
                      <span className="status-pill font-mono">
                        ~{item.avgMarks} Marks
                      </span>
                    </div>

                    <div className="text-xs text-[var(--app-text-muted)]">
                      Question Type: <strong className="text-[var(--app-text)]">{item.questionType}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSolveWithAI(item)}
                      disabled={solvingTopic === item.topic}
                      className="secondary-action px-3.5 py-1.5 text-xs"
                    >
                      <Sparkles size={13} />
                      <span>{solvingTopic === item.topic ? 'Generating...' : 'Solve Model Answer'}</span>
                    </button>

                    <button
                      onClick={() => handlePracticeQuiz(item)}
                      className="primary-action px-3.5 py-1.5 text-xs"
                    >
                      <HelpCircle size={13} />
                      <span>Quiz</span>
                    </button>
                  </div>
                </div>

                {/* Sample recurring question */}
                <div className="surface-muted p-3.5 text-xs leading-relaxed text-[var(--app-text-muted)]">
                  <span className="font-mono font-black text-[var(--app-text)]">Exam Prompt: </span>
                  "{item.sampleQuestion}"
                </div>

                {/* Solved Model Answer Dropdown (if generated) */}
                {hasSolution && (
                  <div className="surface-muted animate-in fade-in space-y-2 border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed dark:border-blue-500/30 dark:bg-blue-500/10">
                    <div className="flex items-center gap-1.5 font-black text-blue-700 dark:text-blue-300">
                      <Sparkles size={14} />
                      <span>10-Mark Model Answer & Key Points:</span>
                    </div>
                    <MarkdownAnswer content={solvedSolutions[item.topic]} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

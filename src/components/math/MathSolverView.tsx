import React, { useMemo, useRef, useState } from 'react';
import {
  Calculator,
  Check,
  Copy,
  Image as ImageIcon,
  Languages,
  Lightbulb,
  Loader2,
  Paperclip,
  Send,
  Sigma,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import { AssistantLanguageCode, assistantLanguages, getAssistantLanguage } from '../../services/languageService';
import { MarkdownAnswer } from '../common/MarkdownAnswer';

type ExplanationDepth = 'exam' | 'deep' | 'quick';
type MathTopicBranch =
  | 'General Mathematics'
  | 'Engineering Mathematics'
  | 'Electrical Engineering'
  | 'Mechanical Engineering'
  | 'Civil Engineering'
  | 'Control Systems'
  | 'Signals & Systems'
  | 'Numerical Methods'
  | 'Complex Variables';
type MathDifficulty = 'Basic' | 'University' | 'Advanced' | 'GATE / Competitive Exam';

type MathImageAttachment = {
  name: string;
  type: string;
  sizeLabel: string;
  dataUrl: string;
};

const topicBranches: MathTopicBranch[] = [
  'General Mathematics',
  'Engineering Mathematics',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Control Systems',
  'Signals & Systems',
  'Numerical Methods',
  'Complex Variables',
];

const mathDifficulties: MathDifficulty[] = ['Basic', 'University', 'Advanced', 'GATE / Competitive Exam'];

const exampleProblemsByTopic: Record<MathTopicBranch, string[]> = {
  'General Mathematics': [
    'Solve x^2 - 5x + 6 = 0 and verify the roots.',
    'Evaluate \\(\\int_0^2 x^3\\,dx\\) with all steps.',
    'Find the derivative of \\(3x^4 - 5x^2 + 7x - 9\\).',
    'Solve a 3x3 matrix inverse problem and verify by multiplication.',
  ],
  'Engineering Mathematics': [
    'Solve \\(y\'\' - 4y\' + 4y = e^{2x}\\) using the complementary function and particular integral.',
    'Find the Laplace transform of \\(t^2 e^{-3t}\\) and state the ROC.',
    'Use eigenvalues to diagonalize a 3x3 matrix and verify \\(A = PDP^{-1}\\).',
    'Solve the heat equation on a rod with homogeneous boundary conditions using separation of variables.',
  ],
  'Electrical Engineering': [
    'For an RLC series circuit with R = 10 ohm, L = 0.5 H, C = 100 microfarad, classify damping and find natural frequency.',
    'Find the RMS value and average power for \\(v(t)=230\\sqrt{2}\\sin(100\\pi t)\\) across a 20 ohm resistor.',
    'Solve a two-mesh circuit using matrix equations and verify KVL.',
    'Compute the Thevenin equivalent of a DC network and verify load current.',
  ],
  'Mechanical Engineering': [
    'A damped spring-mass system has m = 2 kg, c = 8 N s/m, k = 18 N/m. Classify damping and solve free vibration response.',
    'Derive the torsional vibration natural frequency for a shaft-disc system and check units.',
    'Calculate centroid and second moment of area for a T-section symbolically.',
    'Solve a transient conduction problem using lumped capacitance and verify Biot number assumption.',
  ],
  'Civil Engineering': [
    'Find reactions, shear force, and bending moment for a simply supported beam with a central point load P.',
    'Use slope-deflection equations for a fixed-end beam with UDL and verify joint equilibrium.',
    'Calculate principal stresses using Mohr circle for \\(\\sigma_x, \\sigma_y, \\tau_{xy}\\).',
    'Solve a consolidation settlement problem and check units throughout.',
  ],
  'Control Systems': [
    'For \\(G(s)=\\frac{10}{s(s+2)(s+5)}\\), use Routh-Hurwitz to determine closed-loop stability.',
    'Find damping ratio, natural frequency, peak overshoot, and settling time for a second-order system.',
    'Sketch the root locus of \\(G(s)H(s)=\\frac{K}{s(s+4)(s+6)}\\) and identify breakaway points.',
    'Derive steady-state error constants \\(K_p\\), \\(K_v\\), and \\(K_a\\) for a unity-feedback system.',
  ],
  'Signals & Systems': [
    'Find the Fourier series coefficients of a half-wave rectified sine wave.',
    'Compute the convolution \\(x(t)=e^{-t}u(t)\\) and \\(h(t)=u(t)-u(t-2)\\).',
    'Find the Z-transform of \\(x[n]=a^n u[n]\\), ROC, and stability condition.',
    'Determine whether \\(h(t)=e^{-2t}u(t)\\) is BIBO stable and causal.',
  ],
  'Numerical Methods': [
    'Use Newton-Raphson to solve \\(x^3 - x - 2 = 0\\) with tolerance \\(10^{-4}\\), showing iterations.',
    'Apply Gauss-Seidel to a 3x3 linear system and check convergence condition.',
    'Use RK4 to solve \\(y\'=x+y\\), \\(y(0)=1\\), with step size h = 0.1 for two steps.',
    'Interpolate using Newton divided differences for four data points and verify with substitution.',
  ],
  'Complex Variables': [
    'Find the residue of \\(f(z)=\\frac{e^z}{(z-1)^2(z+2)}\\) at each singularity.',
    'Evaluate \\(\\oint_C \\frac{z^2+1}{z(z-2)}\\,dz\\) for |z| = 1 and |z| = 3.',
    'Check whether \\(u(x,y)=x^3-3xy^2\\) is harmonic and find its analytic function.',
    'Use Laurent series to classify the singularity of \\(\\frac{\\sin z}{z^3}\\) at z = 0.',
  ],
};

const fallbackErrorMessage = `# Live Solver Unavailable

The Math Solver could not reach a live AI provider, so I cannot honestly generate or verify a full worked solution right now.

Check the server connection or configure a live provider key such as \`GEMINI_API_KEY\`, \`NVIDIA_API_KEY\`, \`NVIDIA_INFERENCE_API_KEY\`, or \`Vibe_Coder\`, then try again.`;

const latexHint = 'Use LaTeX when helpful: inline \\(x^2\\), block \\[\\int_0^1 x^2\\,dx\\], matrices \\(\\begin{bmatrix}1&2\\\\3&4\\end{bmatrix}\\).';

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Could not read image file.'));
  reader.readAsDataURL(file);
});

const formatUploadSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const depthLabels: Record<ExplanationDepth, string> = {
  exam: 'Exam Steps',
  deep: 'Detailed Teaching',
  quick: 'Final + Key Steps',
};

export const MathSolverView: React.FC = () => {
  const { activeSubject, user } = useApp();
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [language, setLanguage] = useState<AssistantLanguageCode>('auto');
  const [depth, setDepth] = useState<ExplanationDepth>('exam');
  const [topicBranch, setTopicBranch] = useState<MathTopicBranch>('Engineering Mathematics');
  const [difficulty, setDifficulty] = useState<MathDifficulty>('University');
  const [imageAttachment, setImageAttachment] = useState<MathImageAttachment | null>(null);
  const [attachmentError, setAttachmentError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedLanguage = getAssistantLanguage(language);
  const selectedExamples = exampleProblemsByTopic[topicBranch];

  const helperPrompt = useMemo(() => {
    if (depth === 'deep') {
      return 'Teach the solution slowly, explain why each step is valid, and include common mistakes.';
    }
    if (depth === 'quick') {
      return 'Give the final answer first, then only the essential steps needed to trust it.';
    }
    return 'Write it as a high-scoring exam solution with formulas, substitutions, verification, and boxed final answer.';
  }, [depth]);

  const solveProblem = async (customProblem?: string) => {
    const question = (customProblem || problem).trim();
    if ((!question && !imageAttachment) || isLoading) return;

    setProblem(question);
    setIsLoading(true);
    setSolution('');
    aiService.stopSpeaking();
    setIsSpeaking(false);

    try {
      const messageQuestion = question || 'Solve the uploaded handwritten or printed math problem. Transcribe it first, then solve.';
      const response = await aiService.sendMessage({
        message: `${messageQuestion}

Math Solver controls:
- Topic / Branch: ${topicBranch}
- Difficulty: ${difficulty}
- Answer style: ${depthLabels[depth]}

Answer-style control:
${helperPrompt}

Rendering rules:
- Use Markdown headings exactly as requested by the Math Solver system prompt.
- Use LaTeX for every mathematical expression.
- Use inline math with \\( ... \\) and display math with \\[ ... \\] or $$ ... $$.
- Do not put equations in code blocks unless the student asks for code.
- Use \\boxed{...} for the final result.`,
        mode: 'math',
        subject: activeSubject?.name || topicBranch,
        academicContext: {
          degree: user.degree,
          semester: user.semester,
          goal: user.studyGoal,
          answerStyle: depthLabels[depth],
          mathBranch: topicBranch,
          mathDifficulty: difficulty,
        },
        language,
        attachments: imageAttachment ? [{
          name: imageAttachment.name,
          type: imageAttachment.type,
          kind: 'image',
          dataUrl: imageAttachment.dataUrl,
        }] : [],
        allowFallback: false,
      });
      setSolution(response.reply);
    } catch (error) {
      console.error(error);
      setSolution(fallbackErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelected = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    setAttachmentError('');
    const lowerName = file.name.toLowerCase();
    const isImage = /^image\/(png|jpe?g)$/.test(file.type) || /\.(png|jpe?g)$/.test(lowerName);

    if (!isImage) {
      setAttachmentError('Upload a JPG, JPEG, or PNG image of the math problem.');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setAttachmentError('Keep the image under 12 MB.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImageAttachment({
        name: file.name,
        type: file.type || 'image/png',
        sizeLabel: formatUploadSize(file.size),
        dataUrl,
      });
    } catch (error: any) {
      setAttachmentError(error?.message || 'Could not read this image.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleVoice = () => {
    if (!solution) return;
    if (isSpeaking) {
      aiService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    aiService.speakText(solution, () => setIsSpeaking(false), language);
  };

  const copySolution = async () => {
    if (!solution) return;
    await navigator.clipboard.writeText(solution);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="view-stack space-y-5 lg:pb-8">
      <section className="view-hero p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="view-kicker">
              <Sigma size={14} />
              Dedicated Math Solver
            </div>
            <h1 className="view-title mt-3 text-2xl sm:text-3xl">
              Solve high-end math with clear steps
            </h1>
            <p className="view-copy mt-2 max-w-2xl text-sm">
              Algebra, calculus, matrices, probability, statistics, differential equations, proofs, numerical methods, and exam word problems.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-[34rem]">
            <label className="surface-muted px-3 py-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--app-text-subtle)]">
                <Sigma size={12} />
                Topic / Branch
              </span>
              <select
                value={topicBranch}
                onChange={event => setTopicBranch(event.target.value as MathTopicBranch)}
                className="mt-1 w-full bg-transparent text-xs font-black text-[var(--app-text)] outline-none"
              >
                {topicBranches.map(item => (
                  <option key={item} value={item} className="bg-white text-gray-950 dark:bg-slate-950 dark:text-white">
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="surface-muted px-3 py-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--app-text-subtle)]">
                <Calculator size={12} />
                Difficulty
              </span>
              <select
                value={difficulty}
                onChange={event => setDifficulty(event.target.value as MathDifficulty)}
                className="mt-1 w-full bg-transparent text-xs font-black text-[var(--app-text)] outline-none"
              >
                {mathDifficulties.map(item => (
                  <option key={item} value={item} className="bg-white text-gray-950 dark:bg-slate-950 dark:text-white">
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="surface-muted px-3 py-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--app-text-subtle)]">
                <Languages size={12} />
                Language
              </span>
              <select
                value={language}
                onChange={event => setLanguage(event.target.value as AssistantLanguageCode)}
                className="mt-1 w-full bg-transparent text-xs font-black text-[var(--app-text)] outline-none"
              >
                {assistantLanguages.map(item => (
                  <option key={item.code} value={item.code} className="bg-white text-gray-950 dark:bg-slate-950 dark:text-white">
                    {item.label} - {item.nativeLabel}
                  </option>
                ))}
              </select>
            </label>

            <label className="surface-muted px-3 py-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--app-text-subtle)]">
                <Lightbulb size={12} />
                Answer Style
              </span>
              <select
                value={depth}
                onChange={event => setDepth(event.target.value as ExplanationDepth)}
                className="mt-1 w-full bg-transparent text-xs font-black text-[var(--app-text)] outline-none"
              >
                {Object.entries(depthLabels).map(([value, label]) => (
                  <option key={value} value={value} className="bg-white text-gray-950 dark:bg-slate-950 dark:text-white">
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="surface-card p-4 sm:p-5">
          <form
            onSubmit={event => {
              event.preventDefault();
              void solveProblem();
            }}
            className="space-y-4"
          >
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-[var(--app-text-subtle)]">
                Problem
              </span>
              <textarea
                value={problem}
                onChange={event => setProblem(event.target.value)}
                placeholder={`Type any ${topicBranch.toLowerCase()} problem. Example: ${selectedExamples[0]}`}
                className="form-control mt-2 min-h-56 w-full resize-y px-4 py-3 text-sm leading-6"
              />
              <span className="mt-2 block text-[11px] font-semibold leading-5 text-[var(--app-text-muted)]">
                {latexHint}
              </span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={event => handleImageSelected(event.target.files)}
              className="hidden"
            />

            {(imageAttachment || attachmentError) && (
              <div className="space-y-2">
                {attachmentError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-200">
                    {attachmentError}
                  </div>
                )}
                {imageAttachment && (
                  <div className="surface-muted flex items-center gap-3 p-2.5 text-xs text-[var(--app-text)]">
                    <img src={imageAttachment.dataUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{imageAttachment.name}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                        <ImageIcon size={12} />
                        {imageAttachment.sizeLabel}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageAttachment(null)}
                      className="icon-button icon-button-sm"
                      title="Remove image"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={isLoading || (!problem.trim() && !imageAttachment)}
                className="primary-action px-4 py-3 text-sm disabled:opacity-45"
              >
                {isLoading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                Solve Problem
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="secondary-action border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200"
              >
                <Paperclip size={17} />
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => {
                  setProblem('');
                  setSolution('');
                  setImageAttachment(null);
                  setAttachmentError('');
                  aiService.stopSpeaking();
                  setIsSpeaking(false);
                }}
                className="secondary-action px-4 py-3 text-sm"
              >
                Clear
              </button>
            </div>
          </form>

          <div className="mt-5">
            <div className="mb-2 text-xs font-black uppercase tracking-widest text-[var(--app-text-subtle)]">
              Try Examples
            </div>
            <div className="grid gap-2">
              {selectedExamples.map(item => (
                <button
                  key={item}
                  onClick={() => solveProblem(item)}
                  className="command-row px-3 py-2 text-xs font-semibold leading-5"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--app-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                <Calculator size={18} />
              </div>
              <div>
                <h2 className="font-heading text-sm font-black text-[var(--app-text)]">Solution</h2>
                <p className="text-[11px] text-[var(--app-text-muted)]">
                  {selectedLanguage.label} output with voice playback
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copySolution}
                disabled={!solution}
                className="secondary-action px-3 py-2 text-xs disabled:opacity-40"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={toggleVoice}
                disabled={!solution}
                className="primary-action bg-cyan-600 px-3 py-2 text-xs text-white hover:bg-cyan-500 disabled:opacity-40 dark:bg-cyan-500 dark:text-white"
              >
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                {isSpeaking ? 'Stop' : 'Voice'}
              </button>
            </div>
          </div>

          <div className="min-h-[32rem] overflow-y-auto p-4 sm:p-5">
            {isLoading && (
              <div className="flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm font-bold text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200">
                <Loader2 size={18} className="animate-spin" />
                Solving carefully with formulas, steps, and verification...
              </div>
            )}

            {!isLoading && solution && (
              <div className="surface-muted math-solution-panel p-4 sm:p-5">
                <MarkdownAnswer content={solution} />
              </div>
            )}

            {!isLoading && !solution && (
              <div className="surface-muted flex min-h-[28rem] flex-col items-center justify-center border-dashed text-center">
                <Calculator size={34} className="text-[var(--app-text-subtle)]" />
                <p className="mt-3 text-sm font-black text-[var(--app-text)]">
                  Your worked solution will appear here.
                </p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--app-text-muted)]">
                  Ask for a quick result, a full exam answer, or a detailed teaching explanation.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

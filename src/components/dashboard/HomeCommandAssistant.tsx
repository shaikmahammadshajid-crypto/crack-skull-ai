import React, { useMemo, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Compass,
  Languages,
  Loader2,
  Mic,
  Moon,
  Search,
  Send,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp, NavigationTab } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import { AssistantLanguageCode, assistantLanguages, getAssistantLanguage } from '../../services/languageService';
import { inferChatMode, parseAppCommand } from '../../services/appCommandService';
import { MarkdownAnswer } from '../common/MarkdownAnswer';

interface HomeAssistantTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  targetTab?: NavigationTab;
}

const commandChips = [
  'Solve x^2 - 5x + 6 = 0',
  'Open Math Solver',
  'Make today study plan',
  'Switch to dark theme',
  'Open voice assistant',
];

export const HomeCommandAssistant: React.FC = () => {
  const {
    activeSubject,
    user,
    theme,
    toggleTheme,
    setActiveTab,
    setVoiceAssistantOpen,
    setGlobalSearchOpen,
    toggleCrackMode,
    regenerateStudyPlan,
  } = useApp();

  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<AssistantLanguageCode>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastTarget, setLastTarget] = useState<NavigationTab | undefined>();
  const [turns, setTurns] = useState<HomeAssistantTurn[]>([
    {
      id: 'home_ai_welcome',
      role: 'assistant',
      text: 'I can open app sections, switch theme, start voice, create a study plan, and solve academic questions from here.',
    },
  ]);

  const selectedLanguage = getAssistantLanguage(language);

  const statusText = useMemo(() => {
    if (isLoading) return 'Working on your request...';
    return `${selectedLanguage.label} assistant ready`;
  }, [isLoading, selectedLanguage.label]);

  const appendTurn = (turn: HomeAssistantTurn) => {
    setTurns(prev => [...prev.slice(-5), turn]);
  };

  const handleSubmit = async (customInput?: string) => {
    const commandText = (customInput || input).trim();
    if (!commandText || isLoading) return;

    setInput('');
    setLastTarget(undefined);
    appendTurn({ id: `home_user_${Date.now()}`, role: 'user', text: commandText });

    const parsed = parseAppCommand(commandText);
    if (!parsed) return;

    const acknowledge = (text: string, targetTab?: NavigationTab) => {
      appendTurn({
        id: `home_ai_${Date.now()}`,
        role: 'assistant',
        text,
        targetTab,
      });
      setLastTarget(targetTab);
    };

    if (parsed.action === 'theme' && parsed.theme) {
      if (theme !== parsed.theme) toggleTheme();
      acknowledge(`Done. ${parsed.theme === 'dark' ? 'Dark' : 'Light'} theme is active across the app.`);
      return;
    }

    if (parsed.action === 'voice') {
      setVoiceAssistantOpen(true);
      acknowledge(parsed.acknowledgement);
      return;
    }

    if (parsed.action === 'search') {
      setGlobalSearchOpen(true);
      acknowledge(parsed.acknowledgement);
      return;
    }

    if (parsed.action === 'crack-mode') {
      toggleCrackMode();
      acknowledge(parsed.acknowledgement, 'study-plan');
      return;
    }

    if (parsed.action === 'study-plan') {
      setIsLoading(true);
      try {
        await regenerateStudyPlan();
        setActiveTab('study-plan');
        acknowledge('Done. I regenerated your study plan and opened the roadmap.', 'study-plan');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (parsed.action === 'navigate' && parsed.targetTab) {
      setActiveTab(parsed.targetTab);
      acknowledge(parsed.acknowledgement, parsed.targetTab);
      return;
    }

    setIsLoading(true);
    try {
      const response = await aiService.sendMessage({
        message: commandText,
        mode: parsed.chatMode || inferChatMode(commandText),
        subject: activeSubject?.name || 'Academic Preparation',
        academicContext: {
          degree: user.degree,
          semester: user.semester,
          goal: user.studyGoal,
          activeSubject,
          crackMode: user.isCrackModeActive,
          homeAssistant: true,
        },
        history: turns.slice(-4).map(turn => ({
          role: turn.role === 'user' ? 'user' : 'assistant',
          content: turn.text,
        })),
        language,
      });
      acknowledge(response.reply, parsed.targetTab);
    } catch (error) {
      console.error(error);
      acknowledge('I could not complete that request. Please try again with a clearer command or question.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    const lastAssistantTurn = [...turns].reverse().find(turn => turn.role === 'assistant');
    if (!lastAssistantTurn) return;
    if (isSpeaking) {
      aiService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    aiService.speakText(lastAssistantTurn.text, () => setIsSpeaking(false), language);
  };

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-[var(--app-border)] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-950 text-white dark:bg-white dark:text-gray-950">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="font-heading text-base font-black text-[var(--app-text)]">Home Assistant</h2>
              <p className="text-xs text-[var(--app-text-muted)]">{statusText}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="secondary-action px-3 py-2 text-xs">
              <Languages size={14} />
              <select
                value={language}
                onChange={event => setLanguage(event.target.value as AssistantLanguageCode)}
                className="max-w-40 bg-transparent outline-none"
              >
                {assistantLanguages.map(item => (
                  <option key={item.code} value={item.code} className="bg-white text-gray-950 dark:bg-slate-950 dark:text-white">
                    {item.label} - {item.nativeLabel}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => setGlobalSearchOpen(true)}
              className="icon-button"
              title="Search"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => setVoiceAssistantOpen(true)}
              className="icon-button"
              title="Voice assistant"
            >
              <Mic size={16} />
            </button>
            <button
              onClick={toggleTheme}
              className="icon-button"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-3">
          <div className="surface-muted max-h-[22rem] overflow-y-auto p-3">
            <div className="space-y-3">
              {turns.map(turn => (
                <div key={turn.id} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[92%] rounded-2xl px-3.5 py-3 text-xs leading-5 ${
                      turn.role === 'user'
                        ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950'
                        : 'border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]'
                    }`}
                  >
                    {turn.role === 'assistant' ? (
                      <MarkdownAnswer content={turn.text} />
                    ) : (
                      <span>{turn.text}</span>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex w-fit items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking and checking app actions...
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={event => {
              event.preventDefault();
              void handleSubmit();
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder="Ask to open a section, solve a problem, change theme, or plan study"
              className="form-control min-h-12 flex-1 px-4 text-sm"
            />
            <button
              type="button"
              onClick={toggleVoice}
              className="icon-button icon-button-lg"
              title={isSpeaking ? 'Stop voice' : 'Read last answer'}
            >
              {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="primary-action h-12 w-12 disabled:opacity-40"
              title="Run command"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>

        <aside className="space-y-3">
          <div className="surface-muted p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--app-text-subtle)]">
              <Compass size={14} />
              Fast Commands
            </div>
            <div className="space-y-2">
              {commandChips.map(chip => (
                <button
                  key={chip}
                  onClick={() => handleSubmit(chip)}
                  className="command-row px-3 py-2 text-xs font-semibold leading-5"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => lastTarget && setActiveTab(lastTarget)}
            disabled={!lastTarget}
            className="secondary-action w-full px-4 py-3 text-xs disabled:opacity-40"
          >
            <CheckCircle2 size={15} />
            Open Last Target
          </button>

          <div className="surface-card border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
            <div className="mb-1 flex items-center gap-2 font-bold">
              <Sparkles size={14} />
              Reliability Rule
            </div>
            Commands are handled locally first. Academic answers use the selected AI provider and fall back to offline solving when keys are unavailable.
          </div>
        </aside>
      </div>
    </section>
  );
};

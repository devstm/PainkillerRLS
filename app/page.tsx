'use client';

import { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';
import ChatPanel from '@/app/components/ChatPanel';
import { PipelineStepStatus } from '@/lib/types';

// SQL syntax theme — oneDark with our dark background
const sqlTheme: Record<string, React.CSSProperties> = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...(oneDark['pre[class*="language-"]'] ?? {}),
    background: 'transparent',
    margin: '0',
    padding: '24px',
    fontSize: '13px',
    lineHeight: '1.5rem',
    fontFamily: 'var(--font-geist-mono), monospace',
  },
  'code[class*="language-"]': {
    ...(oneDark['code[class*="language-"]'] ?? {}),
    background: 'transparent',
    fontFamily: 'var(--font-geist-mono), monospace',
  },
};

// Icons
const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-green-500"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const SpinnerIcon = () => (
  <svg
    className="animate-spin text-zinc-400"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="2" x2="12" y2="6"></line>
    <line x1="12" y1="18" x2="12" y2="22"></line>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
    <line x1="2" y1="12" x2="6" y2="12"></line>
    <line x1="18" y1="12" x2="22" y2="12"></line>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
    <line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
  </svg>
);

const DatabaseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-zinc-800"
  >
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);

const GitHubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

type Tab = 'paste' | 'connect';

interface Step {
  id: number;
  label: string;
  status: PipelineStepStatus;
  startedAt?: number;
  completedAt?: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('paste');
  const [sqlSchema, setSqlSchema] = useState('');
  const [projectRef, setProjectRef] = useState('');
  const [serviceKey, setServiceKey] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState('');
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [pipelineActive, setPipelineActive] = useState(false);
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, label: 'Classifying tables', status: 'pending' },
    { id: 2, label: 'Retrieving RLS patterns', status: 'pending' },
    { id: 3, label: 'Generating policies', status: 'pending' },
    { id: 4, label: 'Validating output', status: 'pending' },
  ]);

  const [output, setOutput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [totalPipelineMs, setTotalPipelineMs] = useState<number | null>(null);
  const [pipelineExpanded, setPipelineExpanded] = useState(false);
  const [chatHeight, setChatHeight] = useState(320);
  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number>(320);
  const pipelineStartAtRef = useRef<number>(0);
  const handleChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = { role: 'user' as const, content: chatInput.trim() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setChatInput('');
    setIsChatLoading(true);

    // Add empty assistant message to fill as stream comes in
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          schema: generatedSchema,
          migration: output,
          conversationId,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Failed to connect to chat.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        // Append chunk to the last assistant message
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        };
        return updated;
      });
    } finally {
      setIsChatLoading(false);
    }
  };
  const handleGenerate = async () => {
    setPipelineActive(true);
    setOutput('');
    setErrorMsg('');
    setMessages([]);
    setConversationId(crypto.randomUUID());
    setTotalPipelineMs(null);
    setPipelineExpanded(false);
    pipelineStartAtRef.current = Date.now();
    setSteps(steps.map((s) => ({ ...s, status: 'pending', startedAt: undefined, completedAt: undefined })));

    const body =
      activeTab === 'paste'
        ? { mode: 'paste', sql: sqlSchema }
        : { mode: 'connect', projectRef: projectRef, serviceKey };
    // Save schema for chat context
    setGeneratedSchema(
      activeTab === 'paste' ? sqlSchema : `Connected project: ${projectRef}`,
    );
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        setErrorMsg(errData.error ?? 'Something went wrong.');
        setPipelineActive(false);
        return;
      }

      if (!res.body) {
        setErrorMsg('Failed to start pipeline.');
        setPipelineActive(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const events = chunk.split('\n\n').filter(Boolean);
          for (const ev of events) {
            if (ev.startsWith('data: ')) {
              try {
                const data = JSON.parse(ev.slice(6));

                if (data.type === 'error') {
                  setErrorMsg(data.error);
                  setPipelineActive(false);
                } else if (data.type === 'result') {
                  setOutput(data.migration);
                  setPipelineActive(false);
                  setTotalPipelineMs(Date.now() - pipelineStartAtRef.current);
                } else if (data.step) {
                  const now = Date.now();
                  setSteps((prev) =>
                    prev.map((s) =>
                      s.id === data.step
                        ? {
                            ...s,
                            status: data.status,
                            label: data.label,
                            startedAt: data.status === 'running' ? now : s.startedAt,
                            completedAt: data.status === 'done' ? now : s.completedAt,
                          }
                        : s,
                    ),
                  );
                }
              } catch {
                // Ignore parse errors from incomplete chunks
              }
            }
          }
        }
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to connect to the server.',
      );
      setPipelineActive(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '001_rls_policies.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };


  const formatLineNumbers = (val: string) => {
    const lines = val.split('\n').length;
    return Array.from({ length: Math.max(16, lines) }, (_, i) => i + 1).join(
      '\n',
    );
  };

  const numPolicies = output
    ? (output.match(/CREATE POLICY/g) || []).length
    : 0;
  const numTables = output
    ? (output.match(/ENABLE ROW LEVEL SECURITY/g) || []).length
    : 0;
  const isInputReady = activeTab === 'paste'
    ? sqlSchema.trim().length > 0
    : projectRef.trim().length > 0 && serviceKey.trim().length > 0;

  return (
    <main className="min-h-screen min-[900px]:h-screen w-full bg-zinc-950 text-zinc-100 font-mono selection:bg-red-500/30 flex flex-col min-[900px]:overflow-hidden">
      {/* ── Global top bar ──────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-5 h-11 border-b border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.7)]" />
          <span className="text-[13px] font-bold tracking-widest uppercase text-zinc-400">Painkiller</span>
          <span className="text-[13px] font-bold tracking-widest uppercase text-red-500">RLS</span>
        </div>
        <a
          href="https://github.com/devstm/PainkillerRLS"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded hover:bg-zinc-800/50"
          aria-label="View on GitHub"
        >
          <GitHubIcon />
        </a>
      </header>

      {/* ── Two-column body ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col min-[900px]:flex-row min-[900px]:overflow-hidden">

      {/* LEFT COLUMN */}
      <section className="w-full min-[900px]:w-[40%] flex flex-col bg-zinc-900 border-b min-[900px]:border-b-0 min-[900px]:border-r border-zinc-800 z-10 shadow-2xl relative">
        <div className="overflow-y-auto scrollbar-thin px-8 pt-10 pb-8 flex flex-col min-[900px]:flex-1">
          <div className="mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-zinc-100 mb-4 leading-tight tracking-tight">
              Generate RLS policies
              <br />
              <span className="text-red-500">in seconds.</span>
            </h1>
            <p className="text-zinc-400 text-sm max-w-md leading-relaxed">
              Paste your schema or connect your database — our AI pipeline
              detects ownership, retrieves standard patterns, and generates
              production-ready RLS rules.
            </p>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="relative flex border-b border-zinc-800/80 shrink-0">
              {/* Sliding underline indicator */}
              <div
                className="absolute bottom-0 left-0 h-px bg-rose-500 transition-transform duration-200 ease-out"
                style={{ width: '50%', transform: `translateX(${activeTab === 'paste' ? '0%' : '100%'})` }}
              />
              {(['paste', 'connect'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3.5 text-xs uppercase tracking-widest transition-colors duration-200 font-semibold focus-visible:outline-none ${
                    activeTab === tab ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab === 'paste' ? 'Paste Schema' : 'Connect Supabase'}
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col py-6">
              {activeTab === 'paste' ? (
                <div className="flex-1 flex flex-col min-h-[300px] relative group">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                      SQL Schema
                    </label>
                    
                  </div>
                  <div className="flex-1 flex rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden focus-within:border-rose-500/40 focus-within:ring-1 focus-within:ring-rose-500/30 transition-all shadow-inner">
                    <div className="flex-none w-12 py-4 pl-2 pr-3 text-right bg-zinc-900 border-r border-zinc-800 select-none overflow-hidden">
                      <pre className="text-zinc-700 text-sm font-mono pointer-events-none m-0 p-0" style={{ lineHeight: '1.5rem' }}>
                        {formatLineNumbers(sqlSchema)}
                      </pre>
                    </div>
                    <textarea
                      value={sqlSchema}
                      onChange={(e) => setSqlSchema(e.target.value)}
                      placeholder={`CREATE TABLE posts (\n  id uuid PRIMARY KEY,\n  user_id uuid REFERENCES auth.users,\n  title text\n);`}
                      className="flex-1 bg-transparent p-4 text-sm text-zinc-300 placeholder-zinc-700 focus:outline-none resize-none leading-relaxed font-mono scrollbar-thin"
                      spellCheck="false"
                      style={{ lineHeight: '1.5rem' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        Supabase Project ID
                      </label>
                      <a
                        href="https://supabase.com/dashboard/project/_/settings/general"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-rose-500/70 hover:text-rose-400 transition-colors flex items-center gap-1 font-mono"
                      >
                        Where to find it ↗
                      </a>
                    </div>
                    <input
                      type="url"
                      value={projectRef}
                      onChange={(e) => setProjectRef(e.target.value)}
                      placeholder="gnwfmrklkzohbyfvarmt"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3.5 text-sm text-zinc-300 placeholder-zinc-700 focus:outline-none focus-visible:border-rose-500/40 focus-visible:ring-1 focus-visible:ring-rose-500/30 transition-all font-mono"
                    />
                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                      Found in <span className="font-mono text-zinc-500">Settings → General → Reference ID</span>
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-2 font-bold">
                        <span>Secret Key</span>
                        <LockIcon />
                      </label>
                      <a
                        href="https://supabase.com/dashboard/project/_/settings/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-rose-500/70 hover:text-rose-400 transition-colors flex items-center gap-1 font-mono"
                      >
                        Where to find it ↗
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        value={serviceKey}
                        onChange={(e) => setServiceKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3.5 text-sm text-zinc-300 placeholder-zinc-700 focus:outline-none focus-visible:border-rose-500/40 focus-visible:ring-1 focus-visible:ring-rose-500/30 transition-all font-mono pr-10"
                      />
                    </div>
                    <div className="rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 space-y-1.5">
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">How to get your Secret Key</p>
                      <ol className="text-[11px] text-zinc-500 space-y-1 list-none">
                        <li className="flex gap-2"><span className="text-rose-500 font-mono shrink-0">1.</span>Open your project in the <span className="text-zinc-400">Supabase Dashboard</span></li>
                        <li className="flex gap-2"><span className="text-rose-500 font-mono shrink-0">2.</span>Go to <span className="text-zinc-400 font-mono">Settings → API</span></li>
                        <li className="flex gap-2"><span className="text-rose-500 font-mono shrink-0">3.</span>Under <span className="text-zinc-400 font-mono">Project API keys</span>, copy the <span className="text-zinc-400 font-mono">Secret key</span></li>
                      </ol>
                    </div>
                    <p className="text-[10px] text-zinc-600 flex items-center gap-1.5 leading-relaxed">
                      <LockIcon />
                      Used only for this request — never stored or logged.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 mt-4 space-y-4">
              <button
                onClick={handleGenerate}
                disabled={pipelineActive || !isInputReady}
                className={`w-full py-4 overflow-hidden rounded-lg text-sm font-bold tracking-[0.12em] uppercase transition-all duration-200 relative group ${
                  pipelineActive
                    ? 'bg-rose-950/60 border border-rose-900/50 text-rose-300 cursor-not-allowed'
                    : isInputReady
                      ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 border border-rose-500 text-white shadow-lg shadow-rose-900/20'
                      : 'bg-zinc-800/60 border border-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                {pipelineActive ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    <span className="truncate max-w-[220px]">
                      {steps.find((s) => s.status === 'running')?.label ?? 'Generating…'}
                    </span>
                  </span>
                ) : (
                  <>
                    Generate RLS Policies
                    {isInputReady && (
                      <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                    )}
                  </>
                )}
              </button>

              {errorMsg && (
                <div
                  className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 p-4 rounded-lg flex items-start gap-3"
                  style={{ animation: 'fade-in 250ms ease-out both' }}
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT COLUMN */}
      <section className="flex-1 min-[900px]:w-[60%] bg-zinc-950 relative overflow-hidden flex flex-col min-h-[60vh] min-[900px]:min-h-0">
        {pipelineActive && (
          <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900 border-b border-zinc-800 z-50">
            <div
              className="h-full bg-red-500 animate-pulse duration-700 w-full"
              style={{
                width: steps.every((s) => s.status === 'done')
                  ? '100%'
                  : steps[2].status === 'running' || steps[2].status === 'done'
                    ? '75%'
                    : steps[1].status === 'running' ||
                        steps[1].status === 'done'
                      ? '50%'
                      : '25%',
                transition: 'width 0.5s ease-in-out',
              }}
            />
          </div>
        )}

        {/* STATE 1: IDLE */}
        {!pipelineActive && !output && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center" style={{ animation: 'fade-in 600ms ease-out both' }}>
            <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-8 shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-red-500/10 to-transparent rounded-3xl opacity-50"></div>
              <DatabaseIcon />
            </div>
            <h2 className="text-xl font-bold text-zinc-300 mb-3 tracking-tight">
              Your RLS policies will appear here
            </h2>
            <p className="text-sm text-zinc-500 max-w-sm leading-relaxed mb-10">
              When you generate policies, we pass your schema through our
              intelligent AI pipeline.
            </p>
            <div className="text-left space-y-4 inline-block">
              {[
                'Classify tables and ownership',
                'Retrieve standard RLS patterns',
                'Generate access policies',
                'Validate and correct output',
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 text-xs text-zinc-500 font-medium tracking-wide"
                >
                  <span className="w-6 h-6 rounded-full border border-zinc-800 bg-zinc-900/50 flex items-center justify-center text-[10px] text-zinc-600">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATE 2: PIPELINE RUNNING */}
        {(pipelineActive ||
          (steps.some((s) => s.status !== 'pending') &&
            !output &&
            !errorMsg)) && (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="w-full max-w-md space-y-2">
              {steps.map((step) => {
                const elapsedMs =
                  step.startedAt && step.completedAt
                    ? step.completedAt - step.startedAt
                    : null;

                return (
                  <div
                    key={step.id}
                    className={`relative flex items-center gap-4 px-4 py-3.5 rounded-lg border overflow-hidden transition-all duration-300 ${
                      step.status === 'pending'
                        ? 'border-zinc-800/40 opacity-35'
                        : step.status === 'running'
                          ? 'border-rose-500/20 bg-rose-500/[0.04]'
                          : 'border-zinc-800/60 bg-zinc-900/20'
                    }`}
                  >
                    {/* Sweep shimmer on active step */}
                    {step.status === 'running' && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                        <div
                          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-rose-500/10 to-transparent"
                          style={{ animation: 'sweep 2.2s ease-in-out infinite' }}
                        />
                      </div>
                    )}

                    {/* Step indicator */}
                    <div
                      className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${
                        step.status === 'done'
                          ? 'border-green-500/40 bg-green-500/10'
                          : step.status === 'running'
                            ? 'border-rose-500/40 bg-rose-500/10'
                            : 'border-zinc-800 bg-zinc-900'
                      }`}
                      style={
                        step.status === 'running'
                          ? { animation: 'step-glow 2s ease-in-out infinite' }
                          : undefined
                      }
                    >
                      {step.status === 'done' && <CheckIcon />}
                      {step.status === 'running' && (
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      )}
                      {step.status === 'pending' && (
                        <span className="text-[10px] text-zinc-600 font-bold font-mono">
                          {step.id}
                        </span>
                      )}
                    </div>

                    {/* Label + elapsed */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                      <span
                        className={`text-sm transition-colors duration-300 ${
                          step.status === 'done'
                            ? 'text-zinc-300'
                            : step.status === 'running'
                              ? 'text-zinc-100 font-medium'
                              : 'text-zinc-600'
                        }`}
                      >
                        {step.label}
                      </span>
                      {step.status === 'running' && (
                        <div className="flex items-center gap-1 shrink-0">
                          {[0, 200, 400].map((delay) => (
                            <span
                              key={delay}
                              className="w-1 h-1 rounded-full bg-rose-500/60 animate-pulse"
                              style={{ animationDelay: `${delay}ms` }}
                            />
                          ))}
                        </div>
                      )}
                      {elapsedMs !== null && (
                        <span className="text-[10px] text-zinc-600 font-mono shrink-0">
                          {(elapsedMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STATE 3: OUTPUT + CHAT */}
        {output && !pipelineActive && (
          <div className="h-full flex flex-col" style={{ animation: 'fade-in 300ms ease-out both' }}>

            {/* Pipeline summary — collapsible */}
            {totalPipelineMs !== null && (
              <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/30">
                <button
                  onClick={() => setPipelineExpanded((v) => !v)}
                  className="w-full flex items-center gap-2.5 px-5 py-2.5 hover:bg-zinc-800/30 transition-colors text-left"
                >
                  <div className="w-3.5 h-3.5 rounded-full border border-green-500/40 bg-green-500/10 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  </div>
                  <span className="text-[11px] text-zinc-500 flex-1">
                    Generated in{' '}
                    <span className="text-zinc-300 font-mono">
                      {(totalPipelineMs / 1000).toFixed(1)}s
                    </span>
                    {' '}·{' '}4 steps
                  </span>
                  <ChevronDown
                    size={13}
                    className={`text-zinc-600 transition-transform duration-200 ${pipelineExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {pipelineExpanded && (
                  <div className="px-5 pb-3 space-y-2 border-t border-zinc-800/50">
                    {steps.map((step) => {
                      const elapsedMs =
                        step.startedAt && step.completedAt
                          ? step.completedAt - step.startedAt
                          : null;
                      return (
                        <div key={step.id} className="flex items-center gap-2.5">
                          <CheckIcon />
                          <span className="text-xs text-zinc-400 flex-1 truncate">{step.label}</span>
                          {elapsedMs !== null && (
                            <span className="text-[10px] text-zinc-600 font-mono shrink-0">
                              {(elapsedMs / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Output panel — takes remaining space above chat */}
            <div className="flex-1 min-h-0 flex flex-col bg-[#0d0d0d]">
              <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-800/80 bg-zinc-900/40 shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <span className="text-xs tracking-[0.05em] text-zinc-300 font-bold border border-zinc-800/50 bg-zinc-900 px-3 py-1.5 rounded shadow-sm font-mono">
                    001_rls_policies.sql
                  </span>
                  <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400 font-bold tracking-wider">
                    {numPolicies} POLICIES · {numTables} TABLES
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700 rounded-md transition-all"
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    <span>{copied ? 'COPIED' : 'COPY'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-100 bg-red-600 hover:bg-red-500 rounded-md transition-all shadow-lg shadow-red-900/20"
                  >
                    <DownloadIcon />
                    <span>DOWNLOAD</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto scrollbar-thin relative">
                <div className="flex min-h-full">
                  {/* Line numbers — sticky so they stay visible on horizontal scroll */}
                  <div className="w-14 shrink-0 sticky left-0 z-10 bg-[#0d0d0d] border-r border-zinc-800/50 pt-6 pb-6 select-none">
                    {output.split('\n').map((_, i) => (
                      <div key={i} className="font-mono text-[11px] text-zinc-700 text-right pr-3" style={{ lineHeight: '1.5rem' }}>
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  {/* SQL code — proper syntax highlighting, no line wrap */}
                  <div className="flex-1 min-w-0">
                    <SyntaxHighlighter
                      language="sql"
                      style={sqlTheme}
                      customStyle={{
                        background: 'transparent',
                        margin: 0,
                        padding: '24px',
                        fontSize: '13px',
                        lineHeight: '1.5rem',
                        whiteSpace: 'pre',
                        overflowX: 'visible',
                        minWidth: '100%',
                        display: 'inline-block',
                      }}
                      showLineNumbers={false}
                      PreTag="div"
                      wrapLines={false}
                    >
                      {output}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
            </div>

            {/* Drag handle */}
            <div
              className="h-1.5 shrink-0 flex items-center justify-center cursor-row-resize group select-none bg-zinc-900 hover:bg-zinc-800 border-t border-b border-zinc-800 transition-colors"
              onMouseDown={(e) => {
                dragStartY.current = e.clientY;
                dragStartHeight.current = chatHeight;
                const onMove = (ev: MouseEvent) => {
                  if (dragStartY.current === null) return;
                  const delta = dragStartY.current - ev.clientY;
                  setChatHeight(Math.min(600, Math.max(120, dragStartHeight.current + delta)));
                };
                const onUp = () => {
                  dragStartY.current = null;
                  window.removeEventListener('mousemove', onMove);
                  window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
            >
              <div className="w-8 h-0.5 rounded-full bg-zinc-700 group-hover:bg-zinc-500 transition-colors" />
            </div>

            {/* Chat panel — resizable */}
            <div className="shrink-0" style={{ height: chatHeight }}>
              <ChatPanel
                messages={messages}
                isChatLoading={isChatLoading}
                chatInput={chatInput}
                setChatInput={setChatInput}
                onSend={handleChat}
              />
            </div>
          </div>
        )}
      </section>

      </div>{/* /columns wrapper */}
    </main>
  );
}

'use client'

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, Send } from 'lucide-react'
import { toast } from 'sonner'

const SUGGESTED_PROMPTS = [
  'Explain the SELECT policy for the most sensitive table',
  'Why was auth.uid() used instead of a role check?',
  'Add a policy for anonymous read access on public tables',
]

// ─── Code block with language label + copy button ────────────────────────────

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    toast('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-zinc-800">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
          {language || 'sql'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors px-1.5 py-1 rounded hover:bg-zinc-800 font-mono"
        >
          {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'sql'}
        style={oneDark}
        customStyle={{
          background: '#111113',
          margin: 0,
          padding: '12px 16px',
          fontSize: '12px',
          lineHeight: '1.6',
          borderRadius: 0,
        }}
        showLineNumbers={false}
        PreTag="div"
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
}

// ─── Markdown component overrides ────────────────────────────────────────────

type AnyProps = Record<string, unknown>

const md: Record<string, React.ComponentType<AnyProps>> = {
  code({ className, children, ...props }: AnyProps) {
    const match = /language-(\w+)/.exec((className as string) || '')
    if (match) {
      return (
        <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
      )
    }
    return (
      <code
        className="bg-zinc-800 text-rose-400 px-1.5 py-0.5 rounded text-[0.85em] font-mono"
        {...props}
      >
        {children as React.ReactNode}
      </code>
    )
  },
  pre({ children }: AnyProps) {
    return <>{children as React.ReactNode}</>
  },
  p({ children }: AnyProps) {
    return <p className="mb-3 last:mb-0 leading-relaxed">{children as React.ReactNode}</p>
  },
  ul({ children }: AnyProps) {
    return (
      <ul className="mb-3 ml-4 space-y-1 list-disc marker:text-zinc-600">
        {children as React.ReactNode}
      </ul>
    )
  },
  ol({ children }: AnyProps) {
    return (
      <ol className="mb-3 ml-4 space-y-1 list-decimal marker:text-zinc-600">
        {children as React.ReactNode}
      </ol>
    )
  },
  li({ children }: AnyProps) {
    return <li className="leading-relaxed">{children as React.ReactNode}</li>
  },
  h1({ children }: AnyProps) {
    return (
      <h1 className="text-base font-bold text-zinc-100 mb-2 mt-4 first:mt-0">
        {children as React.ReactNode}
      </h1>
    )
  },
  h2({ children }: AnyProps) {
    return (
      <h2 className="text-sm font-bold text-zinc-100 mb-2 mt-3 first:mt-0">
        {children as React.ReactNode}
      </h2>
    )
  },
  h3({ children }: AnyProps) {
    return (
      <h3 className="text-xs font-bold text-zinc-200 mb-1 mt-2 first:mt-0 uppercase tracking-wider">
        {children as React.ReactNode}
      </h3>
    )
  },
  blockquote({ children }: AnyProps) {
    return (
      <blockquote className="border-l-2 border-zinc-700 pl-3 text-zinc-500 italic mb-3">
        {children as React.ReactNode}
      </blockquote>
    )
  },
  a({ href, children }: AnyProps) {
    return (
      <a
        href={href as string}
        className="text-rose-400 hover:text-rose-300 underline underline-offset-2"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children as React.ReactNode}
      </a>
    )
  },
  table({ children }: AnyProps) {
    return (
      <div className="overflow-x-auto mb-3">
        <table className="text-xs w-full border-collapse">{children as React.ReactNode}</table>
      </div>
    )
  },
  th({ children }: AnyProps) {
    return (
      <th className="px-3 py-2 text-left border border-zinc-800 bg-zinc-900 text-zinc-300 font-mono">
        {children as React.ReactNode}
      </th>
    )
  },
  td({ children }: AnyProps) {
    return (
      <td className="px-3 py-2 border border-zinc-800 text-zinc-400">
        {children as React.ReactNode}
      </td>
    )
  },
  hr() {
    return <hr className="border-zinc-800 my-4" />
  },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ onPromptClick }: { onPromptClick: (p: string) => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center py-6 text-center">
      <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-5">
        Ask about a specific policy, request changes, or explain why a pattern was chosen.
      </p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onPromptClick(p)}
            className="text-left text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg px-3.5 py-2.5 transition-all leading-relaxed"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function MessageBubble({ msg, isStreaming }: { msg: Message; isStreaming: boolean }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end" style={{ animation: 'msg-in 180ms ease-out both' }}>
        <div className="max-w-[78%] bg-zinc-800 text-zinc-100 text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm font-sans leading-relaxed">
          {msg.content}
        </div>
      </div>
    )
  }

  const showThinking = isStreaming && msg.content.length === 0
  const showCursor = isStreaming && msg.content.length > 0

  return (
    <div className="flex gap-3" style={{ animation: 'msg-in 180ms ease-out both' }}>
      <div className="w-5 h-5 rounded-full bg-rose-500/15 border border-rose-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      </div>
      <div className="flex-1 min-w-0 text-sm text-zinc-300 font-sans leading-relaxed">
        {showThinking ? (
          <div className="flex items-center gap-1.5 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" style={{ animationDelay: '200ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" style={{ animationDelay: '400ms' }} />
          </div>
        ) : (
          <>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={md}
            >
              {msg.content}
            </ReactMarkdown>
            {showCursor && (
              <span
                className="inline-block w-0.5 h-[1em] bg-rose-500 ml-0.5 align-middle"
                style={{ animation: 'cursor-blink 1.1s ease-in-out infinite' }}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── ChatPanel ────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  messages: Message[]
  isChatLoading: boolean
  chatInput: string
  setChatInput: (v: string) => void
  onSend: () => void
}

export default function ChatPanel({
  messages,
  isChatLoading,
  chatInput,
  setChatInput,
  onSend,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const userScrolledUpRef = useRef(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      userScrolledUpRef.current = el.scrollHeight - el.scrollTop - el.clientHeight > 60
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!userScrolledUpRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (messages.length === 0) userScrolledUpRef.current = false
  }, [messages.length])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      onSend()
    }
  }

  const isStreaming = isChatLoading && messages[messages.length - 1]?.role === 'assistant'

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-zinc-800 shrink-0 bg-zinc-900/40">
        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">
          Ask about your policies
        </span>
        {isStreaming && (
          <span className="ml-auto text-[10px] text-zinc-500 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
            Responding
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-5 py-4">
        {messages.length === 0 ? (
          <EmptyState
            onPromptClick={(p) => {
              setChatInput(p)
              setTimeout(() => textareaRef.current?.focus(), 0)
            }}
          />
        ) : (
          <div className="space-y-5">
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                isStreaming={isStreaming && i === messages.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-zinc-800 bg-zinc-900/20">
        <div className="flex gap-2.5 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your policies…"
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 pr-14 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus-visible:border-rose-500/50 focus-visible:ring-1 focus-visible:ring-rose-500/50 resize-none font-mono leading-relaxed transition-colors"
            />
            <span className="absolute bottom-2.5 right-3 text-[10px] text-zinc-600 pointer-events-none select-none">
              ⌘↵
            </span>
          </div>
          <button
            onClick={onSend}
            disabled={isChatLoading || !chatInput.trim()}
            className="flex items-center justify-center w-9 h-9 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-colors self-end flex-shrink-0"
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

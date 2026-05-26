'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PookieChat } from '@/components/pookie-chat'
import { Timer } from '@/components/timer'
import { runEvaluation } from '@/actions/evaluation'
import { getSession } from '@/actions/session'
import { getMessages } from '@/actions/message'
import { ROLE_LABELS, QUESTION_TYPE_LABELS } from '@/config/llm'
import type { Message, Session } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function SessionPage({ params }: PageProps) {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasEnded = useRef(false)

  useEffect(() => {
    params.then(({ id }) => {
      setSessionId(id)
      loadSession(id)
    })
  }, [params])

  async function loadSession(id: string) {
    const [sessionResult, messagesResult] = await Promise.all([
      getSession(id),
      getMessages(id),
    ])

    if ('error' in sessionResult && sessionResult.error) {
      setError(sessionResult.error)
      setLoading(false)
      return
    }
    if ('session' in sessionResult) setSession(sessionResult.session as Session)
    if ('messages' in messagesResult) setMessages(messagesResult.messages)
    setLoading(false)
  }

  async function handleEnd() {
    if (hasEnded.current || !sessionId) return
    hasEnded.current = true
    setEvaluating(true)

    const result = await runEvaluation(sessionId)
    if ('error' in result && result.error) {
      setError(result.error)
      setEvaluating(false)
      hasEnded.current = false
    } else {
      router.push(`/session/${sessionId}/results`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Loading session...</p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-sm">{error ?? 'Session not found'}</p>
          <button onClick={() => router.push('/')} className="text-xs text-zinc-600 hover:text-zinc-400">
            Back to home
          </button>
        </div>
      </div>
    )
  }

  if (evaluating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-zinc-200 text-sm font-medium">Evaluating your session...</p>
          <p className="text-zinc-500 text-xs">This takes up to 20 seconds.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-100">Pookie</span>
          <span className="text-zinc-700">·</span>
          <span className="text-xs text-zinc-500">
            {QUESTION_TYPE_LABELS[session.question_type]} · {ROLE_LABELS[session.role]}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-600">
            {Math.max(0, 3 - session.hints_used)} hints left
          </span>
          <Timer
            startedAt={session.started_at}
            timerMinutes={session.timer_minutes}
            onExpire={handleEnd}
          />
        </div>
      </header>

      {/* Chat area — fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <PookieChat
          sessionId={session.id}
          initialMessages={messages}
          hintsUsed={session.hints_used}
          maxHints={3}
          onEnd={handleEnd}
        />
      </div>
    </div>
  )
}

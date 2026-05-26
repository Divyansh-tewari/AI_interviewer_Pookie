'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { sendMessage } from '@/actions/message'
import type { Message } from '@/types'

interface PookieChatProps {
  sessionId: string
  initialMessages: Message[]
  hintsUsed: number
  maxHints: number
  onEnd: () => void
}

export function PookieChat({
  sessionId,
  initialMessages,
  hintsUsed: initialHints,
  maxHints,
  onEnd,
}: PookieChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [hintsUsed, setHintsUsed] = useState(initialHints)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(isHint = false) {
    if (!input.trim() || isLoading) return
    setError(null)
    setIsLoading(true)

    const userMsg: Message = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      role: 'user',
      content: input.trim(),
      message_type: isHint ? 'hint' : 'response',
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    const result = await sendMessage(sessionId, input.trim(), isHint)
    if ('error' in result && result.error) {
      setError(result.error)
    } else if ('message' in result && result.message) {
      setMessages((prev) => [...prev, result.message as Message])
      if (isHint) setHintsUsed((h) => h + 1)
    }
    setIsLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  const hintsRemaining = maxHints - hintsUsed

  return (
    <div className="flex flex-col h-full">
      {/* Message thread */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-4 py-3 max-w-[85%] text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-zinc-800 text-zinc-100'
                    : msg.message_type === 'hint'
                    ? 'bg-amber-950/40 text-amber-200 border border-amber-800/40'
                    : msg.message_type === 'nudge'
                    ? 'bg-blue-950/40 text-blue-200 border border-blue-800/40'
                    : 'bg-zinc-900 text-zinc-100 border border-zinc-800'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-zinc-400">Pookie</span>
                    {msg.message_type === 'hint' && (
                      <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-700 h-4">
                        Hint
                      </Badge>
                    )}
                    {msg.message_type === 'nudge' && (
                      <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-700 h-4">
                        Nudge
                      </Badge>
                    )}
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
                <span className="text-xs font-semibold text-zinc-400 block mb-2">Pookie</span>
                <span className="text-zinc-500 text-sm">Thinking...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-xs text-center py-2">{error}</div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-zinc-800 p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response... (Cmd+Enter to send)"
            className="min-h-[100px] bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 resize-none focus:ring-1 focus:ring-zinc-600"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSend(true)}
                disabled={isLoading || hintsRemaining === 0 || !input.trim()}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Hint ({hintsRemaining} left)
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEnd}
                disabled={isLoading}
                className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
              >
                End & Evaluate
              </Button>
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
            >
              Send
            </Button>
          </div>
          <p className="text-xs text-zinc-600 text-right">Cmd+Enter to send</p>
        </div>
      </div>
    </div>
  )
}

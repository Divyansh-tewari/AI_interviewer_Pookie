'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createSession } from '@/actions/session'
import { ROLE_LABELS, QUESTION_TYPE_LABELS, defaultInterviewConfig } from '@/config/llm'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createSession(formData)

    if ('error' in result && result.error) {
      setError(result.error)
      setLoading(false)
    } else if ('sessionId' in result && result.sessionId) {
      router.push(`/session/${result.sessionId}`)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo / title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Pookie</h1>
          <p className="mt-2 text-zinc-400 text-sm">
            AI PM interview practice. No fluff. Real pressure.
          </p>
        </div>

        {/* Session setup form */}
        <form onSubmit={handleStart} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Question Type
            </label>
            <select
              name="questionType"
              defaultValue={defaultInterviewConfig.questionType}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Role Level
            </label>
            <select
              name="role"
              defaultValue={defaultInterviewConfig.role}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Timer (minutes)
            </label>
            <select
              name="timerMinutes"
              defaultValue={defaultInterviewConfig.timerMinutes}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              <option value={20}>20 min (quick practice)</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min (full round)</option>
              <option value={60}>60 min</option>
            </select>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-medium"
          >
            {loading ? 'Generating question...' : 'Start Interview'}
          </Button>
        </form>

        {/* Footer links */}
        <div className="flex justify-between text-xs text-zinc-600">
          <a href="/dashboard" className="hover:text-zinc-400 transition-colors">
            Session history
          </a>
          <span>v0 · AI System Design</span>
        </div>
      </div>
    </main>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/actions/session'
import { getEvaluation } from '@/actions/evaluation'
import { ResultsView } from '@/components/results-view'
import type { Session, Evaluation } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ResultsPage({ params }: PageProps) {
  const { id } = await params

  const [sessionResult, evalResult] = await Promise.all([
    getSession(id),
    getEvaluation(id),
  ])

  if ('error' in sessionResult || !('session' in sessionResult) || !sessionResult.session) {
    redirect('/')
  }

  if ('error' in evalResult || !('evaluation' in evalResult) || !evalResult.evaluation) {
    redirect(`/session/${id}`)
  }

  const session = sessionResult.session as Session
  const evaluation = evalResult.evaluation as Evaluation

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Top nav */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
        <span className="text-sm font-semibold text-zinc-100">Pookie</span>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            History
          </Link>
          <Link
            href="/"
            className="text-xs bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-3 py-1.5 rounded-md font-medium transition-colors"
          >
            New session
          </Link>
        </div>
      </header>

      <ResultsView session={session} evaluation={evaluation} />
    </div>
  )
}

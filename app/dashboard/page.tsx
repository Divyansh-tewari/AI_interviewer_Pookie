import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessions } from '@/actions/evaluation'
import { createClient } from '@/lib/supabase/server'
import { ROLE_LABELS, QUESTION_TYPE_LABELS } from '@/config/llm'

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-zinc-600">—</span>
  const color =
    score >= 20 ? 'text-emerald-400' :
    score >= 15 ? 'text-yellow-400' :
    'text-red-400'
  return <span className={`text-sm font-mono font-medium ${color}`}>{score}/25</span>
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40',
    active: 'bg-blue-950/40 text-blue-400 border border-blue-800/40',
    abandoned: 'bg-zinc-800 text-zinc-500',
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${styles[status] ?? styles.abandoned}`}>
      {status}
    </span>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { sessions } = await getSessions()

  const completed = sessions?.filter((s: { status: string }) => s.status === 'completed') ?? []
  const scores = completed
    .map((s: { evaluations?: { overall_score: number }[] }) => s.evaluations?.[0]?.overall_score)
    .filter((s: number | undefined): s is number => typeof s === 'number')

  const avgScore = scores.length
    ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
        <span className="text-sm font-semibold text-zinc-100">Pookie</span>
        <Link
          href="/"
          className="text-xs bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-3 py-1.5 rounded-md font-medium transition-colors"
        >
          New session
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Session History</h1>
          <p className="text-zinc-500 text-sm mt-1">{user.email}</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-2xl font-bold font-mono text-zinc-100">{completed.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Completed sessions</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-2xl font-bold font-mono text-zinc-100">{avgScore ?? '—'}</p>
            <p className="text-xs text-zinc-500 mt-1">Avg score (/ 25)</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-2xl font-bold font-mono text-zinc-100">
              {sessions?.length ?? 0}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Total attempts</p>
          </div>
        </div>

        {/* Sessions list */}
        {!sessions || sessions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-sm">No sessions yet.</p>
            <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-200 mt-2 block">
              Start your first interview →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session: {
              id: string
              status: string
              question_type: string
              role: string
              started_at: string
              hints_used: number
              evaluations?: { overall_score: number }[]
            }) => {
              const score = session.evaluations?.[0]?.overall_score ?? null
              const date = new Date(session.started_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })
              const href = session.status === 'completed'
                ? `/session/${session.id}/results`
                : `/session/${session.id}`

              return (
                <Link
                  key={session.id}
                  href={href}
                  className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-200">
                        {QUESTION_TYPE_LABELS[session.question_type] ?? session.question_type}
                      </span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-xs text-zinc-500">
                        {ROLE_LABELS[session.role] ?? session.role}
                      </span>
                      <StatusBadge status={session.status} />
                    </div>
                    <p className="text-xs text-zinc-600">
                      {date} · {session.hints_used} hint{session.hints_used !== 1 ? 's' : ''} used
                    </p>
                  </div>
                  <ScorePill score={score} />
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

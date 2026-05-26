import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Evaluation, Session } from '@/types'

interface ResultsViewProps {
  session: Session
  evaluation: Evaluation
}

const DIMENSION_LABELS: Record<string, string> = {
  data_strategy: 'Data Strategy',
  architecture: 'Architecture',
  success_metrics: 'Success Metrics',
  model_selection: 'Model Selection & Trade-offs',
  evaluation_safety: 'Evaluation & Safety',
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 4 ? 'text-emerald-400 border-emerald-700' :
    score >= 3 ? 'text-yellow-400 border-yellow-700' :
    'text-red-400 border-red-700'
  return (
    <Badge variant="outline" className={`font-mono text-xs ${tone}`}>
      {score}/5
    </Badge>
  )
}

function OverallBand({ score }: { score: number }) {
  if (score >= 23) return { label: 'Exceptional', color: 'text-emerald-400' }
  if (score >= 18) return { label: 'Strong', color: 'text-blue-400' }
  if (score >= 13) return { label: 'Developing', color: 'text-yellow-400' }
  if (score >= 8) return { label: 'Early', color: 'text-orange-400' }
  return { label: 'Not ready', color: 'text-red-400' }
}

export function ResultsView({ session, evaluation }: ResultsViewProps) {
  const band = OverallBand({ score: evaluation.overall_score })

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 px-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Session Results</h1>
        <p className="text-zinc-500 text-sm mt-1">{session.generated_question}</p>
      </div>

      {/* Overall score */}
      <div className="flex items-center gap-4 py-4 border-y border-zinc-800">
        <div>
          <span className="text-5xl font-bold font-mono text-zinc-100">{evaluation.overall_score}</span>
          <span className="text-zinc-500 font-mono text-lg">/25</span>
        </div>
        <div>
          <span className={`text-lg font-semibold ${band.color}`}>{band.label}</span>
          <p className="text-xs text-zinc-500 mt-0.5">
            {session.hints_used} hint{session.hints_used !== 1 ? 's' : ''} used
          </p>
        </div>
      </div>

      {/* Feedback summary */}
      <div>
        <p className="text-sm text-zinc-300 leading-relaxed">{evaluation.feedback_summary}</p>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Rubric breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Rubric Breakdown
        </h2>
        <div className="space-y-4">
          {Object.entries(evaluation.rubric_scores).map(([key, score]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-zinc-200">
                  {DIMENSION_LABELS[key] ?? key}
                </span>
                <ScoreBadge score={score as number} />
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-2">
                <div
                  className="h-1.5 rounded-full bg-zinc-400"
                  style={{ width: `${((score as number) / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {evaluation.rubric_feedback[key]}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Strengths and gaps */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-3">
            Strengths
          </h2>
          <ul className="space-y-2">
            {evaluation.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-300">
                <span className="text-emerald-500 mt-0.5 flex-shrink-0">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-3">
            Gaps
          </h2>
          <ul className="space-y-2">
            {evaluation.gaps.map((g, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-300">
                <span className="text-red-500 mt-0.5 flex-shrink-0">–</span>
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Sample answer */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Model Answer
        </h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {evaluation.sample_answer}
          </p>
        </div>
        <p className="text-xs text-zinc-600 mt-2">
          Based on curated reference answers. Rubric coverage ≠ real interview pass rate.
        </p>
      </div>
    </div>
  )
}

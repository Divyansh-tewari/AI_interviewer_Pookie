'use server'

import { createClient } from '@/lib/supabase/server'
import { evaluateSession } from '@/lib/ai/evaluator'
import type { QuestionType, InterviewRole, Message } from '@/types'

export async function runEvaluation(sessionId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  // Fetch session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) return { error: 'Session not found' }

  // Mark session as completed first
  await supabase
    .from('sessions')
    .update({ status: 'completed', ended_at: new Date().toISOString() })
    .eq('id', sessionId)

  // Fetch conversation
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (!messages || messages.length === 0) {
    return { error: 'No messages found for evaluation' }
  }

  // Run evaluation via LLM
  let evaluation
  try {
    evaluation = await evaluateSession({
      sessionId,
      questionType: session.question_type as QuestionType,
      role: session.role as InterviewRole,
      question: session.generated_question,
      conversation: messages as Message[],
    })
  } catch {
    return { error: 'Evaluation failed. Check your API key.' }
  }

  // Save evaluation to DB
  const { data: savedEval, error: evalError } = await supabase
    .from('evaluations')
    .insert({ session_id: sessionId, ...evaluation })
    .select()
    .single()

  if (evalError) return { error: evalError.message }

  return { evaluation: savedEval }
}

export async function getEvaluation(sessionId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { data: evaluation, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (error) return { error: error.message }
  return { evaluation }
}

export async function getSessions() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated', sessions: [] }

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*, evaluations(overall_score)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { error: error.message, sessions: [] }
  return { sessions }
}

'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateQuestion } from '@/lib/ai/pookie'
import { defaultInterviewConfig } from '@/config/llm'
import type { QuestionType, InterviewRole } from '@/types'

const createSessionSchema = z.object({
  questionType: z.enum(['ai_system_design']),
  role: z.enum(['apm', 'pm', 'sr_pm', 'gpm']),
  timerMinutes: z.number().min(10).max(90).default(45),
})

export async function createSession(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const input = createSessionSchema.safeParse({
    questionType: formData.get('questionType') || defaultInterviewConfig.questionType,
    role: formData.get('role') || defaultInterviewConfig.role,
    timerMinutes: Number(formData.get('timerMinutes')) || defaultInterviewConfig.timerMinutes,
  })

  if (!input.success) return { error: 'Invalid input' }

  const { questionType, role, timerMinutes } = input.data

  // Generate a fresh question via LLM
  let generatedQuestion: string
  try {
    generatedQuestion = await generateQuestion(questionType as QuestionType, role as InterviewRole)
  } catch {
    return { error: 'Failed to generate question. Check your API key.' }
  }

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      question_type: questionType,
      role,
      status: 'active',
      generated_question: generatedQuestion,
      timer_minutes: timerMinutes,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Insert Pookie's opening message
  const openingMessage = `Let's get started. You have ${timerMinutes} minutes.

${generatedQuestion}

Take your time to clarify the problem before diving into your answer. I'll follow up as you go.`

  await supabase.from('messages').insert({
    session_id: session.id,
    role: 'assistant',
    content: openingMessage,
    message_type: 'system',
  })

  revalidatePath('/dashboard')
  return { sessionId: session.id }
}

export async function getSession(sessionId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (error) return { error: error.message }
  return { session }
}

export async function abandonSession(sessionId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  await supabase
    .from('sessions')
    .update({ status: 'abandoned', ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
}

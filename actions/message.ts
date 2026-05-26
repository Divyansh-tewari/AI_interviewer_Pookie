'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getPookieResponse } from '@/lib/ai/pookie'
import type { Message, QuestionType, InterviewRole } from '@/types'

const sendMessageSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  isHintRequest: z.boolean().default(false),
})

export async function sendMessage(
  sessionId: string,
  content: string,
  isHintRequest = false
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const input = sendMessageSchema.safeParse({ sessionId, content, isHintRequest })
  if (!input.success) return { error: 'Invalid input' }

  // Fetch session to verify ownership and get context
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) return { error: 'Session not found' }
  if (session.status !== 'active') return { error: 'Session is not active' }

  // Check hint limit
  if (isHintRequest && session.hints_used >= 3) {
    return { error: 'Hint limit reached (3 per session). Push through on your own!' }
  }

  // Save user message to DB
  await supabase.from('messages').insert({
    session_id: sessionId,
    role: 'user',
    content,
    message_type: isHintRequest ? 'hint' : 'response',
  })

  // Fetch full conversation history for Pookie context
  const { data: history } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  const messages: Message[] = history || []

  // Get Pookie's response
  let pookieResponse: { content: string; messageType: 'response' | 'hint' | 'nudge' | 'follow_up' }
  try {
    pookieResponse = await getPookieResponse(
      session.question_type as QuestionType,
      session.role as InterviewRole,
      session.generated_question,
      messages,
      session.hints_used,
      isHintRequest
    )
  } catch {
    return { error: 'Failed to get response from Pookie. Check your API key.' }
  }

  // Save Pookie's response to DB
  const { data: assistantMessage, error: msgError } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      role: 'assistant',
      content: pookieResponse.content,
      message_type: pookieResponse.messageType,
    })
    .select()
    .single()

  if (msgError) return { error: msgError.message }

  // Increment hint counter if needed
  if (isHintRequest) {
    await supabase
      .from('sessions')
      .update({ hints_used: session.hints_used + 1 })
      .eq('id', sessionId)
  }

  return { message: assistantMessage }
}

export async function getMessages(sessionId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated', messages: [] }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) return { error: error.message, messages: [] }
  return { messages: messages as Message[] }
}

export type QuestionType = 'ai_system_design'

export type InterviewRole = 'apm' | 'pm' | 'sr_pm' | 'gpm'

export type SessionStatus = 'active' | 'completed' | 'abandoned'

export type MessageRole = 'user' | 'assistant'

export type MessageType = 'response' | 'hint' | 'nudge' | 'follow_up' | 'system'

export interface Session {
  id: string
  user_id: string
  question_type: QuestionType
  role: InterviewRole
  status: SessionStatus
  generated_question: string
  started_at: string
  ended_at: string | null
  timer_minutes: number
  hints_used: number
  created_at: string
}

export interface Message {
  id: string
  session_id: string
  role: MessageRole
  content: string
  message_type: MessageType
  created_at: string
}

export interface Evaluation {
  id: string
  session_id: string
  rubric_scores: Record<string, number>
  rubric_feedback: Record<string, string>
  overall_score: number
  strengths: string[]
  gaps: string[]
  sample_answer: string
  feedback_summary: string
  sources_cited: string[]
  confidence_scores: Record<string, number>
  created_at: string
}

export interface LLMConfig {
  provider: 'anthropic' | 'openai'
  model: string
  maxTokens: number
  temperature: number
}

export interface InterviewConfig {
  timerMinutes: number
  questionType: QuestionType
  role: InterviewRole
  maxHints: number
}

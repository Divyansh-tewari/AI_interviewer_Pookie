import type { LLMConfig, InterviewConfig } from '@/types'

// LLM provider and model — change this file to swap models without touching code
export const llmConfig: LLMConfig = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-5',
  maxTokens: 1500,
  temperature: 0.7,
}

// Model used for end-of-session evaluation (can be the same or heavier model)
export const evalLlmConfig: LLMConfig = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-5',
  maxTokens: 3000,
  temperature: 0.3, // lower temp for more consistent rubric scoring
}

// Default interview configuration
export const defaultInterviewConfig: InterviewConfig = {
  timerMinutes: 45,
  questionType: 'ai_system_design',
  role: 'sr_pm',
  maxHints: 3,
}

export const ROLE_LABELS: Record<string, string> = {
  apm: 'Associate PM',
  pm: 'Product Manager',
  sr_pm: 'Senior PM',
  gpm: 'Group PM',
}

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  ai_system_design: 'AI System Design',
}

import Anthropic from '@anthropic-ai/sdk'
import { evalLlmConfig } from '@/config/llm'
import { loadRubric, loadSampleAnswer } from './content'
import type { Message, QuestionType, InterviewRole, Evaluation } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface EvaluationInput {
  sessionId: string
  questionType: QuestionType
  role: InterviewRole
  question: string
  conversation: Message[]
}

// Run end-of-session rubric evaluation
export async function evaluateSession(input: EvaluationInput): Promise<Omit<Evaluation, 'id' | 'session_id' | 'created_at'>> {
  const { questionType, role, question, conversation } = input
  const rubric = loadRubric(questionType)
  const sampleAnswer = loadSampleAnswer(questionType)

  // Compile only user messages for evaluation
  const userResponses = conversation
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n\n---\n\n')

  const fullConversation = conversation
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n')

  const evaluationPrompt = `You are evaluating a ${role.replace('_', ' ')} candidate's AI system design interview response.

## Question Asked
${question}

## Full Interview Conversation
${fullConversation}

## Evaluation Rubric
${rubric}

## Reference Sample Answer (for calibration — do NOT copy this verbatim into feedback)
${sampleAnswer}

## Instructions
Evaluate the candidate strictly and honestly. Do not inflate scores. This evaluation will be used to track real learning progress.

Return your evaluation as a valid JSON object with this exact structure:
{
  "rubric_scores": {
    "data_strategy": <1-5>,
    "architecture": <1-5>,
    "success_metrics": <1-5>,
    "model_selection": <1-5>,
    "evaluation_safety": <1-5>
  },
  "rubric_feedback": {
    "data_strategy": "<specific feedback on what was covered and what was missing>",
    "architecture": "<specific feedback>",
    "success_metrics": "<specific feedback>",
    "model_selection": "<specific feedback>",
    "evaluation_safety": "<specific feedback>"
  },
  "overall_score": <sum of rubric_scores, max 25>,
  "strengths": ["<specific thing done well>", "<another strength>"],
  "gaps": ["<specific gap>", "<another gap>"],
  "feedback_summary": "<2-3 sentence overall assessment — be direct and honest>",
  "sources_cited": ["DASME framework", "Rubric v1"],
  "confidence_scores": {
    "data_strategy": <0.0-1.0, your confidence in this score>,
    "architecture": <0.0-1.0>,
    "success_metrics": <0.0-1.0>,
    "model_selection": <0.0-1.0>,
    "evaluation_safety": <0.0-1.0>
  }
}

Return ONLY the JSON object. No preamble, no explanation outside the JSON.`

  const response = await client.messages.create({
    model: evalLlmConfig.model,
    max_tokens: evalLlmConfig.maxTokens,
    messages: [{ role: 'user', content: evaluationPrompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected LLM response type')

  const parsed = JSON.parse(content.text.trim())

  // Generate a grounded sample answer based on the reference
  const sampleAnswerPrompt = `Based on the following reference answer for the question "${question}", generate a concise model answer (300-400 words) that demonstrates what an excellent ${role.replace('_', ' ')} candidate response looks like.

Reference answer:
${sampleAnswer.substring(0, 2000)}

Return only the model answer text. Keep it practical and specific.`

  const sampleResponse = await client.messages.create({
    model: evalLlmConfig.model,
    max_tokens: 800,
    messages: [{ role: 'user', content: sampleAnswerPrompt }],
  })

  const sampleContent = sampleResponse.content[0]
  if (sampleContent.type !== 'text') throw new Error('Unexpected LLM response type')

  return {
    rubric_scores: parsed.rubric_scores,
    rubric_feedback: parsed.rubric_feedback,
    overall_score: parsed.overall_score,
    strengths: parsed.strengths,
    gaps: parsed.gaps,
    sample_answer: sampleContent.text.trim(),
    feedback_summary: parsed.feedback_summary,
    sources_cited: parsed.sources_cited,
    confidence_scores: parsed.confidence_scores,
  }
}

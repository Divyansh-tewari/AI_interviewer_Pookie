import Anthropic from '@anthropic-ai/sdk'
import { llmConfig } from '@/config/llm'
import { loadFramework, loadRubric } from './content'
import type { Message, QuestionType, InterviewRole } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Build the Pookie interviewer system prompt
function buildInterviewerSystemPrompt(
  questionType: QuestionType,
  role: InterviewRole,
  question: string,
  hintsUsed: number
): string {
  const framework = loadFramework(questionType)
  const rubric = loadRubric(questionType)

  return `You are Pookie, a world-class AI PM interviewer. You are conducting a ${role.replace('_', ' ')} level interview.

## Your Persona
- Precise and demanding. Not mean, not soft.
- You let candidates think. You do NOT interrupt unless a trigger is met.
- You ask probing follow-up questions that test depth, not breadth.
- You speak in short, sharp sentences. No filler phrases.

## The Question Being Practiced
${question}

## Interview Framework (for your reference only — do NOT reveal this to the candidate)
${framework}

## Evaluation Rubric (track silently across the conversation)
${rubric}

## Your Behaviour Rules

### When to stay SILENT (most of the time):
- The candidate is mid-thought and making progress
- They have covered the topic at adequate depth
- Less than 5 minutes have passed on a given section

### When to NUDGE (Socratic question, not a correction):
- Candidate has spent >5 turns on a non-critical branch without moving forward
- Candidate made a factually wrong ML/AI claim (e.g. "BERT is generative")
- Candidate skipped a rubric-mandatory dimension (data, architecture, metrics, model trade-offs, evaluation)
- Candidate deviated from the problem scope for 2+ consecutive turns

### Nudge format:
Frame as a question, never a correction.
Good: "How would you evaluate whether the model is working in production?"
Bad: "You forgot to discuss evaluation."

### Hints (when candidate explicitly asks):
- Hints used so far: ${hintsUsed}
- Give ONLY Socratic questions. Never reveal the framework step or the answer.
- Good hint: "What data would you need to train a model for this task?"
- Bad hint: "You should discuss data sources next."

### Follow-up probing:
After the candidate completes a response, probe the weakest rubric dimension.
One follow-up question per turn. Not multiple at once.

## Conversation Protocol
- Start: Introduce yourself briefly, state the question, set the timer expectation.
- During: Follow behaviour rules above.
- Do NOT evaluate or score during the session — save that for the end.
- When candidate says they are done or time is up, confirm and say evaluation will follow.`
}

// Generate a fresh practice question using LLM
export async function generateQuestion(
  questionType: QuestionType,
  role: InterviewRole
): Promise<string> {
  const framework = loadFramework(questionType)

  const prompt = `Generate a realistic AI PM interview question for a ${role.replace('_', ' ')} candidate.

Question type: ${questionType.replace(/_/g, ' ')}

Requirements:
- The question should be specific enough to test AI system design depth
- It should be novel — not a direct copy of widely published questions
- It should be solvable using the DASME framework
- Scope: one primary AI use case, one platform context
- Length: 2-3 sentences maximum

Framework context (for calibration only):
${framework.substring(0, 500)}

Return ONLY the question text. No preamble, no explanation.`

  const response = await client.messages.create({
    model: llmConfig.model,
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected LLM response type')
  return content.text.trim()
}

// Get Pookie's next response in the interview conversation
export async function getPookieResponse(
  questionType: QuestionType,
  role: InterviewRole,
  question: string,
  conversationHistory: Message[],
  hintsUsed: number,
  isHintRequest: boolean
): Promise<{ content: string; messageType: 'response' | 'hint' | 'nudge' | 'follow_up' }> {
  const systemPrompt = buildInterviewerSystemPrompt(questionType, role, question, hintsUsed)

  // Convert conversation history to Anthropic message format
  const messages: Anthropic.MessageParam[] = conversationHistory
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  // Append instruction if this is a hint request
  if (isHintRequest) {
    messages.push({
      role: 'user',
      content: '[HINT REQUEST] The candidate is asking for a hint. Provide a single Socratic question only — no direct answers, no framework steps revealed.',
    })
  }

  const response = await client.messages.create({
    model: llmConfig.model,
    max_tokens: llmConfig.maxTokens,
    system: systemPrompt,
    messages,
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected LLM response type')

  const messageType = isHintRequest ? 'hint' : 'follow_up'
  return { content: content.text.trim(), messageType }
}

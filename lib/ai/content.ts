import fs from 'fs'
import path from 'path'

// Load .md content files at runtime (server-side only)
export function loadRubric(questionType: string): string {
  const filePath = path.join(process.cwd(), 'content', 'rubrics', `${questionType}.md`)
  return fs.readFileSync(filePath, 'utf-8')
}

export function loadFramework(questionType: string): string {
  const filePath = path.join(process.cwd(), 'content', 'frameworks', `${questionType}.md`)
  return fs.readFileSync(filePath, 'utf-8')
}

export function loadSampleAnswer(questionType: string): string {
  const filePath = path.join(process.cwd(), 'content', 'sample-answers', `${questionType}.md`)
  return fs.readFileSync(filePath, 'utf-8')
}

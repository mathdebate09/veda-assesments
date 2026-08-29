export interface VisionPromptConfig {
  extractQuestions: string;
  extractAnswers: (questionList: string) => string;
}

export interface VisionConfig {
  model: string;
  questionMaxTokens: number;
  answerMaxTokens: number;
  temperature: number;
  prompts: VisionPromptConfig;
}

export interface GradingPromptConfig {
  gradeAnswer: string;
}

export interface GradingConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  prompts: GradingPromptConfig;
}

export interface EvaluationPromptConfig {
  generateSummary: string;
}

export interface EvaluationConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  prompts: EvaluationPromptConfig;
}

export interface AiConfig {
  vision: VisionConfig;
  grading: GradingConfig;
  evaluation: EvaluationConfig;
}

export const getAiConfig = (): AiConfig => ({
  vision: {
    model: 'deepseek-v4-flash-vision-exp',
    questionMaxTokens: parseInt(process.env.VISION_QUESTION_MAX_TOKENS || '20000', 10),
    answerMaxTokens: parseInt(process.env.VISION_ANSWER_MAX_TOKENS || '80000', 10),
    temperature: parseFloat(process.env.VISION_TEMPERATURE || '0.1'),
    prompts: {
      extractQuestions: `You are a high-speed document OCR and exam paper parser.
Extract all questions from the provided question paper page images.
Output ONLY valid JSON — no markdown, no code fences, no explanations.
Do NOT solve equations, do NOT calculate answers, do NOT debate typos. Transcribe text verbatim.

JSON shape:
{
  "header": {
    "subject": string | null,
    "className": string | null,
    "maxMarks": number | null,
    "duration": string | null
  },
  "questions": [
    {
      "number": string,
      "subPart": string | null,
      "displayId": string,
      "text": string,
      "maxMarks": number | null
    }
  ]
}

Rules:
- "number" is always a string (e.g. "1", "2", "11")
- "subPart" is a single lowercase letter or null (e.g. "a", "b", null)
- "displayId" = number + subPart concatenated (e.g. "1a") or just number when subPart is null
- "text" is the full question text including all instructions and all multiple choice options
- "maxMarks" extracted from the paper if visible (e.g. "[5 marks]", "(5)", "1"), otherwise null
- Preserve the original printed order of questions
- Include ALL questions and ALL labelled sub-parts as separate items`,
      extractAnswers: (questionList: string) => `You are a high-speed exam answer sheet OCR parser.
Analyse every page of the student answer sheet and extract every written answer block.
Output ONLY valid JSON — no markdown, no code fences, no explanations.
Do NOT grade or solve the questions. Transcribe the student's handwriting verbatim.

The exam contains these questions:
${questionList}

JSON shape:
{
  "answers": [
    {
      "questionRef": string,
      "text": string,
      "segments": [
        {
          "pageIndex": number,
          "boundingBox": { "x": number, "y": number, "width": number, "height": number }
        }
      ]
    }
  ]
}

Rules:
- "questionRef" must match one of the provided displayIds exactly (e.g. "1a", "2", "11b").
  If the student's label cannot be matched, use the label the student wrote as-is.
- "text" is the complete verbatim transcription. Note strikethroughs as "[crossed out: ...]".
- "segments" must have one entry for EACH page the answer spans (multi-page answers are supported).
- "pageIndex" is 0-based (first page = 0).
- "boundingBox" values are FRACTIONAL (0.0–1.0) relative to the full page dimensions:
    x      = left edge  / page width
    y      = top edge   / page height
    width  = block width  / page width
    height = block height / page height
- Include ALL detected answer blocks, including blank/unattempted ones (text = "").
- Preserve the order in which answers appear on the sheet.`,
    },
  },
  grading: {
    model: 'deepseek-v4-flash',
    maxTokens: parseInt(process.env.GRADING_MAX_TOKENS || '50000', 10),
    temperature: parseFloat(process.env.GRADING_TEMPERATURE || '0.1'),
    prompts: {
      gradeAnswer: `You are a strict but fair school exam evaluator.
Given a question, the student's answer, and the maximum marks available,
evaluate the answer and return a JSON object.
Return ONLY valid JSON. No explanation, no markdown, no code fences.
JSON shape: { marksAwarded: number, isCorrect: boolean, aiFeedback: string }
marksAwarded must be between 0 and maxMarks.
Partial credit is allowed for partially correct answers.
aiFeedback should be 2-3 sentences: what was correct, what was missing.`,
    },
  },
  evaluation: {
    model: 'deepseek-v4-flash',
    maxTokens: parseInt(process.env.SUMMARY_MAX_TOKENS || '30000', 10),
    temperature: parseFloat(process.env.SUMMARY_TEMPERATURE || '0.3'),
    prompts: {
      generateSummary: `You are a teacher writing an end-of-exam performance report for a student.
Return ONLY valid JSON. No explanation, no markdown, no code fences.
JSON shape: {
  "overallFeedback": string,
  "strengths": string[],
  "improvements": string[]
}`,
    },
  },
});

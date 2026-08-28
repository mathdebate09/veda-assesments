export interface VisionConfig {
  model: string;
  questionMaxTokens: number;
  answerMaxTokens: number;
  temperature: number;
}

export interface GradingConfig {
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface EvaluationConfig {
  model: string;
  maxTokens: number;
  temperature: number;
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
  },
  grading: {
    model: 'deepseek-v4-flash',
    maxTokens: parseInt(process.env.GRADING_MAX_TOKENS || '50000', 10),
    temperature: parseFloat(process.env.GRADING_TEMPERATURE || '0.1'),
  },
  evaluation: {
    model: 'deepseek-v4-flash',
    maxTokens: parseInt(process.env.SUMMARY_MAX_TOKENS || '30000', 10),
    temperature: parseFloat(process.env.SUMMARY_TEMPERATURE || '0.3'),
  },
});

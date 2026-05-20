import OpenAI from 'openai';

export interface LlmRuntime {
  model: string;
  baseUrl: string;
}

export function readLlmEnv(): LlmRuntime {
  return {
    model: process.env.LLM_MODEL ?? process.env.OPENAI_MODEL ?? 'deepseek-chat',
    baseUrl:
      process.env.LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? 'https://api.deepseek.com',
  };
}

export function hasApiKey(): boolean {
  return Boolean(process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY);
}

/** Returns null when no key configured (caller returns 500). */
export function createOpenAi(): OpenAI | null {
  const apiKey = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const { baseUrl } = readLlmEnv();
  return new OpenAI({ apiKey, baseURL: baseUrl });
}

export type Language = 'en' | 'zh';

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'zh';
}

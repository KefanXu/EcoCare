/// <reference types="vite/client" />
import { createElement, Fragment, useCallback, type ReactNode } from 'react';
import { useEcoStore } from '../store/useEcoStore';
import { ZH } from './zh';
import type { Language } from './language';

export { isLanguage, type Language } from './language';

export type TrVars = Record<string, string | number>;
export type Tr = (text: string, vars?: TrVars) => string;

/** English strings that had no Chinese entry (dev only; inspect via `window.__i18nMissing`). */
const missing = new Set<string>();
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __i18nMissing: Set<string> }).__i18nMissing = missing;
}

function fill(text: string, vars?: TrVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/**
 * The English text is the lookup key, so components keep their original copy
 * and Chinese falls back to English for anything not in the dictionary
 * (e.g. text the participant typed or the AI wrote).
 */
export function translate(lang: Language, text: string, vars?: TrVars): string {
  if (lang === 'zh' && text) {
    const zh = ZH[text];
    if (zh !== undefined) return fill(zh, vars);
    if (import.meta.env.DEV && /[A-Za-z]{2}/.test(text)) missing.add(text);
  }
  return fill(text, vars);
}

/** Translate outside React (store actions, prompt builders). */
export function trNow(text: string, vars?: TrVars): string {
  return translate(useEcoStore.getState().language, text, vars);
}

/** Like `tr`, but placeholder values may be React nodes (e.g. a bold number). */
export type TrX = (text: string, vars: Record<string, ReactNode>) => ReactNode;

function translateNodes(lang: Language, text: string, vars: Record<string, ReactNode>): ReactNode {
  const template = translate(lang, text);
  const parts = template.split(/(\{\w+\})/g);
  return createElement(
    Fragment,
    null,
    ...parts.map((part, i) => {
      const key = /^\{(\w+)\}$/.exec(part)?.[1];
      return createElement(Fragment, { key: i }, key && key in vars ? vars[key] : part);
    }),
  );
}

export function useI18n(): { lang: Language; zh: boolean; tr: Tr; trx: TrX } {
  const lang = useEcoStore((s) => s.language);
  const tr = useCallback<Tr>((text, vars) => translate(lang, text, vars), [lang]);
  const trx = useCallback<TrX>((text, vars) => translateNodes(lang, text, vars), [lang]);
  return { lang, zh: lang === 'zh', tr, trx };
}

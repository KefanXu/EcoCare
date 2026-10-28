import { useState } from 'react';
import {
  ChevronDown,
  ClipboardCheck,
  Info,
  Lightbulb,
  Scale,
  Sparkles,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { Markdown } from './Markdown';
import { SpeakButton } from '../common/SpeakButton';
import { useEffectivePatient } from '../../store/useEcoStore';
import { useUiText } from '../../lib/uiText';

type SectionKind = 'happening' | 'ripple' | 'questions' | 'about' | 'effects' | 'tradeoffs' | 'other';

/** Fixed section labels the AI is asked to use, in English and Chinese. */
const KIND_BY_LABEL: Array<[RegExp, SectionKind]> = [
  [/^what['’]s happening$|^发生了什么$/i, 'happening'],
  [/^ripple effects$|^连锁影响$/i, 'ripple'],
  [/^questions for the care team$|^information to clarify$|^向医护团队提的问题$|^需要确认的信息$/i, 'questions'],
  [/^about this strategy$|^关于这个策略$/i, 'about'],
  [/^possible effects$|^可能的影响$/i, 'effects'],
  [/^trade-?offs$|^利弊权衡$/i, 'tradeoffs'],
];

const ICONS: Record<SectionKind, LucideIcon> = {
  happening: Info,
  ripple: Waves,
  questions: ClipboardCheck,
  about: Lightbulb,
  effects: Sparkles,
  tradeoffs: Scale,
  other: Info,
};

interface Section {
  title: string;
  kind: SectionKind;
  body: string;
}

/** A line that is only a bold label (optionally ending in a colon), or a ##–#### heading. */
const HEADER_RE = /^\s*(?:\*\*([^*\n]+?)\*\*\s*[:：]?|#{2,4}\s+(.+?))\s*$/;

export function splitAnswerSections(markdown: string): { intro: string; sections: Section[] } {
  const lines = markdown.split('\n');
  const sections: Section[] = [];
  const intro: string[] = [];
  let current: Section | null = null;
  for (const line of lines) {
    const m = HEADER_RE.exec(line);
    if (m) {
      const title = (m[1] ?? m[2] ?? '').replace(/[:：]\s*$/, '').trim();
      const kind = KIND_BY_LABEL.find(([re]) => re.test(title))?.[1] ?? 'other';
      current = { title, kind, body: '' };
      sections.push(current);
      continue;
    }
    if (current) current.body += `${line}\n`;
    else intro.push(line);
  }
  return {
    intro: intro.join('\n').trim(),
    sections: sections.map((s) => ({ ...s, body: s.body.trim() })).filter((s) => s.body),
  };
}

/** Markdown to one plain line; backticked map ids become their display names. */
function plainText(md: string, nameOf: (idOrLabel: string) => string = (s) => s): string {
  return md
    .replace(/`([^`]+)`/g, (_m, inner: string) => nameOf(inner.trim()))
    .replace(/\*\*|__|[*_>#]/g, '')
    .replace(/^\s*(?:[-*]|\d+[.)])\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function bulletItems(md: string): string[] | null {
  const lines = md.split('\n').filter((l) => l.trim());
  const items = lines.map((l) => /^\s*(?:[-*]|\d+[.)])\s+(.*)$/.exec(l)?.[1]);
  return items.every(Boolean) ? (items as string[]) : null;
}

/**
 * An AI answer as separate, collapsible section cards with larger text, so a
 * long reply reads as a few short blocks. Falls back to plain markdown when the
 * answer has no section labels.
 */
export function AnswerSections({
  markdown,
  size,
  speakable,
}: {
  markdown: string;
  size: 'md' | 'lg';
  /** Show a read-aloud button per section (Easy mode). */
  speakable: boolean;
}) {
  const { intro, sections } = splitAnswerSections(markdown);
  if (sections.length === 0) return <Markdown size={size}>{markdown}</Markdown>;
  return (
    <div className="space-y-2.5">
      {intro && <Markdown size={size}>{intro}</Markdown>}
      {sections.map((s, i) => (
        <SectionCard key={`${s.title}-${i}`} section={s} size={size} speakable={speakable} defaultOpen={i === 0} />
      ))}
    </div>
  );
}

function SectionCard({
  section,
  size,
  speakable,
  defaultOpen,
}: {
  section: Section;
  size: 'md' | 'lg';
  speakable: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { tr, easy } = useUiText();
  const patient = useEffectivePatient();
  const nameOf = (key: string) => {
    const e = patient.entities.find((x) => x.id === key);
    if (e) return tr(easy ? e.easyLabel ?? e.label : e.label);
    const f = patient.flows.find((x) => x.id === key);
    if (f) {
      const src = patient.entities.find((x) => x.id === f.source);
      const tgt = patient.entities.find((x) => x.id === f.target);
      if (src && tgt) return `${tr(src.label)} → ${tr(tgt.label)}`;
    }
    return key;
  };
  const Icon = ICONS[section.kind];
  const preview = plainText(section.body, nameOf);
  const questions = section.kind === 'questions' ? bulletItems(section.body) : null;
  const titleCls = size === 'lg' ? 'text-[17px]' : 'text-[15px]';

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-start gap-2.5 text-left px-3 py-2.5"
      >
        <span className="flex w-7 h-7 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700 mt-0.5">
          <Icon className="w-4 h-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block font-semibold text-slate-900 ${titleCls}`}>{section.title}</span>
          {!open && (
            <span className="block text-sm text-slate-500 truncate mt-0.5">{preview}</span>
          )}
        </span>
        <ChevronDown
          className={`w-5 h-5 shrink-0 text-slate-400 mt-1 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="px-3 pb-3 pl-12">
          {questions ? (
            <ul className="space-y-2">
              {questions.map((q, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 inline-block w-4 h-4 shrink-0 rounded border-2 border-slate-300" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <Markdown size={size}>{q}</Markdown>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Markdown size={size}>{section.body}</Markdown>
          )}
          {speakable && (
            <div className="mt-2">
              <SpeakButton text={`${section.title}. ${preview}`} size="sm" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

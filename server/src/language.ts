/** Interface language sent by the client; anything unexpected is English. */
export type Language = 'en' | 'zh';

export function normalizeLanguage(value: unknown): Language {
  return value === 'zh' ? 'zh' : 'en';
}

/**
 * Reply-language rules appended to the chat / proposal system prompt.
 * The dashboard parses some markers, so those stay in English.
 */
export function buildLanguageInstructions(language: unknown, questionsHeading: string, easy = false): string {
  if (normalizeLanguage(language) !== 'zh') return '';
  const zhQuestions = questionsHeading === 'Information to clarify' ? '需要确认的信息' : '向医护团队提的问题';
  return [
    '## Reply language: Simplified Chinese (简体中文)',
    'The participant is using the Chinese interface. Write every user-facing word in natural, plain Simplified Chinese suitable for older adults, including prose, bullets, strategy names, and question suggestions. Write the way a native speaker would say it in everyday conversation: short sentences, common words, no literal translation of English phrasing (avoid passive "被…" constructions, "进行…", and stacked noun phrases). The case data above is already in Chinese; use those Chinese names for people and things.',
    `Use these Chinese section labels instead of the English ones: "**发生了什么**" for "What's happening", "**连锁影响**" for "Ripple effects", "**${zhQuestions}**" for "${questionsHeading}". For ripple bullets, bold the layer as ${easy ? '**日常照护**, **家庭与生活**, **医护团队**, **服务机构**, or **社会大环境**' : '**个人**, **微观系统**, **中观系统**, **外层系统**, or **宏观系统**'}. For strategy bullets use "**做法：**", "**修复：**", "**代价：**". For follow-ups about an active strategy use "**关于这个策略**", "**可能的影响**", "**利弊权衡**".`,
    'Keep these exactly in English because the dashboard parses them: the heading marker `### Strategy N —` (write the Chinese strategy name after the dash, e.g. `### Strategy 1 — 申请加急预先授权`), the fenced block names `ecology-highlight` / `ecology-proposal`, all JSON keys, and all ids.',
    'Inside JSON blocks, write `title`, `rationale`, every string in `steps`, and any new entity or flow `label`, `description`, and `content` in Chinese. The proposal `title` must match the Chinese name in its `### Strategy N —` heading.',
    'When you put an existing entity or flow in backticks, use its exact id (for example `insulin-pen`), never the Chinese name, so the chip resolves.',
  ].join('\n');
}

/** Short rule for the JSON-only helpers (follow-ups, classify, suggest-flows). */
export function languageLine(language: unknown, what: string): string {
  return normalizeLanguage(language) === 'zh'
    ? `Write ${what} in natural, plain Simplified Chinese (简体中文), the way a native speaker would say it, not a literal translation. Keep JSON keys, ids, and enum values in English.`
    : '';
}

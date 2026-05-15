import type { ChatContext } from './systemPrompt.js';

/**
 * A FOCUSED system prompt for the /api/followups endpoint.
 *
 * We intentionally avoid reusing `buildSystemPrompt`, because that prompt
 * teaches the model to emit verbose `ecology-highlight` and `ecology-proposal`
 * fenced JSON blocks. When that teaching is in scope, the model often ignores
 * the JSON-array-only follow-ups instruction and instead either (a) continues
 * the previous answer in prose, or (b) emits another `ecology-*` block. Both
 * break our `parseFollowUps` JSON extraction.
 *
 * This prompt gives just enough patient context for the model to generate
 * grounded questions, with no special-format instructions.
 */
export function buildFollowUpsSystemPrompt(ctx: ChatContext): string {
  const lines: string[] = [];

  lines.push(
    'You generate short, click-to-ask follow-up questions for a patient/caregiver ' +
      'using an "Ecological Landscape" dashboard for chronic care. ' +
      'You will be asked to return JSON only \u2014 follow that instruction strictly when it arrives.',
  );

  lines.push('');
  lines.push('## Patient');
  lines.push(`- Name: ${ctx.patient.name}`);
  lines.push(`- Condition: ${ctx.patient.condition}`);
  lines.push(`- Background: ${ctx.patient.background}`);

  lines.push('');
  lines.push('## Active Life-Changing Event');
  lines.push(
    ctx.scenario
      ? `- ${ctx.scenario.name}: ${ctx.scenario.description}`
      : '- None (baseline care ecology).',
  );

  if (ctx.selectedEntities.length > 0 || ctx.selectedFlows.length > 0) {
    lines.push('');
    lines.push('## User has selected');
    for (const e of ctx.selectedEntities) {
      lines.push(`- entity: ${e.label} (${e.category} \u00b7 ${e.layer})`);
    }
    for (const f of ctx.selectedFlows) {
      lines.push(`- flow: ${f.source} \u2192 ${f.target} (${f.kind})`);
    }
  }

  if (ctx.activeConflicts.length > 0) {
    lines.push('');
    lines.push('## Active conflicts in this ecology');
    for (const c of ctx.activeConflicts) {
      lines.push(`- ${c.title}: ${c.description}`);
    }
  }

  return lines.join('\n');
}

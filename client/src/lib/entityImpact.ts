import type { LCE } from '../types/ecology';
import type { Tr } from '../i18n';

/**
 * Plain explanation of how the active LCE impacts one entity.
 * Seeded notes win; participant-marked entities get a short attribution;
 * anything else falls back to a generic line.
 */
export function describeEntityImpact(args: {
  scenario: LCE | null;
  entityId: string;
  easy: boolean;
  userMarked: boolean;
  tr?: Tr;
}): string | null {
  const { scenario, entityId, easy, userMarked, tr = (s: string) => s } = args;
  if (!scenario) return null;

  const note = scenario.impactNotes?.[entityId];
  if (note) return tr(easy ? note.easy : note.standard);

  const eventName = tr(easy ? scenario.easyName ?? scenario.name : scenario.name);
  if (userMarked) {
    return easy
      ? tr('You marked this as affected by "{event}".', { event: eventName })
      : tr('You marked this entity as impacted by "{event}".', { event: eventName });
  }
  return easy
    ? tr('This is affected by "{event}". Tap "Ask the AI helper" to learn how.', { event: eventName })
    : tr('Disrupted by "{event}".', { event: eventName });
}

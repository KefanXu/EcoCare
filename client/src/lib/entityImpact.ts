import type { LCE } from '../types/ecology';

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
}): string | null {
  const { scenario, entityId, easy, userMarked } = args;
  if (!scenario) return null;

  const note = scenario.impactNotes?.[entityId];
  if (note) return easy ? note.easy : note.standard;

  const eventName = easy ? scenario.easyName ?? scenario.name : scenario.name;
  if (userMarked) {
    return easy
      ? `You marked this as hurt by "${eventName}".`
      : `You marked this entity as impacted by "${eventName}".`;
  }
  return easy
    ? `This is affected by "${eventName}".`
    : `Disrupted by "${eventName}".`;
}

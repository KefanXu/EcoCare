import { roleQuestions, sharedQuestions, type IntakeAnswers } from '../../client/src/components/Study/studyIntake';
import type { ParticipantRole } from '../../client/src/lib/participantRoles';

export function completedIntake(role: ParticipantRole): IntakeAnswers {
  return Object.fromEntries([...sharedQuestions, ...roleQuestions[role]].map(q => [q.id, { choices: [q.options[0]] }]));
}

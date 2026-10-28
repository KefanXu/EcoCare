import { isParticipantRole, type ParticipantRole } from './participantRoles';
import { isLanguage, type Language } from '../i18n/language';
import { samplePatient } from '../data/samplePatient';
import type { UiMode } from '../store/useEcoStore';

export interface StudyConfig {
  role?: ParticipantRole;
  eventId?: string;
  baselineEventId?: string;
  lang?: Language;
  mode?: UiMode;
  tour?: 'on' | 'off';
  eventConflict: boolean;
}

export function readStudyConfig(search = typeof window === 'undefined' ? '' : window.location.search): StudyConfig {
  const params = new URLSearchParams(search);
  const role = params.get('role');
  const lang = params.get('lang');
  const mode = params.get('mode');
  const tour = params.get('tour');
  const eventId = samplePatient.scenarios.find(sc => sc.id === params.get('event'))?.id;
  const baselineEventId = samplePatient.scenarios.find(sc => sc.id === params.get('baseline'))?.id;
  const eventConflict = !!eventId && eventId === baselineEventId;
  return {
    role: isParticipantRole(role) ? role : undefined,
    eventId: eventConflict ? undefined : eventId,
    baselineEventId,
    lang: isLanguage(lang) ? lang : undefined,
    mode: mode === 'standard' || mode === 'easy' ? mode : undefined,
    tour: tour === 'on' || tour === 'off' ? tour : undefined,
    eventConflict,
  };
}

import { readStudyConfig } from './studyConfig';

const search = typeof window === 'undefined' ? '' : window.location.search;
const params = new URLSearchParams(search);
export const studyMode = params.get('study') === '1';
export const studyWorkspace = params.get('studyWorkspace') === '1';
export const workspaceAssignment = studyWorkspace ? readStudyConfig(search) : null;
const id = params.get('session') ?? '';
export const studyStorageKey = studyWorkspace
  ? `ecocare:workspace:${/^[a-zA-Z0-9-]{1,64}$/.test(id) ? id : 'preview'}`
  : 'ecocare:study-shell';

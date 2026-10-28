import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTourSteps, placeTourCard, visibleTourViewport } from '../client/src/components/Onboarding/tourContent';
import { readStudyConfig } from '../client/src/lib/studyConfig';
import { ZH } from '../client/src/i18n/zh';
import { SESSION_PHASES } from '../client/src/components/Onboarding/tourContent';

test('researcher links accept only known roles, modes, languages and events', () => {
  assert.deepEqual(readStudyConfig('?role=caregiver&event=lce-relocation&baseline=lce-insurance&lang=zh&mode=easy&tour=on'), {
    role: 'caregiver', eventId: 'lce-relocation', baselineEventId: 'lce-insurance', lang: 'zh', mode: 'easy', tour: 'on', eventConflict: false,
  });
  const invalid = readStudyConfig('?role=admin&event=missing&lang=fr&mode=other&tour=yes');
  assert.equal(invalid.role, undefined);
  assert.equal(invalid.eventId, undefined);
  assert.equal(invalid.lang, undefined);
  assert.equal(invalid.mode, undefined);
  assert.equal(invalid.tour, undefined);
});

test('the same event cannot be preloaded for both study tasks', () => {
  const config = readStudyConfig('?baseline=lce-insurance&event=lce-insurance');
  assert.equal(config.eventId, undefined);
  assert.equal(config.eventConflict, true);
});

test('procedure keeps the baseline before the tool and adapts the individual decision to each role', () => {
  for (const role of ['patient', 'caregiver', 'clinician'] as const) {
    for (const mode of ['easy', 'standard'] as const) {
      const steps = getTourSteps(role, mode);
      assert.ok(steps.findIndex(s => s.id === 'ready') < steps.findIndex(s => s.id === 'map'));
      assert.match(steps.find(s => s.id === 'ready')!.body, /different life-changing event/);
      assert.match(steps.find(s => s.id === 'finish')!.body, /second questionnaire/);
      assert.equal(new Set(steps.map(s => s.id)).size, steps.length);
      assert.ok(steps.every(s => s.title && s.body));
    }
  }
  assert.match(getTourSteps('patient', 'easy').find(s => s.id === 'decision')!.body, /Imagine you are Jordan/);
  assert.match(getTourSteps('caregiver', 'easy').find(s => s.id === 'decision')!.body, /caregiver/);
  assert.match(getTourSteps('clinician', 'standard').find(s => s.id === 'decision')!.body, /care plan/);
});

test('integrated study tour starts at the tool and explains the on-page decision flow', () => {
  for (const role of ['patient', 'caregiver', 'clinician'] as const) {
    for (const mode of ['easy', 'standard'] as const) {
      const steps = getTourSteps(role, mode, true);
      assert.equal(steps[0].id, 'tool-welcome');
      assert.equal(steps.some(s => ['welcome', 'session', 'ready'].includes(s.id)), false);
      assert.match(steps.find(s => s.id === 'event')!.body, /already selected/);
      assert.match(steps.find(s => s.id === 'finish')!.body, /Ready to make my decision/);
      assert.match(steps.find(s => s.id === 'finish')!.body, /copied into the decision box/);
      assert.equal(new Set(steps.map(s => s.id)).size, steps.length);
      for (const step of steps) {
        for (const text of [step.title, step.body, step.note, ...(step.points ?? [])].filter(Boolean)) assert.ok(ZH[text!], `Missing study tour translation: ${text}`);
      }
    }
  }
});

test('tour surfaces stay on screen, including short and narrow viewports', () => {
  for (const width of [320, 390, 768, 1280, 1920]) {
    for (const height of [240, 640, 900]) {
      for (const target of [null, { left: 4, top: 4, width: 40, height: 40 }, { left: width - 100, top: height - 90, width: 80, height: 60 }, { left: 0, top: 70, width, height: height - 70 }]) {
        const box = placeTourCard({ width, height }, target, 450, !target);
        assert.ok(box.left >= 12 && box.top >= 12);
        assert.ok(box.left + box.width <= width - 12);
        assert.ok(box.top + box.maxHeight <= height - 12);
      }
    }
  }
});

test('embedded tour cards fit the visible part of the study workspace', () => {
  for (const frameTop of [180, 350, -100, -300]) {
    const view = visibleTourViewport(390, 850, frameTop, 844);
    const box = placeTourCard(view, null, 540, true);
    const screenTop = frameTop + view.top + box.top;
    assert.ok(screenTop >= 12);
    assert.ok(screenTop + box.maxHeight <= 844 - 12);
  }
  assert.deepEqual(visibleTourViewport(1280, 720), { width: 1280, height: 720, top: 0 });
});

test('all onboarding content has a Chinese translation for every role and mode', () => {
  const strings = new Set<string>();
  for (const role of ['patient', 'caregiver', 'clinician'] as const) {
    for (const mode of ['easy', 'standard'] as const) {
      for (const step of getTourSteps(role, mode)) {
        [step.phase, step.title, step.body, step.note, ...(step.points ?? [])].filter(Boolean).forEach(text => strings.add(text!));
      }
    }
  }
  SESSION_PHASES.forEach(phase => { strings.add(phase.title); strings.add(phase.text); });
  for (const text of strings) assert.ok(ZH[text], `Missing translation: ${text}`);
});

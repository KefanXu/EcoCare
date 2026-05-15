import type { LCE } from '../types/ecology';

export const lceScenarios: LCE[] = [
  {
    id: 'lce-insurance',
    name: 'Insurance Drops Insulin Coverage',
    description:
      "Jane's employer-sponsored insurance switched formularies. Her current insulin pen is no longer covered, and the alternative requires a prior authorization that may take weeks.",
    disruptsEntityIds: ['insurance', 'insulin-pen', 'med-routine', 'pharmacy', 'treatment-plan'],
    breaksFlowIds: ['f-insurance-plan', 'f-pharm-pen', 'f-medroutine-pen'],
    addsConflicts: [
      {
        id: 'c-insurance-meds',
        title: 'No covered insulin',
        entityIds: ['insurance', 'insulin-pen', 'med-routine'],
        flowIds: ['f-insurance-plan', 'f-pharm-pen'],
        description:
          'The covered drug pathway is severed: pharmacy cannot dispense the current pen, breaking the medication routine and triggering plan revision.',
      },
    ],
    suggestedPrompts: [
      'Which entities in my ecology are most disrupted by losing insulin coverage?',
      'What coping strategies could bridge the gap until prior authorization clears?',
      'How should I prioritize a conversation with my primary-care clinician about this?',
    ],
  },
  {
    id: 'lce-relocation',
    name: 'Relocation Away From Family',
    description:
      "Jane and her partner move two hours away for her partner's job. Her daughter, primary-care clinician, podiatrist, and pharmacy are all left behind.",
    disruptsEntityIds: [
      'daughter',
      'primary-care',
      'podiatrist',
      'pharmacy',
      'transportation',
      'clinic-visits',
    ],
    breaksFlowIds: [
      'f-daughter-patient',
      'f-pcp-plan',
      'f-pod-plan',
      'f-pharm-pen',
      'f-pharm-dressings',
      'f-transport-clinic',
      'f-patient-clinic',
    ],
    addsConflicts: [
      {
        id: 'c-relocation-clinics',
        title: 'Lost continuity of care',
        entityIds: ['primary-care', 'podiatrist', 'clinic-visits', 'treatment-plan'],
        flowIds: ['f-pcp-plan', 'f-pod-plan', 'f-clinic-visits'],
        description:
          'Established clinical relationships are severed. The treatment plan loses its authors and the iteration loop stops.',
      },
      {
        id: 'c-relocation-microsystem',
        title: 'Thinner microsystem',
        entityIds: ['daughter', 'partner', 'foot-care-routine'],
        flowIds: ['f-daughter-patient'],
        description:
          'Daughter is no longer nearby; the partner shoulders more caregiving alone, putting pressure on foot care and information processing.',
      },
    ],
    suggestedPrompts: [
      'What information needs to transfer to a new care team after relocation?',
      'How can my partner and I redistribute the caregiving load now that my daughter is far away?',
      'Which ecological entities should I reestablish first in the new location?',
    ],
  },
  {
    id: 'lce-caregiver-surgery',
    name: 'Partner Has Hand Surgery',
    description:
      "Jane's partner needs hand surgery and a 6-week recovery, and can no longer help wrap her foot ulcer or maintain caregiver notes.",
    disruptsEntityIds: ['partner', 'caregiver-notes', 'foot-care-routine'],
    breaksFlowIds: ['f-partner-footroutine', 'f-partner-notes', 'f-notes-clinic'],
    addsConflicts: [
      {
        id: 'c-caregiver-foot',
        title: 'Wound care without dyadic support',
        entityIds: ['patient', 'foot-care-routine', 'foot-dressings'],
        flowIds: ['f-partner-footroutine', 'f-patient-footroutine'],
        description:
          'Jane must perform wound care alone, increasing time, cognitive load, and risk of infection.',
      },
      {
        id: 'c-caregiver-info',
        title: 'Information work falls back on Jane',
        entityIds: ['caregiver-notes', 'clinic-visits'],
        flowIds: ['f-partner-notes', 'f-notes-clinic'],
        description:
          'Without partner-maintained notes, the clinic loses its richest between-visit context.',
      },
    ],
    suggestedPrompts: [
      'What parts of my care ecology depend on my partner that I now need to cover myself?',
      'How can I keep the clinic informed about my foot care during my partner\u2019s recovery?',
      'Which simpler routines could reduce the wound-care burden temporarily?',
    ],
  },
];

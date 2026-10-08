import type { LCE } from '../types/ecology';

export const lceScenarios: LCE[] = [
  {
    id: 'lce-insurance',
    name: 'Insurance Drops Insulin Coverage',
    description:
      "Jordan's employer-sponsored insurance switched formularies. Their current insulin pen is no longer covered, and the alternative requires a prior authorization that may take weeks.",
    easyName: 'Insurance stops covering the insulin pen',
    easyStory:
      'Jordan\u2019s insurance stopped paying for the insulin pen Jordan uses every day. A different insulin is covered, but it needs special approval first, and that can take weeks.',
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
    impactNotes: {
      insurance: {
        standard:
          'The new formulary no longer covers the current insulin pen; coverage now hinges on a prior authorization that may take weeks.',
        easy: 'The insurance company stopped paying for the insulin pen.',
      },
      'insulin-pen': {
        standard:
          'Out-of-pocket cost makes the pen hard to obtain, so supply becomes unreliable until an alternative is approved.',
        easy: 'The pen costs too much now, so it is hard to get.',
      },
      'med-routine': {
        standard:
          'Daily dosing depends on a steady insulin supply; gaps or a switch to a different pen disrupt the established routine.',
        easy: 'Taking medicine every day gets harder without the pen.',
      },
      pharmacy: {
        standard:
          'The pharmacy cannot dispense the current pen under the new plan and must wait on the prior authorization.',
        easy: 'The pharmacy cannot hand out the pen like before.',
      },
      'treatment-plan': {
        standard:
          'The plan assumes the current insulin; the care team must revise dosing and product while coverage is sorted out.',
        easy: 'The care plan has to change to a different medicine.',
      },
    },
  },
  {
    id: 'lce-relocation',
    name: 'Relocation Away From Family',
    description:
      "Jordan and their partner move two hours away for their partner's job. Their daughter, primary-care clinician, podiatrist, and pharmacy are all left behind.",
    easyName: 'Moving two hours away from family',
    easyStory:
      'Jordan and their partner moved two hours away for the partner\u2019s job. Jordan\u2019s daughter, main doctor, foot doctor, and pharmacy are all back in the old town.',
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
    impactNotes: {
      daughter: {
        standard:
          'Now two hours away, the daughter can no longer drop in; everyday check-ins and hands-on help are lost.',
        easy: 'The daughter lives far away now and cannot stop by to help.',
      },
      'primary-care': {
        standard:
          'The established primary-care relationship is left behind; a new clinician must be found and brought up to speed.',
        easy: 'The main doctor is far away now. Jordan needs a new one.',
      },
      podiatrist: {
        standard:
          'Ongoing foot-ulcer follow-up is interrupted until a new podiatrist is found and records are transferred.',
        easy: 'The foot doctor is far away now, so foot checkups stop.',
      },
      pharmacy: {
        standard:
          'The pharmacy that filled insulin and dressings is out of reach; refills must be re-established elsewhere.',
        easy: 'The old pharmacy is too far away to pick up medicine.',
      },
      transportation: {
        standard:
          'Familiar routes and rides no longer apply; getting to any clinic now requires new arrangements.',
        easy: 'The usual rides to the clinic do not work in the new town.',
      },
      'clinic-visits': {
        standard:
          'Scheduled visits with the old care team lapse, breaking the feedback loop that updates the treatment plan.',
        easy: 'The regular doctor visits stop until new ones are set up.',
      },
    },
  },
  {
    id: 'lce-caregiver-surgery',
    name: 'Partner Has Hand Surgery',
    description:
      "Jordan's partner needs hand surgery and a 6-week recovery, and can no longer help wrap their foot ulcer or maintain caregiver notes.",
    easyName: 'Partner needs hand surgery',
    easyStory:
      'Jordan\u2019s partner needs hand surgery and six weeks to recover. During that time the partner cannot help wrap Jordan\u2019s foot sore or keep the care notes.',
    disruptsEntityIds: ['partner', 'caregiver-notes', 'foot-care-routine'],
    breaksFlowIds: ['f-partner-footroutine', 'f-partner-notes', 'f-notes-clinic'],
    addsConflicts: [
      {
        id: 'c-caregiver-foot',
        title: 'Wound care without dyadic support',
        entityIds: ['patient', 'foot-care-routine', 'foot-dressings'],
        flowIds: ['f-partner-footroutine', 'f-patient-footroutine'],
        description:
          'Jordan must perform wound care alone, increasing time, cognitive load, and risk of infection.',
      },
      {
        id: 'c-caregiver-info',
        title: 'Information work falls back on Jordan',
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
    impactNotes: {
      partner: {
        standard:
          'Recovering from hand surgery for about six weeks, the partner cannot wrap the foot ulcer or keep up the caregiver notes.',
        easy: 'The partner hurt their hand and cannot help with care for six weeks.',
      },
      'caregiver-notes': {
        standard:
          'No one is maintaining the between-visit notes, so the clinic loses its richest day-to-day context.',
        easy: 'Nobody is writing the care notes right now.',
      },
      'foot-care-routine': {
        standard:
          'Jordan must do wound care alone, which adds time, cognitive load, and infection risk.',
        easy: 'Jordan has to do the foot bandages alone now.',
      },
    },
  },
];

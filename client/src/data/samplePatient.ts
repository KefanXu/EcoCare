import type { Conflict, EcoEntity, InfoFlow, Patient } from '../types/ecology';
import { lceScenarios } from './lceScenarios';

const entities: EcoEntity[] = [
  // ------ INDIVIDUAL LAYER ------
  {
    id: 'patient',
    label: 'Patient (Jane)',
    category: 'stakeholder',
    layer: 'individual',
    description:
      'A 52-year-old living with Type 2 Diabetes for 9 years and a diabetic foot ulcer for 6 months. Works full-time; lives with her partner.',
  },
  {
    id: 'glucose-monitor',
    label: 'Continuous Glucose Monitor',
    category: 'component',
    layer: 'individual',
    description:
      'A wearable CGM (Dexcom G7) that streams glucose readings to her phone and triggers alarms below 100 mg/dL.',
  },
  {
    id: 'insulin-pen',
    label: 'Insulin Pen',
    category: 'component',
    layer: 'individual',
    description:
      'A pre-filled insulin pen used to dose mealtime insulin. Replaced finger-prick + vial workflow.',
  },
  {
    id: 'foot-dressings',
    label: 'Foot Dressings & Pads',
    category: 'component',
    layer: 'individual',
    description: 'Wound care supplies for the diabetic foot ulcer; replaced daily.',
  },
  {
    id: 'med-routine',
    label: 'Medication Routine',
    category: 'practice',
    layer: 'individual',
    description:
      'Take metformin with breakfast and dinner; bolus insulin before each meal; align timing with family meals.',
  },
  {
    id: 'foot-care-routine',
    label: 'Foot Care Routine',
    category: 'practice',
    layer: 'individual',
    description: 'Daily wound cleaning, redressing, and skin inspection. Wears wide-toe shoes.',
  },
  {
    id: 'glucose-readings',
    label: 'Glucose Readings',
    category: 'information',
    layer: 'individual',
    description: 'Continuous time-series data from the CGM, synced to her phone.',
  },

  // ------ MICROSYSTEM ------
  {
    id: 'partner',
    label: 'Partner (Caregiver)',
    category: 'stakeholder',
    layer: 'microsystem',
    description:
      'Primary informal caregiver. Helps wrap and clean the foot ulcer; verifies clinic instructions.',
  },
  {
    id: 'daughter',
    label: 'Adult Daughter',
    category: 'stakeholder',
    layer: 'microsystem',
    description:
      'Lives nearby; researches diabetes care online and shares findings with Jane.',
  },
  {
    id: 'family-meals',
    label: 'Family Meal Schedule',
    category: 'practice',
    layer: 'microsystem',
    description:
      'Shared breakfast and dinner at fixed times; dietary planning is a family project.',
  },
  {
    id: 'home-pantry',
    label: 'Home Pantry & Diet',
    category: 'component',
    layer: 'microsystem',
    description:
      'Low-glycemic groceries managed by Jane and her partner; constrained by budget.',
  },
  {
    id: 'work-schedule',
    label: 'Work Schedule',
    category: 'practice',
    layer: 'microsystem',
    description:
      'Standing retail job, 30-minute lunch and two 15-minute breaks. Closed-toe-shoe policy.',
  },
  {
    id: 'caregiver-notes',
    label: 'Caregiver Notes',
    category: 'information',
    layer: 'microsystem',
    description:
      'Partner-maintained notes on dressing changes, blood pressure, and questions for the clinic.',
  },

  // ------ MESOSYSTEM ------
  {
    id: 'primary-care',
    label: 'Primary Care Clinician',
    category: 'stakeholder',
    layer: 'mesosystem',
    description:
      'Manages diabetes treatment plan, prescribes metformin and insulin, refers to specialists.',
  },
  {
    id: 'podiatrist',
    label: 'Podiatrist',
    category: 'stakeholder',
    layer: 'mesosystem',
    description: 'Treats the diabetic foot ulcer; recommends offloading pads and footwear.',
  },
  {
    id: 'diabetes-educator',
    label: 'Diabetes Educator',
    category: 'stakeholder',
    layer: 'mesosystem',
    description: 'Coaches insulin technique, glucose interpretation, and lifestyle adjustments.',
  },
  {
    id: 'pharmacy',
    label: 'Local Pharmacy',
    category: 'stakeholder',
    layer: 'mesosystem',
    description:
      'Dispenses prescriptions; runs medication-reminder texts and insurance prior-auth checks.',
  },
  {
    id: 'clinic-visits',
    label: 'Clinic Visits',
    category: 'practice',
    layer: 'mesosystem',
    description:
      'Quarterly primary-care visits and bi-weekly podiatry visits where the care plan is iterated.',
  },
  {
    id: 'treatment-plan',
    label: 'Treatment Plan',
    category: 'information',
    layer: 'mesosystem',
    description:
      'Shared, evolving plan covering medication, foot-care protocol, and target A1C.',
  },

  // ------ EXOSYSTEM ------
  {
    id: 'employer-policy',
    label: 'Employer Footwear Policy',
    category: 'information',
    layer: 'exosystem',
    description:
      'Closed-toe-shoe rule at work; managers can grant medical accommodation but rarely do.',
  },
  {
    id: 'insurance',
    label: 'Health Insurance',
    category: 'stakeholder',
    layer: 'exosystem',
    description:
      'Employer-sponsored plan that determines drug formulary and specialist coverage.',
  },
  {
    id: 'emr',
    label: 'EMR / Patient Portal',
    category: 'component',
    layer: 'exosystem',
    description:
      'Electronic medical record shared across her clinicians; she views labs and messages providers.',
  },
  {
    id: 'transportation',
    label: 'Transportation Access',
    category: 'component',
    layer: 'exosystem',
    description: 'A 30-minute bus ride is the only path to her primary clinic.',
  },

  // ------ MACROSYSTEM ------
  {
    id: 'ada-guidelines',
    label: 'ADA Care Guidelines',
    category: 'information',
    layer: 'macrosystem',
    description: 'American Diabetes Association guidelines that shape clinical decisions.',
  },
  {
    id: 'healthcare-system',
    label: 'Healthcare System',
    category: 'stakeholder',
    layer: 'macrosystem',
    description:
      'Regional hospital network, billing system, and referral norms that her clinics operate within.',
  },
  {
    id: 'cultural-norms',
    label: 'Cultural & Family Norms',
    category: 'information',
    layer: 'macrosystem',
    description:
      'Expectations around food, work, and caregiving that shape daily management decisions.',
  },
];

const flows: InfoFlow[] = [
  // Individual loop
  {
    id: 'f-cgm-readings',
    source: 'glucose-monitor',
    target: 'glucose-readings',
    label: 'streams readings',
    kind: 'data',
    content: 'Glucose values & trends',
    description: 'CGM continuously generates glucose values that the patient interprets.',
  },
  {
    id: 'f-readings-patient',
    source: 'glucose-readings',
    target: 'patient',
    label: 'informs decisions',
    kind: 'data',
    content: 'Current glucose level & low alerts',
    description: 'Jane checks her phone for current glucose before eating, exercising, or dosing.',
  },
  {
    id: 'f-patient-medroutine',
    source: 'patient',
    target: 'med-routine',
    label: 'follows',
    kind: 'feedback',
    content: 'Self-adjusted dosing decisions',
    description: 'She adjusts insulin dosing and timing based on glucose readings and meals.',
  },
  {
    id: 'f-patient-footroutine',
    source: 'patient',
    target: 'foot-care-routine',
    label: 'performs',
    kind: 'feedback',
    content: 'Wound observations & cleaning actions',
    description: 'Daily wound cleaning and inspection.',
  },
  {
    id: 'f-medroutine-pen',
    source: 'med-routine',
    target: 'insulin-pen',
    label: 'uses',
    kind: 'data',
    content: 'Insulin dose & timing',
    description: 'Insulin pen is the tool used to act on the medication routine.',
  },
  {
    id: 'f-footroutine-dressings',
    source: 'foot-care-routine',
    target: 'foot-dressings',
    label: 'consumes',
    kind: 'data',
    content: 'Daily dressing supplies',
    description: 'Routine consumes wound-care supplies daily.',
  },

  // Microsystem
  {
    id: 'f-partner-footroutine',
    source: 'partner',
    target: 'foot-care-routine',
    label: 'assists wound care',
    kind: 'communication',
    content: 'Hands-on wound care assistance',
    description: 'Partner wraps and inspects the foot ulcer with Jane each evening.',
  },
  {
    id: 'f-partner-notes',
    source: 'partner',
    target: 'caregiver-notes',
    label: 'records',
    kind: 'data',
    content: 'Dressing log, BP & clinic questions',
    description: 'Partner logs dressing changes, BP, and questions for the next clinic visit.',
  },
  {
    id: 'f-daughter-patient',
    source: 'daughter',
    target: 'patient',
    label: 'shares research',
    kind: 'communication',
    content: 'Diabetes articles & lifestyle tips',
    description: 'Daughter forwards diabetes articles and discusses them with Jane.',
  },
  {
    id: 'f-meals-medroutine',
    source: 'family-meals',
    target: 'med-routine',
    label: 'anchors timing',
    kind: 'data',
    content: 'Shared meal timing',
    description: 'Insulin and metformin are taken with shared family meals.',
  },
  {
    id: 'f-pantry-meals',
    source: 'home-pantry',
    target: 'family-meals',
    label: 'stocks',
    kind: 'data',
    content: 'Low-glycemic ingredients',
    description: 'Low-glycemic pantry shapes what the family cooks together.',
  },
  {
    id: 'f-work-medroutine',
    source: 'work-schedule',
    target: 'med-routine',
    label: 'constrains',
    kind: 'feedback',
    content: 'Break-window constraints on dosing',
    description: 'Short breaks at work limit when Jane can dose or eat.',
  },

  // Mesosystem
  {
    id: 'f-pcp-plan',
    source: 'primary-care',
    target: 'treatment-plan',
    label: 'authors',
    kind: 'guidance',
    content: 'Medication prescriptions & target A1C',
    description: 'Primary clinician sets and updates the treatment plan.',
  },
  {
    id: 'f-pod-plan',
    source: 'podiatrist',
    target: 'treatment-plan',
    label: 'updates foot care',
    kind: 'guidance',
    content: 'Foot-ulcer protocol & footwear orders',
    description: 'Podiatrist contributes the foot-ulcer protocol.',
  },
  {
    id: 'f-edu-patient',
    source: 'diabetes-educator',
    target: 'patient',
    label: 'coaches',
    kind: 'guidance',
    content: 'Insulin technique & glucose interpretation',
    description: 'Educator coaches Jane on insulin technique and glucose interpretation.',
  },
  {
    id: 'f-plan-medroutine',
    source: 'treatment-plan',
    target: 'med-routine',
    label: 'prescribes',
    kind: 'guidance',
    content: 'Dosing schedule & target A1C',
    description: 'Plan dictates dosing, frequency, and target A1C.',
  },
  {
    id: 'f-plan-footroutine',
    source: 'treatment-plan',
    target: 'foot-care-routine',
    label: 'specifies',
    kind: 'guidance',
    content: 'Wound cleaning protocol & footwear',
    description: 'Plan defines wound cleaning protocol and footwear.',
  },
  {
    id: 'f-pharm-pen',
    source: 'pharmacy',
    target: 'insulin-pen',
    label: 'dispenses',
    kind: 'data',
    content: 'Insulin prescription fill',
    description: 'Pharmacy fills monthly insulin prescription.',
  },
  {
    id: 'f-pharm-dressings',
    source: 'pharmacy',
    target: 'foot-dressings',
    label: 'dispenses',
    kind: 'data',
    content: 'Wound-care supply orders',
    description: 'Wound-care supplies sourced via pharmacy.',
  },
  {
    id: 'f-clinic-visits',
    source: 'clinic-visits',
    target: 'treatment-plan',
    label: 'iterates',
    kind: 'feedback',
    content: 'Visit outcomes & plan revisions',
    description: 'Visits update the plan based on outcomes.',
  },
  {
    id: 'f-patient-clinic',
    source: 'patient',
    target: 'clinic-visits',
    label: 'attends',
    kind: 'feedback',
    content: 'Self-tracked glucose & questions',
    description: 'Jane brings questions and self-tracked data to each visit.',
  },
  {
    id: 'f-notes-clinic',
    source: 'caregiver-notes',
    target: 'clinic-visits',
    label: 'briefs',
    kind: 'communication',
    content: 'At-home observations & vitals log',
    description: 'Partner notes provide context the clinician would otherwise miss.',
  },
  {
    id: 'f-readings-pcp',
    source: 'glucose-readings',
    target: 'primary-care',
    label: 'shares trends',
    kind: 'data',
    content: 'CGM trends shared via portal',
    description: 'CGM trends shared via the patient portal between visits.',
  },

  // Exosystem
  {
    id: 'f-emr-pcp',
    source: 'emr',
    target: 'primary-care',
    label: 'records',
    kind: 'data',
    content: 'Labs, notes & imaging',
    description: 'EMR holds labs, notes, and imaging for the clinician.',
  },
  {
    id: 'f-emr-pod',
    source: 'emr',
    target: 'podiatrist',
    label: 'records',
    kind: 'data',
    content: 'Wound progress documentation',
    description: 'Podiatrist documents wound progress in the same EMR.',
  },
  {
    id: 'f-insurance-plan',
    source: 'insurance',
    target: 'treatment-plan',
    label: 'gates coverage',
    kind: 'guidance',
    content: 'Formulary & prior-auth decisions',
    description: 'Insurance formulary determines which drugs and devices are affordable.',
  },
  {
    id: 'f-employer-work',
    source: 'employer-policy',
    target: 'work-schedule',
    label: 'shapes',
    kind: 'guidance',
    content: 'Footwear & break-time policy',
    description: 'Footwear and break policy constrain Jane during the workday.',
  },
  {
    id: 'f-transport-clinic',
    source: 'transportation',
    target: 'clinic-visits',
    label: 'enables',
    kind: 'data',
    content: 'Bus route access',
    description: 'Bus access determines whether visits are realistic.',
  },

  // Macrosystem
  {
    id: 'f-ada-pcp',
    source: 'ada-guidelines',
    target: 'primary-care',
    label: 'guides',
    kind: 'guidance',
    content: 'Clinical practice guidelines',
    description: 'ADA guidelines shape clinical decisions.',
  },
  {
    id: 'f-system-insurance',
    source: 'healthcare-system',
    target: 'insurance',
    label: 'structures',
    kind: 'guidance',
    content: 'Coverage norms & billing rules',
    description: 'System-level rules govern coverage norms.',
  },
  {
    id: 'f-norms-meals',
    source: 'cultural-norms',
    target: 'family-meals',
    label: 'shapes',
    kind: 'guidance',
    content: 'Food traditions & dietary expectations',
    description: 'Cultural food traditions influence the family table.',
  },
  {
    id: 'f-norms-work',
    source: 'cultural-norms',
    target: 'work-schedule',
    label: 'pressures',
    kind: 'guidance',
    content: 'Workplace presenteeism pressure',
    description: 'Norms about staying employed despite illness.',
  },
];

const baselineConflicts: Conflict[] = [
  {
    id: 'c-work-foot',
    title: 'Closed-toe shoes vs. foot ulcer',
    entityIds: ['employer-policy', 'foot-care-routine', 'work-schedule'],
    flowIds: ['f-employer-work', 'f-work-medroutine'],
    description:
      'Jane needs wide, open footwear for the ulcer, but the employer policy requires closed-toe shoes — a cross-layer conflict between the exosystem and the individual layer.',
  },
];

export const samplePatient: Patient = {
  id: 'jane',
  name: 'Jane',
  condition: 'Type 2 Diabetes + Diabetic Foot Ulcer',
  background:
    'Jane has been managing Type 2 Diabetes for 9 years and developed a diabetic foot ulcer 6 months ago. She works a standing retail job, lives with her partner who is the primary informal caregiver, and sees a primary-care clinician, podiatrist, and diabetes educator regularly.',
  entities,
  flows,
  baselineConflicts,
  scenarios: lceScenarios,
};

import {
  Activity,
  Apple,
  Bandage,
  Box,
  Briefcase,
  Building2,
  ClipboardList,
  Clock,
  CreditCard,
  Database,
  FileText,
  Footprints,
  Globe,
  HeartHandshake,
  HeartPulse,
  Home,
  Hospital,
  IdCard,
  Pill,
  RefreshCcw,
  ScrollText,
  ShoppingBasket,
  Smartphone,
  Stethoscope,
  Syringe,
  User,
  UserCog,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import type { EntityCategory } from '../types/ecology';

const ENTITY_ICON_MAP: Record<string, LucideIcon> = {
  // Individual
  patient: User,
  'glucose-monitor': Activity,
  'insulin-pen': Syringe,
  'foot-dressings': Bandage,
  'med-routine': Pill,
  'foot-care-routine': Footprints,
  'glucose-readings': Database,

  // Microsystem
  partner: HeartHandshake,
  daughter: Users,
  'family-meals': Utensils,
  'home-pantry': ShoppingBasket,
  'work-schedule': Briefcase,
  'caregiver-notes': ClipboardList,

  // Mesosystem
  'primary-care': Stethoscope,
  podiatrist: Footprints,
  'diabetes-educator': UserCog,
  pharmacy: Pill,
  'clinic-visits': Hospital,
  'treatment-plan': FileText,

  // Exosystem
  'employer-policy': IdCard,
  insurance: CreditCard,
  emr: Database,
  transportation: Globe,

  // Macrosystem
  'ada-guidelines': ScrollText,
  'healthcare-system': Building2,
  'cultural-norms': Home,
};

const CATEGORY_FALLBACK: Record<EntityCategory, LucideIcon> = {
  component: Box,
  stakeholder: User,
  information: FileText,
  practice: Clock,
};

export function iconFor(entityId: string, category: EntityCategory): LucideIcon {
  return ENTITY_ICON_MAP[entityId] ?? CATEGORY_FALLBACK[category];
}

export const LCE_ICON_MAP: Record<string, LucideIcon> = {
  'lce-insurance': CreditCard,
  'lce-relocation': Home,
  'lce-caregiver-surgery': HeartPulse,
};

export function iconForScenario(scenarioId: string): LucideIcon {
  return LCE_ICON_MAP[scenarioId] ?? RefreshCcw;
}

export { Apple, Pill, Activity }; // re-export common icons if needed elsewhere

import type {
  EcoEntity,
  EntityCategory,
  Layer,
  Patient,
} from '../../types/ecology';

export interface RingLayer {
  name: Layer;
  label: string;
  innerRadius: number;
  outerRadius: number;
  centerRadius: number;
  isMicrosystem: boolean;
}

export interface CategoryWedge {
  category: EntityCategory;
  startDeg: number;
  endDeg: number;
}

export interface PositionedEntity extends EcoEntity {
  angleDeg: number;
  radius: number;
  x: number;
  y: number;
}

export interface LayoutResult {
  rings: RingLayer[];
  wedges: CategoryWedge[];
  positions: Map<string, PositionedEntity>;
  patientCenter: PositionedEntity | null;
  width: number;
  height: number;
}

const CATEGORY_ORDER: EntityCategory[] = ['component', 'stakeholder', 'practice', 'information'];

const CATEGORY_WEDGE_OFFSET_DEG = -90; // start "component" at top

function polar(angleDeg: number, r: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
}

export function computeLayout(patient: Patient): LayoutResult {
  // Ring metadata (radius units in svg user space)
  const rings: RingLayer[] = [
    {
      name: 'microsystem',
      label: 'MICROSYSTEM',
      innerRadius: 110,
      outerRadius: 290,
      centerRadius: 200,
      isMicrosystem: true,
    },
    {
      name: 'mesosystem',
      label: 'MESOSYSTEM',
      innerRadius: 290,
      outerRadius: 400,
      centerRadius: 345,
      isMicrosystem: false,
    },
    {
      name: 'exosystem',
      label: 'EXOSYSTEM',
      innerRadius: 400,
      outerRadius: 500,
      centerRadius: 450,
      isMicrosystem: false,
    },
    {
      name: 'macrosystem',
      label: 'MACROSYSTEM',
      innerRadius: 500,
      outerRadius: 590,
      centerRadius: 545,
      isMicrosystem: false,
    },
  ];

  // Microsystem wedges (4 quadrants)
  const wedgeSize = 360 / CATEGORY_ORDER.length;
  const wedges: CategoryWedge[] = CATEGORY_ORDER.map((cat, i) => ({
    category: cat,
    startDeg: CATEGORY_WEDGE_OFFSET_DEG + i * wedgeSize,
    endDeg: CATEGORY_WEDGE_OFFSET_DEG + (i + 1) * wedgeSize,
  }));

  const positions = new Map<string, PositionedEntity>();
  let patientCenter: PositionedEntity | null = null;

  // Patient at center
  const patientEntity = patient.entities.find((e) => e.id === 'patient');
  if (patientEntity) {
    // Use top-level `Patient.name` so the center label stays correct even when
    // older persisted ecology still has a stale `Patient (…)` entity label.
    patientCenter = {
      ...patientEntity,
      label: `Patient (${patient.name})`,
      angleDeg: 0,
      radius: 0,
      x: 0,
      y: 0,
    };
    positions.set(patientEntity.id, patientCenter);
  }

  // Other individual-layer entities (e.g. CGM, insulin pen) - place on a small inner ring
  const individualOthers = patient.entities.filter(
    (e) => e.layer === 'individual' && e.id !== 'patient',
  );
  if (individualOthers.length > 0) {
    const innerR = 70;
    individualOthers.forEach((e, i) => {
      const angle = (i / individualOthers.length) * 360 - 90;
      const { x, y } = polar(angle, innerR);
      positions.set(e.id, { ...e, angleDeg: angle, radius: innerR, x, y });
    });
  }

  // Microsystem: distribute entities within their category wedge
  const microsystemEntities = patient.entities.filter((e) => e.layer === 'microsystem');
  for (const wedge of wedges) {
    const inWedge = microsystemEntities.filter((e) => e.category === wedge.category);
    if (inWedge.length === 0) continue;
    // Reserve a small padding inside each wedge
    const padDeg = Math.min(8, wedgeSize * 0.15);
    const start = wedge.startDeg + padDeg;
    const end = wedge.endDeg - padDeg;
    const span = end - start;
    inWedge.forEach((e, i) => {
      const t = inWedge.length === 1 ? 0.5 : i / (inWedge.length - 1);
      const angle = start + t * span;
      const r = rings[0].centerRadius;
      const { x, y } = polar(angle, r);
      positions.set(e.id, { ...e, angleDeg: angle, radius: r, x, y });
    });
  }

  // Mesosystem, Exosystem, Macrosystem: distribute around full ring
  const ringByLayer: Record<string, RingLayer> = {
    mesosystem: rings[1],
    exosystem: rings[2],
    macrosystem: rings[3],
  };
  for (const layerName of ['mesosystem', 'exosystem', 'macrosystem'] as const) {
    const ring = ringByLayer[layerName];
    const inLayer = patient.entities.filter((e) => e.layer === layerName);
    const sorted = [...inLayer].sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category);
      const bi = CATEGORY_ORDER.indexOf(b.category);
      if (ai !== bi) return ai - bi;
      return a.label.localeCompare(b.label);
    });
    sorted.forEach((e, i) => {
      const angle = (i / Math.max(sorted.length, 1)) * 360 - 90;
      const r = ring.centerRadius;
      const { x, y } = polar(angle, r);
      positions.set(e.id, { ...e, angleDeg: angle, radius: r, x, y });
    });
  }

  const macroRing = rings[3];
  const max = macroRing.outerRadius + 60;
  return {
    rings,
    wedges,
    positions,
    patientCenter,
    width: max * 2,
    height: max * 2,
  };
}

function bezierControl(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { mx: number; my: number; cx: number; cy: number } {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const curvature = Math.min(dist * 0.22, 70);
  const nx = -dy / dist;
  const ny = dx / dist;
  return { mx, my, cx: mx + nx * curvature, cy: my + ny * curvature };
}

export function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const { cx, cy } = bezierControl(x1, y1, x2, y2);
  return `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`;
}

/** Midpoint of the quadratic bezier built by `bezierPath`. */
export function bezierMidpoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { x: number; y: number } {
  const { mx, my, cx, cy } = bezierControl(x1, y1, x2, y2);
  // Q(0.5) = 0.25 P0 + 0.5 P1 + 0.25 P2 = 0.5*mid + 0.5*control
  return { x: 0.5 * mx + 0.5 * cx, y: 0.5 * my + 0.5 * cy };
}

/** Build an SVG path along a circle of radius r.
 * The arc direction is clockwise so `textPath` labels render upright. */
export function ringTextPath(r: number): string {
  // Top center starts at angle -90deg => (0, -r)
  // Use two arcs to draw a complete circle
  return `M ${0},${-r} A ${r},${r} 0 1 0 ${0},${r} A ${r},${r} 0 1 0 ${0},${-r}`;
}

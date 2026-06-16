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

export interface RowBand {
  name: Layer;
  label: string;
  y: number;
  height: number;
}

export interface RowLayoutResult {
  bands: RowBand[];
  positions: Map<string, PositionedEntity>;
  patientCenter: PositionedEntity | null;
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

// ── Row layout ────────────────────────────────────────────────────────

const ROW_HEIGHT = 76;
const ROW_GAP = 20;
const ROW_STEP = ROW_HEIGHT + ROW_GAP;
const ROW_X_MIN = -560;
const ROW_X_MAX = 560;
const ROW_USABLE_WIDTH = ROW_X_MAX - ROW_X_MIN;
const PATIENT_Y = -300;

/** Distribute entities for one layer into a horizontal row, grouped by
 * category and spread evenly across the full width so labels never overlap. */
function layoutRow(
  entities: EcoEntity[],
  y: number,
  positions: Map<string, PositionedEntity>,
): void {
  if (entities.length === 0) return;

  // Group by category (in stable order)
  const groups: { cat: EntityCategory; members: EcoEntity[] }[] = [];
  for (const cat of CATEGORY_ORDER) {
    const members = entities.filter((e) => e.category === cat);
    if (members.length > 0) groups.push({ cat, members });
  }

  const totalCount = entities.length;
  const margin = 24;
  const usableWidth = ROW_USABLE_WIDTH - margin * 2;
  const groupGapWidth = groups.length > 1 ? 28 : 0;

  // Give every entity an equal share of the available width;
  // insert a fixed gap between category groups.
  const numGaps = Math.max(0, groups.length - 1);
  const entityPitch =
    (usableWidth - numGaps * groupGapWidth) / totalCount;
  const startX = -usableWidth / 2;

  let cursorX = startX;
  for (const group of groups) {
    for (let i = 0; i < group.members.length; i++) {
      const x = cursorX + (i + 0.5) * entityPitch;
      positions.set(group.members[i].id, {
        ...group.members[i],
        angleDeg: 0,
        radius: 0,
        x,
        y,
      });
    }
    cursorX += group.members.length * entityPitch + groupGapWidth;
  }
}

export function computeRowLayout(patient: Patient): RowLayoutResult {
  // Individual closest to patient, macrosystem farthest.
  const layerOrder: Layer[] = [
    'individual',
    'microsystem',
    'mesosystem',
    'exosystem',
    'macrosystem',
  ];
  const layerLabel: Record<Layer, string> = {
    individual: 'INDIVIDUAL',
    microsystem: 'MICROSYSTEM',
    mesosystem: 'MESOSYSTEM',
    exosystem: 'EXOSYSTEM',
    macrosystem: 'MACROSYSTEM',
  };

  // Compute row band y-positions centered around 0
  const totalHeight = layerOrder.length * ROW_STEP - ROW_GAP;
  const firstY = -totalHeight / 2 + ROW_HEIGHT / 2;
  const bands: RowBand[] = layerOrder.map((name, i) => ({
    name,
    label: layerLabel[name],
    y: firstY + i * ROW_STEP,
    height: ROW_HEIGHT,
  }));

  const positions = new Map<string, PositionedEntity>();
  let patientCenter: PositionedEntity | null = null;

  // Patient — prominent, right above the individual row
  const patientEntity = patient.entities.find((e) => e.id === 'patient');
  if (patientEntity) {
    patientCenter = {
      ...patientEntity,
      label: `Patient (${patient.name})`,
      angleDeg: 0,
      radius: 0,
      x: 0,
      y: PATIENT_Y,
    };
    positions.set(patientEntity.id, patientCenter);
  }

  // Distribute non-patient entities into their layer rows
  for (const layer of layerOrder) {
    const band = bands.find((b) => b.name === layer)!;
    const inLayer = patient.entities.filter(
      (e) => e.layer === layer && e.id !== 'patient',
    );
    layoutRow(inLayer, band.y, positions);
  }

  return { bands, positions, patientCenter };
}

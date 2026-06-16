import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  useEffectivePatient,
  useEntityDisruptionStrengths,
  useFlowBreakStrengths,
  useHighlightedIds,
  useOverlayTagMap,
  useEcoStore,
  type OverlayTag,
} from '../../store/useEcoStore';
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  FLOW_COLOR,
  LAYER_RING_FILL,
  type EntityCategory,
} from '../../types/ecology';
import { iconFor } from '../../lib/entityIcons';
import {
  type PositionedEntity,
  bezierMidpoint,
  bezierPath,
  computeLayout,
  computeRowLayout,
  ringTextPath,
} from './layout';

const NODE_BEZEL_R = 22;
const PATIENT_BEZEL_R = 36;
const DISRUPTED_COLOR = '#fb7185';
const OVERLAY_COLOR = '#10b981';
const HIGHLIGHT_COLOR = '#f59e0b';
const NODE_NUDGE_MAX_PX = 48;
const NODE_DRAG_CLICK_THRESHOLD_PX = 5;

type NodeOffset = { dx: number; dy: number };

function clientToLayout(
  svg: SVGSVGElement,
  layer: SVGGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = layer.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const local = pt.matrixTransform(ctm.inverse());
  return { x: local.x, y: local.y };
}

function clampNodeNudge(dx: number, dy: number): NodeOffset {
  const dist = Math.hypot(dx, dy);
  if (dist <= NODE_NUDGE_MAX_PX) return { dx, dy };
  const k = NODE_NUDGE_MAX_PX / dist;
  return { dx: dx * k, dy: dy * k };
}

function categoryStrokeColor(cat: EntityCategory): string {
  return CATEGORY_COLOR[cat];
}

function ringFill(name: string): string {
  return LAYER_RING_FILL[name as keyof typeof LAYER_RING_FILL] ?? '#ffffff';
}

function parseHex(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const full =
    m.length === 3
      ? m
          .split('')
          .map((c) => c + c)
          .join('')
      : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [r, g, b];
}

function toHex2(n: number): string {
  return Math.round(Math.min(255, Math.max(0, n)))
    .toString(16)
    .padStart(2, '0');
}

/** Linearly interpolate between two hex colors by t in [0,1]. */
function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  const k = Math.min(1, Math.max(0, t));
  const r = ar + (br - ar) * k;
  const g = ag + (bg - ag) * k;
  const bch = ab + (bb - ab) * k;
  return `#${toHex2(r)}${toHex2(g)}${toHex2(bch)}`;
}

export function EcoLandscape({ viewMode }: { viewMode: 'ring' | 'row' }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);

  const patient = useEffectivePatient();
  const selection = useEcoStore((s) => s.selection);
  const hoveredEntityId = useEcoStore((s) => s.hoveredEntityId);
  const hoveredFlowId = useEcoStore((s) => s.hoveredFlowId);
  const entitySearchQuery = useEcoStore((s) => s.entitySearchQuery);
  const showInformationFlows = useEcoStore((s) => s.showInformationFlows);
  const toggleSelection = useEcoStore((s) => s.toggleSelection);
  const setHoveredEntity = useEcoStore((s) => s.setHoveredEntity);
  const setHoveredFlow = useEcoStore((s) => s.setHoveredFlow);
  const editMode = useEcoStore((s) => s.editMode);
  const connectMode = useEcoStore((s) => s.connectMode);
  const pickConnectNode = useEcoStore((s) => s.pickConnectNode);
  const entityStrengths = useEntityDisruptionStrengths();
  const flowStrengths = useFlowBreakStrengths();
  const overlayTags = useOverlayTagMap();
  const highlightIds = useHighlightedIds();

  const [nodeOffsets, setNodeOffsets] = useState<Record<string, NodeOffset>>({});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragRef = useRef<{
    id: string;
    pointerX: number;
    pointerY: number;
    offsetDx: number;
    offsetDy: number;
    moved: boolean;
  } | null>(null);
  const springAnimRef = useRef<number | null>(null);

  const ringLayout = useMemo(() => computeLayout(patient), [patient]);
  const rowLayout = useMemo(() => computeRowLayout(patient), [patient]);

  // ── View transition ──────────────────────────────────────────────
  const [transitionProgress, setTransitionProgress] = useState(0);
  const transitionRef = useRef(0);
  const animatingRef = useRef(false);

  useEffect(() => {
    const target = viewMode === 'row' ? 1 : 0;
    const start = transitionRef.current;
    if (Math.abs(target - start) < 0.001) return;

    animatingRef.current = true;
    const duration = 500; // ms
    const startTime = performance.now();

    const animate = (now: number) => {
      if (!animatingRef.current) return;
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // smoothstep easing: 3t² - 2t³
      const eased = t * t * (3 - 2 * t);
      const current = start + (target - start) * eased;
      transitionRef.current = current;
      setTransitionProgress(current);
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        transitionRef.current = target;
        setTransitionProgress(target);
      }
    };

    requestAnimationFrame(animate);
    return () => {
      animatingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // Interpolated positions — smoothly move entities between layouts
  const positions = useMemo(() => {
    const p = transitionProgress;
    if (p === 0) return ringLayout.positions;
    if (p === 1) return rowLayout.positions;

    const interpolated = new Map<string, PositionedEntity>();
    for (const [id, ringPos] of ringLayout.positions) {
      const rowPos = rowLayout.positions.get(id);
      if (!rowPos) {
        interpolated.set(id, ringPos);
        continue;
      }
      interpolated.set(id, {
        ...ringPos,
        x: ringPos.x + (rowPos.x - ringPos.x) * p,
        y: ringPos.y + (rowPos.y - ringPos.y) * p,
        angleDeg: ringPos.angleDeg + (rowPos.angleDeg - ringPos.angleDeg) * p,
        radius: ringPos.radius + (rowPos.radius - ringPos.radius) * p,
      });
    }
    return interpolated;
  }, [ringLayout, rowLayout, transitionProgress]);

  const transitionActive = transitionProgress > 0.01 && transitionProgress < 0.99;
  const useRowLabel = transitionProgress >= 0.5;

  const setNodeOffset = useCallback((id: string, dx: number, dy: number) => {
    setNodeOffsets((prev) => {
      if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { dx, dy } };
    });
  }, []);

  const springNodeBack = useCallback(
    (id: string, start: NodeOffset) => {
      if (springAnimRef.current !== null) {
        cancelAnimationFrame(springAnimRef.current);
      }
      let dx = start.dx;
      let dy = start.dy;
      let vx = 0;
      let vy = 0;
      const step = () => {
        vx += -dx * 0.26;
        vy += -dy * 0.26;
        vx *= 0.74;
        vy *= 0.74;
        dx += vx;
        dy += vy;
        if (
          Math.hypot(dx, dy) < 0.35 &&
          Math.hypot(vx, vy) < 0.12
        ) {
          setNodeOffset(id, 0, 0);
          springAnimRef.current = null;
          return;
        }
        setNodeOffset(id, dx, dy);
        springAnimRef.current = requestAnimationFrame(step);
      };
      springAnimRef.current = requestAnimationFrame(step);
    },
    [setNodeOffset],
  );

  useEffect(() => {
    return () => {
      if (springAnimRef.current !== null) {
        cancelAnimationFrame(springAnimRef.current);
      }
    };
  }, []);

  const positionedAt = useCallback(
    (id: string, x: number, y: number) => {
      const o = nodeOffsets[id];
      return { x: x + (o?.dx ?? 0), y: y + (o?.dy ?? 0) };
    },
    [nodeOffsets],
  );

  const handleNodePointerDown = useCallback(
    (id: string, e: React.PointerEvent<SVGGElement>) => {
      if (connectMode.active || transitionActive) return;
      if (e.button !== 0) return;
      if (!svgRef.current || !gRef.current) return;

      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);

      if (springAnimRef.current !== null) {
        cancelAnimationFrame(springAnimRef.current);
        springAnimRef.current = null;
      }

      const local = clientToLayout(svgRef.current, gRef.current, e.clientX, e.clientY);
      const existing = nodeOffsets[id];
      dragRef.current = {
        id,
        pointerX: local.x,
        pointerY: local.y,
        offsetDx: existing?.dx ?? 0,
        offsetDy: existing?.dy ?? 0,
        moved: false,
      };
      setDraggingNodeId(id);
    },
    [connectMode.active, nodeOffsets],
  );

  const handleNodePointerMove = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.id === undefined) return;
      if (!svgRef.current || !gRef.current) return;

      const local = clientToLayout(svgRef.current, gRef.current, e.clientX, e.clientY);
      const rawDx = local.x - drag.pointerX;
      const rawDy = local.y - drag.pointerY;
      if (
        !drag.moved &&
        Math.hypot(rawDx, rawDy) >= NODE_DRAG_CLICK_THRESHOLD_PX
      ) {
        drag.moved = true;
      }
      const { dx, dy } = clampNodeNudge(drag.offsetDx + rawDx, drag.offsetDy + rawDy);
      setNodeOffset(drag.id, dx, dy);
    },
    [setNodeOffset],
  );

  const finishNodePointer = useCallback(
    (id: string, onActivate: () => void, e: React.PointerEvent<SVGGElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== id) return;

      e.stopPropagation();
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      const offset = nodeOffsets[id] ?? { dx: 0, dy: 0 };
      const wasDrag = drag.moved;
      dragRef.current = null;
      setDraggingNodeId(null);

      if (wasDrag) {
        springNodeBack(id, offset);
      } else {
        onActivate();
      }
    },
    [nodeOffsets, springNodeBack],
  );

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    const g = d3.select<SVGGElement, unknown>(gRef.current);
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3.0])
      // Lock the ecology to the viewport center — scale only, no pan.
      .constrain((transform) => d3.zoomIdentity.scale(transform.k))
      .filter((event) => {
        if (event.type === 'wheel') return true;
        if (event.type === 'touchstart' || event.type === 'touchmove') {
          return (event as TouchEvent).touches.length >= 2;
        }
        return false;
      })
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });
    svg.call(zoom);
    const initial = d3.zoomIdentity.translate(0, 0).scale(1.0);
    svg.call(zoom.transform, initial);
    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  const selectedSet = useMemo(() => {
    return {
      entities: new Set(selection.filter((s) => s.kind === 'entity').map((s) => s.id)),
      flows: new Set(selection.filter((s) => s.kind === 'flow').map((s) => s.id)),
    };
  }, [selection]);

  const { width, height, rings, wedges } = ringLayout;

  const search = entitySearchQuery.trim().toLowerCase();
  const searchMatchIds = useMemo(() => {
    if (!search) return new Set<string>();
    const ids = new Set<string>();
    for (const p of positions.values()) {
      if (p.label.toLowerCase().includes(search)) ids.add(p.id);
    }
    return ids;
  }, [positions, search]);
  const searchActive = search.length > 0;

  const adjacentEntityIds = useMemo(() => {
    const set = new Set<string>();
    if (hoveredEntityId) {
      patient.flows.forEach((f) => {
        if (f.source === hoveredEntityId) set.add(f.target);
        if (f.target === hoveredEntityId) set.add(f.source);
      });
    }
    return set;
  }, [hoveredEntityId, patient.flows]);

  function handleEntityClick(entityId: string) {
    if (editMode && connectMode.active) {
      pickConnectNode(entityId);
      return;
    }
    toggleSelection({ id: entityId, kind: 'entity' });
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      style={{ cursor: connectMode.active ? 'crosshair' : 'default' }}
    >
      <defs>
        {(['data', 'guidance', 'feedback', 'communication'] as const).map((k) => (
          <marker
            key={k}
            id={`arrow-${k}`}
            viewBox="0 -5 10 10"
            refX="10"
            refY="0"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0,-5L10,0L0,5" fill={FLOW_COLOR[k]} />
          </marker>
        ))}
        <marker
          id="arrow-broken"
          viewBox="0 -5 10 10"
          refX="10"
          refY="0"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0,-5L10,0L0,5" fill="#fb7185" />
        </marker>
        <marker
          id="arrow-overlay"
          viewBox="0 -5 10 10"
          refX="10"
          refY="0"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0,-5L10,0L0,5" fill={OVERLAY_COLOR} />
        </marker>
        <marker
          id="arrow-highlight"
          viewBox="0 -5 10 10"
          refX="10"
          refY="0"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0,-5L10,0L0,5" fill={HIGHLIGHT_COLOR} />
        </marker>

        <filter id="microsystem-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.18" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="select-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {rings.map((r) => (
          <path
            key={`rp-${r.name}`}
            id={`ringPath-${r.name}`}
            d={ringTextPath(r.outerRadius - 14)}
            fill="none"
          />
        ))}
      </defs>

      <g ref={gRef}>
        {/* Ring view backgrounds — fade out during transition */}
        <g opacity={1 - transitionProgress}>
        {/* Render rings outer-to-inner so the inner microsystem sits on top */}
        {[...rings].reverse().map((ring) => {
          const isMicro = ring.isMicrosystem;
          return (
            <g key={ring.name} filter={isMicro ? 'url(#microsystem-shadow)' : undefined}>
              {/* Outer disc */}
              <circle
                cx={0}
                cy={0}
                r={ring.outerRadius}
                fill={ringFill(ring.name)}
                fillOpacity={isMicro ? 0.85 : 0.55}
                stroke="rgba(100,116,139,0.14)"
                strokeWidth={1}
              />
              {/* Donut hole (white inner disc) */}
              {ring.innerRadius > 0 && (
                <circle
                  cx={0}
                  cy={0}
                  r={ring.innerRadius}
                  fill="#ffffff"
                  stroke="rgba(100,116,139,0.14)"
                  strokeWidth={1}
                />
              )}
              {/* Layer label following the outer arc */}
              <text
                fontSize={11}
                letterSpacing={3}
                fill="rgba(71,85,105,0.7)"
                fontWeight={600}
                style={{ pointerEvents: 'none' }}
              >
                <textPath
                  href={`#ringPath-${ring.name}`}
                  startOffset="50%"
                  textAnchor="middle"
                >
                  {ring.label}
                </textPath>
              </text>
            </g>
          );
        })}

        {/* Microsystem category wedge dividers + labels */}
        {(() => {
          const ring = rings[0];
          return (
            <g>
              {wedges.map((w) => {
                const startRad = (w.startDeg * Math.PI) / 180;
                const x1 = Math.cos(startRad) * ring.innerRadius;
                const y1 = Math.sin(startRad) * ring.innerRadius;
                const x2 = Math.cos(startRad) * ring.outerRadius;
                const y2 = Math.sin(startRad) * ring.outerRadius;
                const midDeg = (w.startDeg + w.endDeg) / 2;
                const midRad = (midDeg * Math.PI) / 180;
                const labelR = ring.outerRadius - 16;
                const lx = Math.cos(midRad) * labelR;
                const ly = Math.sin(midRad) * labelR;
                return (
                  <g key={`wedge-${w.category}`}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="rgba(100,116,139,0.25)"
                      strokeWidth={1}
                      strokeDasharray="3 4"
                    />
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={10}
                      letterSpacing={1.5}
                      fill={CATEGORY_COLOR[w.category]}
                      fontWeight={600}
                      style={{
                        textTransform: 'uppercase',
                        pointerEvents: 'none',
                        opacity: 0.85,
                      }}
                    >
                      {CATEGORY_LABEL[w.category]}s
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })()}

        {/* End ring view backgrounds */}
        </g>

        {/* Row view backgrounds — fade in during transition */}
        {transitionProgress > 0 && (
          <g opacity={transitionProgress}>
            {rowLayout.bands.map((band) => (
              <g key={`row-${band.name}`}>
                <rect
                  x={-580}
                  y={band.y - band.height / 2}
                  width={1160}
                  height={band.height}
                  rx={8}
                  fill={ringFill(band.name)}
                  fillOpacity={0.55}
                  stroke="rgba(100,116,139,0.14)"
                  strokeWidth={1}
                />
                <text
                  x={-570}
                  y={band.y}
                  textAnchor="start"
                  dominantBaseline="middle"
                  fontSize={10}
                  letterSpacing={2}
                  fill="rgba(71,85,105,0.6)"
                  fontWeight={600}
                  style={{ pointerEvents: 'none' }}
                >
                  {band.label}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* Flows */}
        {showInformationFlows &&
          patient.flows.map((flow) => {
            const sPos = positions.get(flow.source);
            const tPos = positions.get(flow.target);
            if (!sPos || !tPos) return null;
            const s = positionedAt(flow.source, sPos.x, sPos.y);
            const t = positionedAt(flow.target, tPos.x, tPos.y);
            const breakStrength = flowStrengths.get(flow.id) ?? 0;
            const isSelected = selectedSet.flows.has(flow.id);
            const isFlowHovered = hoveredFlowId === flow.id;
            const isAdjacent =
              !!hoveredEntityId &&
              (flow.source === hoveredEntityId || flow.target === hoveredEntityId);
            const isHighlighted = highlightIds.active && highlightIds.flowIds.has(flow.id);
            const dimByHighlight = highlightIds.active && !isHighlighted;
            const baseOpacity = isFlowHovered
              ? 1
              : hoveredEntityId
                ? isAdjacent
                  ? 1
                  : 0.18
                : isHighlighted
                  ? 1
                  : dimByHighlight
                    ? 0.12
                    : isSelected
                      ? 1
                      : 0.65;
            const tag = overlayTags.get(flow.id);
            const isOverlayFlow = tag === 'preview' || tag === 'applied';
            const baseColor = isHighlighted
              ? HIGHLIGHT_COLOR
              : isOverlayFlow
                ? OVERLAY_COLOR
                : FLOW_COLOR[flow.kind];
            const stroke = mixHex(baseColor, DISRUPTED_COLOR, breakStrength);
            const widthPx = isHighlighted
              ? 3
              : isOverlayFlow
                ? isFlowHovered
                  ? 3.2
                  : 2.6
                : isFlowHovered
                  ? 2.6
                  : isSelected
                    ? 2.5
                    : isAdjacent
                      ? 2
                      : 1.2;
            const path = bezierPath(s.x, s.y, t.x, t.y);
            const useBrokenArrow = breakStrength >= 0.5;
            const showBrokenLayer = breakStrength > 0.02;
            const showIntactLayer = breakStrength < 0.98;
            const strokeDasharray = tag === 'preview' ? '6 4' : undefined;
            return (
              <g key={flow.id} style={{ cursor: 'pointer' }}>
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  onMouseEnter={() => setHoveredFlow(flow.id)}
                  onMouseLeave={() => setHoveredFlow(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (editMode && connectMode.active) return;
                    toggleSelection({ id: flow.id, kind: 'flow' });
                  }}
                />
                {showIntactLayer && (
                  <path
                    d={path}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={widthPx}
                    strokeDasharray={strokeDasharray}
                    opacity={baseOpacity * (1 - breakStrength)}
                    className={isSelected ? 'flow-active' : undefined}
                    markerEnd={
                      useBrokenArrow
                        ? `url(#arrow-broken)`
                        : isHighlighted
                          ? `url(#arrow-highlight)`
                          : isOverlayFlow
                            ? `url(#arrow-overlay)`
                            : `url(#arrow-${flow.kind})`
                    }
                    pointerEvents="none"
                  />
                )}
                {showBrokenLayer && (
                  <path
                    d={path}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={widthPx}
                    strokeDasharray={strokeDasharray}
                    opacity={baseOpacity * breakStrength}
                    className="flow-broken flow-broken-pulse"
                    markerEnd={
                      useBrokenArrow
                        ? `url(#arrow-broken)`
                        : isHighlighted
                          ? `url(#arrow-highlight)`
                          : isOverlayFlow
                            ? `url(#arrow-overlay)`
                            : `url(#arrow-${flow.kind})`
                    }
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}

        {/* Entities */}
        {Array.from(positions.values())
          .filter((p) => p.id !== 'patient')
          .map((p) => (
            <EntityNode
              key={p.id}
              p={p}
              offset={nodeOffsets[p.id]}
              isDragging={draggingNodeId === p.id}
              isSelected={selectedSet.entities.has(p.id)}
              disruption={entityStrengths.get(p.id) ?? 0}
              isHovered={hoveredEntityId === p.id}
              isAdjacent={adjacentEntityIds.has(p.id)}
              isConnectSource={connectMode.active && connectMode.sourceId === p.id}
              isConnectMode={connectMode.active}
              dimNonAdjacent={!!hoveredEntityId}
              searchActive={searchActive}
              isSearchMatch={searchMatchIds.has(p.id)}
              overlayTag={overlayTags.get(p.id)}
              highlightActive={highlightIds.active}
              isHighlighted={highlightIds.entityIds.has(p.id)}
              labelBelow={useRowLabel}
              onHover={(id) => setHoveredEntity(id)}
              onPointerDown={(e) => handleNodePointerDown(p.id, e)}
              onPointerMove={handleNodePointerMove}
              onPointerUp={(e) => finishNodePointer(p.id, () => handleEntityClick(p.id), e)}
              onPointerCancel={(e) => finishNodePointer(p.id, () => handleEntityClick(p.id), e)}
            />
          ))}

        {/* Patient at center */}
        {(() => {
          const patientPos = positions.get('patient');
          if (!patientPos) return null;
          return (
            <g transform={`translate(${patientPos.x}, ${patientPos.y})`}>
              <PatientCenter
                label={patientPos.label}
            offset={nodeOffsets.patient}
            isDragging={draggingNodeId === 'patient'}
            isSelected={selectedSet.entities.has('patient')}
            isConnectMode={connectMode.active}
            isConnectSource={connectMode.active && connectMode.sourceId === 'patient'}
            searchActive={searchActive}
            isSearchMatch={searchMatchIds.has('patient')}
            highlightActive={highlightIds.active}
            isHighlighted={highlightIds.entityIds.has('patient')}
            onHover={(v) => setHoveredEntity(v ? 'patient' : null)}
            onPointerDown={(e) => handleNodePointerDown('patient', e)}
            onPointerMove={handleNodePointerMove}
            onPointerUp={(e) =>
              finishNodePointer('patient', () => handleEntityClick('patient'), e)
            }
            onPointerCancel={(e) =>
              finishNodePointer('patient', () => handleEntityClick('patient'), e)
            }
          />
        </g>
        );
      })()}

        {/* Hovered flow tooltip — drawn last so it sits above flows AND nodes. */}
        {showInformationFlows &&
          hoveredFlowId &&
          (() => {
            const flow = patient.flows.find((f) => f.id === hoveredFlowId);
            if (!flow) return null;
            const sPos = positions.get(flow.source);
            const tPos = positions.get(flow.target);
            if (!sPos || !tPos) return null;
            const s = positionedAt(flow.source, sPos.x, sPos.y);
            const t = positionedAt(flow.target, tPos.x, tPos.y);
            const { x, y } = bezierMidpoint(s.x, s.y, t.x, t.y);
            const label = flow.content || flow.label;
            // Width grows ~7px per char; clamp to a sane max.
            const w = Math.min(Math.max(label.length * 7 + 16, 80), 220);
            const h = 26;
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={x - w / 2}
                  y={y - h - 8}
                  rx={6}
                  ry={6}
                  width={w}
                  height={h}
                  fill="#1f2937"
                  opacity={0.92}
                />
                <text
                  x={x}
                  y={y - h - 8 + h / 2 + 4}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#f8fafc"
                  fontWeight={500}
                >
                  {label}
                </text>
              </g>
            );
          })()}
      </g>
    </svg>
  );
}

interface EntityNodeProps {
  p: PositionedEntity;
  offset?: NodeOffset;
  isDragging: boolean;
  isSelected: boolean;
  disruption: number;
  isHovered: boolean;
  isAdjacent: boolean;
  isConnectSource: boolean;
  isConnectMode: boolean;
  dimNonAdjacent: boolean;
  searchActive: boolean;
  isSearchMatch: boolean;
  overlayTag?: OverlayTag;
  highlightActive: boolean;
  isHighlighted: boolean;
  labelBelow?: boolean;
  onHover: (id: string | null) => void;
  onPointerDown: (e: React.PointerEvent<SVGGElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGGElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGGElement>) => void;
  onPointerCancel: (e: React.PointerEvent<SVGGElement>) => void;
}

function EntityNode({
  p,
  offset,
  isDragging,
  isSelected,
  disruption,
  isHovered,
  isAdjacent,
  isConnectSource,
  isConnectMode,
  dimNonAdjacent,
  searchActive,
  isSearchMatch,
  overlayTag,
  highlightActive,
  isHighlighted,
  labelBelow,
  onHover,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: EntityNodeProps) {
  const Icon = iconFor(p.id, p.category);
  const baseStroke = categoryStrokeColor(p.category);
  const isOverlayNode = overlayTag === 'preview' || overlayTag === 'applied';
  const nodeBaseStroke = isOverlayNode ? OVERLAY_COLOR : baseStroke;
  const bezelStroke = mixHex(nodeBaseStroke, DISRUPTED_COLOR, disruption);
  const hoverOpacity = dimNonAdjacent && !isHovered && !isAdjacent ? 0.35 : 1;
  const searchOpacity = searchActive ? (isSearchMatch ? 1 : 0.18) : 1;
  const highlightOpacity = highlightActive ? (isHighlighted ? 1 : 0.18) : 1;
  const opacity = Math.min(hoverOpacity, searchOpacity, highlightOpacity);
  const showDisruptionGlow = disruption > 0.02;

  // Label placement: above when on top half, below when on bottom half.
  // In row mode (labelBelow), always place label below the node.
  let normAngle = ((p.angleDeg % 360) + 360) % 360;
  // angleDeg uses 0deg = right, +90 = bottom (svg). Top half = 180..360.
  const isBottomHalf = labelBelow || (normAngle > 0 && normAngle < 180);
  const labelDy = isBottomHalf ? NODE_BEZEL_R + 16 : -(NODE_BEZEL_R + 6);
  const labelBaseline = isBottomHalf ? 'hanging' : 'auto';
  const nudgeX = offset?.dx ?? 0;
  const nudgeY = offset?.dy ?? 0;
  const nodeCursor = isConnectMode ? 'crosshair' : isDragging ? 'grabbing' : 'grab';

  return (
    <g
      transform={`translate(${p.x + nudgeX}, ${p.y + nudgeY})`}
      style={{ cursor: nodeCursor, touchAction: isConnectMode ? undefined : 'none' }}
      opacity={opacity}
      onMouseEnter={() => onHover(p.id)}
      onMouseLeave={() => onHover(null)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {showDisruptionGlow && (
        <circle
          r={NODE_BEZEL_R + 7}
          fill="none"
          stroke={DISRUPTED_COLOR}
          strokeWidth={2}
          filter="url(#select-glow)"
          opacity={0.9 * disruption}
        />
      )}
      {overlayTag === 'applied' && !showDisruptionGlow && (
        <circle
          r={NODE_BEZEL_R + 7}
          fill="none"
          stroke={OVERLAY_COLOR}
          strokeWidth={2}
          filter="url(#select-glow)"
          opacity={0.9}
        />
      )}
      {highlightActive && isHighlighted && (
        <circle
          r={NODE_BEZEL_R + 10}
          fill="none"
          stroke={HIGHLIGHT_COLOR}
          strokeWidth={2.5}
          filter="url(#select-glow)"
          opacity={0.95}
        />
      )}
      {(isSelected || isConnectSource || (searchActive && isSearchMatch)) && (
        <circle
          r={NODE_BEZEL_R + 7}
          fill="none"
          stroke={
            isConnectSource
              ? '#f59e0b'
              : searchActive && isSearchMatch
                ? '#2563eb'
                : '#0ea5e9'
          }
          strokeWidth={2}
          filter="url(#select-glow)"
          opacity={0.9}
        />
      )}

      <circle
        r={NODE_BEZEL_R}
        fill={isOverlayNode ? '#ecfdf5' : 'white'}
        stroke={bezelStroke}
        strokeWidth={2}
        strokeDasharray={overlayTag === 'preview' ? '4 3' : undefined}
      />

      {/* Lucide icon via foreignObject */}
      <foreignObject
        x={-NODE_BEZEL_R + 6}
        y={-NODE_BEZEL_R + 6}
        width={(NODE_BEZEL_R - 6) * 2}
        height={(NODE_BEZEL_R - 6) * 2}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: bezelStroke,
          }}
        >
          {createElement(Icon, { size: 20, strokeWidth: 1.75 })}
        </div>
      </foreignObject>

      <text
        y={labelDy}
        textAnchor="middle"
        dominantBaseline={labelBaseline}
        fontSize={11}
        fill={isOverlayNode ? '#065f46' : 'rgba(30,41,59,0.92)'}
        style={{ pointerEvents: 'none', fontWeight: 500 }}
      >
        {p.label}
      </text>
      {isOverlayNode && (
        <OverlayPill
          tag={overlayTag!}
          dy={isBottomHalf ? labelDy + 14 : labelDy - 14}
          baseline={labelBaseline}
        />
      )}
    </g>
  );
}

function OverlayPill({
  tag,
  dy,
  baseline,
}: {
  tag: OverlayTag;
  dy: number;
  baseline: 'hanging' | 'auto';
}) {
  const label = tag === 'preview' ? 'preview' : 'what-if';
  const fill = tag === 'preview' ? '#ecfdf5' : '#10b981';
  const stroke = tag === 'preview' ? '#10b981' : '#059669';
  const textColor = tag === 'preview' ? '#047857' : '#ffffff';
  const charWidth = 6;
  const padX = 6;
  const w = Math.max(label.length * charWidth + padX * 2, 36);
  const h = 14;
  return (
    <g style={{ pointerEvents: 'none' }} transform={`translate(0, ${dy})`}>
      <rect
        x={-w / 2}
        y={baseline === 'hanging' ? 0 : -h}
        rx={7}
        ry={7}
        width={w}
        height={h}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
        strokeDasharray={tag === 'preview' ? '3 2' : undefined}
      />
      <text
        x={0}
        y={baseline === 'hanging' ? h / 2 + 3 : -h / 2 + 3}
        textAnchor="middle"
        fontSize={9}
        fontWeight={600}
        letterSpacing={0.5}
        fill={textColor}
        style={{ textTransform: 'uppercase' }}
      >
        {label}
      </text>
    </g>
  );
}

interface PatientCenterProps {
  label: string;
  offset?: NodeOffset;
  isDragging: boolean;
  isSelected: boolean;
  isConnectMode: boolean;
  isConnectSource: boolean;
  searchActive: boolean;
  isSearchMatch: boolean;
  highlightActive: boolean;
  isHighlighted: boolean;
  onHover: (v: boolean) => void;
  onPointerDown: (e: React.PointerEvent<SVGGElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGGElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGGElement>) => void;
  onPointerCancel: (e: React.PointerEvent<SVGGElement>) => void;
}

function PatientCenter({
  label,
  offset,
  isDragging,
  isSelected,
  isConnectMode,
  isConnectSource,
  searchActive,
  isSearchMatch,
  highlightActive,
  isHighlighted,
  onHover,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: PatientCenterProps) {
  const searchOpacity = searchActive ? (isSearchMatch ? 1 : 0.18) : 1;
  const highlightOpacity = highlightActive ? (isHighlighted ? 1 : 0.18) : 1;
  const opacity = Math.min(searchOpacity, highlightOpacity);
  const nudgeX = offset?.dx ?? 0;
  const nudgeY = offset?.dy ?? 0;
  const nodeCursor = isConnectMode ? 'crosshair' : isDragging ? 'grabbing' : 'grab';
  return (
    <g
      transform={`translate(${nudgeX}, ${nudgeY})`}
      style={{ cursor: nodeCursor, touchAction: isConnectMode ? undefined : 'none' }}
      opacity={opacity}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {highlightActive && isHighlighted && (
        <circle
          r={PATIENT_BEZEL_R + 11}
          fill="none"
          stroke={HIGHLIGHT_COLOR}
          strokeWidth={2.5}
          opacity={0.95}
          filter="url(#select-glow)"
        />
      )}
      {(isSelected || isConnectSource || (searchActive && isSearchMatch)) && (
        <circle
          r={PATIENT_BEZEL_R + 8}
          fill="none"
          stroke={
            isConnectSource
              ? '#f59e0b'
              : searchActive && isSearchMatch
                ? '#2563eb'
                : '#0ea5e9'
          }
          strokeWidth={2}
          opacity={0.9}
          filter="url(#select-glow)"
        />
      )}
      <circle
        r={PATIENT_BEZEL_R}
        fill="#fff1f2"
        stroke="#fb7185"
        strokeWidth={2.5}
      />
      <foreignObject
        x={-PATIENT_BEZEL_R + 8}
        y={-PATIENT_BEZEL_R + 8}
        width={(PATIENT_BEZEL_R - 8) * 2}
        height={(PATIENT_BEZEL_R - 8) * 2}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#be123c',
          }}
        >
          {createElement(iconFor('patient', 'stakeholder'), {
            size: 28,
            strokeWidth: 1.75,
          })}
        </div>
      </foreignObject>
      <text
        y={PATIENT_BEZEL_R + 18}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill="#9f1239"
        style={{ pointerEvents: 'none' }}
      >
        {label}
      </text>
    </g>
  );
}

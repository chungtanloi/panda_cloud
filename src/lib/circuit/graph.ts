/**
 * Circuit graph generation.
 *
 * Produces a PCB-looking network: nodes on a jittered grid, joined by traces
 * that run orthogonally and then break at 45°, which is how real board routing
 * looks. Geometry is built once per resize and never recomputed per frame.
 */

export interface Point {
  x: number;
  y: number;
}

export interface CircuitNode extends Point {
  /** Radius in CSS pixels. A few larger nodes read as chips/vias. */
  r: number;
  /** Phase offset so idle shimmer is not synchronised across nodes. */
  phase: number;
}

export interface Segment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  len: number;
  /** Cumulative length at the START of this segment. */
  offset: number;
}

export interface CircuitEdge {
  a: number;
  b: number;
  segments: Segment[];
  len: number;
  /** Midpoint, cached for cheap proximity tests. */
  mx: number;
  my: number;
}

export interface CircuitGraph {
  nodes: CircuitNode[];
  edges: CircuitEdge[];
  /** nodeIndex → indices of edges touching it. */
  adjacency: number[][];
}

/** Deterministic PRNG so the layout is stable across re-renders at one size. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function buildSegments(from: Point, to: Point): Segment[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  // Orthogonal run, then a 45° break into the destination — standard PCB style.
  let elbow: Point;
  if (adx > ady) {
    elbow = { x: to.x - Math.sign(dx) * ady, y: from.y };
  } else {
    elbow = { x: from.x, y: to.y - Math.sign(dy) * adx };
  }

  const points: Point[] = [from, elbow, to];
  const segments: Segment[] = [];
  let offset = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    if (len < 0.5) continue; // collapsed elbow
    segments.push({ x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, len, offset });
    offset += len;
  }

  return segments;
}

export function buildCircuitGraph(
  width: number,
  height: number,
  targetNodes: number,
  seed = 1337,
): CircuitGraph {
  const random = makeRandom(seed);

  // Choose grid dimensions whose product is close to the requested node count
  // while keeping cells roughly square.
  const aspect = width / Math.max(height, 1);
  const rows = Math.max(3, Math.round(Math.sqrt(targetNodes / Math.max(aspect, 0.2))));
  const cols = Math.max(3, Math.round(targetNodes / rows));

  const cellW = width / (cols - 1 || 1);
  const cellH = height / (rows - 1 || 1);
  const jitter = 0.34;

  const nodes: CircuitNode[] = [];
  const indexAt = (row: number, col: number) => row * cols + col;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      nodes.push({
        x: col * cellW + (random() - 0.5) * cellW * jitter,
        y: row * cellH + (random() - 0.5) * cellH * jitter,
        // ~1 in 7 nodes is a larger junction, like a via or pad.
        r: random() < 0.14 ? 2.6 + random() * 1.6 : 1.2 + random() * 0.7,
        phase: random() * Math.PI * 2,
      });
    }
  }

  const edges: CircuitEdge[] = [];
  const adjacency: number[][] = nodes.map(() => []);

  const connect = (ai: number, bi: number) => {
    const a = nodes[ai];
    const b = nodes[bi];
    if (!a || !b) return;

    const segments = buildSegments(a, b);
    if (segments.length === 0) return;

    const len = segments.reduce((sum, s) => sum + s.len, 0);
    const index = edges.length;

    edges.push({ a: ai, b: bi, segments, len, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 });
    adjacency[ai]!.push(index);
    adjacency[bi]!.push(index);
  };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const here = indexAt(row, col);

      // Horizontal neighbour — kept dense so signals have somewhere to travel.
      if (col < cols - 1 && random() < 0.82) connect(here, indexAt(row, col + 1));
      // Vertical neighbour.
      if (row < rows - 1 && random() < 0.68) connect(here, indexAt(row + 1, col));
      // Occasional diagonal for visual variety.
      if (row < rows - 1 && col < cols - 1 && random() < 0.1) {
        connect(here, indexAt(row + 1, col + 1));
      }
    }
  }

  return { nodes, edges, adjacency };
}

/** Position and heading at a distance along an edge. */
export function pointAtDistance(
  edge: CircuitEdge,
  distance: number,
  forward: boolean,
): { x: number; y: number; dx: number; dy: number } {
  const d = forward ? distance : edge.len - distance;

  for (const seg of edge.segments) {
    if (d <= seg.offset + seg.len) {
      const local = Math.max(0, d - seg.offset) / seg.len;
      const ux = (seg.x1 - seg.x0) / seg.len;
      const uy = (seg.y1 - seg.y0) / seg.len;
      return {
        x: seg.x0 + (seg.x1 - seg.x0) * local,
        y: seg.y0 + (seg.y1 - seg.y0) * local,
        dx: forward ? ux : -ux,
        dy: forward ? uy : -uy,
      };
    }
  }

  const last = edge.segments[edge.segments.length - 1]!;
  const ux = (last.x1 - last.x0) / last.len;
  const uy = (last.y1 - last.y0) / last.len;
  return forward
    ? { x: last.x1, y: last.y1, dx: ux, dy: uy }
    : { x: last.x0, y: last.y0, dx: -ux, dy: -uy };
}

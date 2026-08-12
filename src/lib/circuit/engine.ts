import type { CircuitConfig } from "@/config/circuit";
import {
  buildCircuitGraph,
  pointAtDistance,
  type CircuitEdge,
  type CircuitGraph,
} from "./graph";

/**
 * Canvas renderer and simulation for the circuit background.
 *
 * Performance notes:
 *  - One <canvas>. No DOM node is created per trace, node or pulse.
 *  - Resting traces are rasterised ONCE into an offscreen canvas per resize and
 *    blitted each frame, so the per-frame cost is only the lit region plus the
 *    active pulses.
 *  - Glow is drawn as two strokes (wide/faint over narrow/bright) rather than
 *    `shadowBlur`, which is dramatically cheaper.
 *  - Pulses are hard-capped by config; the array never grows unbounded.
 *  - The loop stops entirely when the tab is hidden or the pointer has been
 *    idle long enough that nothing is animating.
 */

interface Pulse {
  edge: number;
  forward: boolean;
  distance: number;
  hops: number;
  /** 0–1, fades as hops are consumed. */
  energy: number;
}

export interface CircuitEngineOptions {
  canvas: HTMLCanvasElement;
  config: CircuitConfig;
  /** When true, renders a single static frame and never animates. */
  reducedMotion: boolean;
}

export class CircuitEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly config: CircuitConfig;
  private readonly reducedMotion: boolean;

  private base: HTMLCanvasElement | null = null;
  private graph: CircuitGraph = { nodes: [], edges: [], adjacency: [] };

  private width = 0;
  private height = 0;
  private dpr = 1;

  private pointerX = -9999;
  private pointerY = -9999;
  private pointerActive = false;
  private lastSpawn = 0;
  private lastPointerMove = 0;

  private pulses: Pulse[] = [];
  private frame = 0;
  private lastTime = 0;
  private running = false;
  private disposed = false;

  constructor({ canvas, config, reducedMotion }: CircuitEngineOptions) {
    this.canvas = canvas;
    this.config = config;
    this.reducedMotion = reducedMotion;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("[circuit] 2D canvas context unavailable.");
    this.ctx = ctx;
  }

  /* ------------------------------ lifecycle ------------------------------ */

  resize(width: number, height: number, nodeCount: number): void {
    this.width = width;
    this.height = height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR: 3x costs a lot for a faint effect

    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.graph = buildCircuitGraph(width, height, nodeCount);
    this.pulses = [];
    this.renderBaseLayer();

    if (this.reducedMotion) this.drawStaticFrame();
  }

  start(): void {
    if (this.reducedMotion || this.running || this.disposed) return;
    this.running = true;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
    this.base = null;
  }

  /* -------------------------------- input -------------------------------- */

  setPointer(x: number, y: number): void {
    this.pointerX = x;
    this.pointerY = y;
    this.pointerActive = true;
    this.lastPointerMove = performance.now();

    if (this.reducedMotion) return;
    this.maybeSpawnPulse();
    this.start(); // resume if the loop had idled out
  }

  clearPointer(): void {
    this.pointerActive = false;
    this.pointerX = -9999;
    this.pointerY = -9999;
  }

  /** Converging burst toward a screen point — used by [data-circuit-attract]. */
  burstToward(x: number, y: number): void {
    if (this.reducedMotion) return;

    const target = this.nearestNode(x, y);
    if (target === -1) return;

    const edges = this.graph.adjacency[target] ?? [];
    let spawned = 0;

    for (const edgeIndex of edges) {
      if (spawned >= this.config.attractBurst) break;
      if (this.pulses.length >= this.config.pulse.maxActive) break;

      const edge = this.graph.edges[edgeIndex]!;
      // Travel INTO the target node, so pulses converge on the element.
      this.pulses.push({
        edge: edgeIndex,
        forward: edge.b === target,
        distance: 0,
        hops: 0,
        energy: 1,
      });
      spawned++;
    }

    this.start();
  }

  /* ------------------------------ simulation ----------------------------- */

  private nearestNode(x: number, y: number): number {
    let best = -1;
    let bestDist = Infinity;

    for (let i = 0; i < this.graph.nodes.length; i++) {
      const node = this.graph.nodes[i]!;
      const d = (node.x - x) ** 2 + (node.y - y) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  private maybeSpawnPulse(): void {
    const now = performance.now();
    if (now - this.lastSpawn < this.config.pulse.spawnIntervalMs) return;
    if (this.pulses.length >= this.config.pulse.maxActive) return;

    const node = this.nearestNode(this.pointerX, this.pointerY);
    if (node === -1) return;

    const candidates = this.graph.adjacency[node] ?? [];
    if (candidates.length === 0) return;

    const edgeIndex = candidates[Math.floor(Math.random() * candidates.length)]!;
    const edge = this.graph.edges[edgeIndex]!;

    this.pulses.push({
      edge: edgeIndex,
      forward: edge.a === node,
      distance: 0,
      hops: 0,
      energy: 1,
    });
    this.lastSpawn = now;
  }

  /** Continue through a junction, preferring to keep travelling straight. */
  private advanceToNextEdge(pulse: Pulse): boolean {
    const edge = this.graph.edges[pulse.edge]!;
    const arrivedAt = pulse.forward ? edge.b : edge.a;
    const heading = pointAtDistance(edge, edge.len, pulse.forward);

    const options = (this.graph.adjacency[arrivedAt] ?? []).filter((i) => i !== pulse.edge);
    if (options.length === 0) return false;

    let bestEdge = -1;
    let bestScore = -Infinity;

    for (const index of options) {
      const candidate = this.graph.edges[index]!;
      const forward = candidate.a === arrivedAt;
      const start = pointAtDistance(candidate, 0, forward);
      // Dot product against the incoming heading, plus jitter so paths vary.
      const score = start.dx * heading.dx + start.dy * heading.dy + Math.random() * 0.45;
      if (score > bestScore) {
        bestScore = score;
        bestEdge = index;
      }
    }

    if (bestEdge === -1) return false;

    const next = this.graph.edges[bestEdge]!;
    pulse.edge = bestEdge;
    pulse.forward = next.a === arrivedAt;
    pulse.distance = 0;
    pulse.hops++;
    pulse.energy = 1 - pulse.hops / (this.config.pulse.maxHops + 1);

    return pulse.hops < this.config.pulse.maxHops;
  }

  private updatePulses(dt: number): void {
    const step = this.config.pulse.speed * dt;

    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const pulse = this.pulses[i]!;
      pulse.distance += step;

      const edge = this.graph.edges[pulse.edge]!;
      if (pulse.distance >= edge.len) {
        if (!this.advanceToNextEdge(pulse)) {
          this.pulses.splice(i, 1);
        }
      }
    }
  }

  /* ------------------------------- rendering ----------------------------- */

  /** Rasterise the resting traces and nodes once. */
  private renderBaseLayer(): void {
    const base = document.createElement("canvas");
    base.width = this.canvas.width;
    base.height = this.canvas.height;

    const ctx = base.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const { traceRgb, nodeRgb, baseTraceAlpha, baseNodeAlpha } = this.config;

    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${traceRgb}, ${baseTraceAlpha})`;
    ctx.beginPath();
    for (const edge of this.graph.edges) {
      for (const seg of edge.segments) {
        ctx.moveTo(seg.x0, seg.y0);
        ctx.lineTo(seg.x1, seg.y1);
      }
    }
    ctx.stroke();

    ctx.fillStyle = `rgba(${nodeRgb}, ${baseNodeAlpha})`;
    for (const node of this.graph.nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
    }

    this.base = base;
  }

  /** Proximity falloff, 0 (far) → 1 (under the cursor). */
  private influence(x: number, y: number): number {
    if (!this.pointerActive) return 0;
    const radius = this.config.influenceRadius;
    const d = Math.hypot(x - this.pointerX, y - this.pointerY);
    if (d >= radius) return 0;
    const t = 1 - d / radius;
    return t * t; // quadratic: tight bright core, soft edge
  }

  private drawStaticFrame(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (this.base) this.ctx.drawImage(this.base, 0, 0, this.width, this.height);
  }

  private render(time: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    if (this.base) ctx.drawImage(this.base, 0, 0, this.width, this.height);

    const { traceRgb, nodeRgb, pulseRgb, activeTraceAlpha, activeNodeAlpha } = this.config;

    // --- Lit traces near the cursor -------------------------------------
    if (this.pointerActive) {
      ctx.lineCap = "round";

      for (const edge of this.graph.edges) {
        const k = this.influence(edge.mx, edge.my);
        if (k <= 0.01) continue;

        // Wide faint pass = glow, narrow bright pass = the trace itself.
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgba(${traceRgb}, ${k * activeTraceAlpha * 0.22})`;
        this.strokeEdge(ctx, edge);

        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(${traceRgb}, ${k * activeTraceAlpha})`;
        this.strokeEdge(ctx, edge);
      }

      // --- Lit nodes ----------------------------------------------------
      for (const node of this.graph.nodes) {
        const k = this.influence(node.x, node.y);
        if (k <= 0.01) continue;

        // Slow breathing so nodes are not perfectly static while lit.
        const shimmer = 0.85 + 0.15 * Math.sin(time * 0.0022 + node.phase);
        const alpha = k * activeNodeAlpha * shimmer;

        ctx.fillStyle = `rgba(${nodeRgb}, ${alpha * 0.18})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + 5 * k, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${nodeRgb}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + 0.6 * k, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // --- Pulses ----------------------------------------------------------
    ctx.lineCap = "round";
    const trail = this.config.pulse.trailLength;

    for (const pulse of this.pulses) {
      const edge = this.graph.edges[pulse.edge]!;
      const head = pointAtDistance(edge, Math.min(pulse.distance, edge.len), pulse.forward);
      const tailDistance = Math.max(0, pulse.distance - trail);
      const tail = pointAtDistance(edge, tailDistance, pulse.forward);

      const gradient = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
      gradient.addColorStop(0, `rgba(${pulseRgb}, 0)`);
      gradient.addColorStop(1, `rgba(${pulseRgb}, ${0.9 * pulse.energy})`);

      ctx.lineWidth = 2;
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.lineTo(head.x, head.y);
      ctx.stroke();

      ctx.fillStyle = `rgba(${pulseRgb}, ${0.95 * pulse.energy})`;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 2.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(${pulseRgb}, ${0.16 * pulse.energy})`;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private strokeEdge(ctx: CanvasRenderingContext2D, edge: CircuitEdge): void {
    ctx.beginPath();
    for (const seg of edge.segments) {
      ctx.moveTo(seg.x0, seg.y0);
      ctx.lineTo(seg.x1, seg.y1);
    }
    ctx.stroke();
  }

  private readonly tick = (time: number): void => {
    if (!this.running || this.disposed) return;

    // Clamp dt so a background tab returning does not teleport every pulse.
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    this.updatePulses(dt);
    this.render(time);

    // Idle out: nothing lit, nothing moving, pointer quiet for 1.5s.
    const idle =
      this.pulses.length === 0 &&
      !this.pointerActive &&
      time - this.lastPointerMove > 1500;

    if (idle) {
      this.stop();
      this.drawStaticFrame();
      return;
    }

    this.frame = requestAnimationFrame(this.tick);
  };
}

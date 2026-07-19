// ─────────────────────────────────────────────────────────────────────────────
// FlowViz — Canvas Renderer
// ─────────────────────────────────────────────────────────────────────────────

import type { Node, FlowEdge, Particle } from './types';
import { VIZ } from './types';
import { edgePoint, edgeWidth } from './layout';

const hsl   = (h: number, s: number, l: number, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
const lerp  = (a: number, b: number, t: number)         => a + (b - a) * t;

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#03060f';
  ctx.fillRect(0, 0, w, h);

  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
  grad.addColorStop(0,   'rgba(10,32,60,0.55)');
  grad.addColorStop(0.6, 'rgba(5,15,35,0.30)');
  grad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle   = '#2dd4bf';
  const spacing   = 28;
  for (let x = spacing / 2; x < w; x += spacing) {
    for (let y = spacing / 2; y < h; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawEdges(
  ctx:    CanvasRenderingContext2D,
  edges:  FlowEdge[],
  pulse:  number,
): void {
  for (const edge of edges) {
    const { from, to, pct, hue } = edge;
    const w = edgeWidth(pct);

    ctx.save();
    ctx.shadowBlur  = VIZ.GLOW_BLUR;
    ctx.shadowColor = hsl(hue, 85, 60, 0.6);
    ctx.strokeStyle = hsl(hue, 80, 65, 0.08 + Math.sin(pulse) * 0.02);
    ctx.lineWidth   = w * 4;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    const steps = 32;
    for (let s = 0; s <= steps; s++) {
      const { x, y } = edgePoint(from, to, s / steps);
      s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = hsl(hue, 75, 65, VIZ.EDGE_ALPHA + pct * 0.12);
    ctx.lineWidth   = w;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    for (let s = 0; s <= steps; s++) {
      const { x, y } = edgePoint(from, to, s / steps);
      s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

export function drawParticles(
  ctx:       CanvasRenderingContext2D,
  particles: Particle[],
  edges:     FlowEdge[],
): void {
  for (const p of particles) {
    const edge = edges[p.edgeIndex];
    if (!edge) continue;
    const { from, to, hue } = edge;

    for (let trail: number = VIZ.TRAIL_STEPS; trail >= 0; trail--) {
      const tBack    = Math.max(0, p.t - trail * 0.012);
      const { x, y } = edgePoint(from, to, tBack);
      const trailPct = trail === 0 ? 1 : (1 - trail / (VIZ.TRAIL_STEPS + 1));
      const alpha    = p.opacity * trailPct * trailPct;
      const radius   = p.size * (trail === 0 ? 1 : lerp(0.3, 0.85, trailPct));

      ctx.save();
      if (trail === 0) {
        ctx.shadowBlur  = 8;
        ctx.shadowColor = hsl(hue, 90, 70, 0.8);
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = trail === 0 ? hsl(hue, 80, 90) : hsl(hue, 70, 70);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

export function drawNodes(ctx: CanvasRenderingContext2D, nodes: Node[], pulse: number): void {
  for (const node of nodes) {
    if (node.isCenter) drawCenterNode(ctx, node, pulse);
    else drawRecipientNode(ctx, node, pulse);
  }
}

function drawCenterNode(ctx: CanvasRenderingContext2D, node: Node, pulse: number): void {
  const { x, y, r } = node;
  const pulseR = r + 4 + Math.sin(pulse) * 3;
  ctx.save();
  ctx.strokeStyle = hsl(180, 80, 60, 0.25 + Math.sin(pulse) * 0.1);
  ctx.lineWidth = 1.5; ctx.shadowBlur = 20; ctx.shadowColor = hsl(180, 90, 60, 0.4);
  ctx.beginPath(); ctx.arc(x, y, pulseR + 8, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.shadowBlur = VIZ.GLOW_BLUR * 1.5; ctx.shadowColor = hsl(180, 90, 55, 0.7);
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  grad.addColorStop(0, hsl(190, 80, 60, 0.95)); grad.addColorStop(0.6, hsl(180, 75, 38, 0.95)); grad.addColorStop(1, hsl(170, 65, 22, 0.95));
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Hexagon icon
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  const ir = r * 0.46; ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + Math.cos(a) * ir; const py = y + Math.sin(a) * ir;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.stroke(); ctx.restore();
}

function drawRecipientNode(ctx: CanvasRenderingContext2D, node: Node, pulse: number): void {
  const { x, y, r, hue, pct } = node;
  const ringAlpha = 0.3 + pct * 0.3 + Math.sin(pulse * 0.7) * 0.08;
  ctx.save();
  ctx.shadowBlur = 16; ctx.shadowColor = hsl(hue, 85, 60, 0.5); ctx.strokeStyle = hsl(hue, 80, 65, ringAlpha); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(x, y, r + 5, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.shadowBlur = 12; ctx.shadowColor = hsl(hue, 85, 55, 0.5);
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  grad.addColorStop(0, hsl(hue, 70, 35, 0.92)); grad.addColorStop(1, hsl(hue, 60, 18, 0.92));
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.font = `bold ${Math.max(9, r * 0.52)}px "JetBrains Mono", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.round(pct * 100)}%`, x, y);
  ctx.restore();
}

export function drawLabels(ctx: CanvasRenderingContext2D, nodes: Node[], canvasW: number, canvasH: number): void {
  for (const node of nodes) {
    if (node.isCenter) drawCenterLabel(ctx, node);
    else drawRecipientLabel(ctx, node, canvasW, canvasH);
  }
}

function drawCenterLabel(ctx: CanvasRenderingContext2D, node: Node): void {
  const { x, y, r } = node; const ly = y + r + 14;
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = 'bold 11px "Syne", sans-serif'; ctx.fillText(node.label, x, ly);
  ctx.fillStyle = 'rgba(45,212,191,0.55)'; ctx.font = '9px "JetBrains Mono", monospace'; ctx.fillText(node.sublabel, x, ly + 13);
  ctx.restore();
}

function drawRecipientLabel(ctx: CanvasRenderingContext2D, node: Node, canvasW: number, canvasH: number): void {
  const { x, y, r, hue } = node; const cx = canvasW / 2; const cy = canvasH / 2;
  const dx = x - cx; const dy = y - cy; const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist; const ny = dy / dist; const offset = r + 12;
  const lx = x + nx * offset; const ly = y + ny * offset;
  const align: CanvasTextAlign = x < cx - 20 ? 'right' : x > cx + 20 ? 'left' : 'center';

  ctx.save(); ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 'bold 10.5px "Syne", sans-serif'; ctx.fillText(node.label, lx, ly - 6);
  ctx.fillStyle = hsl(hue, 70, 68, 0.55); ctx.font = '9px "JetBrains Mono", monospace'; ctx.fillText(node.sublabel, lx, ly + 7);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '9px "JetBrains Mono", monospace'; ctx.fillText(`$${node.amount.toLocaleString()}`, lx, ly + 19);
  ctx.restore();
}

import type { VizSplit, Node, FlowEdge } from './types';
import { NODE_HUES, VIZ } from './types';

function hueFromAddress(address: string, fallbackIndex: number): number {
  if (address.length < 4) return NODE_HUES[fallbackIndex % NODE_HUES.length];
  const code = address.charCodeAt(2) * 31 + address.charCodeAt(3);
  return NODE_HUES[code % NODE_HUES.length];
}

export function buildLayout(
  splits:      VizSplit[],
  canvasW:     number,
  canvasH:     number,
  totalAmount: number,
): { center: Node; recipients: Node[]; edges: FlowEdge[] } {
  const cx = canvasW / 2;
  const cy = canvasH / 2;

  const center: Node = {
    id:       'center',
    x:        cx,
    y:        cy,
    r:        VIZ.CENTER_RADIUS,
    label:    'Wallet',
    sublabel: 'Origin',
    amount:   totalAmount,
    pct:      1,
    hue:      180,
    isCenter: true,
  };

  const orbit  = Math.min(canvasW, canvasH) * VIZ.ORBIT_RATIO;
  const count  = splits.length;
  const step   = (Math.PI * 2) / Math.max(count, 1);
  const offset = -Math.PI / 2; 

  const recipients: Node[] = splits.map((s, i) => {
    const angle = offset + step * i;
    const pct   = totalAmount > 0 ? s.amount / totalAmount : 1 / count;
    const r = VIZ.NODE_RADIUS_MIN + (VIZ.NODE_RADIUS_MAX - VIZ.NODE_RADIUS_MIN) * Math.sqrt(pct);

    const shortLabel = s.recipient.length > 12
      ? s.recipient.slice(0, 11) + '…'
      : s.recipient;

    const shortProto = s.arcProtocol.length > 14
      ? s.arcProtocol.slice(0, 13) + '…'
      : s.arcProtocol;

    return {
      id:       s.address,
      x:        cx + Math.cos(angle) * orbit,
      y:        cy + Math.sin(angle) * orbit,
      r,
      label:    shortLabel,
      sublabel: shortProto,
      amount:   s.amount,
      pct,
      hue:      hueFromAddress(s.address, i),
      isCenter: false,
    };
  });

  const edges: FlowEdge[] = recipients.map((node) => ({
    from: center,
    to:   node,
    pct:  node.pct,
    hue:  node.hue,
  }));

  return { center, recipients, edges };
}

export function edgePoint(
  from: Node,
  to:   Node,
  t:    number,
): { x: number; y: number } {
  const mx     = (from.x + to.x) / 2;
  const my     = (from.y + to.y) / 2;
  const dx     = to.x - from.x;
  const dy     = to.y - from.y;
  const len    = Math.sqrt(dx * dx + dy * dy);
  const perp   = len * 0.12; 
  const cx_    = mx - (dy / len) * perp;
  const cy_    = my + (dx / len) * perp;

  const inv = 1 - t;
  return {
    x: inv * inv * from.x + 2 * inv * t * cx_ + t * t * to.x,
    y: inv * inv * from.y + 2 * inv * t * cy_ + t * t * to.y,
  };
}

export function edgeWidth(pct: number): number {
  return VIZ.EDGE_WIDTH_MIN + (VIZ.EDGE_WIDTH_MAX - VIZ.EDGE_WIDTH_MIN) * pct;
}

export function particleCount(pct: number): number {
  return Math.max(2, Math.round(VIZ.PARTICLE_BASE * (0.3 + pct * 0.7) * 8));
}

// ─────────────────────────────────────────────────────────────────────────────
// FlowViz — Types and Visual Constants
// Pure visual layer — no business logic.
// ─────────────────────────────────────────────────────────────────────────────

export interface VizSplit {
  recipient:   string;   // Label on recipient node
  address:     string;   // Used to derive stable colour / ID
  amount:      number;   // Controls flow thickness + particle count
  currency:    string;   // Small label e.g. "USDC"
  arcProtocol: string;   // Badge text beneath node
}

export interface FlowVizProps {
  splits:        VizSplit[];
  totalAmount?:  number;       // If omitted, derived from sum(splits)
  isAnimating?:  boolean;      // Pause/resume particle animation
  className?:    string;
  style?:        React.CSSProperties;
}

export interface Node {
  id:       string;
  x:        number;
  y:        number;
  r:        number;        // Circle radius
  label:    string;
  sublabel: string;
  amount:   number;
  pct:      number;        // 0-1 fraction of totalAmount
  hue:      number;        // HSL hue for per-node colour
  isCenter: boolean;
}

export interface FlowEdge {
  from:     Node;
  to:       Node;
  pct:      number;        // Controls line width + particle density
  hue:      number;        // Inherits from target node
}

export interface Particle {
  edgeIndex: number;
  t:         number;       // 0→1 progress along the edge
  speed:     number;
  size:      number;
  opacity:   number;
  trail:     number;       // Trail length multiplier
}

export const NODE_HUES = [170, 210, 260, 140, 30, 190, 290, 50] as const;

export const VIZ = {
  CENTER_RADIUS:    28,
  NODE_RADIUS_MIN:  14,
  NODE_RADIUS_MAX:  26,
  EDGE_WIDTH_MIN:    1.2,
  EDGE_WIDTH_MAX:    5,
  EDGE_ALPHA:        0.18,
  PARTICLE_BASE:     6,
  PARTICLE_SPEED_MIN: 0.0018,
  PARTICLE_SPEED_MAX: 0.0045,
  PARTICLE_SIZE_MIN:  1.8,
  PARTICLE_SIZE_MAX:  3.5,
  PARTICLE_OPACITY:   0.9,
  TRAIL_STEPS:        6,
  ORBIT_RATIO:       0.36,
  GLOW_BLUR:         18,
  PULSE_SPEED:       0.018,
} as const;

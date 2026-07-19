import type { Particle, FlowEdge } from './types';
import { VIZ } from './types';
import { particleCount } from './layout';

const rng = Math.random;

export function spawnParticle(edgeIndex: number, edge: FlowEdge, preSeed = false): Particle {
  return {
    edgeIndex,
    t:       preSeed ? rng() : 0,
    speed:   VIZ.PARTICLE_SPEED_MIN + rng() * (VIZ.PARTICLE_SPEED_MAX - VIZ.PARTICLE_SPEED_MIN),
    size:    VIZ.PARTICLE_SIZE_MIN  + rng() * (VIZ.PARTICLE_SIZE_MAX  - VIZ.PARTICLE_SIZE_MIN)
               * (0.6 + edge.pct * 0.4),
    opacity: 0.55 + rng() * 0.45,
    trail:   0.8 + rng() * 0.4,
  };
}

export function initParticles(edges: FlowEdge[]): Particle[] {
  const pool: Particle[] = [];
  edges.forEach((edge, i) => {
    const count = particleCount(edge.pct);
    for (let n = 0; n < count; n++) {
      pool.push(spawnParticle(i, edge, true));
    }
  });
  return pool;
}

export function tickParticles(particles: Particle[], edges: FlowEdge[]): void {
  for (let i = 0; i < particles.length; i++) {
    const p    = particles[i];
    const edge = edges[p.edgeIndex];
    if (!edge) continue;

    p.t += p.speed;

    if (p.t >= 1) {
      p.t       = 0;
      p.speed   = VIZ.PARTICLE_SPEED_MIN + rng() * (VIZ.PARTICLE_SPEED_MAX - VIZ.PARTICLE_SPEED_MIN);
      p.size    = VIZ.PARTICLE_SIZE_MIN  + rng() * (VIZ.PARTICLE_SIZE_MAX  - VIZ.PARTICLE_SIZE_MIN)
                    * (0.6 + edge.pct * 0.4);
      p.opacity = 0.55 + rng() * 0.45;
    }
  }
}

export function reconcileParticles(
  existing: Particle[],
  edges:    FlowEdge[],
): Particle[] {
  const target = edges.reduce((sum, e) => sum + particleCount(e.pct), 0);
  if (existing.length === target) return existing;
  if (existing.length > target) {
    return existing.sort((a, b) => b.t - a.t).slice(0, target);
  }
  const fresh = [...existing];
  for (let i = existing.length; i < target; i++) {
    const edgeIndex = i % edges.length;
    fresh.push(spawnParticle(edgeIndex, edges[edgeIndex], true));
  }
  return fresh;
}

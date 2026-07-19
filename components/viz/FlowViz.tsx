'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { FlowVizProps, Particle, FlowEdge } from './types';
import { VIZ } from './types';
import { buildLayout } from './layout';
import { drawBackground, drawEdges, drawParticles, drawNodes, drawLabels } from './renderer';
import { initParticles, tickParticles, reconcileParticles } from './particles';

export default function FlowViz({
  splits,
  totalAmount,
  isAnimating = true,
  className = '',
  style,
}: FlowVizProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const rafRef       = useRef<number>(0);
  const pulseRef     = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const edgesRef     = useRef<FlowEdge[]>([]);

  const total = totalAmount ?? splits.reduce((s, x) => s + x.amount, 0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const { center, recipients, edges } = buildLayout(splits, w, h, total);
    edgesRef.current = edges;

    particlesRef.current = reconcileParticles(particlesRef.current, edges);

    if (isAnimating) {
      tickParticles(particlesRef.current, edges);
      pulseRef.current += VIZ.PULSE_SPEED;
    }

    const pulse = pulseRef.current;
    const allNodes = [center, ...recipients];

    drawBackground(ctx, w, h);
    drawEdges(ctx, edges, pulse);
    drawParticles(ctx, particlesRef.current, edges);
    drawNodes(ctx, allNodes, pulse);
    drawLabels(ctx, allNodes, w, h);

    if (isAnimating) {
      rafRef.current = requestAnimationFrame(draw);
    }
  }, [splits, total, isAnimating]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;

        canvas.width  = Math.floor(width  * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width  = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);

        const { edges } = buildLayout(splits, Math.floor(width), Math.floor(height), total);
        edgesRef.current   = edges;
        particlesRef.current = initParticles(edges);
      }
    });

    observer.observe(canvas.parentElement ?? canvas);
    return () => observer.disconnect();
  }, [splits, total]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width  / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    const { edges } = buildLayout(splits, w || 400, h || 300, total);
    edgesRef.current     = edges;
    particlesRef.current = initParticles(edges);
  }, [splits, total]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (isAnimating) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      draw();
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw, isAnimating]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width:   '100%',
        height:  '100%',
        display: 'block',
        ...style,
      }}
    />
  );
}

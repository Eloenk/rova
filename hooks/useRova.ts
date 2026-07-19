// ─────────────────────────────────────────────────────────────────────────────
// This file exists because several components import from '@/hooks/useRova',
// but the implementation itself lives in hooks/useFlowFi.ts (a leftover from
// the FlowFi → Rova rename — the function inside was renamed to `useRova`,
// but the file itself never was). Re-exporting here is the safe fix: it
// doesn't touch the working logic in useFlowFi.ts, it just gives it the
// filename callers already expect.
// ─────────────────────────────────────────────────────────────────────────────
export { useRova } from './useFlowFi';
export type { FlowStatus } from './useFlowFi';

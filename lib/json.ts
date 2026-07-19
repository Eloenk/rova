/**
 * Master Shield: Deep Serialization Pruner
 * 
 * This utility ensures that only plain JSON-compatible data survives.
 * It is the final defense against circular structures (like React Fiber or DOM nodes)
 * leaking into the agent's memory.
 */
export function safeClone<T>(obj: T): T {
  try {
    // 1. First-pass: Fast stringify to check for circularity
    // and prune non-serializable properties (functions, elements, etc.)
    return JSON.parse(JSON.stringify(obj));
  } catch (err) {
    // 2. Second-pass (Emergency): Manual pruning for complex objects
    console.warn('[Rova] Circular data detected during cloning. Pruning manually.');
    const cache = new Set();
    const pruned = JSON.parse(JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return;
        cache.add(value);
      }
      return value;
    }));
    return pruned as T;
  }
}

/**
 * Ensures that a value is a safe, plain string.
 */
export function safeString(val: any): string {
  if (typeof val === 'string') return val;
  if (!val) return '';
  try {
    return String(val);
  } catch {
    return '[Unserializable Data]';
  }
}

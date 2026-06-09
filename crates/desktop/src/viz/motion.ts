/* Tessera · spring helper for tier transitions.
 *
 * Wraps framer-motion's imperative `animate` API in a small primitive the D3
 * projections can call when a node's tier changes — keeps the spring physics
 * required by DESIGN_SYSTEM.md §5 (springs.soft) without rewriting each view
 * into a React-rendered graph.
 */

import { animate, type AnimationPlaybackControls } from "framer-motion";

export const SPRING_SOFT = { type: "spring" as const, stiffness: 180, damping: 22 };

type Setter = (value: number) => void;

export interface SpringHandle {
  /** Animate a single number toward `to` with `springs.soft`, applying via `set`. */
  to(from: number, target: number, set: Setter): void;
  /** Cancel any in-flight animation. */
  stop(): void;
}

export function makeSpring(): SpringHandle {
  let current: AnimationPlaybackControls | null = null;
  return {
    to(from, target, set) {
      current?.stop();
      current = animate(from, target, { ...SPRING_SOFT, onUpdate: set });
    },
    stop() {
      current?.stop();
      current = null;
    },
  };
}

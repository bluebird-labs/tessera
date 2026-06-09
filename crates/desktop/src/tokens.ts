/* Runtime reader for CSS custom properties declared in design/tokens.css.
 *
 * Code that *can* use CSS should reference `var(--name)` directly. This
 * module exists for the diagram/canvas code that needs concrete color
 * strings to hand to D3 fills, SVG attributes, etc. Values are read from
 * `:root` via getComputedStyle and memoized; call `invalidateTokens()`
 * after a theme switch to drop the cache.
 */

const cache = new Map<string, string>();

export function cssVar(name: string): string {
  const hit = cache.get(name);
  if (hit !== undefined) return hit;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  cache.set(name, value);
  return value;
}

export function invalidateTokens(): void {
  cache.clear();
}

export const tokens = {
  get indigo()     { return cssVar("--indigo"); },
  get indigoHi()   { return cssVar("--indigo-hi"); },
  get magenta()    { return cssVar("--magenta"); },
  get magentaHi()  { return cssVar("--magenta-hi"); },
  get cyan()       { return cssVar("--cyan"); },
  get cyanHi()     { return cssVar("--cyan-hi"); },
  get lime()       { return cssVar("--lime"); },
  get limeHi()     { return cssVar("--lime-hi"); },
  get violet()     { return cssVar("--violet"); },
  get violetHi()   { return cssVar("--violet-hi"); },
  get amber()      { return cssVar("--amber"); },
  get coral()      { return cssVar("--coral"); },

  get text()       { return cssVar("--text"); },
  get textDim()    { return cssVar("--text-dim"); },
  get textMute()   { return cssVar("--text-mute"); },

  get canvas()     { return cssVar("--canvas"); },
  get surface0()   { return cssVar("--surface-0"); },
  get surface2()   { return cssVar("--surface-2"); },
  get surface3()   { return cssVar("--surface-3"); },

  get line()       { return cssVar("--line"); },
  get lineHi()     { return cssVar("--line-hi"); },

  get edge()       { return cssVar("--edge"); },
  get edgeMid()    { return cssVar("--edge-mid"); },
  get edgeGhost()  { return cssVar("--edge-ghost"); },

  get fontSans()   { return cssVar("--font-sans"); },
  get fontMono()   { return cssVar("--font-mono"); },
} as const;

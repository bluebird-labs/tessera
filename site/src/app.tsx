// app.tsx — composes the page and applies the chosen design config.
//
// These three values were the "tweaks" from the design exploration; they're now
// fixed production config. Change them here to re-theme the whole page.
import { useEffect } from "react";
import { Nav, Hero, Manifesto, IsIsNot, Loop } from "./sections";
import { Shift } from "./shift";
import { CTA, Footer } from "./cta";

const VIBE: "dense" | "airy" = "dense";
const ACCENT = ["#5b6bff", "#7d8aff", "#a855f7"]; // [primary, highlight, secondary]
const CASCADE_MOTION = true;

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(",");
}

export function App() {
  useEffect(() => {
    document.documentElement.setAttribute("data-vibe", VIBE);
    const [a, hi, a2] = ACCENT;
    const rgb = hexToRgb(a);
    const r = document.documentElement.style;
    r.setProperty("--accent", a);
    r.setProperty("--accent-hi", hi);
    r.setProperty("--accent-2", a2);
    r.setProperty("--accent-rgb", rgb);
    r.setProperty("--accent-grad", `linear-gradient(135deg, ${a}, ${a2})`);
    r.setProperty("--accent-bg", `rgba(${rgb},0.14)`);
  }, []);

  return (
    <>
      <div className="aurora"></div>
      <div className="grain"></div>
      <Nav />
      <main>
        <Hero cascadeMotion={CASCADE_MOTION} />
        <Shift />
        <Loop />
        <Manifesto />
        <IsIsNot />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

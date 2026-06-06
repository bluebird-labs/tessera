// shift.tsx — "More is less" slice. Eyebrow + headline, then the GitHub-activity
// visual (a contribution graph that reveals TESSERA, then a violet swipe floods
// it with hot, busy green until the word dissolves — activity up, design down),
// and the before/after argument in two columns beneath it: the trust an "LGTM"
// used to carry, and the judgment an agent doesn't have.
import { Reveal } from "./mosaic";
import { ActivityGrid } from "./activity";

export function Shift() {
  return (
    <section className="section shift" id="shift">
      <div className="shell">
        <Reveal className="shift-head">
          <span className="eyebrow">More is less</span>
          <h2>Looks good to me.</h2>
        </Reveal>

        <div className="shift-grid">
          <ActivityGrid noise={24} speed={18} swipeSecs={2.6} />
        </div>

        <div className="shift-cols">
          <Reveal as="div" className="shift-col">
            <span className="shift-col-tag">Then</span>
            <p>
              "LGTM" was never about the diff. It was trust in the person who wrote it:
              that they held the whole system in their head, weighed the architecture and
              the boundaries, and knew where the code should go next. You approved their
              judgment, not every line.
            </p>
          </Reveal>

          <Reveal as="div" className="shift-col">
            <span className="shift-col-tag">Now</span>
            <p>
              The agent has no stake in the system a year from now. It writes the change,
              the code compiles, the diff reads clean, and "looks good to me" gets typed in
              seconds. Each change is reviewed on its own. The architecture they add up to
              is not.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

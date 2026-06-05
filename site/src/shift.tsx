// shift.tsx — "The shift" slice. Eyebrow + headline, then two mirrored blocks
// that oppose definition against entropy using the locked mosaic visual.
import { Reveal } from "./mosaic";
import { TMosaic } from "./tmosaic";

export function Shift() {
  return (
    <section className="section shift" id="shift">
      <div className="shell">
        <Reveal className="shift-head">
          <span className="eyebrow">The shift</span>
          <h2>Looks good to me.</h2>
        </Reveal>

        <div className="shift-blocks">
          <Reveal as="div" className="shift-block">
            <div className="sb-text">
              <p>
                "Looks good to me" was never really about the diff. It was trust in the
                person who wrote it: that they had held the whole system in their head,
                weighed the architecture and the boundaries, and had a feel for where the
                code needed to go next. You approved because you trusted their judgment,
                not because you re-derived every decision yourself.
              </p>
            </div>
            <div className="sb-visual">
              <div className="sb-stage tmosaic-stage">
                <TMosaic variant="proper" erosion={0.59} />
              </div>
            </div>
          </Reveal>

          <Reveal as="div" className="shift-block mirror">
            <div className="sb-text">
              <p>
                The agent has no such judgment to trust. It has no stake in the system a
                year from now, no instinct for how it should evolve, no sense of which
                shortcuts will quietly cost you. The code compiles, the diff reads clean,
                and "looks good to me" gets typed in seconds, over decisions no one
                actually made. The flaws are not the kind a glance can catch. They surface
                later, one shortcut at a time, long after anyone could have caught them.
              </p>
            </div>
            <div className="sb-visual">
              <div className="sb-stage tmosaic-stage">
                <TMosaic variant="ai" erosion={0.59} />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

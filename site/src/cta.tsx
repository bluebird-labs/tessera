// cta.tsx — closing CTA with Buttondown email capture, and the footer.
import { useState } from "react";
import { Reveal, Mark } from "./mosaic";

// Buttondown embed — replace YOUR_USERNAME with the real Buttondown username.
const BUTTONDOWN_USER = "YOUR_USERNAME";
const BUTTONDOWN_ACTION =
  "https://buttondown.com/api/emails/embed-subscribe/" + BUTTONDOWN_USER;

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function CTA() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!isEmail(email)) {
      e.preventDefault();
      setErr(true);
      return;
    }
    setErr(false);
    // let the form POST to Buttondown (opens the confirmation in a popup)
    window.open("https://buttondown.com/" + BUTTONDOWN_USER, "popupwindow");
  };

  return (
    <section className="cta" id="access">
      <div className="shell">
        <Reveal className="cta-card">
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            Early access
          </span>
          <h2>Own the design. Delegate the rest.</h2>
          <p className="sub">
            Tessera is in active development. Request early access to get in first.
          </p>

          <div className="signup">
            <form
              className="signup-form embeddable-buttondown-form"
              action={BUTTONDOWN_ACTION}
              method="post"
              target="popupwindow"
              onSubmit={onSubmit}
              noValidate
            >
              <label className="field">
                <span className="at">@</span>
                <input
                  type="email"
                  name="email"
                  inputMode="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (err) setErr(false);
                  }}
                  aria-label="Email address"
                />
              </label>
              <input type="hidden" value="1" name="embed" />
              <button type="submit" className="btn btn-primary btn-lg">
                Request early access
              </button>
            </form>
            <p className="hint">
              {err
                ? "⚠ that doesn't look like an email, try again"
                : "One note when early access opens. No spam."}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── FOOTER ───────────────────────── */
const FOOT = [
  {
    h: "Product",
    links: [
      ["More is less", "#shift"],
      ["How it works", "#system"],
      ["What it is", "#isnot"],
      ["Beliefs", "#beliefs"],
      ["Early access", "#access"],
    ],
  },
  {
    h: "The views",
    links: [
      ["Domain", "#system"],
      ["Architecture", "#system"],
      ["Contracts", "#system"],
      ["Flows", "#system"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-inner">
          <div className="footer-brand">
            <a className="brand" href="#top">
              <Mark size={28} />
              <span className="word">Tessera</span>
            </a>
            <p className="tagline">
              Design your system's architecture and keep design control while coding agents
              handle the implementation.
            </p>
          </div>
          <div className="footer-cols">
            {FOOT.map((c) => (
              <div className="footer-col" key={c.h}>
                <h5>{c.h}</h5>
                {c.links.map(([label, href]) => (
                  <a key={label} href={href}>
                    {label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="footer-base">
          <span>© 2026 Tessera</span>
          <span>Pre-release · v0 · early access opening soon</span>
        </div>
      </div>
    </footer>
  );
}

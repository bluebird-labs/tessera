// cta.tsx — closing CTA with Buttondown email capture, and the footer.
import { useRef, useState } from "react";
import { Reveal, Mark, Glyph } from "./mosaic";

// Buttondown embed. The subscribe POST is sent from here rather than as a
// native form navigation, so the visitor never leaves the page: Buttondown's
// embed endpoint answers with `access-control-allow-origin: *` and a
// form-urlencoded body needs no preflight, so the status is readable.
// 200 = subscribed (idempotent for an address already on the list),
// 400 = rejected address.
const BUTTONDOWN_USER = "sylvainestevez";
const BUTTONDOWN_ACTION =
  "https://buttondown.com/api/emails/embed-subscribe/" + BUTTONDOWN_USER;
const BUTTONDOWN_PAGE = "https://buttondown.com/" + BUTTONDOWN_USER;

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

type Status = "idle" | "sending" | "done";
type Problem = null | "email" | "rejected" | "offline";

const MESSAGE: Record<Exclude<Problem, null>, string> = {
  email: "⚠ that doesn't look like an email, try again",
  rejected: "⚠ that address was rejected — try another one",
  offline: "⚠ couldn't reach the signup service — try again in a moment",
};

export function CTA() {
  const [email, setEmail] = useState("");
  const [problem, setProblem] = useState<Problem>(null);
  const [status, setStatus] = useState<Status>("idle");
  const sent = useRef(""); // address of the submit that succeeded

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    if (!isEmail(email)) {
      setProblem("email");
      return;
    }
    setProblem(null);
    setStatus("sending");
    try {
      const res = await fetch(BUTTONDOWN_ACTION, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email, embed: "1" }).toString(),
      });
      if (!res.ok) {
        setProblem("rejected");
        setStatus("idle");
        return;
      }
      sent.current = email;
      setStatus("done");
    } catch {
      setProblem("offline");
      setStatus("idle");
    }
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
            {status === "done" ? (
              <div className="signup-done" role="status">
                <span className="ring">
                  <Glyph.check width={26} height={26} />
                </span>
                <h3>You're on the list.</h3>
                <p>
                  We'll write to <span className="tile-no">{sent.current}</span> when
                  early access opens.
                </p>
              </div>
            ) : (
              <>
                <form
                  className="signup-form embeddable-buttondown-form"
                  action={BUTTONDOWN_ACTION}
                  method="post"
                  onSubmit={onSubmit}
                  noValidate
                >
                  <label className="field">
                    <span className="at">@</span>
                    <input
                      type="email"
                      name="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (problem) setProblem(null);
                      }}
                      aria-label="Email address"
                    />
                  </label>
                  <input type="hidden" value="1" name="embed" />
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={status === "sending"}
                  >
                    {status === "sending" ? "Sending…" : "Request early access"}
                  </button>
                </form>
                <p className="hint" aria-live="polite">
                  {problem ? (
                    problem === "offline" ? (
                      <>
                        {MESSAGE.offline} or{" "}
                        <a href={BUTTONDOWN_PAGE} target="_blank" rel="noreferrer">
                          sign up here
                        </a>
                        .
                      </>
                    ) : (
                      MESSAGE[problem]
                    )
                  ) : (
                    "One note when early access opens. No spam."
                  )}
                </p>
              </>
            )}
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

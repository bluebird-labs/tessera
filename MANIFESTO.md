# Engineering in the Age of Agents

Software engineering is being remade in the image of the chat box. Senior engineers — the people whose job is to keep architecture coherent, to make decisions at the right altitude, to think in systems — have been handed a turn-based text interface and told this is the future. It isn't. It's the easiest thing to ship, mistaken for the right thing to build.

We believe a different shape of work is possible, and overdue.

**1. The unit of engineering work is a decision, not a line of code.** Tools that optimize for lines per minute are optimizing for the wrong variable. The valuable thing was always the choice of what to write — and at what layer.

**2. Decisions belong at the layer of abstraction where they were made.** A contract is not a comment on an implementation; an implementation is a consequence of a contract. Tools that flatten these distinctions flatten the work.

**3. Code without domain is half a model.** Class hierarchies and bounded contexts are the same system viewed from different angles. Storing them in different tools guarantees they drift, and drift is how systems rot.

**4. Chat is a conversation, not a workflow.** Engineering needs a directional, gated, revisable structure. A turn-based text loop has none of these properties, and dressing it up with sidebars and shortcuts does not give it any.

**5. Review at the diff is review too late.** By the time architecture appears as a code change, the architectural decision has already been made — silently, invisibly, and without your input. The right altitude for review is the altitude where change is still cheap.

**6. Work in progress should be editable in place.** Watching an agent write code you cannot annotate is a failure of the medium. Revising an earlier decision and waiting for an agent to re-derive its consequences by hand is a failure of the medium. Both failures are choices, and both are reversible.

**7. Tools should share a substrate, not a sidebar.** Jira, Git, ADRs, design docs — each holds part of the truth, and none of them know the others exist. The answer is not to replace them. The answer is to give them a place to meet.

**8. Architects and senior engineers are the audience AI tooling has most underserved.** They are also the audience whose authority over a codebase matters most. Building for them is not a niche bet. It is a bet on the people who decide whether the system holds together.

---

We are building Tessera. It is what these beliefs look like when they are taken seriously.
# Tessera

## What Tessera is

Tessera is an ecosystem for engineering teams that want to stay in architectural control as AI coding agents take on more of the work. At its core is a unified knowledge graph that models code and business domain together — the same structure your TypeScript class lives in is the structure your bounded context, use case, contract, and architectural decision live in. Around that graph sits a family of components — desktop app, CLI, MCP server, cloud-backed graph database — each surfacing the substrate where it's most useful. The desktop app is one face of Tessera; it isn't *Tessera*.

Tessera is built for the engineers the current generation of agent tooling has quietly disappointed: architects, tech leads, and senior developers who tried the chat-based incumbents, watched them produce confident line-level edits at conversational speed, and realized that wasn't the unit of work they wanted to be operating on. The unit of work is a *decision*, made at the right layer of abstraction, propagated cleanly through the layers below it. Today's tools have no way to represent that — Tessera is built around it.

The name comes from *tessera* — the individual tile in a mosaic. Each node, contract, decision, and annotation is a tile; the picture they compose is what makes the work legible.

## The shift Tessera makes

**From chat to cascade.** Chat is the wrong primitive for engineering work. It rewards velocity over decisions, treats each turn as fresh, and offers no surface for locking anything in. Tessera replaces it with a cascade: stages flow into each other in a fixed direction, each stage produces a frozen artifact, and the next stage operates on what came before. Iteration inside a stage is fast; transitions between stages are gated. Architects set direction at the top of the cascade; agents execute within frozen layers; the graph remembers everything.

**From files to graph.** Code, domain, and process belong in one model. A class definition, a use case, a contract, an ADR, a ticket reference — all are nodes with typed relationships. Queries finally compose across what your tools have always kept apart.

**From silo to ecosystem.** Tessera doesn't replace Jira, GitHub, your IDE, or your design docs. It integrates with them, surfaces them through a shared UI when that's useful, and gives them the common substrate — the graph — they've never had. Functionality is grouped under one UX; the underlying systems of record stay where they are.

**From turn-locked to live-editable.** In a chat, the agent's turn is a wall. You watch the work happen, see the line you'd flag, and have no way to mark it until the turn completes — then you re-engage through prose and hope the agent maps your feedback back to the right place. And once a decision is made, it's stranded in scrollback: revising it means re-explaining and re-running, because nothing downstream knows it descends from that decision. Tessera makes both directions live. Annotations attach to graph nodes the moment those nodes exist, including ones the agent is actively writing to. Revising an upstream node — a contract, a use case, a placement decision — automatically marks every downstream derivation stale, and the cascade re-runs only the affected stages. Work becomes editable in place, not re-runnable from scratch.

## Three co-equal pillars

**Unified code + domain modeling.** The knowledge graph is the substrate and the heart of Tessera's value. ts-morph (and equivalents) feeds the code side; integrations and design artifacts feed the domain side. This unification is what makes the rest of the product possible — without it, contracts have nothing to reference, the cascade has nothing to flow through, and review has nothing coherent to operate on.

**Cascading contracts as the workflow primitive.** Work flows through frozen layers — contracts → use cases → placement → implementation — each gating the next. Contracts are first-class graph nodes, so queries compose across code and design. The cascade is the discipline engine, and it is what turns the chat loop into a directional, decision-first workflow.

**Review as a downstream surface.** Mermaid projections of the graph, in-flight annotations bound to stable node IDs, approval gates, scoped QA, and a parking lot that flows back into the substrate. Review here operates at the design altitude, not the diff altitude — the only altitude where architectural mistakes are still cheap to fix.

## Problems Tessera is solving

**The chat UX is structurally wrong for senior engineering work.** Architects and leads find themselves babysitting agents through conversational loops instead of setting direction. The cascade returns authority to the people who should be making decisions, and lets agents do what they're actually good at — executing within a frozen layer.

**Code and domain are modeled separately and badly.** Code lives in Git, domain lives in Confluence or oral tradition, tickets live in Jira, decisions live in ADRs nobody reads. Each tool ignores the others. Tessera's graph is the missing substrate.

**Existing agent tools optimize for the wrong altitude.** The chat-first incumbents — and the native macOS attempts like Augment and Nimbalyst — compete on line-level speed and conversational fluency. The bottleneck for the engineers Tessera serves is not lines per minute; it's making sure decisions are made at the right layer and propagate cleanly downward.

**Context evaporates between sessions.** Without a persistent graph, every session starts cold. With one, sessions accumulate into something teams can rely on.

**Feedback is gated by the agent's turn, and decisions can't be revised in place.** While the agent works, you can see the artifact taking shape but can't touch it — annotation has to wait, and by the time the turn ends, the moment of clearest insight has passed. Going back to revise a decision made earlier is worse: chat offers no way to edit a decision and have its consequences automatically re-derived, so you scroll up, restate, and pray. Tessera's graph makes work-in-progress annotatable as it happens, and the cascade makes upstream edits propagate downstream automatically — only the affected stages re-run.

**Engineering tools don't share a substrate.** Jira doesn't know your code. Your code doesn't know your ADRs. Your ADRs don't know your contracts. Tessera makes them all neighbors in a single graph without forcing teams to migrate off any of them.

## Commercial model

Tessera is open-core. The graph schema, modeling primitives, single-user desktop app, CLI, and MCP server are open source. The cloud-backed shared graph, team collaboration, and enterprise integrations form the commercial layer. Individual engineers can adopt Tessera without procurement; teams scale into the commercial tier when they need shared substrate.

## What Tessera is not

- Not a chat client or a skin over an agent loop.
- Not a replacement for Jira, GitHub, or your IDE — it integrates with them.
- Not a code search or code intelligence tool — it models code *and* domain, and enforces a workflow across both.
- Not a productivity tool for vibe-coders. It's for engineers who refuse to give up architectural control.
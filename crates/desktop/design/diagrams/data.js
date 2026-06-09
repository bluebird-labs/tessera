/* Tessera · diagram language demo data
 * ─────────────────────────────────────────────────────────────────────────
 * One domain — "Atlas Stays", a lodging/reservation platform — expressed
 * three ways. The SAME named things recur across views so the common
 * graphical language is legible: a Reservation is magenta in the domain
 * graph, owns the `reservations` table in the ERD, and is the node that
 * gets held during the "Book a stay" flow.
 *
 * type taxonomy (color is bound to type forever — see DESIGN_SYSTEM.md):
 *   contract  indigo   · frozen promise between layers
 *   useCase   cyan     · behaviour, what the system does
 *   aggregate magenta  · domain entity cluster (root)
 *   entity    magenta  · identity-bearing member of an aggregate
 *   value     magenta  · identity-LESS value object (hollow / dashed)
 *   module    neutral  · code-level concrete
 *   decision  violet   · architectural ADR
 *   actor     white    · external agent
 */
(function () {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════
  // DOMAIN VIEW — DDD graph. Nodes carry a `ctx` (bounded context) so the
  // domain renderer can draw territory hulls behind each cluster.
  // ═══════════════════════════════════════════════════════════════════════
  const domain = {
    contexts: [
      { id: "booking",   label: "Booking",   hue: "magenta" },
      { id: "inventory", label: "Inventory", hue: "cyan" },
      { id: "billing",   label: "Billing",   hue: "violet" },
      { id: "reviews",   label: "Reviews",   hue: "amber" },
    ],
    nodes: [
      // actors
      { id: "traveler",   type: "actor",     label: "Traveler",        ctx: null },
      { id: "host",       type: "actor",     label: "Host",            ctx: null },
      { id: "channelmgr", type: "actor",     label: "Channel Mgr",     ctx: null, ext: true },

      // use cases
      { id: "uc-search",  type: "useCase",   label: "Search Availability", ctx: "inventory" },
      { id: "uc-book",    type: "useCase",   label: "Book Stay",       ctx: "booking" },
      { id: "uc-cancel",  type: "useCase",   label: "Cancel Stay",     ctx: "booking" },
      { id: "uc-capture", type: "useCase",   label: "Capture Payment", ctx: "billing" },
      { id: "uc-review",  type: "useCase",   label: "Leave Review",    ctx: "reviews" },

      // contracts (sit on context boundaries)
      { id: "c-booking",  type: "contract",  label: "Booking v4",      ctx: "booking", frozen: true },
      { id: "c-avail",    type: "contract",  label: "Availability v1", ctx: "inventory", frozen: true },
      { id: "c-pay",      type: "contract",  label: "Payments v2",     ctx: "billing", frozen: true },

      // aggregates (roots)
      { id: "a-resv",     type: "aggregate", label: "Reservation",     ctx: "booking", root: true },
      { id: "a-listing",  type: "aggregate", label: "Listing",         ctx: "inventory", root: true },
      { id: "a-payment",  type: "aggregate", label: "Payment",         ctx: "billing", root: true, drift: true },
      { id: "a-review",   type: "aggregate", label: "Review",          ctx: "reviews", root: true },

      // entities (members)
      { id: "e-party",    type: "entity",    label: "GuestParty",      ctx: "booking" },
      { id: "e-calday",   type: "entity",    label: "CalendarDay",     ctx: "inventory" },
      { id: "e-photo",    type: "entity",    label: "Photo",           ctx: "inventory" },
      { id: "e-payout",   type: "entity",    label: "Payout",          ctx: "billing" },

      // value objects (identity-less)
      { id: "v-dates",    type: "value",     label: "DateRange",       ctx: "booking" },
      { id: "v-money",    type: "value",     label: "Money",           ctx: "billing" },
      { id: "v-address",  type: "value",     label: "Address",         ctx: "inventory" },
      { id: "v-rating",   type: "value",     label: "Rating",          ctx: "reviews" },

      // decision
      { id: "adr-014",    type: "decision",  label: "ADR-014",         ctx: null },
    ],
    edges: [
      // actor → use case (invokes)
      { from: "traveler",   to: "uc-search",  kind: "invokes" },
      { from: "traveler",   to: "uc-book",    kind: "invokes" },
      { from: "traveler",   to: "uc-review",  kind: "invokes" },
      { from: "host",       to: "a-listing",  kind: "owns" },
      { from: "channelmgr", to: "c-avail",    kind: "syncs", dashed: true },

      // use case → contract (derives)
      { from: "uc-search",  to: "c-avail",    kind: "derives", label: "derives" },
      { from: "uc-book",    to: "c-booking",  kind: "derives", label: "derives" },
      { from: "uc-capture", to: "c-pay",      kind: "derives", label: "derives" },

      // contract → aggregate (shapes)
      { from: "c-booking",  to: "a-resv",     kind: "shapes",  label: "shapes" },
      { from: "c-avail",    to: "a-listing",  kind: "shapes" },
      { from: "c-pay",      to: "a-payment",  kind: "shapes" },

      // aggregate → entity (contains)
      { from: "a-resv",     to: "e-party",    kind: "contains" },
      { from: "a-listing",  to: "e-calday",   kind: "contains" },
      { from: "a-listing",  to: "e-photo",    kind: "contains" },
      { from: "a-payment",  to: "e-payout",   kind: "contains" },

      // aggregate → value object (has)
      { from: "a-resv",     to: "v-dates",    kind: "has" },
      { from: "a-payment",  to: "v-money",    kind: "has" },
      { from: "a-listing",  to: "v-address",  kind: "has" },
      { from: "a-review",   to: "v-rating",   kind: "has" },

      // aggregate → aggregate (references across contexts)
      { from: "a-resv",     to: "a-listing",  kind: "references", label: "books" },
      { from: "a-resv",     to: "a-payment",  kind: "references", label: "settles" },
      { from: "a-review",   to: "a-resv",     kind: "references" },
      { from: "uc-cancel",  to: "a-resv",     kind: "mutates" },

      // decision → aggregate (decides)
      { from: "adr-014",    to: "a-resv",     kind: "decides", dashed: true, label: "optimistic hold" },
    ],
  };

  // ═══════════════════════════════════════════════════════════════════════
  // DATA VIEW — ERD. Each table maps to a domain aggregate/entity. Fields
  // carry key roles (pk / fk / unique) and an index flag. Relationships use
  // crow's-foot cardinality and reference a fk field for edge anchoring.
  // ═══════════════════════════════════════════════════════════════════════
  const F = (name, ftype, opts = {}) => ({ name, ftype, ...opts });
  const data = {
    tables: [
      {
        id: "reservations", label: "reservations", node: "a-resv", accent: "magenta",
        fields: [
          F("id", "uuid", { pk: true }),
          F("listing_id", "uuid", { fk: "listings", idx: true }),
          F("guest_id", "uuid", { fk: "guests", idx: true }),
          F("check_in", "date", { idx: true }),
          F("check_out", "date"),
          F("status", "resv_status"),
          F("total_amount", "bigint"),
          F("currency", "char(3)"),
          F("created_at", "timestamptz"),
        ],
      },
      {
        id: "listings", label: "listings", node: "a-listing", accent: "cyan",
        fields: [
          F("id", "uuid", { pk: true }),
          F("host_id", "uuid", { fk: "hosts", idx: true }),
          F("title", "text"),
          F("city", "text", { idx: true }),
          F("country", "char(2)"),
          F("lat", "float8"),
          F("lng", "float8"),
          F("nightly_rate", "bigint"),
          F("max_guests", "int2"),
        ],
      },
      {
        id: "guests", label: "guests", node: "traveler", accent: "indigo",
        fields: [
          F("id", "uuid", { pk: true }),
          F("email", "citext", { unique: true }),
          F("full_name", "text"),
          F("created_at", "timestamptz"),
        ],
      },
      {
        id: "hosts", label: "hosts", node: "host", accent: "indigo",
        fields: [
          F("id", "uuid", { pk: true }),
          F("email", "citext", { unique: true }),
          F("display_name", "text"),
          F("payout_account", "text"),
        ],
      },
      {
        id: "payments", label: "payments", node: "a-payment", accent: "violet", drift: true,
        fields: [
          F("id", "uuid", { pk: true }),
          F("reservation_id", "uuid", { fk: "reservations", idx: true, unique: true }),
          F("amount", "bigint"),
          F("currency", "char(3)"),
          F("status", "pay_status", { idx: true }),
          F("card_ref", "text"),
          F("captured_at", "timestamptz"),
        ],
      },
      {
        id: "availability", label: "availability_calendar", node: "e-calday", accent: "cyan",
        fields: [
          F("id", "bigint", { pk: true }),
          F("listing_id", "uuid", { fk: "listings", idx: true }),
          F("date", "date", { idx: true }),
          F("is_blocked", "bool"),
          F("price_override", "bigint"),
        ],
      },
      {
        id: "reviews", label: "reviews", node: "a-review", accent: "amber",
        fields: [
          F("id", "uuid", { pk: true }),
          F("reservation_id", "uuid", { fk: "reservations", unique: true }),
          F("listing_id", "uuid", { fk: "listings", idx: true }),
          F("rating", "int2"),
          F("body", "text"),
          F("created_at", "timestamptz"),
        ],
      },
      {
        id: "listing_photos", label: "listing_photos", node: "e-photo", accent: "cyan",
        fields: [
          F("id", "bigint", { pk: true }),
          F("listing_id", "uuid", { fk: "listings", idx: true }),
          F("url", "text"),
          F("position", "int2"),
        ],
      },
    ],
    // relationships: parent (1) ── (many) child, anchored on the child's fk
    rels: [
      { from: "listings",     to: "reservations",  fromCard: "one", toCard: "many", fk: "listing_id" },
      { from: "guests",       to: "reservations",  fromCard: "one", toCard: "many", fk: "guest_id" },
      { from: "hosts",        to: "listings",      fromCard: "one", toCard: "many", fk: "host_id" },
      { from: "reservations", to: "payments",      fromCard: "one", toCard: "oneopt", fk: "reservation_id" },
      { from: "listings",     to: "availability",  fromCard: "one", toCard: "many", fk: "listing_id" },
      { from: "reservations", to: "reviews",       fromCard: "one", toCard: "oneopt", fk: "reservation_id" },
      { from: "listings",     to: "reviews",       fromCard: "one", toCard: "many", fk: "listing_id" },
      { from: "listings",     to: "listing_photos",fromCard: "one", toCard: "many", fk: "listing_id" },
    ],
  };

  // ═══════════════════════════════════════════════════════════════════════
  // FLOW VIEW — "Book a stay", request→response from the caller's POV.
  // Steps are arranged in layered lanes; the happy path is the spine, with
  // two error branches that peel off. Each step keeps its type color.
  // ═══════════════════════════════════════════════════════════════════════
  const flow = {
    goal: "Book a stay",
    lanes: [
      { id: "actor",  label: "Actor" },
      { id: "edge",   label: "Edge / API" },
      { id: "app",    label: "Application" },
      { id: "domain", label: "Domain & Services" },
      { id: "infra",  label: "Infrastructure" },
    ],
    steps: [
      { id: "s-traveler", lane: "actor",  type: "actor",    label: "Traveler",        node: "traveler", seq: "" },
      { id: "s-api",      lane: "edge",    type: "contract", label: "Booking v4",      node: "c-booking", seq: "01", sub: "POST /reservations" },
      { id: "s-book",     lane: "app",     type: "useCase",  label: "BookStay",        node: "uc-book", seq: "02", sub: "use case" },
      { id: "s-avail",    lane: "domain",  type: "module",   label: "AvailabilityIndex", seq: "03", sub: "check dates" },
      { id: "s-price",    lane: "domain",  type: "module",   label: "PricingEngine",   seq: "04", sub: "quote total" },
      { id: "s-resv",     lane: "domain",  type: "aggregate",label: "Reservation",     node: "a-resv", seq: "05", sub: "optimistic hold" },
      { id: "s-pay",      lane: "infra",   type: "module",   label: "PaymentGateway",  seq: "06", sub: "capture", drift: true },
      { id: "s-repo",     lane: "infra",   type: "module",   label: "ReservationRepo", seq: "07", sub: "persist" },
      { id: "s-201",      lane: "app",     type: "useCase",  label: "201 Confirmed",   seq: "08", sub: "response", terminal: "ok" },
      // error branches
      { id: "s-409",      lane: "domain",  type: "aggregate",label: "409 No Vacancy",  seq: "", sub: "dates blocked", terminal: "err", branch: true },
      { id: "s-402",      lane: "infra",   type: "module",   label: "402 Declined",    seq: "", sub: "card refused", terminal: "err", branch: true },
    ],
    // path edges: `path:"happy"` is the highlighted spine; branches are errors
    edges: [
      { from: "s-traveler", to: "s-api",   path: "happy", label: "request" },
      { from: "s-api",      to: "s-book",  path: "happy" },
      { from: "s-book",     to: "s-avail", path: "happy" },
      { from: "s-avail",    to: "s-price", path: "happy", label: "available" },
      { from: "s-price",    to: "s-resv",  path: "happy", label: "quoted" },
      { from: "s-resv",     to: "s-pay",   path: "happy", label: "hold ok" },
      { from: "s-pay",      to: "s-repo",  path: "happy", label: "captured", drift: true },
      { from: "s-repo",     to: "s-201",   path: "happy", label: "response" },
      { from: "s-avail",    to: "s-409",   path: "err",   label: "blocked" },
      { from: "s-pay",      to: "s-402",   path: "err",   label: "declined" },
    ],
  };

  window.AtlasData = { domain, data, flow };
})();

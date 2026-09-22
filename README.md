# Digital Heroes

A subscription platform combining golf score tracking, monthly charity prize
draws, and charitable giving — built for the Digital Heroes trainee selection
assignment.

**Live site:** https://golf-tracker-bhu9.vercel.app
**Repo:** https://github.com/Bhu1-explorer/Digital-Heroes

## Test Credentials

| Role  | Email | Password |
|-------|-------|----------|
| User  | user@digitalheroes.test | password123 |
| Admin | admin@digitalheroes.test | password123 |

~20 additional demo subscribers (`userN@demo.digitalheroes.test`, same
password) are seeded with active subscriptions and scores, so the draw
simulation and admin reports have real data to show. See "Demo Data" below.

## Stack

Next.js (App Router) + TypeScript, Tailwind CSS, Supabase (Postgres, Auth,
Storage, RLS), Stripe (test mode / simulated — see note below), Vitest.
Deployed on Vercel.

## Payment Integration

The payment system is built behind a `PaymentProvider` interface
(`lib/payments/types.ts`) with two implementations:
- `StripeProvider` — full Checkout, signature-verified webhook, and Customer
  Portal integration, ready to use with live Stripe test keys.
- `SimulatedProvider` — a demo-mode fallback used for this submission.

Stripe's self-serve signup is currently invite-only for India-based accounts
(confirmed at signup: stripe.com/in/contact/sales), so live Stripe test keys
could not be obtained within the assignment deadline. The deployed app runs
in simulated payment mode (`ALLOW_SIMULATED_PAYMENTS=true`), which exercises
the identical subscription state machine, database writes, and access-control
logic that the real webhook would — the only difference is the checkout
screen is a local stand-in instead of Stripe's hosted page.

To switch to live Stripe: set `STRIPE_SECRET_KEY`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` in the
environment; the app automatically uses `StripeProvider` with no code changes.

## Design Decisions (ambiguities resolved)

The PRD left several implementation details open. Decisions made:

- **Draw numbers:** 5 unique numbers drawn from 1–45. A user's match count is
  how many of their 5 distinct retained score values appear in the draw.
- **Eligibility:** active subscribers with all 5 scores entered at
  simulation/publish time. Pool size is based on ALL active subscribers.
- **Prize pool:** a configurable percentage (default 50%, in `settings`) of
  each active subscriber's monthly-equivalent fee (yearly ÷ 12), computed in
  integer paise to avoid floating-point error.
- **Tier split:** 40% / 35% / 25% for 5/4/3-number matches. Only the 5-match
  jackpot rolls over when unclaimed; empty 4/3 tiers are shown as unallocated
  rather than rolling over.
- **Algorithmic draw mode:** weights numbers by frequency across eligible
  users' current scores (configurable bias toward frequent or rare numbers).
- **One draw per month:** enforced with a unique constraint; a draw is
  simulated (previewed, nothing persisted) before it can be published
  (atomic, numbers reused from the last simulation, never re-drawn).
- **Score edge cases:** duplicate dates rejected (edit instead), future dates
  rejected, a new score older than all 5 stored scores is rejected with a
  clear message.
- **Winner verification:** `awaiting_proof → submitted → approved/rejected`,
  with `payment_status` only reachable to `paid` after `approved`, enforced
  by both a DB constraint and application logic.

## Demo Data

`npm run seed:demo` creates ~20 demo subscribers with active subscriptions
and clustered scores (so draw simulations reliably produce winners across
tiers), plus one past published draw with winners in every verification and
payment state. `npm run cleanup:demo` removes all of it. See the script
files for exact behavior.

## Local Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL,
   anon key, and service-role key.
3. `npx supabase login --token <your-token>`
4. `npx supabase link --project-ref <your-ref>`
5. `npx supabase db push`
6. Run `supabase/seed.sql` in the Supabase SQL editor (charities + settings).
7. `npm run seed:demo` (creates the admin/test/demo users).
8. In the Supabase dashboard, disable "Confirm email" under Authentication.
9. `npm run dev`

## Testing

`npm run test` runs the Vitest suite covering the score rolling-5 logic,
draw generation and prize-pool math (including conservation checks and
jackpot rollover across months), winner state transitions, and charity
contribution calculations — all as pure, isolated functions separate from
UI and database code.

## Notes for Reviewers

- Missing PRD page 11 (§13 Technical requirements, §14 Scalability
  considerations) was not available in the provided document; reasonable
  defaults were assumed (responsive design, server-side auth checks on every
  request, extensible schema).
- Deployed to a new Vercel account and a new Supabase project per the
  assignment's deployment constraints.
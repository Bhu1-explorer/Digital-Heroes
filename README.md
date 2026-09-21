# Digital Heroes

Digital Heroes is a subscription-based web application combining golf score tracking, monthly charity prize draws, and charitable giving.

## Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS (v4)
- Framer Motion
- shadcn/ui
- Supabase (PostgreSQL, Auth, RLS, Storage)
- Stripe
- Vitest

## Design Decisions
- **Dark-first theme**: A premium, cinematic aesthetic using deep navy (`#09090b` / `oklch(0.18 0.03 260)`), muted sage-green (`oklch(0.55 0.08 160)`), and warm copper (`oklch(0.65 0.15 45)`) accents.
- **Money and Math Rules**: To avoid precision issues, all financial calculations are performed in integers using the smallest currency unit (e.g., cents or paise).
  - **Database**: All money columns (prices, pools, payouts) store integers.
  - **Monthly Equivalent**: Yearly plans are divided by 12, rounded down using integer math (`Math.floor(yearly / 12)`).
  - **Prize Pool Calculation**: The total pool is calculated as `Math.floor(sum_of_monthly_equivalents * pool_percent / 100)`.
  - **Payout Splits**: Tiers receive 40%, 35%, and 25% of the total pool respectively. If winners exist in a tier, the payout per winner is divided equally and floored. Any remainders from integer division, as well as any empty 4 or 3 match tiers, are recorded as `unallocated_remainder`. If nobody matches 5 numbers, the entire tier 5 pool rolls over to the next month's jackpot (`jackpot_carry_out`).
- **Draw Implementation**: A draw is selected from 1 to 45. Five numbers are drawn per month. The tier payouts are split evenly across matching participants.
- **Database Rules**: All authorization logic is enforced by Supabase RLS (Row Level Security). The backend handles roles, subscriptions, and scores securely.

## Local Setup

1. **Clone the project and install dependencies**
   ```bash
   npm install
   ```

2. **Supabase Environment Variables**
   Create a `.env.local` file at the root of the project with your remote Supabase instance details (do not commit this file):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
   *(Note: Stripe credentials will be added in Stage 3).*

3. **Database Migration**
   Using the Supabase CLI, link your remote project and push the initial schema:
   ```bash
   npx supabase link --project-ref your_project_id
   npx supabase db push
   ```
   *Alternatively, run the SQL script in `supabase/migrations/0000_initial_schema.sql` manually in the Supabase SQL Editor.*

4. **Database Seeding**
   - Run the SQL script located in `supabase/seed.sql` in your Supabase SQL Editor to seed charities and their events.
   - Run the user seed script to create test users:
     ```bash
     npx tsx supabase/seed-users.ts
     ```

### Development & Demo Scripts
- `npm run seed`: Seeds the database with essential core data (e.g. charities).
- `npm run seed:demo`: Generates 20 demo users with subscriptions and scores in a narrow band to ensure frequent overlaps. It also seeds a past published draw to populate the dashboard and reports.
- `npm run cleanup:demo`: Removes all demo users and demo draws created by `seed:demo`.

## Test Credentials

After running the seed script, you can log in with these credentials:

**Admin User**
- Email: `admin@digitalheroes.test`
- Password: `password123`

**Standard User**
- Email: `user@digitalheroes.test`
- Password: `password123`

## Running the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to view the app.

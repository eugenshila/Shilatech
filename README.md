# Shilatech Autospares

Premium e-commerce platform for Jeep, Mercedes-Benz, Volkswagen, Range Rover and Volvo spare parts.

## Production stack

- Next.js / React
- Vercel hosting
- PostgreSQL on Supabase
- Database-backed catalog, customers, My Garage and orders
- VIN decoding with catalog fitment filtering foundation

## Required environment variables

Copy `.env.example` to `.env.local` and fill in:

- `DATABASE_URL` — PostgreSQL connection (local Postgres, Supabase, or another provider)
- `JWT_SECRET` — secure session signing secret (32+ characters)

`.env.local` is gitignored. Next.js and the database scripts (`npm run db:migrate`, `npm run db:check-stock`, `npm run admin:bootstrap:local`) all read it. Values already set in your shell take precedence.

On Windows PowerShell, if script execution is restricted, use `npm.cmd` instead of `npm`.

## Database

1. Create a PostgreSQL database.
2. Put `DATABASE_URL` in `.env.local` (or export it in your shell).
3. Run `npm run db:migrate` to create/update the schema and seed starter inventory.

If you see `DATABASE_URL is required`, the scripts could not find a connection string in the environment or in `.env.local`.

### Set up a local administrator

After migrating a **new local-only PostgreSQL database**, run `npm run admin:bootstrap:local -- your-email@example.com`. The command reads `.env.local`, refuses non-local or production database URLs, creates a new administrator account with a randomly generated one-time password, and prints it once in your own terminal. Do not paste that password in chat, take a screenshot of it, or commit it. Sign in at `/staff-login` and change it immediately. This command will **not** overwrite an existing account or reset its password. Other staff accounts are created by the signed-in administrator under `/admin` → Add staff; staff sign-in does not offer public registration.

## Payments

Checkout supports M-Pesa, card and PayPal selection. Live gateway charges remain disabled until official payment-provider credentials are configured.

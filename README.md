# Shilatech Autospares

Premium e-commerce platform for Jeep, Mercedes-Benz, Volkswagen, Range Rover and Volvo spare parts.

## Production stack

- Next.js / React
- Vercel hosting
- PostgreSQL on Supabase
- Database-backed catalog, customers, My Garage and orders
- VIN decoding with catalog fitment filtering foundation

## Required environment variables

- `DATABASE_URL` — PostgreSQL connection (Supabase or another PostgreSQL provider)
- `JWT_SECRET` — secure session signing secret (32+ characters)

## Database

Run `npm run db:migrate` against the configured PostgreSQL database to create/update the schema and seed starter inventory.

### Set up a local administrator

After migrating a **new local-only PostgreSQL database**, put `DATABASE_URL` and `JWT_SECRET` in the ignored `.env.local` file, then run `npm run admin:bootstrap:local -- your-email@example.com` (in Windows PowerShell, use `npm.cmd` instead of `npm` if script execution is restricted). The command reads `.env.local`, refuses non-local or production database URLs, creates a new administrator account with a randomly generated one-time password, and prints it once in your own terminal. Do not paste that password in chat, take a screenshot of it, or commit it. Sign in at `/staff-login` and change it immediately. This command will **not** overwrite an existing account or reset its password. Other staff accounts are created by the signed-in administrator under `/admin` → Add staff; staff sign-in does not offer public registration.

## Payments

Checkout supports M-Pesa, card and PayPal selection. Live gateway charges remain disabled until official payment-provider credentials are configured.

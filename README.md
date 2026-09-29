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

## Payments

Checkout supports M-Pesa, card and PayPal selection. Live gateway charges remain disabled until official payment-provider credentials are configured.

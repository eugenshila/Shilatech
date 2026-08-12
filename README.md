# Shilatech Auto Spares — Website (feature/site-shilatech)

This branch contains a demo Next.js + TypeScript + Tailwind implementation for Shilatech Auto Spares.

Contact details (used across the site):

- Phone / WhatsApp: +254721802597
- Email: Eugene.Shilachilu@gmail.com
- Location: Nairobi, Kenya
- Business hours: Weekdays 09:00 - 18:00 | Weekends 09:00 - 16:00

Quick start (after cloning):

1. Install dependencies

   npm install

2. Run dev server

   npm run dev

3. Open http://localhost:3000

Notes:
- Sample product data is in data/products.json. Replace with your catalogue or use the CSV template (coming soon).
- Images are placeholders in /public; replace with high-quality imagery for production.
- Admin page is a placeholder; full admin CRUD and CSV import will be added in subsequent commits.

I have created an initial visual identity and functional catalogue (search + filters + product pages). Next I'll add: admin CRUD, CSV import/export, request form handling, Google Maps place, SEO tweaks, and logo vector files.
  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '18'

  - name: Install system deps (psql)
    run: sudo apt-get update && sudo apt-get install -y postgresql-client

  - name: Install npm dependencies
    run: npm ci

  - name: Run SQL migrations
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    run: |
      if [ -z "$DATABASE_URL" ]; then echo "DATABASE_URL is not set"; exit 1; fi
      psql "$DATABASE_URL" -f scripts/migrations/init.sql

  - name: Run node migration script (import JSON -> Postgres)
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    run: |
      if [ -z "$DATABASE_URL" ]; then echo "DATABASE_URL is not set"; exit 1; fi
      node scripts/migrate-json-to-postgres.js

  - name: Create initial admin (optional)
    if: ${{ secrets.ADMIN_PASSWORD != '' && secrets.ADMIN_EMAIL != '' }}
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
      ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
    run: |
      if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then echo "ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping admin creation"; exit 0; fi
      node scripts/create-admin.js --email "$ADMIN_EMAIL" --password "$ADMIN_PASSWORD"

  - name: Print completion
    run: echo "Migrations and import completed. If the workflow succeeded then the DB should be populated and the admin user created (if credentials were provided)."

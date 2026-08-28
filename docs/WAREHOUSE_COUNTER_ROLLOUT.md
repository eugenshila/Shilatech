# Warehouse counter and location foundation

## Included

- `/pos`: staff counter with part-number/barcode search, shared inventory, cash change, manually confirmed M-Pesa/card references, receipts and reprints.
- Cashier role, MAIN location assignment, database-backed permission checks, and location/cashier ownership checks for counter receipts.
- FIFO batch allocations with purchase-cost snapshots, stock movements, audit records, payment-reference uniqueness, and idempotent sale submission.
- MAIN business location above existing brand storage areas. Receiving does not require a warehouse-to-counter transfer.
- Location stock view: physical sellable batch stock minus outstanding online picking quantities. Counter and online checkout fail closed on inconsistencies.
- Existing online orders retain their picking workflow. Counter sales finish immediately and do not create dispatch jobs.
- Online cancellation releases unpicked reservations once. Picked orders require a managed physical return; reopening cancelled orders is blocked.
- Counter daily totals use Nairobi dates. The admin sales-today total combines paid online orders and counter sales. Existing order lists and operations monthly order metrics remain online-order-only; counter details are in `/pos`.
- Direct product stock edits are blocked. Create products at zero, then receive opening batches. Existing batched products cannot change brand through the product editor.

## Not included / deliberately gated

This is a warehouse-counter release, not a complete accounting ERP. It does not include cashier shifts/cash-drawer reconciliation, discounts, customer credit, automated counter refunds, tax-invoice integration, offline sales, or automatic M-Pesa/card charging or verification. Staff must independently verify electronic payments before recording them. Receipts are labelled as sales receipts, not tax invoices.

Future location records default to inactive. A database check prevents activation of any location other than MAIN. Do not remove that check until warehouse receiving, imports, picking, reporting and staff permissions are scoped to branches and transfer workflows are implemented and tested. Branch transfers should have sent, in-transit and received states; a transfer must never create stock at both ends.

## Deployment order — existing shop

1. Back up the production database and verify a restore on a separate database. Record the deployed application revision.
2. Restore a recent production backup to staging. Do not use production payment credentials in staging.
3. Install dependencies. The repository specifies Node 20 and npm 10.8.2. A pnpm lockfile is also included from local verification.
4. On the existing migrated database run `npm run db:migrate:pos`. The additive migration is transactional and can be rerun. It assigns existing storage areas, orders and staff to MAIN without changing stock quantities or creating fictional batches.
5. Run `npm run db:check-stock`. Resolve every discrepancy against a physical count, batch receipts, and pending orders before releasing the new checkout. Unassigned pending order lines also require correction. The check is read-only and exits unsuccessfully when discrepancies remain.
6. Do not automatically copy the product stock number into batch records, or zero reservations to make the check pass. Older seeded catalogue stock can exist without a batch; confirm the actual stock and document any opening balance correction with an audit trail. Historical cancelled orders may need manual review.
7. Run `npm test` and `npm run build`. Test receiving, online ordering, picking, manual issuing and counter sales together on staging.
8. Schedule a short sales/receiving pause. Back up again, apply the additive migration, repeat reconciliation, and deploy the code as one coordinated release. Do not run old and new stock-changing application versions simultaneously.
9. Sign in as administrator. Under Management → Create employee, select `cashier`; new staff created there are assigned to MAIN. Existing administrators and warehouse managers are assigned by the migration. Cashiers use their ordinary staff credentials at `/account`, then select Open sales counter.
10. Verify a small controlled cash sale, change, stock movement, receipt reprint, and daily totals before opening the counter to normal use. Verify a real electronic payment independently before recording its reference.

New databases must run the full `npm run db:migrate` chain. The original migration seeds catalogue quantities; those seeds still need reconciliation into actual batches before selling.

## Operational safeguards

- A pending-sale warning means the result is uncertain. Retry that same request; never collect payment again because a response was lost. The browser stores the request in session storage and the server guarantees one committed sale per request key. Recent receipts help recover after closing a tab. Do not start the same sale in a second tab.
- If stock is inconsistent, stop selling that part and investigate. Neither checkout silently repairs it.
- Customer returns are not automated counter refunds in this release. A manager must arrange the payment refund and stock disposition through a documented, reviewed process; do not edit a completed sale or insert stock directly to disguise a return.
- Protect production credentials and backups. No production secrets belong in Git.

## Rollback

Before any new writes, the old application plus the verified pre-release database backup can be restored together. Once new sales or cancellations have occurred, do not simply restore an old database: that would lose transactions. Pause writes and reconcile all post-release movements and payments before deciding on rollback or a forward fix. Preserve the new sales/audit tables and their data.

## Verification scope

The automated tests execute the actual migration and sale/cancellation SQL using PGlite, an embedded PostgreSQL engine. They cover FIFO, reserved stock, retries, payment validation, stale stock, role and location gating, cancellation, and repeatable migration. This is not a substitute for multi-connection concurrency testing on the production PostgreSQL version. Test simultaneous online/counter orders, picking, issuing and cancellations on staging before rollout.

Local checks completed: 12 database tests; HTTP tests of the real application routes with a disposable PGlite adapter (authentication, online reservation, oversell rejection, counter sale, retry, receipt and cashier access denial); browser testing of cashier login, barcode lookup, cash sale, stock reduction, change, receipt and electronic-payment reference requirements. Local runtime: Node 24.19.0; the repository's declared Node 20 deployment runtime still needs staging verification. No live database or payment provider was contacted.

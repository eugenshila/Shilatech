# Sprint 1 — Stabilization and Operational Readiness

Sprint start: 2026-09-22
Sprint goal: Prove that Shilatech can safely process stock and sales from receipt to final delivery without inventory corruption, access leakage or silent payment errors.

## Sprint scope

### Story 1 — Test suite integrity
As the product owner, I need all automated tests to actually execute so that a green test result is meaningful.

Acceptance criteria:
- npm test includes .mjs and .cjs tests.
- counter, finance ledger, HR records, payroll, receivables and staff dashboard tests run.
- failures are fixed or documented with linked backlog items.
- npm run build succeeds.

### Story 2 — Inventory reconciliation gate
As warehouse management, I need sellable stock to agree with batch stock minus reservations so that online and counter sales cannot oversell.

Acceptance criteria:
- db:check-stock runs successfully against staging/reconciled data.
- discrepancies are not silently auto-fixed.
- opening-balance corrections are auditable.
- unresolved discrepancies block release.

### Story 3 — Role boundary verification
As the business owner, I need each staff member to see only the tools required for their job.

Acceptance criteria:
- customer cannot access staff portals.
- cashier is limited to permitted POS functions.
- warehouse roles are limited to assigned warehouse actions.
- delivery drivers see only assigned deliveries.
- admin retains full operational access.

### Story 4 — Online order end-to-end
Acceptance criteria:
- stock is reserved once at checkout.
- FIFO picking consumes the oldest valid batch.
- picking does not deduct stock a second time.
- packing/dispatch state transitions are valid.
- unpaid M-Pesa orders cannot be completed as delivered.
- proof of delivery completes order/warehouse/delivery states consistently.

### Story 5 — Counter sale end-to-end
Acceptance criteria:
- barcode/part-number lookup finds live stock.
- sale is idempotent on retry.
- payment reference uniqueness is enforced.
- cash change is correct.
- receipt can be reprinted.
- stock movement and daily totals update once.

### Story 6 — Cancellation and returns safety
Acceptance criteria:
- unpicked cancellation releases reservations exactly once.
- cancelled orders cannot be casually reopened.
- picked/issued stock requires managed return handling.
- defective stock enters quarantine/non-sellable state.
- audit trail records material stock changes.

### Story 7 — Deployment safety
Acceptance criteria:
- production backup exists before migration.
- restore is verified separately.
- Node 20 build is tested.
- /api/health reports application and database health.
- release revision is recorded.
- rollback procedure is documented.

## Explicitly out of Sprint 1
- New major modules.
- Automatic card/PayPal charging.
- Multi-branch inventory transfers.
- Automatic counter refunds.
- Tax invoice integration.
- Large UI redesigns unrelated to defects.

## Sprint exit criteria
Sprint 1 closes only after critical stock/sales workflows pass and the release checklist is signed off. Any P0 defect discovered during testing remains in this sprint until fixed or release is stopped.

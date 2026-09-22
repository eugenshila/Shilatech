# Shilatech Auto Spares — Scrum Product Backlog

Last audit: 2026-09-22
Repository: eugenshila/Shilatech
Default branch: main
Audit branch: scrum/sprint-0-audit

## Product Goal
Operate Shilatech Auto Spares as one reliable platform for catalogue sales, warehouse inventory, FIFO fulfilment, counter/POS sales, delivery, purchasing, workshop operations, finance, HR and staff access.

## Definition of Done
A backlog item is Done only when:
- code is reviewed and merged;
- automated tests pass;
- production build passes on Node 20;
- database changes are migration-safe and repeatable;
- role/permission behavior is verified;
- the user-facing workflow is tested end-to-end;
- stock-changing workflows preserve inventory integrity;
- no production secrets are committed;
- operational documentation is updated.

## Priority Backlog

### P0 — Operational safety and release readiness
1. Reconcile product stock, FIFO batches and outstanding reservations.
2. Run the complete automated test suite and repair failing or unexecuted tests.
3. Verify the production build on the declared Node 20 runtime.
4. Validate access boundaries for admin, warehouse, cashier, operations, delivery and customer roles.
5. Validate one complete online order: checkout → reserve → pick → pack → dispatch → delivery.
6. Validate one complete counter sale: lookup → payment recording → receipt → stock movement.
7. Verify cancellation and returns do not duplicate or recreate stock.
8. Verify database backup and restore procedure before any migration/release.
9. Check /api/health, application logs and database health after release.

### P1 — Payments
10. Complete production M-Pesa Daraja integration and callback validation.
11. Keep card/PayPal disabled or clearly marked until real provider integration is configured.
12. Add payment reconciliation and failed/pending payment reporting.
13. Prevent delivery completion for unpaid orders.

### P1 — Inventory and warehousing
14. Validate all brand warehouse routes and brand-scoped permissions.
15. Complete barcode-driven receiving, picking and issue flows.
16. Add controlled stock adjustment workflow with reason, approver and audit trail.
17. Add physical stock-count/cycle-count workflow and variance reporting.
18. Add low-stock and reorder reporting based on reconciled batch stock.

### P1 — Catalogue and fitment
19. Improve VIN-to-parts fitment from decoding foundation to validated compatibility matching.
20. Standardize part records: OEM number, alternate number, brand, model, year, engine, category and images.
21. Add duplicate-part detection and controlled merge/update workflow.
22. Validate product images and catalogue category fallbacks.

### P2 — Purchasing and imports
23. Extend supplier and purchase-order workflow into shipment/import tracking.
24. Track supplier paperwork, pre-clearance, KEBS/KRA stages, duties/taxes, delivery and receiving.
25. Link landed cost to received FIFO batches.
26. Add supplier performance and purchase history reporting.

### P2 — Finance
27. Reconcile POS and online revenue into management reporting.
28. Add cash-shift/cash-drawer reconciliation for cashiers.
29. Add controlled counter return/refund workflow.
30. Add gross-margin reporting using purchase-cost snapshots.
31. Prepare tax-invoice integration as a separate compliant workstream.

### P2 — Workshop / garage
32. Validate workshop job lifecycle and parts consumption.
33. Link parts issued to workshop jobs and customer invoices.
34. Track technician assignment, status and job completion.

### P2 — HR and staff
35. Validate HR records, payroll and approval workflows.
36. Complete staff onboarding/offboarding and permission revocation.
37. Add activity/audit views for sensitive employee actions.

### P3 — Customer experience
38. Improve My Garage and saved-vehicle experience.
39. Add order notifications and customer delivery updates.
40. Add invoice/receipt access from customer account.
41. Improve mobile UX across shop, account, checkout and product pages.

### P3 — Platform quality
42. Add CI checks for test + build on pull requests.
43. Add structured error logging and operational alerts.
44. Add staging environment using restored/reconciled data, never production payment credentials.
45. Add release checklist and rollback record for every production deployment.

## Current audit findings
- Next.js 14 / React 18 application with PostgreSQL.
- Railway-style migration chain is already present.
- Online catalogue, accounts, My Garage, orders and VIN filtering foundation exist.
- Warehouse fulfilment, FIFO batches, barcodes, delivery and proof-of-delivery foundations exist.
- POS/counter workflow exists with idempotency and payment-reference controls.
- Finance, receivables, HR, payroll, workshop and staff approval modules are present.
- Live payment charging is still gated pending provider credentials.
- The repository's test script currently targets tests/*.test.mjs even though several tests are .cjs; test coverage execution must therefore be verified and corrected.
- The latest main-branch commits focus on catalogue/API fallback and styling, so a full release-readiness pass is appropriate before adding major features.

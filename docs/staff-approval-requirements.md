# Staff access and exception approvals

## Confirmed by the owner

- One staff sign-in; customer accounts remain separate.
- Administrator can access every staff department and manage staff accounts.
- General manager can view all departments and reports, request changes, and review staff requests, but cannot directly change stock or sales.
- Warehouse, sales, and garage staff only access their own departmental functions.
- Ordinary sales and receiving parts do not require approval.
- Price changes, refunds, stock adjustments, and corrections require approval.
- Staff exception requests go to the general manager, then to the administrator for final approval and execution.
- Requests raised by the general manager go directly to the administrator.
- Pending requests do not change prices, balances, stock, or completed sales.

## Implementation safeguards

- Authorize every protected API using the current database role, not solely a role cached in a seven-day login token.
- Restrict navigation as well as API actions; general-manager screens must be read-only except for requests and reviews.
- Record requester, reason, exact proposed change, original values, reviewer, final approver, timestamps, and rejection reasons.
- Final approval must apply the exact reviewed payload transactionally and once only. Reject stale original values and require a new review when a proposal changes.
- Preserve FIFO batch history, pending online reservations, and stock reconciliation when adjusting inventory.
- Keep completed sale lines immutable; record refunds and corrections as linked audit entries with appropriate report totals.
- A recorded refund is not an automatic M-Pesa or bank payout. Do not claim funds have been returned without a defined settlement process and evidence.
- Do not let direct product editing, CSV import, manual issues, order updates, or alternate API routes bypass exception approvals.
- Administrator-originated exception handling should be explicit and audited; do not assume an unaudited bypass.
- Test role isolation, direct API denial, stale sessions after role changes, approval ordering, duplicate submissions, concurrent approvals, stale proposals, stock reconciliation, and unchanged routine sales/receipts before release.

## Findings from the current repository

- The staff login and role-specific landing helper already exist.
- Warehouse managers currently have counter access; the revised departmental policy requires narrowing this access.
- No general-manager or garage-staff role is currently offered by staff management.
- There is no exception-request/approval queue or POS refund workflow yet.
- Existing product editing can change prices directly; order administration can mark payments refunded directly.
- Most existing authorization checks use the role stored in the session token; counter access already fetches the database role.
- `/workshop` is a public service page whose booking form opens WhatsApp.
- `/api/garage` manages customer-owned saved vehicles, not staff jobs. It must not be repurposed to expose other customers' vehicles.

## Garage scope confirmed

The owner approved a new internal garage dashboard for manually entering bookings received through WhatsApp, creating job cards, and tracking repair progress. Customer saved vehicles and the public WhatsApp booking form remain separate. Parts requirements are notes only; they do not deduct stock or charge customers.

## Operational rules

- Administrator-originated exception requests also require independent general-manager review before the administrator applies them.
- Refunds create an approved credit ledger. The administrator records the actual external payout reference after paying the customer; no payment provider is called. Refund credits reduce net-sales reports when approved. Stock is never automatically returned by a refund.
- Stock adjustments set the counted available quantity of an existing usable batch, preserve reservations, and cannot exceed its original receipt quantity. Additional deliveries must be received as new batches.
- Sale corrections currently cover customer name and electronic payment reference. Amount corrections use an approved refund and a new correct sale; completed sale quantities and prices are not overwritten.
- Garage progress advances through booked, inspection, awaiting customer, in progress, ready, and completed. Cancellation, reopening, and corrections require the approval queue. Job notes are append-only.
- Configure a general-manager account in Operations & staff before submitting administrator-originated requests. No existing staff roles are automatically promoted.
- Warehouse managers no longer have POS or delivery management access. Retain dispatch/picker/packer roles for their existing warehouse fulfillment duties.

## Status

Implementation includes an additive migration in `staff-workflows.sql`, run by the existing POS migration command. Local automated tests and HTTP checks use disposable records, never live inventory. Deployment must pass the existing stock reconciliation and Railway health checks.

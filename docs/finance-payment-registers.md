# Finance payment registers and sales performance

This extension adds private supplier/statutory liabilities, net-salary settlement records from approved payroll, audited payment references, CSV exports, charts and monthly sales targets. It is not a full general ledger or payment gateway.

## Access and approvals

- Administrator initialises empty tables through Sales & finance → Enable extended finance.
- Finance/admin prepare supplier or statutory liabilities with amount, payee, external source reference, period and due date.
- General manager reviews; administrator gives final approval. Approved liabilities may be settled by finance/admin. Rejections are terminal.
- Salary liability amounts and approval identities are copied from an approved payroll record, once per payroll entry. Existing payroll calculations are not changed.
- Sales employees can see only their own KPIs and cannot read bills, salary records or audit events through the API.
- Administrator sets sales targets. GM views reports and reviews liabilities but cannot record payments or change targets.

## Money and duplicate protection

Liabilities and settlements store integer cents. Transactions, row locks, UUID request keys, unique bill references and unique payment references prevent repeat submissions and overpayments. The UI requires confirmation that funds have already been paid externally. No bank/M-Pesa instructions are transmitted. No documents or records can be deleted through this API.

## Reporting definitions

Liability totals cover all approved records; charts cover recorded outgoing payments. The register/CSV exposes the latest 500 bills and payments, audit the latest 200 events; aggregate totals include older records. Sales targets use POS sales less approved refund credits in the selected month. Commercial invoices are shown separately, never added to POS totals. Quotation conversions may occur after the selected quote month. Collections are lifetime recorded collections against that month's invoices, not cash received during the month.

## Required follow-up before production accounting

- Bank/M-Pesa disbursement integration, credentials and payment authorisation controls.
- eTIMS onboarding, approved integration method and testing; commercial documents are not tax invoices.
- Accountant-verified tax obligations/deadlines. This module records assessed liabilities without tax calculations or automatic filing.
- Full double-entry ledger, opening balances, bank reconciliation, invoice-to-dispatch/POS matching and consolidated financial statements remain unimplemented.
- No attachments are uploaded here; reference original supplier/assessment/receipt documents kept securely outside the register.
- No automatic liability generation for payroll statutory deductions; do not mistake a net salary settlement for statutory remittance.

Tests use isolated PGlite, never production data. Run tests/finance-ledger.test.cjs and tests/receivables.test.cjs. Setup is manual and idempotent, and does not change existing stock, payroll or sales.

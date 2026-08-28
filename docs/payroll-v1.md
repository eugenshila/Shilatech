# Kenya payroll preparation v1

This is the first ERP module, not a full accounting ledger or payment integration.
No bank/M-Pesa transfer, statutory remittance, paid status, payment credential or
bank account storage exists in this release. Statements say payment not sent.

## Access and setup

Only admin and general_manager can access `/payroll` and `/api/payroll`.
The API checks the current database role through readSession on every request.
Responses are private/no-store and noindex. Ordinary staff and finance/auditor
roles have no salary access. Admin explicitly clicks Initialise payroll to create
two empty payroll tables. Setup is repeatable and does not touch stock or sales.

Admin enters an existing staff account, month, regular basic pay, regular cash
allowances, tax residency and preferred BANK/MPESA method. These are saved as an
immutable employee/month snapshot, pending manager review. Manager review precedes
admin approval; notes and actors are recorded. Rejection permits a replacement.
A unique partial index blocks two non-rejected entries for the same employee/month.
Decisions run in transactions with row locking. No edits or deletion of submitted
amounts are exposed. Staff accounts themselves are managed in Operations & staff.

## Calculation scope

Version KE-2026-02-v1 supports February–December 2026 monthly ordinary cash pay.
All entered cash allowances are assumed regular and pensionable. No bonuses,
overtime, non-cash benefits, disability/tax exemptions, insurance relief, additional
pension/mortgage deductions, loans, arrears, prorating, termination pay, NSSF
contracting-out or employer NITA levy are calculated. Employer NSSF and housing
levy are shown separately and are not a complete employer cost estimate.
Zero/negative pay and net pay below zero are rejected rather than guessed.
Amounts use integer cents internally with rounding at individual deductions.
A qualified payroll reviewer must verify eligibility, rounding and any statutory
changes before relying on a statement for actual payments or tax filing.

## Sources checked 28 August 2026

- KRA PAYE: https://www.kra.go.ke/individual/filing-paying/types-of-taxes/paye
  Monthly brackets 24,000 at 10%, next 8,333 at 25%, next 467,667 at 30%,
  next 300,000 at 32.5%, remainder at 35%; resident personal relief 2,400.
- KRA allowable deductions: https://www.kra.go.ke/component/kra_faq/faq/732
  NSSF pension contributions, employee housing levy and SHIF reduce taxable pay
  in this limited ordinary-salary model.
- NSSF Year 4: https://www.nssf.or.ke/notice-to-employers-year-4-2026-nssf-contribution-rates/notice
  6% employee and matching employer contribution, upper earnings limit 108,000.
- SHIF: https://new.kenyalaw.org/akn/ke/act/ln/2024/49/eng%402024-03-08
  Employee 2.75% of gross, minimum 300 monthly.
- Housing levy: https://www.kra.go.ke/news-center/public-notices/2099-
  Employee and employer each 1.5% of gross monthly salary.

## Verification and remaining phases

Automated tests cover an independently calculated KSh 50,000 example, contribution
limits, residency, invalid input, role transitions, duplicate month prevention,
idempotent schema setup, immutable approval data and audit events using PGlite.
Existing POS/warehouse tests must also pass before publishing.

Next phases: recurring employee pay profiles and effective-dated changes; payroll
adjustments; reconciled payment recording; bank/M-Pesa sandbox integration; expense,
supplier and double-entry general ledger modules. Never label an approval as paid.

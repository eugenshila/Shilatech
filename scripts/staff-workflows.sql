BEGIN;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS garage_jobs (
 id BIGSERIAL PRIMARY KEY,
 job_no TEXT NOT NULL UNIQUE,
 request_key UUID NOT NULL UNIQUE,
 location_id BIGINT NOT NULL DEFAULT main_business_location_id() REFERENCES business_locations(id),
 customer_name TEXT NOT NULL,
 phone TEXT NOT NULL,
 vehicle TEXT NOT NULL,
 registration TEXT NOT NULL,
 service TEXT NOT NULL,
 preferred_date DATE,
 status TEXT NOT NULL DEFAULT 'BOOKED' CHECK(status IN ('BOOKED','INSPECTION','AWAITING_CUSTOMER','IN_PROGRESS','READY','COMPLETED','CANCELLED')),
 version INTEGER NOT NULL DEFAULT 1,
 created_by BIGINT NOT NULL REFERENCES customers(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS garage_job_notes (
 id BIGSERIAL PRIMARY KEY,
 job_id BIGINT NOT NULL REFERENCES garage_jobs(id),
 employee_id BIGINT NOT NULL REFERENCES customers(id),
 note TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS staff_requests (
 id BIGSERIAL PRIMARY KEY,
 request_key UUID NOT NULL UNIQUE,
 kind TEXT NOT NULL CHECK(kind IN ('PRICE_CHANGE','STOCK_ADJUSTMENT','REFUND','SALE_CORRECTION','ORDER_CORRECTION','GARAGE_CORRECTION')),
 target_id BIGINT NOT NULL,
 payload JSONB NOT NULL,
 before_values JSONB NOT NULL,
 reason TEXT NOT NULL,
 requested_by BIGINT NOT NULL REFERENCES customers(id),
 requester_role TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('PENDING_MANAGER','PENDING_ADMIN','APPLIED','REJECTED')),
 reviewed_by BIGINT REFERENCES customers(id),
 review_note TEXT,
 reviewed_at TIMESTAMPTZ,
 approved_by BIGINT REFERENCES customers(id),
 approved_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_requests_status ON staff_requests(status,created_at);
CREATE TABLE IF NOT EXISTS approved_refunds (
 id BIGSERIAL PRIMARY KEY,
 request_id BIGINT NOT NULL UNIQUE REFERENCES staff_requests(id),
 sale_id BIGINT REFERENCES counter_sales(id),
 order_id BIGINT REFERENCES orders(id),
 amount_kes INTEGER NOT NULL CHECK(amount_kes>0),
 status TEXT NOT NULL DEFAULT 'AWAITING_PAYOUT' CHECK(status IN ('AWAITING_PAYOUT','PAID')),
 payout_reference TEXT,
 paid_by BIGINT REFERENCES customers(id),
 paid_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK((sale_id IS NULL)<>(order_id IS NULL)),
 CHECK(status<>'PAID' OR (payout_reference IS NOT NULL AND paid_by IS NOT NULL AND paid_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_refund_payout_reference ON approved_refunds(lower(payout_reference)) WHERE payout_reference IS NOT NULL;
COMMIT;

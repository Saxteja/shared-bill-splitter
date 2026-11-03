-- Allow zero-cent shares while preserving payment records and constraints.
-- Also introduce explicitly named constraints for assignment compliance.

-- Temporarily preserve existing payment data.
CREATE TABLE payments_backup AS
SELECT * FROM payments;

-- Remove the dependent table before rebuilding shares.
DROP TABLE payments;

-- Rebuild shares with zero-cent support and named constraints.
CREATE TABLE shares_new (
  id TEXT PRIMARY KEY NOT NULL,
  bill_id TEXT NOT NULL,
  home_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  CONSTRAINT chk_shares_amount_nonnegative
    CHECK (amount_cents >= 0),

  CONSTRAINT uq_shares_bill_member
    UNIQUE (bill_id, member_id),

  CONSTRAINT uq_shares_id_amount
    UNIQUE (id, amount_cents),

  CONSTRAINT fk_shares_bill_home
    FOREIGN KEY (bill_id, home_id)
    REFERENCES bills(id, home_id) ON DELETE RESTRICT,

  CONSTRAINT fk_shares_member_home
    FOREIGN KEY (member_id, home_id)
    REFERENCES members(id, home_id) ON DELETE RESTRICT
);

INSERT INTO shares_new (
  id, bill_id, home_id, member_id, amount_cents, paid_at, created_at
)
SELECT
  id, bill_id, home_id, member_id, amount_cents, paid_at, created_at
FROM shares;

DROP TABLE shares;

ALTER TABLE shares_new RENAME TO shares;

CREATE INDEX idx_shares_bill
  ON shares(bill_id);

CREATE INDEX idx_shares_member_unpaid
  ON shares(member_id, paid_at);

-- Recreate payments with zero-cent support and named constraints.
CREATE TABLE payments (
  id TEXT PRIMARY KEY NOT NULL,
  payment_reference TEXT NOT NULL,
  share_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL,
  provider TEXT,
  provider_transaction_id TEXT,
  paid_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  CONSTRAINT uq_payments_reference
    UNIQUE (payment_reference),

  CONSTRAINT uq_payments_share
    UNIQUE (share_id),

  CONSTRAINT uq_payments_idempotency
    UNIQUE (idempotency_key),

  CONSTRAINT chk_payments_amount_nonnegative
    CHECK (amount_cents >= 0),

  CONSTRAINT fk_payments_share_amount
    FOREIGN KEY (share_id, amount_cents)
    REFERENCES shares(id, amount_cents) ON DELETE RESTRICT,

  CONSTRAINT uq_payments_provider_transaction
    UNIQUE (provider, provider_transaction_id)
);

INSERT INTO payments (
  id, payment_reference, share_id, amount_cents,
  idempotency_key, provider, provider_transaction_id,
  paid_at, created_at
)
SELECT
  id, payment_reference, share_id, amount_cents,
  idempotency_key, provider, provider_transaction_id,
  paid_at, created_at
FROM payments_backup;

DROP TABLE payments_backup;

CREATE INDEX idx_payments_paid_at
  ON payments(paid_at);
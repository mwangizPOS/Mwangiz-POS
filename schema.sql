-- MWANGI'Z Salon POS
-- PostgreSQL / Supabase-compatible physical schema.
-- This file defines persistence, constraints, and indexes only.
-- Business decisions remain in the backend event processor.

create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  create type app_role as enum ('SuperAdmin', 'BranchManager', 'Cashier');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type sale_status as enum (
    'Pending',
    'Completed',
    'Cancelled',
    'Refunded',
    'PartiallyRefunded'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type sale_item_status as enum (
    'Active',
    'Removed',
    'Refunded',
    'PartiallyRefunded'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type payment_method as enum ('Cash', 'Mpesa', 'Bank', 'Mixed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type payment_status as enum (
    'Pending',
    'Paid',
    'Failed',
    'Cancelled',
    'Refunded',
    'PartiallyRefunded'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type refund_target as enum ('Sale', 'SaleItem');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type refund_type as enum ('Partial', 'Full');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type refund_status as enum (
    'Pending',
    'Approved',
    'Rejected',
    'Completed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type settlement_status as enum ('Pending', 'Paid');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type sync_status as enum ('Pending', 'Synced', 'Failed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type audit_entity_type as enum (
    'Branch',
    'Service',
    'Worker',
    'Sale',
    'SaleItem',
    'SaleClient',
    'SplitPayment',
    'Refund',
    'WorkerSettlement',
    'OfflineQueueItem'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type audit_action as enum (
    'SaleCreated',
    'SaleCompleted',
    'SaleCancelled',
    'SaleItemAdded',
    'SaleItemUpdated',
    'SaleItemRemoved',
    'PaymentInitiated',
    'PaymentCompleted',
    'SplitPaymentRecorded',
    'RefundRequested',
    'RefundApproved',
    'RefundRejected',
    'RefundProcessed',
    'WorkerSettlementCalculated',
    'WorkerPaid',
    'WorkerSettlementMarkedPaid',
    'SettlementPaid',
    'PriceChanged',
    'ServiceModified'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type offline_action_type as enum (
    'CreateSale',
    'CreateRefund',
    'CreateWorker',
    'UpdateWorker',
    'CreateService',
    'UpdateService',
    'CreateBranch',
    'UpdateBranch',
    'CreateSettlement'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type event_aggregate_type as enum ('Sale', 'Worker', 'Branch');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type event_type as enum (
    'SaleCreated',
    'SaleCompleted',
    'SaleCancelled',
    'SaleItemAdded',
    'SaleItemUpdated',
    'SaleItemRemoved',
    'PaymentInitiated',
    'PaymentCompleted',
    'SplitPaymentRecorded',
    'RefundRequested',
    'RefundApproved',
    'RefundRejected',
    'RefundProcessed',
    'WorkerSettlementCalculated',
    'WorkerPaid',
    'WorkerSettlementMarkedPaid',
    'AuditLogCreated'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type processing_status as enum ('Pending', 'Processed', 'Rejected');
exception
  when duplicate_object then null;
end $$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  password_hash text not null,
  role app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_users_email unique (email),
  constraint chk_users_email_not_blank check (length(trim(email::text)) > 0),
  constraint chk_users_password_hash_not_blank check (length(trim(password_hash)) > 0)
);

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  address text not null,
  manager_id uuid not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_branches_code unique (code),
  constraint fk_branches_manager
    foreign key (manager_id)
    references users (id)
    on update cascade
    on delete restrict,
  constraint chk_branches_name_not_blank check (length(trim(name)) > 0),
  constraint chk_branches_code_not_blank check (length(trim(code)) > 0),
  constraint chk_branches_address_not_blank check (length(trim(address)) > 0)
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_price numeric(12, 2) not null,
  commission_percent numeric(5, 2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_services_name_not_blank check (length(trim(name)) > 0),
  constraint chk_services_default_price_nonnegative check (default_price >= 0),
  constraint chk_services_commission_range
    check (commission_percent >= 0 and commission_percent <= 100)
);

create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null,
  full_name text not null,
  phone text not null,
  skills text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_workers_branch
    foreign key (branch_id)
    references branches (id)
    on update cascade
    on delete restrict,
  constraint chk_workers_full_name_not_blank check (length(trim(full_name)) > 0),
  constraint chk_workers_phone_not_blank check (length(trim(phone)) > 0)
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null,
  branch_id uuid not null,
  status sale_status not null default 'Pending',
  payment_method payment_method null,
  payment_status payment_status not null default 'Pending',
  subtotal numeric(12, 2) not null default 0,
  refund_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  sync_status sync_status not null default 'Pending',
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null,
  cancelled_at timestamptz null,
  constraint uq_sales_sale_number unique (sale_number),
  constraint fk_sales_branch
    foreign key (branch_id)
    references branches (id)
    on update cascade
    on delete restrict,
  constraint fk_sales_created_by
    foreign key (created_by)
    references users (id)
    on update cascade
    on delete restrict,
  constraint chk_sales_sale_number_not_blank check (length(trim(sale_number)) > 0),
  constraint chk_sales_amounts_nonnegative
    check (subtotal >= 0 and refund_amount >= 0 and total_amount >= 0),
  constraint chk_sales_refund_not_above_subtotal check (refund_amount <= subtotal),
  constraint chk_sales_total_matches_refund_summary
    check (total_amount = subtotal - refund_amount),
  constraint chk_sales_paid_has_payment_method
    check (payment_status <> 'Paid' or payment_method is not null)
);

create table if not exists sale_clients (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null,
  label text not null,
  created_at timestamptz not null default now(),
  constraint uq_sale_clients_sale_id_id unique (sale_id, id),
  constraint uq_sale_clients_sale_label unique (sale_id, label),
  constraint fk_sale_clients_sale
    foreign key (sale_id)
    references sales (id)
    on update cascade
    on delete restrict,
  constraint chk_sale_clients_label_not_blank check (length(trim(label)) > 0)
);

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null,
  sale_client_id uuid null,
  service_id uuid not null,
  worker_id uuid not null,
  quantity integer not null default 1,
  price numeric(12, 2) not null,
  commission_rate_snapshot numeric(5, 2) not null,
  worker_revenue numeric(12, 2) not null default 0,
  salon_revenue numeric(12, 2) not null default 0,
  refunded_amount numeric(12, 2) not null default 0,
  status sale_item_status not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_sale_items_sale_id_id unique (sale_id, id),
  constraint fk_sale_items_sale
    foreign key (sale_id)
    references sales (id)
    on update cascade
    on delete restrict,
  constraint fk_sale_items_sale_client_same_sale
    foreign key (sale_id, sale_client_id)
    references sale_clients (sale_id, id)
    on update cascade
    on delete restrict,
  constraint fk_sale_items_service
    foreign key (service_id)
    references services (id)
    on update cascade
    on delete restrict,
  constraint fk_sale_items_worker
    foreign key (worker_id)
    references workers (id)
    on update cascade
    on delete restrict,
  constraint chk_sale_items_quantity_positive check (quantity > 0),
  constraint chk_sale_items_price_nonnegative check (price >= 0),
  constraint chk_sale_items_commission_range
    check (commission_rate_snapshot >= 0 and commission_rate_snapshot <= 100),
  constraint chk_sale_items_revenue_nonnegative
    check (worker_revenue >= 0 and salon_revenue >= 0 and refunded_amount >= 0),
  constraint chk_sale_items_refund_not_above_gross
    check (refunded_amount <= (price * quantity)),
  constraint chk_sale_items_revenue_matches_state
    check (
      (
        status = 'Removed'
        and worker_revenue = 0
        and salon_revenue = 0
      )
      or
      (
        status <> 'Removed'
        and worker_revenue + salon_revenue = (price * quantity) - refunded_amount
      )
    )
);

create table if not exists split_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null,
  method payment_method not null default 'Mixed',
  cash_amount numeric(12, 2) not null default 0,
  mpesa_amount numeric(12, 2) not null default 0,
  bank_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  constraint uq_split_payments_sale unique (sale_id),
  constraint fk_split_payments_sale
    foreign key (sale_id)
    references sales (id)
    on update cascade
    on delete restrict,
  constraint chk_split_payments_method_mixed check (method = 'Mixed'),
  constraint chk_split_payments_amounts_nonnegative
    check (cash_amount >= 0 and mpesa_amount >= 0 and bank_amount >= 0),
  constraint chk_split_payments_has_amount
    check ((cash_amount + mpesa_amount + bank_amount) > 0)
);

create table if not exists refunds (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid null,
  sale_item_id uuid null,
  refund_target refund_target not null,
  refund_type refund_type not null,
  refund_amount numeric(12, 2) not null,
  processed_amount numeric(12, 2) not null default 0,
  reason text not null,
  status refund_status not null default 'Pending',
  requested_by uuid not null,
  approved_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_refunds_sale
    foreign key (sale_id)
    references sales (id)
    on update cascade
    on delete restrict,
  constraint fk_refunds_sale_item
    foreign key (sale_item_id)
    references sale_items (id)
    on update cascade
    on delete restrict,
  constraint fk_refunds_requested_by
    foreign key (requested_by)
    references users (id)
    on update cascade
    on delete restrict,
  constraint fk_refunds_approved_by
    foreign key (approved_by)
    references users (id)
    on update cascade
    on delete restrict,
  constraint chk_refunds_target_reference
    check (
      (refund_target = 'Sale' and sale_id is not null and sale_item_id is null)
      or
      (refund_target = 'SaleItem' and sale_id is null and sale_item_id is not null)
    ),
  constraint chk_refunds_amount_positive check (refund_amount > 0),
  constraint chk_refunds_processed_nonnegative check (processed_amount >= 0),
  constraint chk_refunds_processed_not_above_requested
    check (processed_amount <= refund_amount),
  constraint chk_refunds_reason_not_blank check (length(trim(reason)) > 0),
  constraint chk_refunds_approval_consistency
    check (status <> 'Approved' or approved_by is not null)
);

create table if not exists worker_settlements (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null,
  branch_id uuid not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  total_earned numeric(12, 2) not null,
  paid_amount numeric(12, 2) not null default 0,
  unpaid_amount numeric(12, 2) generated always as (total_earned - paid_amount) stored,
  paid_by uuid null,
  paid_at timestamptz null,
  status settlement_status not null default 'Pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_worker_settlements_worker
    foreign key (worker_id)
    references workers (id)
    on update cascade
    on delete restrict,
  constraint fk_worker_settlements_branch
    foreign key (branch_id)
    references branches (id)
    on update cascade
    on delete restrict,
  constraint fk_worker_settlements_paid_by
    foreign key (paid_by)
    references users (id)
    on update cascade
    on delete restrict,
  constraint chk_worker_settlements_period check (period_end >= period_start),
  constraint chk_worker_settlements_amounts
    check (total_earned >= 0 and paid_amount >= 0 and paid_amount <= total_earned),
  constraint chk_worker_settlements_paid_consistency
    check (
      (status = 'Pending' and paid_amount < total_earned)
      or
      (status = 'Paid' and paid_amount = total_earned and paid_by is not null and paid_at is not null)
    )
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  action audit_action not null,
  entity_type audit_entity_type not null,
  entity_id uuid not null,
  performed_by uuid not null,
  branch_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now(),
  constraint fk_audit_logs_performed_by
    foreign key (performed_by)
    references users (id)
    on update cascade
    on delete restrict,
  constraint fk_audit_logs_branch
    foreign key (branch_id)
    references branches (id)
    on update cascade
    on delete restrict,
  constraint chk_audit_logs_metadata_object
    check (jsonb_typeof(metadata) = 'object')
);

create table if not exists event_store (
  event_id uuid primary key,
  event_type event_type not null,
  aggregate_id uuid not null,
  aggregate_type event_aggregate_type not null,
  branch_id uuid not null,
  actor_id uuid not null,
  payload jsonb not null,
  version integer not null,
  idempotency_key text not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  constraint uq_event_store_idempotency_key unique (idempotency_key),
  constraint fk_event_store_branch
    foreign key (branch_id)
    references branches (id)
    on update cascade
    on delete restrict,
  constraint fk_event_store_actor
    foreign key (actor_id)
    references users (id)
    on update cascade
    on delete restrict,
  constraint chk_event_store_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint chk_event_store_version_positive check (version > 0),
  constraint chk_event_store_idempotency_not_blank check (length(trim(idempotency_key)) > 0)
);

create table if not exists idempotency_keys (
  idempotency_key text primary key,
  event_id uuid not null,
  status processing_status not null default 'Processed',
  first_seen_at timestamptz not null default now(),
  processed_at timestamptz null,
  constraint uq_idempotency_keys_event unique (event_id),
  constraint fk_idempotency_keys_event
    foreign key (event_id)
    references event_store (event_id)
    on update cascade
    on delete restrict,
  constraint chk_idempotency_key_not_blank check (length(trim(idempotency_key)) > 0)
);

create table if not exists offline_queue (
  id uuid primary key default gen_random_uuid(),
  device_id text null,
  event_id uuid null,
  action_type offline_action_type not null,
  payload jsonb not null,
  sync_status sync_status not null default 'Pending',
  retry_count integer not null default 0,
  next_retry_at timestamptz null,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_offline_queue_event
    foreign key (event_id)
    references event_store (event_id)
    on update cascade
    on delete set null,
  constraint chk_offline_queue_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint chk_offline_queue_retry_count check (retry_count >= 0)
);

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
before update on users
for each row execute function set_updated_at();

drop trigger if exists trg_branches_updated_at on branches;
create trigger trg_branches_updated_at
before update on branches
for each row execute function set_updated_at();

drop trigger if exists trg_services_updated_at on services;
create trigger trg_services_updated_at
before update on services
for each row execute function set_updated_at();

drop trigger if exists trg_workers_updated_at on workers;
create trigger trg_workers_updated_at
before update on workers
for each row execute function set_updated_at();

drop trigger if exists trg_sales_updated_at on sales;
create trigger trg_sales_updated_at
before update on sales
for each row execute function set_updated_at();

drop trigger if exists trg_sale_items_updated_at on sale_items;
create trigger trg_sale_items_updated_at
before update on sale_items
for each row execute function set_updated_at();

drop trigger if exists trg_refunds_updated_at on refunds;
create trigger trg_refunds_updated_at
before update on refunds
for each row execute function set_updated_at();

drop trigger if exists trg_worker_settlements_updated_at on worker_settlements;
create trigger trg_worker_settlements_updated_at
before update on worker_settlements
for each row execute function set_updated_at();

drop trigger if exists trg_offline_queue_updated_at on offline_queue;
create trigger trg_offline_queue_updated_at
before update on offline_queue
for each row execute function set_updated_at();

create index if not exists idx_users_role on users (role);
create index if not exists idx_users_active on users (active);

create index if not exists idx_branches_manager_id on branches (manager_id);
create index if not exists idx_branches_active on branches (active);

create index if not exists idx_services_active on services (active);
create index if not exists idx_services_name_lower on services (lower(name));

create index if not exists idx_workers_branch_id on workers (branch_id);
create index if not exists idx_workers_branch_active on workers (branch_id, active);
create index if not exists idx_workers_phone on workers (phone);

create index if not exists idx_sales_branch_id on sales (branch_id);
create index if not exists idx_sales_created_at on sales (created_at);
create index if not exists idx_sales_branch_created_at on sales (branch_id, created_at);
create index if not exists idx_sales_status on sales (status);
create index if not exists idx_sales_payment_status on sales (payment_status);
create index if not exists idx_sales_sync_status on sales (sync_status);
create index if not exists idx_sales_created_by on sales (created_by);

create index if not exists idx_sale_clients_sale_id on sale_clients (sale_id);

create index if not exists idx_sale_items_sale_id on sale_items (sale_id);
create index if not exists idx_sale_items_worker_id on sale_items (worker_id);
create index if not exists idx_sale_items_service_id on sale_items (service_id);
create index if not exists idx_sale_items_sale_client_id on sale_items (sale_client_id);
create index if not exists idx_sale_items_worker_created_at on sale_items (worker_id, created_at);
create index if not exists idx_sale_items_service_created_at on sale_items (service_id, created_at);
create index if not exists idx_sale_items_sale_worker on sale_items (sale_id, worker_id);
create index if not exists idx_sale_items_status on sale_items (status);

create index if not exists idx_split_payments_sale_id on split_payments (sale_id);

create index if not exists idx_refunds_sale_id on refunds (sale_id);
create index if not exists idx_refunds_sale_item_id on refunds (sale_item_id);
create index if not exists idx_refunds_status on refunds (status);
create index if not exists idx_refunds_requested_by on refunds (requested_by);
create index if not exists idx_refunds_approved_by on refunds (approved_by);
create index if not exists idx_refunds_created_at on refunds (created_at);

create index if not exists idx_worker_settlements_worker_id on worker_settlements (worker_id);
create index if not exists idx_worker_settlements_branch_id on worker_settlements (branch_id);
create index if not exists idx_worker_settlements_status on worker_settlements (status);
create index if not exists idx_worker_settlements_worker_period
  on worker_settlements (worker_id, period_start, period_end);
create index if not exists idx_worker_settlements_created_at on worker_settlements (created_at);

create index if not exists idx_audit_logs_entity on audit_logs (entity_type, entity_id);
create index if not exists idx_audit_logs_entity_id on audit_logs (entity_id);
create index if not exists idx_audit_logs_performed_by on audit_logs (performed_by);
create index if not exists idx_audit_logs_branch_timestamp on audit_logs (branch_id, timestamp);
create index if not exists idx_audit_logs_timestamp on audit_logs (timestamp);
create index if not exists idx_audit_logs_action on audit_logs (action);

create index if not exists idx_event_store_aggregate
  on event_store (aggregate_type, aggregate_id, occurred_at);
create index if not exists idx_event_store_branch_occurred_at
  on event_store (branch_id, occurred_at);
create index if not exists idx_event_store_event_type on event_store (event_type);
create index if not exists idx_event_store_actor on event_store (actor_id);

create index if not exists idx_idempotency_keys_event_id on idempotency_keys (event_id);
create index if not exists idx_idempotency_keys_status on idempotency_keys (status);

create index if not exists idx_offline_queue_sync_status on offline_queue (sync_status);
create index if not exists idx_offline_queue_created_at on offline_queue (created_at);
create index if not exists idx_offline_queue_retry
  on offline_queue (sync_status, next_retry_at, retry_count);
create index if not exists idx_offline_queue_device_id on offline_queue (device_id);

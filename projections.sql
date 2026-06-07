create table if not exists projection_processed_events (
  projection_name text not null default 'main',
  event_id uuid not null,
  event_type event_type not null,
  aggregate_id uuid not null,
  processed_at timestamptz not null default now(),
  primary key (projection_name, event_id),
  constraint fk_projection_processed_events_event
    foreign key (event_id)
    references event_store (event_id)
    on update cascade
    on delete restrict,
  constraint chk_projection_processed_events_name_not_blank
    check (length(trim(projection_name)) > 0)
);

create table if not exists sales_projection (
  sale_id uuid primary key,
  branch_id uuid not null,
  total_amount numeric(12, 2) not null default 0,
  status sale_status not null default 'Pending',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint chk_sales_projection_total_amount_nonnegative
    check (total_amount >= 0)
);

create table if not exists sale_items_projection (
  sale_item_id uuid primary key,
  sale_id uuid not null,
  worker_id uuid not null,
  service_id uuid not null,
  client_id uuid null,
  amount numeric(12, 2) not null default 0,
  commission_amount numeric(12, 2) not null default 0,
  quantity integer not null default 1,
  unit_price numeric(12, 2) not null default 0,
  commission_rate_snapshot numeric(5, 2) not null default 0,
  refunded_amount numeric(12, 2) not null default 0,
  status sale_item_status not null default 'Active',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint fk_sale_items_projection_sale
    foreign key (sale_id)
    references sales_projection (sale_id)
    on update cascade
    on delete cascade,
  constraint chk_sale_items_projection_amounts_nonnegative
    check (
      amount >= 0
      and commission_amount >= 0
      and unit_price >= 0
      and refunded_amount >= 0
    ),
  constraint chk_sale_items_projection_quantity_positive
    check (quantity > 0),
  constraint chk_sale_items_projection_commission_rate
    check (commission_rate_snapshot >= 0 and commission_rate_snapshot <= 100)
);

create table if not exists worker_earnings_projection (
  worker_id uuid primary key,
  total_earnings numeric(12, 2) not null default 0,
  unpaid_earnings numeric(12, 2) not null default 0,
  paid_earnings numeric(12, 2) not null default 0,
  last_updated timestamptz not null default now(),
  constraint chk_worker_earnings_projection_nonnegative
    check (
      total_earnings >= 0
      and unpaid_earnings >= 0
      and paid_earnings >= 0
    )
);

create table if not exists branch_revenue_projection (
  branch_id uuid primary key,
  total_revenue numeric(12, 2) not null default 0,
  total_refunds numeric(12, 2) not null default 0,
  net_revenue numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now(),
  constraint chk_branch_revenue_projection_nonnegative
    check (
      total_revenue >= 0
      and total_refunds >= 0
      and net_revenue >= 0
    )
);

create table if not exists refund_projection (
  refund_id uuid primary key,
  sale_id uuid not null,
  sale_item_id uuid null,
  amount numeric(12, 2) not null default 0,
  type text not null,
  status refund_status not null default 'Pending',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint fk_refund_projection_sale
    foreign key (sale_id)
    references sales_projection (sale_id)
    on update cascade
    on delete cascade,
  constraint fk_refund_projection_sale_item
    foreign key (sale_item_id)
    references sale_items_projection (sale_item_id)
    on update cascade
    on delete set null,
  constraint chk_refund_projection_amount_nonnegative
    check (amount >= 0),
  constraint chk_refund_projection_type
    check (type in ('global', 'item'))
);

create table if not exists audit_projection (
  event_id uuid primary key,
  entity_type audit_entity_type not null,
  entity_id uuid not null,
  action audit_action not null,
  actor_id uuid not null,
  timestamp timestamptz not null,
  constraint fk_audit_projection_event
    foreign key (event_id)
    references event_store (event_id)
    on update cascade
    on delete restrict
);

create index if not exists idx_projection_processed_events_type
  on projection_processed_events (projection_name, event_type, processed_at);

create index if not exists idx_sales_projection_branch_status
  on sales_projection (branch_id, status);
create index if not exists idx_sales_projection_created_at
  on sales_projection (created_at);
create index if not exists idx_sales_projection_branch_updated_at
  on sales_projection (branch_id, updated_at);

create index if not exists idx_sale_items_projection_sale
  on sale_items_projection (sale_id);
create index if not exists idx_sale_items_projection_worker
  on sale_items_projection (worker_id, created_at);
create index if not exists idx_sale_items_projection_service
  on sale_items_projection (service_id, created_at);
create index if not exists idx_sale_items_projection_client
  on sale_items_projection (client_id);

create index if not exists idx_worker_earnings_projection_unpaid
  on worker_earnings_projection (unpaid_earnings);
create index if not exists idx_worker_earnings_projection_updated
  on worker_earnings_projection (last_updated);

create index if not exists idx_branch_revenue_projection_updated
  on branch_revenue_projection (updated_at);

create index if not exists idx_refund_projection_sale
  on refund_projection (sale_id, status);
create index if not exists idx_refund_projection_sale_item
  on refund_projection (sale_item_id);
create index if not exists idx_refund_projection_created_at
  on refund_projection (created_at);

create index if not exists idx_audit_projection_entity
  on audit_projection (entity_type, entity_id);
create index if not exists idx_audit_projection_actor
  on audit_projection (actor_id, timestamp);
create index if not exists idx_audit_projection_timestamp
  on audit_projection (timestamp);

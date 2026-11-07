create table if not exists app_state (
  owner_id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

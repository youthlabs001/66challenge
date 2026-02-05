-- 66challenge Supabase 스키마 (프로젝트 qhwhhujhnhkfenofoewa)
-- Supabase 대시보드 > SQL Editor에서 이 스크립트를 실행하세요.

-- 챌린지 설정 (단일 행)
create table if not exists public.challenge_config (
  id text primary key default 'default',
  start_date date not null default current_date,
  total_days int not null default 66,
  goal_pages int not null default 20,
  updated_at timestamptz default now()
);

insert into public.challenge_config (id, start_date, total_days, goal_pages)
values ('default', current_date, 66, 20)
on conflict (id) do nothing;

-- 참가자
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  password text not null default '',
  created_at timestamptz default now()
);

-- 독서 기록 (참가자별, 날짜별)
create table if not exists public.reading_records (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  record_date date not null,
  pages int not null default 0,
  book_title text default '',
  thought text default '',
  created_at timestamptz default now(),
  unique(participant_id, record_date)
);

create index if not exists idx_reading_records_participant_date
  on public.reading_records(participant_id, record_date);

-- 공지사항
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  created_at timestamptz default now()
);

-- RLS 활성화 후 anon 읽기/쓰기 허용 (프론트 anon 키 사용)
alter table public.challenge_config enable row level security;
alter table public.participants enable row level security;
alter table public.reading_records enable row level security;
alter table public.notices enable row level security;

-- anon 역할으로 모든 작업 허용 (배포 후 필요 시 정책 조정)
create policy "Allow anon all on challenge_config"
  on public.challenge_config for all to anon using (true) with check (true);

create policy "Allow anon all on participants"
  on public.participants for all to anon using (true) with check (true);

create policy "Allow anon all on reading_records"
  on public.reading_records for all to anon using (true) with check (true);

create policy "Allow anon all on notices"
  on public.notices for all to anon using (true) with check (true);

-- Shared review reactions for 1 star maccas
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

create table if not exists public.reaction_votes (
  id bigint generated always as identity primary key,
  review_id text not null,
  reaction_id text not null,
  voter_id uuid not null,
  created_at timestamptz not null default now(),
  constraint reaction_votes_unique unique (review_id, reaction_id, voter_id)
);

create index if not exists reaction_votes_review_id_idx
  on public.reaction_votes (review_id);

alter table public.reaction_votes enable row level security;

-- Public read for aggregated reaction data via RPC
create policy "reaction_votes_public_read"
  on public.reaction_votes
  for select
  to anon, authenticated
  using (true);

create or replace function public.get_review_reactions(
  p_review_id text,
  p_voter_id uuid default null
)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'counts',
    coalesce(
      (
        select json_object_agg(reaction_id, reaction_count)
        from (
          select reaction_id, count(*)::int as reaction_count
          from public.reaction_votes
          where review_id = p_review_id
          group by reaction_id
        ) grouped_counts
      ),
      '{}'::json
    ),
    'mine',
    coalesce(
      (
        select json_agg(reaction_id)
        from public.reaction_votes
        where review_id = p_review_id
          and voter_id = p_voter_id
      ),
      '[]'::json
    )
  );
$$;

create or replace function public.toggle_review_reaction(
  p_review_id text,
  p_reaction_id text,
  p_voter_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_review_id is null
    or p_review_id !~ '^mcd-[0-9]{3}-r-[a-z0-9]+$'
  then
    raise exception 'invalid review_id';
  end if;

  if p_reaction_id is null
    or p_reaction_id !~ '^[a-z0-9-]{1,32}$'
  then
    raise exception 'invalid reaction_id';
  end if;

  if p_voter_id is null then
    raise exception 'invalid voter_id';
  end if;

  if exists (
    select 1
    from public.reaction_votes
    where review_id = p_review_id
      and reaction_id = p_reaction_id
      and voter_id = p_voter_id
  ) then
    delete from public.reaction_votes
    where review_id = p_review_id
      and reaction_id = p_reaction_id
      and voter_id = p_voter_id;
  else
    insert into public.reaction_votes (review_id, reaction_id, voter_id)
    values (p_review_id, p_reaction_id, p_voter_id);
  end if;

  return public.get_review_reactions(p_review_id, p_voter_id);
end;
$$;

grant execute on function public.get_review_reactions(text, uuid) to anon, authenticated;
grant execute on function public.toggle_review_reaction(text, text, uuid) to anon, authenticated;

-- Optional: live updates in the browser (enable in Database → Replication if needed)
alter publication supabase_realtime add table public.reaction_votes;

-- Harden reaction_votes: no direct table access, whitelist reaction IDs.
-- Run after 20260527120000_reactions.sql in Supabase SQL Editor.

drop policy if exists "reaction_votes_public_read" on public.reaction_votes;

revoke all on table public.reaction_votes from anon, authenticated;

do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reaction_votes'
  ) then
    alter publication supabase_realtime drop table public.reaction_votes;
  end if;
end $$;

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
    or p_reaction_id not in (
      'laugh', 'sad', 'confused', 'shocked', 'dead', 'sick',
      'thumbs-up', 'thumbs-down', 'heart', 'fire', 'skull', 'cry',
      'pray', 'clap', 'eyes', 'poop', 'nauseated', 'angry'
    )
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

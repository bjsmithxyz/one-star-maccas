-- Clown-only reactions: drop standard emoji picker IDs from the whitelist.

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
            and reaction_id in (
              'laugh', 'sad', 'confused', 'shocked', 'dead', 'sick'
            )
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
          and reaction_id in (
            'laugh', 'sad', 'confused', 'shocked', 'dead', 'sick'
          )
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
    or p_reaction_id not in (
      'laugh', 'sad', 'confused', 'shocked', 'dead', 'sick'
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

create or replace function public.get_top_reacted_reviews(p_limit int default 3)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    json_agg(
      json_build_object(
        'review_id', review_id,
        'total_reactions', total_reactions
      )
      order by total_reactions desc
    ),
    '[]'::json
  )
  from (
    select
      review_id,
      count(*)::int as total_reactions
    from public.reaction_votes
    where review_id ~ '^mcd-[0-9]{3}-r-[a-z0-9]+$'
      and reaction_id in (
        'laugh', 'sad', 'confused', 'shocked', 'dead', 'sick'
      )
    group by review_id
    order by total_reactions desc
    limit greatest(1, least(coalesce(p_limit, 3), 25))
  ) ranked;
$$;

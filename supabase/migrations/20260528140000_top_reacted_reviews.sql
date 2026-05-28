-- Top reacted reviews leaderboard (aggregated counts only, no voter data exposed).

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
    group by review_id
    order by total_reactions desc
    limit greatest(1, least(coalesce(p_limit, 3), 25))
  ) ranked;
$$;

grant execute on function public.get_top_reacted_reviews(int) to anon, authenticated;

-- Remove legacy non-clown reaction rows (ignored by RPCs but waste storage).

delete from public.reaction_votes
where reaction_id not in (
  'laugh', 'sad', 'confused', 'shocked', 'dead', 'sick'
);

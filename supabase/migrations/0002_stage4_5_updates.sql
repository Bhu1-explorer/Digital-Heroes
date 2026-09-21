-- 1. Charities category
ALTER TABLE public.charities ADD COLUMN category TEXT;

-- 2. Scores Rolling-5 Rule
CREATE OR REPLACE FUNCTION public.enforce_rolling_5_scores()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_score_count INT;
  v_oldest_date DATE;
  v_oldest_id UUID;
BEGIN
  -- Take an advisory transaction-level lock hashed by the user_id
  -- This ensures concurrent inserts for the same user are queued and evaluated sequentially
  PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text));

  -- Get current count of scores for this user
  SELECT count(*) INTO v_score_count
  FROM public.scores
  WHERE user_id = NEW.user_id;

  -- If there are already 5 or more scores, we need to enforce the rolling 5 rule
  IF v_score_count >= 5 THEN
    -- Find the 5th most recent score's date and ID
    SELECT played_on, id INTO v_oldest_date, v_oldest_id
    FROM public.scores
    WHERE user_id = NEW.user_id
    ORDER BY played_on DESC, created_at DESC
    OFFSET 4 LIMIT 1;

    -- If the new score is older than the oldest of the 5, reject it
    IF NEW.played_on < v_oldest_date THEN
      RAISE EXCEPTION 'Score date is too old. Only the most recent 5 scores are kept.' USING ERRCODE = 'P0001';
    END IF;

    -- Otherwise, delete the oldest scores so that inserting this one keeps the count at 5
    -- We delete anything that would fall to the 5th rank or worse (offset 4) before the insert
    DELETE FROM public.scores
    WHERE id IN (
      SELECT id FROM public.scores
      WHERE user_id = NEW.user_id
      ORDER BY played_on DESC, created_at DESC
      OFFSET 4
    );
  END IF;

  -- Reject future dates
  IF NEW.played_on > CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot enter a score for a future date.' USING ERRCODE = 'P0002';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER rolling_5_trigger
  BEFORE INSERT ON public.scores
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_rolling_5_scores();

-- Migration 0004: Draw Engine RPC and Schema Updates

-- Rename columns to match the new business logic specs
ALTER TABLE draws RENAME COLUMN total_pool TO pool_total;
ALTER TABLE draws RENAME COLUMN jackpot_rollover TO jackpot_carry_out;

-- Add new columns for tracking
ALTER TABLE draws ADD COLUMN active_subscriber_count INTEGER DEFAULT 0;
ALTER TABLE draws ADD COLUMN unallocated_remainder INTEGER DEFAULT 0;

-- Create atomic publish_draw RPC
CREATE OR REPLACE FUNCTION public.publish_draw(payload json)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draw_month DATE;
  v_latest_published_month DATE;
  v_draw_id UUID;
  v_draw_status draw_status;
  
  -- variables for loop
  v_entry json;
  v_winner json;
BEGIN
  -- 1. Ensure caller is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admins only.';
  END IF;

  v_draw_month := (payload->>'month')::date;
  
  -- 2. Lock the specific month in the draws table (advisory lock or SELECT FOR UPDATE if row exists)
  -- We'll try to find the draft row and lock it. If it doesn't exist, we can't lock a row, so we just check.
  SELECT id, status INTO v_draw_id, v_draw_status 
  FROM draws 
  WHERE month = v_draw_month
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft draw for month % not found.', v_draw_month;
  END IF;

  -- 3. Ensure the draw is not already published
  IF v_draw_status = 'published' THEN
    RAISE EXCEPTION 'Draw for month % is already published.', v_draw_month;
  END IF;

  -- 4. Ensure we aren't publishing a month older than the latest published month
  SELECT MAX(month) INTO v_latest_published_month FROM draws WHERE status = 'published';
  IF v_latest_published_month IS NOT NULL AND v_draw_month <= v_latest_published_month THEN
    RAISE EXCEPTION 'Cannot publish a draw for %, because a newer or equal month (%) is already published.', v_draw_month, v_latest_published_month;
  END IF;

  -- 5. Update the draws row with the final pool payload and 'published' status
  UPDATE draws SET
    status = 'published',
    draw_numbers = (
      SELECT array_agg(x::int) FROM json_array_elements_text(payload->'draw_numbers') x
    ),
    pool_total = (payload->>'pool_total')::int,
    pool_5 = (payload->>'pool_5')::int,
    pool_4 = (payload->>'pool_4')::int,
    pool_3 = (payload->>'pool_3')::int,
    jackpot_carried_in = (payload->>'jackpot_carried_in')::int,
    jackpot_carry_out = (payload->>'jackpot_carry_out')::int,
    active_subscriber_count = (payload->>'active_subscriber_count')::int,
    unallocated_remainder = (payload->>'unallocated_remainder')::int,
    updated_at = now()
  WHERE id = v_draw_id;

  -- 6. Insert draw entries
  FOR v_entry IN SELECT * FROM json_array_elements(payload->'entries')
  LOOP
    INSERT INTO draw_entries (draw_id, user_id, match_count, scores_snapshot)
    VALUES (
      v_draw_id, 
      (v_entry->>'user_id')::uuid, 
      (v_entry->>'match_count')::int, 
      (SELECT array_agg(x::int) FROM json_array_elements_text(v_entry->'scores_snapshot') x)
    );
  END LOOP;

  -- 7. Insert winners
  FOR v_winner IN SELECT * FROM json_array_elements(payload->'winners')
  LOOP
    INSERT INTO winners (
      draw_id, 
      user_id, 
      draw_entry_id, 
      tier, 
      prize_amount, 
      verification_status, 
      payment_status
    )
    VALUES (
      v_draw_id,
      (v_winner->>'user_id')::uuid,
      (
        SELECT id FROM draw_entries WHERE draw_id = v_draw_id AND user_id = (v_winner->>'user_id')::uuid
      ),
      (v_winner->>'tier')::int,
      (v_winner->>'prize_amount')::int,
      'awaiting_proof',
      'pending'
    );
  END LOOP;

END;
$$;

-- Revoke execute from public to enforce server-action/service-role usage only
REVOKE EXECUTE ON FUNCTION public.publish_draw(json) FROM public;
REVOKE EXECUTE ON FUNCTION public.publish_draw(json) FROM anon;
REVOKE EXECUTE ON FUNCTION public.publish_draw(json) FROM authenticated;

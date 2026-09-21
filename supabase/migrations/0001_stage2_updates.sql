-- Update handle_new_user to securely extract charity preferences
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_charity_id UUID;
  v_charity_percent INT;
BEGIN
  -- Extract charity_id securely
  BEGIN
    v_charity_id := NULLIF(new.raw_user_meta_data->>'charity_id', '')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_charity_id := NULL;
  END;

  -- Extract charity_percent and ensure >= 10
  BEGIN
    v_charity_percent := COALESCE(NULLIF(new.raw_user_meta_data->>'charity_percent', '')::INT, 10);
    v_charity_percent := GREATEST(10, v_charity_percent);
  EXCEPTION WHEN OTHERS THEN
    v_charity_percent := 10;
  END;

  INSERT INTO public.profiles (id, full_name, role, charity_id, charity_percent)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    'user'::public.role_type, -- Hardcoded, NEVER from metadata
    v_charity_id, 
    v_charity_percent
  );
  
  RETURN new;
END;
$$;

-- Protect role updates so only admins can change a profile's role
CREATE OR REPLACE FUNCTION public.protect_role_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is changing, ensure the current user is an admin.
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can change roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER block_non_admin_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_role_update();

-- PostgREST Setup for Winterdienst App

-- Create roles for PostgREST
CREATE ROLE web_anon NOLOGIN;
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'authenticator_password';
GRANT web_anon TO authenticator;

-- Create authenticated role
CREATE ROLE authenticated NOLOGIN;
GRANT authenticated TO authenticator;

-- Grant permissions to web_anon (anonymous access)
GRANT USAGE ON SCHEMA public TO web_anon;
GRANT SELECT ON public.users_public TO web_anon;
GRANT SELECT ON public.routes_with_worker TO web_anon;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Function to get current user
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claim.user_id', true)::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) policies

-- Users table RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (id = current_user_id());

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_user_id() 
      AND role = 'admin'
    )
  );

-- Routes table RLS
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view assigned routes" ON routes
  FOR SELECT USING (
    assigned_worker_id = current_user_id() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_user_id() 
      AND role = 'admin'
    )
  );

-- Work sessions RLS
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own sessions" ON work_sessions
  FOR SELECT USING (
    worker_id = current_user_id() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_user_id() 
      AND role = 'admin'
    )
  );

-- Photos RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own photos" ON photos
  FOR SELECT USING (
    worker_id = current_user_id() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_user_id() 
      AND role = 'admin'
    )
  );

-- API functions for authentication
CREATE OR REPLACE FUNCTION login(email TEXT, password TEXT)
RETURNS JSON AS $$
DECLARE
  _user RECORD;
  _token TEXT;
BEGIN
  SELECT * FROM users u WHERE u.email = login.email INTO _user;
  
  IF _user IS NULL OR NOT crypt(password, _user.password_hash) = _user.password_hash THEN
    RAISE EXCEPTION 'Invalid credentials';
  END IF;
  
  -- Generate JWT token (simplified - in production use a proper JWT library)
  _token := encode(
    convert_to('{"user_id":"' || _user.id || '","role":"' || _user.role || '"}', 'utf8'),
    'base64'
  );
  
  RETURN json_build_object(
    'token', _token,
    'user', json_build_object(
      'id', _user.id,
      'name', _user.name,
      'email', _user.email,
      'role', _user.role
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION login(TEXT, TEXT) TO web_anon;
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated;
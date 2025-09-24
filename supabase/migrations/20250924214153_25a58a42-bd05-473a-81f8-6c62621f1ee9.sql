-- Create RPC function for friends leaderboard
CREATE OR REPLACE FUNCTION get_friends_leaderboard(current_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  score integer,
  test_count bigint,
  avg_score numeric,
  difficulty text,
  completed_at timestamptz,
  is_friend boolean
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH friends AS (
    SELECT 
      CASE 
        WHEN f.requester_id = current_user_id THEN f.addressee_id
        ELSE f.requester_id
      END as friend_user_id
    FROM public.friendships f
    WHERE f.status = 'accepted' 
    AND (f.requester_id = current_user_id OR f.addressee_id = current_user_id)
  ),
  friend_scores AS (
    SELECT 
      tr.user_id,
      p.username,
      p.display_name,
      p.avatar_url,
      MAX(tr.score) as score,
      COUNT(tr.id) as test_count,
      AVG(tr.score) as avg_score,
      tr.difficulty,
      MAX(tr.completed_at) as completed_at
    FROM public.test_results tr
    JOIN public.profiles p ON p.user_id = tr.user_id
    JOIN friends f ON f.friend_user_id = tr.user_id
    WHERE tr.test_date = CURRENT_DATE
    GROUP BY tr.user_id, p.username, p.display_name, p.avatar_url, tr.difficulty
  ),
  current_user_score AS (
    SELECT 
      tr.user_id,
      p.username,
      p.display_name,
      p.avatar_url,
      MAX(tr.score) as score,
      COUNT(tr.id) as test_count,
      AVG(tr.score) as avg_score,
      tr.difficulty,
      MAX(tr.completed_at) as completed_at
    FROM public.test_results tr
    JOIN public.profiles p ON p.user_id = tr.user_id
    WHERE tr.user_id = current_user_id
    AND tr.test_date = CURRENT_DATE
    GROUP BY tr.user_id, p.username, p.display_name, p.avatar_url, tr.difficulty
  )
  SELECT 
    fs.user_id,
    fs.username,
    fs.display_name,
    fs.avatar_url,
    fs.score,
    fs.test_count,
    fs.avg_score,
    fs.difficulty,
    fs.completed_at,
    true as is_friend
  FROM friend_scores fs
  UNION ALL
  SELECT 
    cus.user_id,
    cus.username,
    cus.display_name,
    cus.avatar_url,
    cus.score,
    cus.test_count,
    cus.avg_score,
    cus.difficulty,
    cus.completed_at,
    false as is_friend
  FROM current_user_score cus
  ORDER BY score DESC, completed_at ASC;
$$;
-- Fix public profile exposure by restricting profile visibility
-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a more secure policy that only allows authenticated users to view profiles
-- and implements friend-based visibility
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Users can always see their own profile
  auth.uid() = user_id 
  OR 
  -- Users can see profiles of their friends
  EXISTS (
    SELECT 1 
    FROM public.friendships f 
    WHERE f.status = 'accepted' 
    AND (
      (f.requester_id = auth.uid() AND f.addressee_id = user_id) 
      OR 
      (f.addressee_id = auth.uid() AND f.requester_id = user_id)
    )
  )
);
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, UserPlus, Check, X, Search, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { z } from 'zod';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  requester: Profile;
  addressee: Profile;
}

// Validation schema for username search
const usernameSearchSchema = z.object({
  username: z.string()
    .trim()
    .min(1, 'Username cannot be empty')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_-]*$/, 'Username can only contain letters, numbers, hyphens, and underscores')
});

const FriendsPanel = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadFriends();
      loadPendingRequests();
    }
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (error) {
      console.error('Error loading friends:', error);
      return;
    }

    // Get friend user IDs
    const friendUserIds = data.map((friendship: any) => {
      return friendship.requester_id === user.id 
        ? friendship.addressee_id 
        : friendship.requester_id;
    });

    if (friendUserIds.length === 0) {
      setFriends([]);
      return;
    }

    // Get friend profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, username, display_name, avatar_url')
      .in('user_id', friendUserIds);

    if (profilesError) {
      console.error('Error loading friend profiles:', error);
      return;
    }

    setFriends(profilesData || []);
  };

  const loadPendingRequests = async () => {
    if (!user) return;

    // Get incoming requests
    const { data: incoming, error: incomingError } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status, created_at')
      .eq('addressee_id', user.id)
      .eq('status', 'pending');

    // Get outgoing requests
    const { data: outgoing, error: outgoingError } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status, created_at')
      .eq('requester_id', user.id)
      .eq('status', 'pending');

    if (!incomingError && incoming && incoming.length > 0) {
      // Get requester profiles for incoming requests
      const requesterIds = incoming.map((req: any) => req.requester_id);
      const { data: requesterProfiles } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, avatar_url')
        .in('user_id', requesterIds);

      const enrichedIncoming = incoming.map((req: any) => {
        const requesterProfile = requesterProfiles?.find(p => p.user_id === req.requester_id);
        return {
          ...req,
          status: req.status as 'pending' | 'accepted' | 'declined',
          requester: requesterProfile || { username: 'Unknown', display_name: 'Unknown User' },
          addressee: { username: '', display_name: '' }
        };
      });
      setPendingRequests(enrichedIncoming);
    } else {
      setPendingRequests([]);
    }

    if (!outgoingError && outgoing && outgoing.length > 0) {
      // Get addressee profiles for outgoing requests
      const addresseeIds = outgoing.map((req: any) => req.addressee_id);
      const { data: addresseeProfiles } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, avatar_url')
        .in('user_id', addresseeIds);

      const enrichedOutgoing = outgoing.map((req: any) => {
        const addresseeProfile = addresseeProfiles?.find(p => p.user_id === req.addressee_id);
        return {
          ...req,
          status: req.status as 'pending' | 'accepted' | 'declined',
          requester: { username: '', display_name: '' },
          addressee: addresseeProfile || { username: 'Unknown', display_name: 'Unknown User' }
        };
      });
      setSentRequests(enrichedOutgoing);
    } else {
      setSentRequests([]);
    }
  };

  const searchUsers = async () => {
    if (!user) return;

    // Validate search input
    const validationResult = usernameSearchSchema.safeParse({ username: searchUsername });
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || 'Invalid username format';
      toast.error(errorMessage);
      return;
    }

    const trimmedUsername = validationResult.data.username;
    if (!trimmedUsername) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, avatar_url')
        .ilike('username', `%${trimmedUsername}%`)
        .neq('user_id', user.id)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        toast.error(t('errorSearchingUsers'));
      } else {
        setSearchResults(data || []);
      }
    } catch (err) {
      console.error('Unexpected error during search:', err);
      toast.error(t('errorSearchingUsers'));
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return;

    // Validate target user ID (basic UUID format check)
    if (!targetUserId || typeof targetUserId !== 'string' || targetUserId.length < 10) {
      toast.error('Invalid user selection');
      return;
    }

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: targetUserId,
          status: 'pending'
        });

      if (error) {
        console.error('Error sending friend request:', error);
        // Check if it's a duplicate request error
        if (error.code === '23505') {
          toast.error('Friend request already exists');
        } else {
          toast.error(t('errorSendingRequest'));
        }
      } else {
        toast.success(t('friendRequestSent'));
        loadPendingRequests();
        setSearchResults([]);
        setSearchUsername('');
      }
    } catch (err) {
      console.error('Unexpected error sending friend request:', err);
      toast.error(t('errorSendingRequest'));
    }
  };

  const respondToRequest = async (friendshipId: string, status: 'accepted' | 'declined') => {
    const { error } = await supabase
      .from('friendships')
      .update({ status })
      .eq('id', friendshipId);

    if (error) {
      console.error('Error responding to request:', error);
      toast.error(t('errorRespondingToRequest'));
    } else {
      toast.success(status === 'accepted' ? t('friendRequestAccepted') : t('friendRequestDeclined'));
      loadFriends();
      loadPendingRequests();
    }
  };

  const isAlreadyFriend = (userId: string) => {
    return friends.some(friend => friend.user_id === userId);
  };

  const hasPendingRequest = (userId: string) => {
    return sentRequests.some(request => request.addressee_id === userId) ||
           pendingRequests.some(request => request.requester_id === userId);
  };

  return (
    <div className="space-y-6">
      {/* Search for friends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {t('addFriends')}
          </CardTitle>
          <CardDescription>{t('searchForFriends')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchByUsername')}
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
            </div>
            <Button onClick={searchUsers} disabled={loading}>
              {t('search')}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">@{profile.username}</div>
                    <div className="text-sm text-muted-foreground">{profile.display_name}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendFriendRequest(profile.user_id)}
                    disabled={isAlreadyFriend(profile.user_id) || hasPendingRequest(profile.user_id)}
                  >
                    {isAlreadyFriend(profile.user_id) ? t('friends') : 
                     hasPendingRequest(profile.user_id) ? t('pending') : t('addFriend')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending friend requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('friendRequests')}</CardTitle>
            <CardDescription>{t('respondToRequests')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">@{request.requester.username}</div>
                  <div className="text-sm text-muted-foreground">{request.requester.display_name}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => respondToRequest(request.id, 'accepted')}
                  >
                    <Check className="w-4 h-4" />
                    {t('accept')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => respondToRequest(request.id, 'declined')}
                  >
                    <X className="w-4 h-4" />
                    {t('decline')}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Friends list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('myFriends')} ({friends.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('noFriendsYet')}</p>
              <p className="text-sm">{t('searchAboveToAdd')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">@{friend.username}</div>
                    <div className="text-sm text-muted-foreground">{friend.display_name}</div>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    {t('friend')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FriendsPanel;
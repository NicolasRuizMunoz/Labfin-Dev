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
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        requester:profiles!friendships_requester_id_fkey(id, user_id, username, display_name, avatar_url),
        addressee:profiles!friendships_addressee_id_fkey(id, user_id, username, display_name, avatar_url)
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (error) {
      console.error('Error loading friends:', error);
      return;
    }

    const friendProfiles = data.map((friendship: any) => {
      return friendship.requester_id === user.id 
        ? friendship.addressee 
        : friendship.requester;
    });

    setFriends(friendProfiles);
  };

  const loadPendingRequests = async () => {
    if (!user) return;

    // Get incoming requests
    const { data: incoming, error: incomingError } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        created_at,
        requester:profiles!friendships_requester_id_fkey(id, user_id, username, display_name, avatar_url),
        addressee:profiles!friendships_addressee_id_fkey(id, user_id, username, display_name, avatar_url)
      `)
      .eq('addressee_id', user.id)
      .eq('status', 'pending');

    // Get outgoing requests
    const { data: outgoing, error: outgoingError } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        created_at,
        requester:profiles!friendships_requester_id_fkey(id, user_id, username, display_name, avatar_url),
        addressee:profiles!friendships_addressee_id_fkey(id, user_id, username, display_name, avatar_url)
      `)
      .eq('requester_id', user.id)
      .eq('status', 'pending');

    if (!incomingError && incoming) {
      setPendingRequests(incoming);
    }
    if (!outgoingError && outgoing) {
      setSentRequests(outgoing);
    }
  };

  const searchUsers = async () => {
    if (!searchUsername.trim() || !user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, username, display_name, avatar_url')
      .ilike('username', `%${searchUsername}%`)
      .neq('user_id', user.id)
      .limit(10);

    if (error) {
      console.error('Error searching users:', error);
      toast.error(t('errorSearchingUsers'));
    } else {
      setSearchResults(data || []);
    }
    setLoading(false);
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('friendships')
      .insert({
        requester_id: user.id,
        addressee_id: targetUserId,
        status: 'pending'
      });

    if (error) {
      console.error('Error sending friend request:', error);
      toast.error(t('errorSendingRequest'));
    } else {
      toast.success(t('friendRequestSent'));
      loadPendingRequests();
      setSearchResults([]);
      setSearchUsername('');
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
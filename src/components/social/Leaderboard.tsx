import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Crown, Users, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  score: number;
  test_count: number;
  avg_score: number;
  difficulty: string;
  completed_at: string;
  is_friend: boolean;
}

const Leaderboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLeaderboards();
    }
  }, [user]);

  const loadLeaderboards = async () => {
    if (!user) return;

    setLoading(true);

    // Get global leaderboard (today's best scores)
    const { data: globalData, error: globalError } = await supabase
      .from('test_results')
      .select(`
        user_id,
        score,
        difficulty,
        completed_at,
        profiles!inner(username, display_name, avatar_url)
      `)
      .eq('test_date', new Date().toISOString().split('T')[0])
      .order('score', { ascending: false })
      .limit(50);

    if (!globalError && globalData) {
      const processedGlobal = globalData.map((entry: any) => ({
        user_id: entry.user_id,
        username: entry.profiles.username,
        display_name: entry.profiles.display_name,
        avatar_url: entry.profiles.avatar_url,
        score: entry.score,
        difficulty: entry.difficulty,
        completed_at: entry.completed_at,
        test_count: 1,
        avg_score: entry.score,
        is_friend: false
      }));
      setGlobalLeaderboard(processedGlobal);
    }

    // Get friends leaderboard
    try {
      const { data: friendsData, error: friendsError } = await supabase.rpc('get_friends_leaderboard', {
        current_user_id: user.id
      });

      if (!friendsError && friendsData) {
        setFriendsLeaderboard(friendsData);
      }
    } catch (error) {
      console.error('Error loading friends leaderboard:', error);
      setFriendsLeaderboard([]);
    }

    setLoading(false);
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-500" />;
      default:
        return <Award className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRankBadgeVariant = (position: number) => {
    switch (position) {
      case 1:
        return "default";
      case 2:
        return "secondary";
      case 3:
        return "outline";
      default:
        return "secondary";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const LeaderboardList = ({ entries, showFriendBadge = false }: { entries: LeaderboardEntry[], showFriendBadge?: boolean }) => (
    <div className="space-y-3">
      {entries.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t('noScoresYet')}</p>
          <p className="text-sm">{t('takeTestToAppear')}</p>
        </div>
      ) : (
        entries.map((entry, index) => (
          <div
            key={entry.user_id}
            className={`flex items-center justify-between p-4 border rounded-lg ${
              entry.user_id === user?.id ? 'bg-primary/5 border-primary/20' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getRankIcon(index + 1)}
                <span className="font-bold text-lg">#{index + 1}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">@{entry.username}</span>
                  {entry.user_id === user?.id && (
                    <Badge variant="outline" className="text-xs">{t('you')}</Badge>
                  )}
                  {showFriendBadge && entry.is_friend && (
                    <Badge variant="secondary" className="text-xs">{t('friend')}</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{entry.display_name}</div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(entry.difficulty)}>
                  {t(entry.difficulty)}
                </Badge>
                <span className="text-2xl font-bold text-primary">{entry.score}%</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(entry.completed_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {t('rankings')}
          </CardTitle>
          <CardDescription>{t('seeHowYouCompare')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="global" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="global" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('todayGlobal')}
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t('friends')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="global">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {t('topScoresToday')}
                </div>
                <LeaderboardList entries={globalLeaderboard} />
              </div>
            </TabsContent>

            <TabsContent value="friends">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {t('friendsPerformance')}
                </div>
                <LeaderboardList entries={friendsLeaderboard} showFriendBadge />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
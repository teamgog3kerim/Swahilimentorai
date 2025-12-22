import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Flame, BookOpen, Clock, User as UserIcon } from "lucide-react";
import type { User } from "@shared/schema";

export default function Leaderboard() {
  const { data: allTimeLeaderboard = [], isLoading: isLoadingAllTime } = useQuery<User[]>({
    queryKey: ['/api/leaderboard?type=allTime'],
  });

  const { data: weeklyLeaderboard = [], isLoading: isLoadingWeekly } = useQuery<User[]>({
    queryKey: ['/api/leaderboard?type=weekly'],
  });

  const { data: userRankData } = useQuery<{ rank: number; user: User }>({
    queryKey: ['/api/leaderboard/rank'],
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{index + 1}</span>;
    }
  };

  const renderLeaderboardList = (users: User[], isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无排名数据</p>
          <p className="text-sm">开始学习以登上排行榜！</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {users.map((user, index) => (
          <div
            key={user.id}
            className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
              index < 3 ? "bg-accent/50" : "bg-card hover-elevate"
            }`}
            data-testid={`leaderboard-row-${index}`}
          >
            <div className="flex-shrink-0">
              {getRankIcon(index)}
            </div>
            <Avatar className="w-10 h-10">
              <AvatarFallback>
                <UserIcon className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.username}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {user.currentStreak} 天连续
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {user.lessonsCompleted} 课程
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-primary">{user.totalPoints}</p>
              <p className="text-xs text-muted-foreground">积分</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-leaderboard-title">排行榜</h1>
        <p className="text-muted-foreground">与其他学习者一起竞争，提升您的斯瓦希里语水平</p>
      </div>

      {userRankData && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">您的当前排名</p>
                <p className="text-3xl font-bold">第 {userRankData.rank} 名</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{userRankData.user.totalPoints}</p>
                  <p className="text-xs text-muted-foreground">积分</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{userRankData.user.lessonsCompleted}</p>
                  <p className="text-xs text-muted-foreground">课程</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{userRankData.user.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">连续天数</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="allTime" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="allTime" data-testid="tab-all-time">总榜</TabsTrigger>
          <TabsTrigger value="weekly" data-testid="tab-weekly">周榜</TabsTrigger>
        </TabsList>
        <TabsContent value="allTime">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                总积分排行
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboardList(allTimeLeaderboard, isLoadingAllTime)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                本周活跃排行
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboardList(weeklyLeaderboard, isLoadingWeekly)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

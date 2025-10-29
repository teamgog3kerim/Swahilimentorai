import { useQuery } from "@tanstack/react-query";
import { BookOpen, MessageSquare, Flame, Trophy, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProgress, Lesson } from "@shared/schema";

export default function ProgressPage() {
  const { data: progress, isLoading: progressLoading } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress"],
  });

  const { data: allLessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
  });

  const isLoading = progressLoading || lessonsLoading;

  const completedLessons = progress?.filter((p) => p.completed) || [];
  const totalLessons = allLessons?.length || 0;
  const completionRate = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0;

  const getLessonsByLevel = (level: string) => {
    return allLessons?.filter((lesson) => lesson.level === level) || [];
  };

  const getCompletedByLevel = (level: string) => {
    const levelLessons = getLessonsByLevel(level);
    return levelLessons.filter((lesson) =>
      completedLessons.some((p) => p.lessonId === lesson.id)
    ).length;
  };

  const recentLessons = progress
    ?.sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
    .slice(0, 5)
    .map((p) => ({
      progress: p,
      lesson: allLessons?.find((l) => l.id === p.lessonId),
    }))
    .filter((item) => item.lesson);

  const stats = [
    {
      title: "已完成课程",
      value: completedLessons.length.toString(),
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "学习天数",
      value: "7",
      icon: Flame,
      color: "text-orange-600",
    },
    {
      title: "练习次数",
      value: "0",
      icon: MessageSquare,
      color: "text-green-600",
    },
    {
      title: "成就徽章",
      value: "3",
      icon: Trophy,
      color: "text-purple-600",
    },
  ];

  const levels = [
    { id: "beginner", name: "初学者", nameSwahili: "Mwanzo" },
    { id: "intermediate", name: "中级", nameSwahili: "Kati" },
    { id: "advanced", name: "高级", nameSwahili: "Juu" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">学习进度</h1>
        <p className="text-muted-foreground text-lg">追踪你的学习成果</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title} data-testid={`card-stat-${stat.title}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <span className="text-3xl font-bold" data-testid={`text-${stat.title}-value`}>
                      {stat.value}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>总体进度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    已完成 {completedLessons.length} / {totalLessons} 课程
                  </span>
                  <span className="font-semibold">{completionRate.toFixed(0)}%</span>
                </div>
                <Progress value={completionRate} data-testid="progress-overall" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>各级别进度</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {levels.map((level) => {
                const total = getLessonsByLevel(level.id).length;
                const completed = getCompletedByLevel(level.id);
                const percentage = total > 0 ? (completed / total) * 100 : 0;

                return (
                  <div key={level.id} className="space-y-2" data-testid={`progress-level-${level.id}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{level.name}</p>
                        <p className="text-sm text-muted-foreground">{level.nameSwahili}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {completed} / {total}
                        </p>
                        <p className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</p>
                      </div>
                    </div>
                    <Progress value={percentage} />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {recentLessons && recentLessons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>最近学习</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentLessons.map((item, idx) => (
                    <div
                      key={item.progress.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                      data-testid={`recent-lesson-${idx}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.lesson?.titleSwahili}</p>
                        <p className="text-sm text-muted-foreground">{item.lesson?.titleChinese}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={item.progress.completed ? "default" : "secondary"}>
                          {item.progress.completed ? "已完成" : "学习中"}
                        </Badge>
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>成就徽章</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {[
                  { name: "初学者", unlocked: true },
                  { name: "坚持者", unlocked: true },
                  { name: "对话者", unlocked: true },
                  { name: "中级达人", unlocked: false },
                  { name: "高级大师", unlocked: false },
                  { name: "全能学霸", unlocked: false },
                ].map((badge, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center p-4 bg-muted rounded-md ${
                      !badge.unlocked && "opacity-50 grayscale"
                    }`}
                    data-testid={`badge-achievement-${idx}`}
                  >
                    <Trophy className={`w-8 h-8 mb-2 ${badge.unlocked ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-xs text-center font-medium">{badge.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

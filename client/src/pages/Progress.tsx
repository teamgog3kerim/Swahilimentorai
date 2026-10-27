import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { UserProgress, Lesson } from "@shared/schema";
import { useLocale } from "@/lib/i18n";
import { useTrack } from "@/contexts/TrackContext";

export default function ProgressPage() {
  const { language, t } = useLocale();
  const { track } = useTrack();
  const { data: progress, isLoading: progressLoading, isError: progressError, refetch: refetchProgress } = useQuery<UserProgress[]>({
    queryKey: [`/api/progress?language=${track || "swahili"}`],
    enabled: !!track,
  });

  const { data: allLessons, isLoading: lessonsLoading, isError: lessonsError, refetch: refetchLessons } = useQuery<Lesson[]>({
    queryKey: [`/api/lessons?language=${track || "swahili"}`],
    enabled: !!track,
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

  const recentLessons = [...(progress || [])]
    ?.sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
    .slice(0, 5)
    .map((p) => ({
      progress: p,
      lesson: allLessons?.find((l) => l.id === p.lessonId),
    }))
    .filter((item) => item.lesson);

  const levels = [
    { id: "beginner", name: t("初学者"), nameSwahili: "Mwanzo" },
    { id: "intermediate", name: t("中级"), nameSwahili: "Kati" },
    { id: "advanced", name: t("高级"), nameSwahili: "Juu" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto" data-testid="page-progress">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[.22em] text-primary">{track === "amharic" ? "አማርኛ · AMHARIC" : "Kiswahili · SWAHILI"}</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold mb-2">{language === "en" ? "Your progress" : "学习进度"}</h1>
        <p className="text-muted-foreground text-lg">{language === "en" ? "A clear view of the lessons you have completed on this track." : "查看当前学习路径中已完成的课程。"}</p>
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
      ) : progressError || lessonsError ? (
        <Card><CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{language === "en" ? "Progress could not be loaded." : "学习进度暂时无法加载。"}</p>
          <Button className="mt-4" variant="outline" onClick={() => { refetchProgress(); refetchLessons(); }}>{language === "en" ? "Retry" : "重试"}</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t("总体进度")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("已完成")} {completedLessons.length} / {totalLessons} {t("课程")}
                  </span>
                  <span className="font-semibold">{completionRate.toFixed(0)}%</span>
                </div>
                <Progress value={completionRate} data-testid="progress-overall" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("各级别进度")}</CardTitle>
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
                  <p className="text-sm text-muted-foreground">{track === "amharic" ? (language === "en" ? "Amharic" : "阿姆哈拉语") : level.nameSwahili}</p>
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
                <CardTitle>{t("最近学习")}</CardTitle>
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
                        <p className="font-medium">{language === "en" ? item.lesson?.title : track === "amharic" ? item.lesson?.title : item.lesson?.titleSwahili}</p>
                        <p className="text-sm text-muted-foreground">{language === "en" ? (track === "amharic" ? item.lesson?.titleChinese : item.lesson?.titleSwahili) : item.lesson?.titleChinese}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={item.progress.completed ? "default" : "secondary"}>
                          {item.progress.completed ? t("已完成") : t("学习中")}
                        </Badge>
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      )}
    </div>
  );
}

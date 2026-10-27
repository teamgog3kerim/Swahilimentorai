import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GraduationCap, BookOpen, Award, Clock, CheckCircle2, Lock, Download, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { saveLessonOffline, isLessonDownloaded, deleteLessonOffline, getAllOfflineLessons, type OfflineLesson } from "@/lib/offlineStorage";
import type { Lesson, UserProgress } from "@shared/schema";
import { useLocale } from "@/lib/i18n";
import { useTrack } from "@/contexts/TrackContext";
import { LessonContentView as FocusedLessonContentView } from "@/components/learning/LessonContentView";

interface LearnProps {
  onNavigateToPractice: (lessonId?: string) => void;
}

type Level = "beginner" | "intermediate" | "advanced";

export default function Learn({ onNavigateToPractice }: LearnProps) {
  const { user } = useAuth();
  const { language, t } = useLocale();
  const { track } = useTrack();
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const lessonDialogRef = useRef<HTMLDivElement>(null);
  const [downloadedLessonIds, setDownloadedLessonIds] = useState<Set<string>>(new Set());
  const [downloadingLessonIds, setDownloadingLessonIds] = useState<Set<string>>(new Set());
  const [offlineStorageAvailable, setOfflineStorageAvailable] = useState(true);

  const { data: lessons, isLoading: lessonsLoading, isError: lessonsError, refetch: refetchLessons } = useQuery<Lesson[]>({
    queryKey: selectedLevel ? [`/api/lessons/level/${selectedLevel}?language=${track || "swahili"}`] : [`/api/lessons?language=${track || "swahili"}`],
    enabled: !!track,
  });

  const { data: progress } = useQuery<UserProgress[]>({
    queryKey: [`/api/progress?language=${track || "swahili"}`],
    enabled: !!track,
  });
  const completion = useMutation({
    mutationFn: async ({ lessonId, completed }: { lessonId: string; completed: boolean }) =>
      apiRequest("POST", "/api/progress", { lessonId, completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/progress?language=${track || "swahili"}`] });
      toast({ title: language === "en" ? "Progress saved" : "学习进度已保存" });
    },
    onError: () => toast({
      title: language === "en" ? "Couldn't save progress. Please try again online." : "无法保存进度，请联网后重试。",
      variant: "destructive",
    }),
  });

  const getLessonProgress = (lessonId: string) => {
    return progress?.find((p) => p.lessonId === lessonId);
  };
  const categoryLabel = (category: string) => {
    if (track !== "amharic") return category;
    const values: Record<string, [string, string]> = {
      letters: ["Ethiopic letters", "埃塞俄比亚字母"],
      words: ["Vocabulary", "词汇"],
      numbers: ["Numbers", "数字"],
      conversations: ["Conversations", "对话"],
    };
    return values[category]?.[language === "en" ? 0 : 1] || (language === "en" ? "Lesson" : "课程");
  };

  const levels = [
    {
      id: "beginner" as Level,
      title: t("初学者"),
      titleSwahili: "Mwanzo",
      description: t("开始学习基础词汇和短语"),
      icon: GraduationCap,
      color: "bg-green-500",
    },
    {
      id: "intermediate" as Level,
      title: t("中级"),
      titleSwahili: "Kati",
      description: t("扩展词汇量和对话能力"),
      icon: BookOpen,
      color: "bg-blue-500",
    },
    {
      id: "advanced" as Level,
      title: t("高级"),
      titleSwahili: "Juu",
      description: t("掌握高级语法和流利对话"),
      icon: Award,
      color: "bg-purple-500",
    },
  ];

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
  };

  useEffect(() => {
    if (selectedLesson) lessonDialogRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedLesson?.id]);

  useEffect(() => {
    async function loadDownloadedLessons() {
      const offlineLessons = await getAllOfflineLessons();
      setDownloadedLessonIds(new Set(offlineLessons.map(l => l.id)));
    }
    loadDownloadedLessons().catch(() => setOfflineStorageAvailable(false));
  }, []);

  const handleStartPractice = () => {
    setSelectedLesson(null);
    onNavigateToPractice(selectedLesson?.id);
  };

  const handleDownloadLesson = async (lesson: Lesson, e: React.MouseEvent) => {
    e.stopPropagation();
    const lessonId = lesson.id;
    
    if (downloadedLessonIds.has(lessonId)) {
      try {
        await deleteLessonOffline(lessonId);
        setDownloadedLessonIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(lessonId);
          return newSet;
        });
        toast({
          title: t("已删除"),
          description: `${language === "en" ? lesson.title : lesson.titleChinese} ${t("已从离线存储中删除")}`
        });
      } catch (error) {
        toast({
          title: t("删除失败"),
          description: t("无法删除离线课程"),
          variant: "destructive"
        });
      }
      return;
    }

    setDownloadingLessonIds(prev => new Set(prev).add(lessonId));
    
    try {
      const offlineLesson: OfflineLesson = {
        id: lessonId,
        title: lesson.titleChinese || lesson.titleSwahili || '',
        level: lesson.level,
        category: lesson.category,
        content: lesson.content,
        downloadedAt: Date.now()
      };
      
      await saveLessonOffline(offlineLesson);
      
      setDownloadedLessonIds(prev => new Set(prev).add(lessonId));
      
      toast({
        title: t("下载完成"),
        description: `${language === "en" ? lesson.title : lesson.titleChinese} ${t("已保存，可离线访问")}`
      });
    } catch (error) {
      console.error('Failed to download lesson:', error);
      toast({
        title: t("下载失败"),
        description: t("无法保存课程到离线存储"),
        variant: "destructive"
      });
    } finally {
      setDownloadingLessonIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(lessonId);
        return newSet;
      });
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto" data-testid="page-learn">
      <OfflineIndicator />
      
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[.22em] text-primary">{track === "amharic" ? "አማርኛ · AMHARIC" : "Kiswahili · SWAHILI"}</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold mb-2">{language === "en" ? "Learn" : "学习"}</h1>
        <p className="text-muted-foreground text-lg">{language === "en" ? "Choose a level and build your language, one useful lesson at a time." : "选择学习级别，用一节节实用课程建立语言能力。"}</p>
      </div>

      {!selectedLevel ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {levels.map((level) => (
            <Card
              key={level.id}
              className="hover-elevate cursor-pointer transition-all"
              onClick={() => setSelectedLevel(level.id)}
              data-testid={`card-level-${level.id}`}
            >
              <CardHeader>
                <div className={`w-16 h-16 ${level.color} rounded-xl flex items-center justify-center mb-4`}>
                  <level.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-1">{level.title}</CardTitle>
                <CardDescription className="text-lg font-medium text-foreground/70">
                  {track === "amharic" ? (level.id === "beginner" ? "ጀማሪ" : level.id === "intermediate" ? "መካከለኛ" : "የላቀ") : level.titleSwahili}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{level.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => setSelectedLevel(null)}
              data-testid="button-back-to-levels"
            >
              {t("返回级别选择")}
            </Button>
            <h2 className="text-2xl font-semibold">
              {levels.find((l) => l.id === selectedLevel)?.title} {t("课程")}
            </h2>
          </div>

          {lessonsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : lessonsError ? (
            <Card><CardContent className="py-10 text-center">
              <p className="text-muted-foreground">{language === "en" ? "Lessons could not be loaded. Check your connection and try again." : "课程暂时无法加载，请检查网络后重试。"}</p>
              <Button className="mt-4" variant="outline" onClick={() => refetchLessons()}>{language === "en" ? "Retry" : "重试"}</Button>
            </CardContent></Card>
          ) : lessons && lessons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map((lesson) => {
                const lessonProgress = getLessonProgress(lesson.id);
                const isCompleted = lessonProgress?.completed;
                const lessonId = lesson.id;
                const isDownloaded = downloadedLessonIds.has(lessonId);
                const isDownloading = downloadingLessonIds.has(lessonId);

                return (
                  <Card
                    key={lesson.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => handleLessonClick(lesson)}
                    data-testid={`card-lesson-${lesson.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-xl flex-1">{language === "en" ? lesson.title : (track === "amharic" ? lesson.titleChinese : lesson.titleSwahili)}</CardTitle>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isCompleted && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" data-testid="icon-completed" />
                          )}
                          <Button
                            size="icon"
                            variant={isDownloaded ? "default" : "ghost"}
                            onClick={(e) => handleDownloadLesson(lesson, e)}
                            disabled={isDownloading || !offlineStorageAvailable}
                            title={!offlineStorageAvailable ? (language === "en" ? "Offline storage is unavailable in this browser" : "此浏览器暂不支持离线存储") : undefined}
                            className="h-8 w-8"
                            data-testid={`button-download-${lesson.id}`}
                          >
                            {isDownloading ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isDownloaded ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="text-base">{language === "en" ? (track === "amharic" ? lesson.title : lesson.titleSwahili) : lesson.titleChinese}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary">{categoryLabel(lesson.category)}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{lesson.estimatedMinutes} {t("分钟")}</span>
                        </div>
                        {isDownloaded && (
                          <Badge variant="outline" className="text-xs">
                            {t("已下载")}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">{t("该级别暂无课程")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent ref={lessonDialogRef} className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-lesson-detail">
          <DialogHeader>
            <DialogTitle className="text-2xl">{language === "en" ? selectedLesson?.title : (track === "amharic" ? selectedLesson?.titleChinese : selectedLesson?.titleSwahili)}</DialogTitle>
            <DialogDescription className="text-lg">{language === "en" ? (track === "amharic" ? selectedLesson?.titleChinese : selectedLesson?.titleSwahili) : selectedLesson?.title}</DialogDescription>
          </DialogHeader>

          {selectedLesson && lessons && (() => {
            const lessonIndex = lessons.findIndex((lesson) => lesson.id === selectedLesson.id);
            return <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
              <Button variant="outline" size="sm" disabled={lessonIndex <= 0}
                onClick={() => lessonIndex > 0 && setSelectedLesson(lessons[lessonIndex - 1])}
                data-testid="button-previous-lesson">
                {language === "en" ? "Previous lesson" : "上一课"}
              </Button>
              <span className="text-sm text-muted-foreground" data-testid="text-lesson-position">
                {lessonIndex >= 0 ? `${lessonIndex + 1} / ${lessons.length}` : ""}
              </span>
              <Button variant="outline" size="sm" disabled={lessonIndex < 0 || lessonIndex >= lessons.length - 1}
                onClick={() => lessonIndex >= 0 && lessonIndex < lessons.length - 1 && setSelectedLesson(lessons[lessonIndex + 1])}
                data-testid="button-next-lesson">
                {language === "en" ? "Next lesson" : "下一课"}
              </Button>
            </div>;
          })()}

          {selectedLesson?.content && typeof selectedLesson.content === 'object' ? (
            <FocusedLessonContentView key={selectedLesson.id} content={selectedLesson.content as Record<string, unknown>} lessonTitle={selectedLesson.title} t={t} />
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setSelectedLesson(null)} data-testid="button-back-to-lesson-list">
              {language === "en" ? "Back to lessons" : "返回课程列表"}
            </Button>
            <Button
              variant="outline"
              disabled={!selectedLesson || completion.isPending}
              data-testid="button-toggle-lesson-completion"
              onClick={() => selectedLesson && completion.mutate({
                lessonId: selectedLesson.id, completed: !getLessonProgress(selectedLesson.id)?.completed,
              })}
            >
              {getLessonProgress(selectedLesson?.id || "")?.completed
                ? (language === "en" ? "Mark incomplete" : "标记为未完成")
                : (language === "en" ? "Mark complete" : "标记为已完成")}
            </Button>
            <Button onClick={handleStartPractice} className="flex-1" data-testid="button-start-practice">
              {t("开始练习")}
            </Button>
            <Button variant="outline" onClick={() => setSelectedLesson(null)} data-testid="button-close-lesson">
              {t("关闭")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

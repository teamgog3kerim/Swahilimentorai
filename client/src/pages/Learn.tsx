import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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

interface LearnProps {
  onNavigateToPractice: (lessonId?: string) => void;
}

type Level = "beginner" | "intermediate" | "advanced";

export default function Learn({ onNavigateToPractice }: LearnProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [downloadedLessonIds, setDownloadedLessonIds] = useState<Set<string>>(new Set());
  const [downloadingLessonIds, setDownloadingLessonIds] = useState<Set<string>>(new Set());

  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: selectedLevel ? [`/api/lessons/level/${selectedLevel}`] : ["/api/lessons"],
    enabled: !!selectedLevel,
  });

  const { data: progress } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress"],
  });

  const getLessonProgress = (lessonId: string) => {
    return progress?.find((p) => p.lessonId === lessonId);
  };

  const levels = [
    {
      id: "beginner" as Level,
      title: "初学者",
      titleSwahili: "Mwanzo",
      description: "开始学习基础词汇和短语",
      icon: GraduationCap,
      color: "bg-green-500",
    },
    {
      id: "intermediate" as Level,
      title: "中级",
      titleSwahili: "Kati",
      description: "扩展词汇量和对话能力",
      icon: BookOpen,
      color: "bg-blue-500",
    },
    {
      id: "advanced" as Level,
      title: "高级",
      titleSwahili: "Juu",
      description: "掌握高级语法和流利对话",
      icon: Award,
      color: "bg-purple-500",
    },
  ];

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
  };

  useEffect(() => {
    async function loadDownloadedLessons() {
      const offlineLessons = await getAllOfflineLessons();
      setDownloadedLessonIds(new Set(offlineLessons.map(l => l.id)));
    }
    loadDownloadedLessons();
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
          title: "已删除",
          description: `${lesson.titleChinese} 已从离线存储中删除`
        });
      } catch (error) {
        toast({
          title: "删除失败",
          description: "无法删除离线课程",
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
        title: "下载完成",
        description: `${lesson.titleChinese} 已保存，可离线访问`
      });
    } catch (error) {
      console.error('Failed to download lesson:', error);
      toast({
        title: "下载失败",
        description: "无法保存课程到离线存储",
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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <OfflineIndicator />
      
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">学习</h1>
        <p className="text-muted-foreground text-lg">选择你的学习级别</p>
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
                  {level.titleSwahili}
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
              返回级别选择
            </Button>
            <h2 className="text-2xl font-semibold">
              {levels.find((l) => l.id === selectedLevel)?.title} 课程
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
                        <CardTitle className="text-xl flex-1">{lesson.titleSwahili}</CardTitle>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isCompleted && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" data-testid="icon-completed" />
                          )}
                          <Button
                            size="icon"
                            variant={isDownloaded ? "default" : "ghost"}
                            onClick={(e) => handleDownloadLesson(lesson, e)}
                            disabled={isDownloading}
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
                      <CardDescription className="text-base">{lesson.titleChinese}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary">{lesson.category}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{lesson.estimatedMinutes}分钟</span>
                        </div>
                        {isDownloaded && (
                          <Badge variant="outline" className="text-xs">
                            已下载
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
                <p className="text-muted-foreground">该级别暂无课程</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-lesson-detail">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedLesson?.titleSwahili}</DialogTitle>
            <DialogDescription className="text-lg">{selectedLesson?.titleChinese}</DialogDescription>
          </DialogHeader>

          {selectedLesson?.content && typeof selectedLesson.content === 'object' && (
            <>
              <div className="space-y-6 mt-4">
                {(selectedLesson.content as Record<string, any>).vocabulary && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">词汇 (Vocabulary)</h3>
                    <div className="space-y-2">
                      {((selectedLesson.content as Record<string, any>).vocabulary as any[]).map((item: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-md">
                          <p className="font-medium text-lg">{item.swahili}</p>
                          <p className="text-muted-foreground">{item.chinese}</p>
                          {item.pronunciation && (
                            <p className="text-sm text-muted-foreground italic">{item.pronunciation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedLesson.content as Record<string, any>).phrases && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">常用短语 (Phrases)</h3>
                    <div className="space-y-2">
                      {((selectedLesson.content as Record<string, any>).phrases as any[]).map((item: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-md">
                          <p className="font-medium text-lg">{item.swahili}</p>
                          <p className="text-muted-foreground">{item.chinese}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedLesson.content as Record<string, any>).dialogues && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">对话 (Dialogues)</h3>
                    <div className="space-y-4">
                      {((selectedLesson.content as Record<string, any>).dialogues as any[]).map((dialogue: any, idx: number) => (
                        <div key={idx} className="space-y-2">
                          {dialogue.lines.map((line: any, lineIdx: number) => (
                            <div key={lineIdx} className="p-3 bg-muted rounded-md">
                              <p className="text-sm font-semibold text-primary mb-1">{line.speaker}:</p>
                              <p className="font-medium">{line.swahili}</p>
                              <p className="text-sm text-muted-foreground">{line.chinese}</p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="mt-6 flex gap-3">
            <Button onClick={handleStartPractice} className="flex-1" data-testid="button-start-practice">
              开始练习
            </Button>
            <Button variant="outline" onClick={() => setSelectedLesson(null)} data-testid="button-close-lesson">
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

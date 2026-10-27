import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, Bot, User as UserIcon, AlertCircle, History, Plus, GraduationCap, BookOpen, Award, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChatSession, ChatMessage, User } from "@shared/schema";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { Link } from "wouter";
import { useLocale } from "@/lib/i18n";

const LEVELS = [
  { id: "beginner", name: "初学者", nameSwahili: "Mwanzo", icon: GraduationCap, color: "bg-green-500" },
  { id: "intermediate", name: "中级", nameSwahili: "Kati", icon: BookOpen, color: "bg-blue-500" },
  { id: "advanced", name: "高级", nameSwahili: "Juu", icon: Award, color: "bg-purple-500" },
];

const QUICK_REPLIES = [
  { text: "Habari!", translation: "你好！" },
  { text: "Ndiyo", translation: "是的" },
  { text: "Hapana", translation: "不是" },
  { text: "Asante sana", translation: "非常感谢" },
  { text: "Tafadhali", translation: "请" },
  { text: "Sijui", translation: "我不知道" },
];

export default function Practice() {
  const { user } = useAuth() as { user: User | null };
  const { language, t } = useLocale();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>("beginner");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: session, isLoading: sessionLoading, refetch: refetchSession } = useQuery<ChatSession & { messages: ChatMessage[] }>({
    queryKey: ["/api/chat/session", currentSessionId],
    enabled: !!currentSessionId,
    staleTime: 0,
  });

  const { data: sessions } = useQuery<ChatSession[]>({
    queryKey: ["/api/chat/sessions"],
    enabled: !!user,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (level: string) => {
      const res = await apiRequest("POST", "/api/chat/session", { level });
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.id);
      setSelectedLevel(data.level || "beginner");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      setShowHistoryModal(false);
    },
    onError: (error: Error) => {
      const errorMsg = error.message;
      if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
        return;
      }
      toast({
        title: t("创建会话失败"),
        description: t("请稍后重试"),
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/chat/message", {
        sessionId: currentSessionId,
        content,
        language,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.requiresUpgrade) {
        setShowUpgradeModal(true);
      }
      refetchSession();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      if (error.message.includes("403")) {
        setShowUpgradeModal(true);
      } else {
        toast({
          title: t("错误"),
          description: error.message || t("发送消息失败"),
          variant: "destructive",
        });
      }
    },
  });

  const handleQuickReply = (text: string) => {
    if (sendMessageMutation.isPending) return;
    setMessage(text);
    inputRef.current?.focus();
  };

  const handleResumeSession = (sessionId: string, level: string) => {
    setCurrentSessionId(sessionId);
    setSelectedLevel(level || "beginner");
    setShowHistoryModal(false);
  };

  const handleNewSession = (level: string) => {
    setSelectedLevel(level);
    createSessionMutation.mutate(level);
  };

  const currentLevelInfo = LEVELS.find(l => l.id === selectedLevel) || LEVELS[0];

  // Auto-resume latest session for returning users (don't auto-create for new users - let them choose level)
  useEffect(() => {
    if (!user || currentSessionId || createSessionMutation.isPending) return;
    
    // If user has previous sessions, resume the most recent one
    if (sessions && sessions.length > 0) {
      const latestSession = sessions[0];
      setCurrentSessionId(latestSession.id);
      setSelectedLevel(latestSession.level || "beginner");
    }
    // Note: If no sessions, user will see welcome screen to choose their level
  }, [user, sessions, currentSessionId, createSessionMutation.isPending]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;

    const messageContent = message;
    setMessage("");
    await sendMessageMutation.mutateAsync(messageContent);
  };

  const practiceCount = user?.practiceCount || 0;
  const subscriptionEndsAt = user?.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null;
  const now = new Date();
  const isExpired = subscriptionEndsAt !== null && subscriptionEndsAt < now;
  const daysRemaining = subscriptionEndsAt 
    ? differenceInDays(subscriptionEndsAt, now)
    : null;
  // Admins have full access without subscription
  const isAdmin = user?.isAdmin === true;
  const isPremium = isAdmin || (user?.isPremium && !isExpired);
  const remainingPractices = isPremium ? t("无限") : Math.max(0, 10 - practiceCount);

  return (
    <div className="h-full flex flex-col" data-testid="page-practice">
      <div className="border-b bg-card">
        <div className="px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold">{t("AI 练习")}</h1>
              <p className="text-sm text-muted-foreground">{t("与AI老师练习斯瓦希里语对话")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="button-level-select">
                  <currentLevelInfo.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t(currentLevelInfo.name)}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {LEVELS.map((level) => (
                  <DropdownMenuItem
                    key={level.id}
                    onClick={() => handleNewSession(level.id)}
                    data-testid={`menu-level-${level.id}`}
                  >
                    <level.icon className="w-4 h-4 mr-2" />
                    {t(level.name)} ({level.nameSwahili})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowHistoryModal(true)}
              data-testid="button-history"
            >
              <History className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 pl-2 border-l">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t("剩余")}</p>
                <p className="text-sm font-bold" data-testid="text-practice-count">
                  {remainingPractices}
                </p>
              </div>
              <Badge variant={isPremium ? "default" : "secondary"} data-testid="badge-subscription-status">
                {isPremium ? t("高级会员") : t("免费")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {isExpired && (
        <div className="px-4 md:px-6 pt-4">
          <Alert variant="destructive" data-testid="alert-subscription-expired">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("订阅已过期")}</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{t("你的高级订阅已过期，现在使用免费版限制（10次练习）。")}</span>
              <Link href="/subscription">
                <Button variant="outline" size="sm" className="ml-4">
                  {t("续费订阅")}
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
        <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
          {sessionLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">{t("加载中...")}</p>
              </div>
            </div>
          ) : session?.messages && session.messages.length > 0 ? (
            <div className="space-y-4">
              {session.messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${msg.role}-${idx}`}
                >
                  {msg.role === "assistant" && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-xs md:max-w-md p-4 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback>
                        <UserIcon className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-xs md:max-w-md p-4 rounded-2xl bg-muted">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : !currentSessionId ? (
            <div className="flex items-center justify-center py-12">
              <Card className="max-w-md w-full mx-4">
                <CardContent className="pt-6 text-center space-y-6">
                  <div>
                    <Bot className="w-16 h-16 mx-auto mb-4 text-primary" />
                    <h2 className="text-xl font-bold mb-2">{t("Karibu! 欢迎来到AI练习")}</h2>
                    <p className="text-muted-foreground">{t("选择一个级别开始与AI老师对话")}</p>
                  </div>
                  <div className="grid gap-3">
                    {LEVELS.map((level) => (
                      <Button
                        key={level.id}
                        variant="outline"
                        className="w-full justify-start gap-3 h-auto py-4"
                        onClick={() => handleNewSession(level.id)}
                        disabled={createSessionMutation.isPending}
                        data-testid={`button-start-${level.id}`}
                      >
                        <div className={`p-2 rounded-lg ${level.color}`}>
                          <level.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{t(level.name)}</p>
                          <p className="text-xs text-muted-foreground">{level.nameSwahili}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                  {sessions && sessions.length > 0 && (
                    <Button
                      variant="ghost"
                      className="w-full gap-2"
                      onClick={() => setShowHistoryModal(true)}
                      data-testid="button-view-history"
                    >
                      <History className="w-4 h-4" />
                      {t("查看历史会话")} ({sessions.length})
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Card className="max-w-md">
                <CardContent className="pt-6 text-center">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">{t("开始与AI老师对话")}</p>
                  <p className="text-sm text-muted-foreground">{t("尝试用斯瓦希里语或中文打招呼")}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>

        <div className="border-t bg-card p-4 md:p-6 space-y-3">
          {currentSessionId && session?.messages && session.messages.length < 4 && (
            <div className="flex flex-wrap gap-2">
              {QUICK_REPLIES.map((reply, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickReply(reply.text)}
                  disabled={sendMessageMutation.isPending}
                  className="text-xs"
                  data-testid={`button-quick-${idx}`}
                >
                  {reply.text} <span className="text-muted-foreground ml-1">({t(reply.translation)})</span>
                </Button>
              ))}
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={currentSessionId ? t("输入你的消息...") : t("请先选择级别开始对话")}
              disabled={sendMessageMutation.isPending || !currentSessionId}
              className="flex-1"
              data-testid="input-message"
            />
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending || !currentSessionId}
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent data-testid="dialog-upgrade">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              {t("升级到高级会员")}
            </DialogTitle>
            <DialogDescription>
              {t("你已达到免费练习次数上限（10次）")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p>{t("升级到高级会员可以获得：")}</p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t("无限次AI对话练习")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t("访问所有课程级别")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t("离线模式")}</span>
              </li>
            </ul>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setShowUpgradeModal(false)} variant="outline" className="flex-1">
                {t("稍后")}
              </Button>
              <Button onClick={() => window.location.hash = "subscription"} className="flex-1" data-testid="button-upgrade-now">
                {t("立即升级")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-md" data-testid="dialog-history">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              {t("历史会话")}
            </DialogTitle>
            <DialogDescription>
              {t("继续之前的对话或开始新对话")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              {LEVELS.map((level) => (
                <Button
                  key={level.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleNewSession(level.id)}
                  disabled={createSessionMutation.isPending}
                  className="flex-1 gap-1"
                  data-testid={`button-new-${level.id}`}
                >
                  <Plus className="w-3 h-3" />
                  {t(level.name)}
                </Button>
              ))}
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {sessions && sessions.length > 0 ? (
                  sessions.map((s) => {
                    const levelInfo = LEVELS.find(l => l.id === s.level) || LEVELS[0];
                    return (
                      <Button
                        key={s.id}
                        variant={currentSessionId === s.id ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3 h-auto py-3"
                        onClick={() => handleResumeSession(s.id, s.level)}
                        data-testid={`button-session-${s.id}`}
                      >
                        <div className={`p-1.5 rounded ${levelInfo.color}`}>
                          <levelInfo.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {t(levelInfo.name)} {t("练习")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.createdAt ? formatDistanceToNow(new Date(s.createdAt), { addSuffix: true, locale: language === "en" ? enUS : zhCN }) : ""}
                          </p>
                        </div>
                        {currentSessionId === s.id && (
                          <Badge variant="outline" className="text-xs">{t("当前")}</Badge>
                        )}
                      </Button>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t("暂无历史会话")}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
